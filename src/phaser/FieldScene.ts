/**
 * 필드 씬 — 마을을 걸어다니는 화면.
 *
 * 이 씬은 `GameState` 를 **읽기만** 한다. 갱신은 `syncFromState` 한 곳으로 들어오고,
 * 상태를 바꿔야 할 때는 콜백으로 올려서 스토어 액션이 처리한다.
 * 갈 수 있는가·방향만 바꾸는가는 systems/movement.ts 가 정한다. 여기는 시간과 그림만 맡는다.
 */

import Phaser from 'phaser';
import type { Dir, GameState } from '@/types/game';
import type { MapObject, TileMapData } from '@/types/map';
import { CHAR_SHEET, IDLE_FRAME, WALK_FPS, WALK_ORDER, frameIndex } from '@/data/characters';
import { ASSETS, getAsset } from '@/data/assets';
import { CHAR_TINT_SCALE, PALETTE, SEASON_TINT } from '@/data/palette';
import { STEP_MS, TILE, TURN_HOLD_MS } from '@/data/layout';
import { seasonOf } from '@/data/seasons';
import { isBlocked, loadMap, mapKey, objectAt, type MapContext } from '@/systems/map';
import { interactionAt, resolveMove, type HeroTile } from '@/systems/movement';
import { residentsOf } from '@/systems/roster';
import { drawPlaceholder } from '@/render/placeholder';
import { paintMapCanvas } from '@/render/terrain';
import { readInput } from './inputBus';
import { play } from '@/audio/sfx';

const S = TILE.source;
const HERO_SPRITE = 'char.hero';

export interface FieldSceneCallbacks {
  /** 한 칸 옮겨갔다 */
  onStep: (to: { x: number; y: number }, dir: Dir) => void;
  /** 방향만 바뀌었다 */
  onFace: (dir: Dir) => void;
  /** 하단 프롬프트 문구가 바뀌었다. 없으면 null */
  onPrompt: (label: string | null) => void;
  /** A 를 눌렀다. 바라보는 자리에 아무것도 없으면 null */
  onAction: (object: MapObject | null) => void;
  /** 한 칸 밟고 올라섰다. 지역 사건 노드는 밟는 것으로 발동한다 (§11) */
  onEnterTile: (object: MapObject) => void;
  /** 다가오던 인물이 앞까지 왔다 (§7.3) */
  onApproachArrive: () => void;
}

/** 타일 좌표를 세계 좌표로. 스프라이트 기준점은 발밑(가운데 아래)이다 */
const worldX = (tx: number) => tx * S + S / 2;
const worldY = (ty: number) => ty * S + S;

export class FieldScene extends Phaser.Scene {
  static readonly KEY = 'field';

  private readonly cbs: FieldSceneCallbacks;

  private map: TileMapData | null = null;
  /** 지금 그려 둔 맵의 열쇠. 시대나 건물 레벨이 바뀌면 달라진다 */
  private mapKeyDrawn: string | null = null;
  /** 프롬프트가 건설·증축을 가르려면 레벨을 알아야 한다 */
  private buildings: Record<string, number> = {};
  private seasonOverlay: Phaser.GameObjects.Rectangle | null = null;
  /** 지금 걸어오고 있는 인물의 스프라이트 */
  private approachSprite: Phaser.GameObjects.Sprite | null = null;
  /** 씬이 서기 전에 들어온 다가옴 요청 */
  private wantApproach: string | null = null;
  private hero: HeroTile = { x: 0, y: 0, dir: 'down' };
  private heroSprite: Phaser.GameObjects.Sprite | null = null;
  private npcLayer: Phaser.GameObjects.Group | null = null;
  private mapImage: Phaser.GameObjects.Image | null = null;

  /** create() 전에 들어온 상태를 담아 둔다 */
  private pending: GameState | null = null;
  private ready = false;

  // 이동 진행 상태. 게임 상태가 아니라 애니메이션 상태다
  private walking = false;
  private queued: Dir | null = null;
  private turnUntil = 0;
  private lastPressCount = 0;
  private lastActionCount = 0;
  private lastPrompt: string | null = null;
  /** 대화가 열려 있으면 필드는 입력을 받지 않는다 */
  private paused = false;

  constructor(cbs: FieldSceneCallbacks) {
    super({ key: FieldScene.KEY });
    this.cbs = cbs;
  }

  // ── 적재 ────────────────────────────────────────────────

  preload(): void {
    // 매니페스트에 경로가 있는 캐릭터만 싣는다. 없으면 플레이스홀더로 간다
    for (const entry of ASSETS) {
      if (entry.kind !== 'character' || entry.path === null) continue;
      const sheet = entry.sheet ?? CHAR_SHEET;
      this.load.spritesheet(entry.id, new URL(entry.path, document.baseURI).href, {
        frameWidth: sheet.frameWidth,
        frameHeight: sheet.frameHeight,
        spacing: sheet.spacing,
        margin: sheet.margin,
      });
    }

    // 한 장이 없어도 게임은 돌아야 한다. 실패는 조용히 넘기고 플레이스홀더를 쓴다
    this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
      console.warn(`에셋 '${file.key}' 를 싣지 못했다. 플레이스홀더로 그린다.`);
    });
  }

  create(): void {
    this.ready = true;
    this.cameras.main.setBackgroundColor(PALETTE.ink);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(TILE.scale);

    this.npcLayer = this.add.group();

    if (this.pending !== null) this.applyState(this.pending);
  }

  // ── 상태 반영 ───────────────────────────────────────────

  /** GameState 가 들어오는 유일한 통로 */
  syncFromState(state: GameState): void {
    this.pending = state;
    if (this.ready) this.applyState(state);
  }

  private applyState(state: GameState): void {
    this.buildings = state.town.buildings;

    const ctx: MapContext = {
      mapId: state.world.currentMap,
      eraIndex: state.world.eraIndex,
      buildings: state.town.buildings,
      // 숙소에 누가 사는지는 관계 상태에서 나온다 (§7.4)
      residents: residentsOf(state).map((c) => ({ id: c.id, archetypeId: c.archetypeId })),
    };

    // 건물을 올리면 열쇠가 달라진다. 그때 마을 그림을 다시 굽는다
    const key = mapKey(ctx);
    if (key !== this.mapKeyDrawn) {
      this.mapKeyDrawn = key;
      this.buildMap(ctx, key);
    }

    this.applySeason(state.world.week);

    // 씬이 서기 전에 들어온 다가옴이 있으면 이제 시작한다
    if (this.wantApproach !== null && this.map !== null && this.heroSprite !== null) {
      const pending = this.wantApproach;
      this.wantApproach = null;
      this.setApproach(pending);
    }

    // 걷는 중에는 씬이 앞서 있다. 트윈과 싸우지 않게 둔다
    if (!this.walking) {
      const tile = state.world.heroTile;
      this.hero = { x: tile.x, y: tile.y, dir: tile.dir };
      this.placeHero();
      this.refreshPrompt();
    }
  }

  private buildMap(ctx: MapContext, cacheKey: string): void {
    const map = loadMap(ctx);
    this.map = map;

    // 타일마다 객체를 만들지 않는다. 한 장으로 구워서 이미지 하나로 붙인다
    const key = `map:${cacheKey}`;
    if (this.textures.exists(key)) this.textures.remove(key);

    const tex = this.textures.createCanvas(key, map.width * S, map.height * S);
    if (tex !== null) {
      const ctx = tex.getContext();
      ctx.imageSmoothingEnabled = false;
      paintMapCanvas(ctx, map.width, map.height, map.ground, map.deco);
      tex.refresh();
    }

    this.mapImage?.destroy();
    this.mapImage = this.add.image(0, 0, key).setOrigin(0, 0).setDepth(-1000);

    this.cameras.main.setBounds(0, 0, map.width * S, map.height * S);

    this.buildNpcs(map);
    this.buildHero();
    this.buildSeasonOverlay(map);
  }

  /**
   * 계절 틴트 — 곱셈 오버레이 (§12).
   * 세계에는 그대로 걸고, 인물에는 CHAR_TINT_SCALE 만큼만 건다.
   * 100%로 걸면 인물이 배경과 함께 물들어 안 읽힌다.
   */
  private buildSeasonOverlay(map: TileMapData): void {
    this.seasonOverlay?.destroy();
    const rect = this.add.rectangle(0, 0, map.width * S, map.height * S, 0xffffff, 0);
    rect.setOrigin(0, 0);
    rect.setBlendMode(Phaser.BlendModes.MULTIPLY);
    // 인물보다 위, UI 보다 아래
    rect.setDepth(100000);
    this.seasonOverlay = rect;
  }

  private applySeason(week: number): void {
    const tint = SEASON_TINT[seasonOf(week)];
    const color = Phaser.Display.Color.HexStringToColor(tint.color).color;

    this.seasonOverlay?.setFillStyle(color, tint.alpha);

    // 캐릭터는 절반 강도. 곱셈 틴트라서 흰색 쪽으로 섞어 옅게 만든다
    const charTint = Phaser.Display.Color.Interpolate.ColorWithColor(
      Phaser.Display.Color.ValueToColor(0xffffff),
      Phaser.Display.Color.ValueToColor(color),
      100,
      Math.round(tint.alpha * CHAR_TINT_SCALE * 100),
    );
    const packed = Phaser.Display.Color.GetColor(charTint.r, charTint.g, charTint.b);

    this.heroSprite?.setTint(packed);
    this.npcLayer?.getChildren().forEach((child) => {
      (child as Phaser.GameObjects.Sprite).setTint(packed);
    });
  }

  /** 시트가 실제로 실렸는지. 실패했으면 플레이스홀더 텍스처를 만들어 준다 */
  private textureFor(spriteId: string): string {
    if (this.textures.exists(spriteId)) return spriteId;

    const key = `ph:${spriteId}`;
    if (!this.textures.exists(key)) {
      const entry = getAsset(spriteId);
      const w = entry?.sheet?.frameWidth ?? CHAR_SHEET.frameWidth;
      const h = entry?.sheet?.frameHeight ?? CHAR_SHEET.frameHeight;
      const tex = this.textures.createCanvas(key, w, h);
      if (tex !== null) {
        drawPlaceholder(tex.getContext(), {
          width: w,
          height: h,
          label: spriteId,
          color: entry?.placeholder.color ?? 'clothWarm',
        });
        tex.refresh();
      }
    }
    return key;
  }

  /** 방향별 걷기 애니메이션. 프레임 배열은 characters.ts 값을 그대로 쓴다 */
  private ensureAnims(spriteId: string): boolean {
    if (!this.textures.exists(spriteId)) return false;
    for (const dir of ['down', 'left', 'up', 'right'] as const) {
      const key = `${spriteId}-walk-${dir}`;
      if (this.anims.exists(key)) continue;
      this.anims.create({
        key,
        frames: WALK_ORDER.map((col) => ({ key: spriteId, frame: frameIndex(dir, col) })),
        frameRate: WALK_FPS,
        repeat: -1,
      });
    }
    return true;
  }

  private buildNpcs(map: TileMapData): void {
    this.npcLayer?.clear(true, true);

    for (const obj of map.objects) {
      if (obj.type !== 'npc' || obj.sprite === undefined) continue;
      const texKey = this.textureFor(obj.sprite);
      const sprite = this.add.sprite(worldX(obj.x), worldY(obj.y), texKey);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(worldY(obj.y));
      // 인물은 아래를 보고 서 있는다. 말을 걸면 돌아보는 건 대화가 붙을 때다
      if (this.ensureAnims(obj.sprite)) sprite.setFrame(frameIndex('down', IDLE_FRAME));
      this.npcLayer?.add(sprite);
    }
  }

  private buildHero(): void {
    this.heroSprite?.destroy();
    const texKey = this.textureFor(HERO_SPRITE);
    this.heroSprite = this.add.sprite(0, 0, texKey).setOrigin(0.5, 1);
    this.ensureAnims(HERO_SPRITE);
    this.placeHero();
    this.cameras.main.startFollow(this.heroSprite, true, 1, 1);
  }

  private placeHero(): void {
    const s = this.heroSprite;
    if (s === null) return;
    s.setPosition(worldX(this.hero.x), worldY(this.hero.y));
    s.setDepth(worldY(this.hero.y));
    this.setIdleFrame();
  }

  private setIdleFrame(): void {
    const s = this.heroSprite;
    if (s === null) return;
    s.anims.stop();
    if (this.textures.exists(HERO_SPRITE)) {
      s.setFrame(frameIndex(this.hero.dir, IDLE_FRAME));
    }
  }

  private playWalk(dir: Dir): void {
    const s = this.heroSprite;
    if (s === null || !this.textures.exists(HERO_SPRITE)) return;
    s.play(`${HERO_SPRITE}-walk-${dir}`, true);
  }

  // ── 매 프레임 ───────────────────────────────────────────

  /**
   * 인물이 플레이어 쪽으로 걸어온다 (§7.3).
   *
   * **플레이어가 찾아가는 것이 아니다.** 마을에 들어선 순간 스프라이트가
   * 이쪽으로 이동하고, 앞에 서면 대화가 저절로 열린다.
   */
  setApproach(spriteId: string | null): void {
    // 앞서 걸어오던 스프라이트가 있으면 트윈까지 함께 끊는다.
    // 스프라이트만 지우면 트윈이 살아남아 없어진 대상 위에서 onComplete 가 터진다
    if (this.approachSprite !== null) {
      this.tweens.killTweensOf(this.approachSprite);
      this.approachSprite.destroy();
      this.approachSprite = null;
    }

    // 씬이 아직 안 섰으면 적어 두었다가 맵이 준비되면 시작한다.
    // 마을에서 새로 켠 판은 이 경로로 들어온다
    this.wantApproach = spriteId;
    if (spriteId === null || this.map === null || this.heroSprite === null) return;
    this.wantApproach = null;

    const from = this.approachStart();
    if (from === null) {
      // 설 자리가 없으면 걷는 연출을 건너뛰고 바로 말을 건다
      this.cbs.onApproachArrive();
      return;
    }

    const sprite = this.add.sprite(worldX(from.x), worldY(from.y), this.textureFor(spriteId));
    sprite.setOrigin(0.5, 1);
    sprite.setDepth(worldY(from.y));
    this.ensureAnims(spriteId);
    this.approachSprite = sprite;

    // 주인공 바로 앞 칸에서 멈춘다
    const toX = worldX(this.hero.x);
    const toY = worldY(this.hero.y - 1);

    const dir: Dir =
      Math.abs(toX - sprite.x) > Math.abs(toY - sprite.y)
        ? toX > sprite.x
          ? 'right'
          : 'left'
        : toY > sprite.y
          ? 'down'
          : 'up';
    if (this.textures.exists(spriteId)) sprite.play(`${spriteId}-walk-${dir}`, true);

    this.tweens.add({
      targets: sprite,
      x: toX,
      y: toY,
      duration: STEP_MS * 6,
      ease: 'Linear',
      onUpdate: () => sprite.setDepth(sprite.y),
      onComplete: () => {
        // 그새 다른 스프라이트로 갈렸으면 이 도착은 무효다
        if (this.approachSprite !== sprite || !sprite.active) return;
        sprite.anims?.stop();
        if (this.textures.exists(spriteId)) sprite.setFrame(frameIndex('down', IDLE_FRAME));
        this.cbs.onApproachArrive();
      },
    });
  }

  /** 주인공에게서 조금 떨어진, 걸어올 수 있는 자리 */
  private approachStart(): { x: number; y: number } | null {
    const map = this.map;
    if (map === null) return null;
    const candidates = [
      { x: this.hero.x, y: this.hero.y + 5 },
      { x: this.hero.x + 5, y: this.hero.y },
      { x: this.hero.x - 5, y: this.hero.y },
      { x: this.hero.x, y: this.hero.y - 5 },
      { x: this.hero.x + 3, y: this.hero.y + 3 },
    ];
    for (const c of candidates) if (!isBlocked(map, c.x, c.y)) return c;
    return null;
  }

  /** 대화가 열리고 닫힐 때 호스트가 알려 준다 */
  setPaused(paused: boolean): void {
    this.paused = paused;
    this.queued = null;

    // 멈춤이 풀리는 그 순간의 누름은 대화를 닫으려고 누른 것이다.
    // 여기서 카운터를 맞춰 두지 않으면, 그 한 번이 다음 프레임에 대화를 다시 연다
    const input = readInput();
    this.lastActionCount = input.actionCount;
    this.lastPressCount = input.pressCount;
  }

  override update(time: number): void {
    if (this.map === null || this.heroSprite === null) return;

    const input = readInput();

    // 대화 중에 눌린 것은 대화가 가져간다. 여기서는 흘려보내되, 카운터는 맞춰 둔다 —
    // 안 맞춰 두면 대화를 닫은 그 누름이 다시 대화를 연다
    if (this.paused) {
      this.lastActionCount = input.actionCount;
      this.lastPressCount = input.pressCount;
      return;
    }

    if (input.actionCount !== this.lastActionCount) {
      this.lastActionCount = input.actionCount;
      const it = interactionAt(this.map, this.hero, this.buildings);
      this.cbs.onAction(it?.object ?? null);
    }

    const newPress = input.pressCount !== this.lastPressCount;
    if (newPress) this.lastPressCount = input.pressCount;

    // 걷는 중에는 입력을 하나만 쌓아 둔다 (§5). 연타해도 무너지지 않는다
    if (this.walking) {
      if (newPress && input.held !== null) this.queued = input.held;
      return;
    }

    // 방향만 바꾼 직후의 짧은 틈
    if (time < this.turnUntil) return;

    const next = this.queued ?? input.held;
    this.queued = null;
    if (next === null) return;

    this.begin(next, time, true);
  }

  /** fromStandstill 이 참일 때만 방향 전환 규칙이 걸린다 */
  private begin(dir: Dir, time: number, fromStandstill: boolean): void {
    const map = this.map;
    if (map === null) return;

    const outcome = resolveMove(this.hero, map, dir, { fromStandstill });

    switch (outcome.kind) {
      case 'turn':
        this.face(dir);
        this.turnUntil = time + TURN_HOLD_MS;
        play('turn');
        break;

      case 'blocked':
        // 벽을 보고 선다. 제자리에서 발만 구르지는 않는다
        if (this.hero.dir !== dir) this.face(dir);
        else this.setIdleFrame();
        play('bump');
        break;

      case 'step':
        this.startStep(outcome.to, dir);
        break;
    }
  }

  private face(dir: Dir): void {
    this.hero.dir = dir;
    this.setIdleFrame();
    this.cbs.onFace(dir);
    this.refreshPrompt();
  }

  private startStep(to: { x: number; y: number }, dir: Dir): void {
    const s = this.heroSprite;
    if (s === null) return;

    this.walking = true;
    this.hero = { x: to.x, y: to.y, dir };
    play('step');
    this.cbs.onStep(to, dir);
    this.refreshPrompt();
    this.playWalk(dir);

    this.tweens.add({
      targets: s,
      x: worldX(to.x),
      y: worldY(to.y),
      duration: STEP_MS,
      ease: 'Linear',
      onUpdate: () => s.setDepth(s.y),
      onComplete: () => this.finishStep(),
    });
  }

  private finishStep(): void {
    this.walking = false;

    // 밟고 올라선 칸에 사건 노드가 있으면 알린다 (§11 — 밟으면 판정)
    if (this.map !== null) {
      const here = objectAt(this.map, this.hero.x, this.hero.y);
      if (here !== undefined && here.nodeKind !== undefined) this.cbs.onEnterTile(here);
    }

    // 쌓아 둔 입력이나 여전히 눌린 방향이 있으면 멈추지 않고 이어 간다.
    // 여기서 한 번 세우면 모퉁이를 돌 때마다 걸린다
    const input = readInput();
    const next = this.queued ?? input.held;
    this.queued = null;

    if (next !== null) {
      this.begin(next, this.time.now, false);
      return;
    }
    this.setIdleFrame();
  }

  private refreshPrompt(): void {
    if (this.map === null) return;
    const it = interactionAt(this.map, this.hero, this.buildings);
    const label = it === null ? null : it.label;
    if (label !== this.lastPrompt) {
      this.lastPrompt = label;
      this.cbs.onPrompt(label);
    }
  }
}
