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
import { PALETTE } from '@/data/palette';
import { STEP_MS, TILE, TURN_HOLD_MS } from '@/data/layout';
import { loadMap } from '@/systems/map';
import { interactionAt, resolveMove, type HeroTile } from '@/systems/movement';
import { drawPlaceholder } from '@/render/placeholder';
import { paintMapCanvas } from '@/render/terrain';
import { readInput } from './inputBus';

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
}

/** 타일 좌표를 세계 좌표로. 스프라이트 기준점은 발밑(가운데 아래)이다 */
const worldX = (tx: number) => tx * S + S / 2;
const worldY = (ty: number) => ty * S + S;

export class FieldScene extends Phaser.Scene {
  static readonly KEY = 'field';

  private readonly cbs: FieldSceneCallbacks;

  private map: TileMapData | null = null;
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
    const mapId = state.world.currentMap;

    if (this.map === null || this.map.id !== mapId) {
      this.buildMap(mapId);
    }

    // 걷는 중에는 씬이 앞서 있다. 트윈과 싸우지 않게 둔다
    if (!this.walking) {
      const tile = state.world.heroTile;
      this.hero = { x: tile.x, y: tile.y, dir: tile.dir };
      this.placeHero();
      this.refreshPrompt();
    }
  }

  private buildMap(mapId: string): void {
    const map = loadMap(mapId);
    this.map = map;

    // 타일마다 객체를 만들지 않는다. 한 장으로 구워서 이미지 하나로 붙인다
    const key = `map:${map.id}`;
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

  override update(time: number): void {
    if (this.map === null || this.heroSprite === null) return;

    const input = readInput();

    if (input.actionCount !== this.lastActionCount) {
      this.lastActionCount = input.actionCount;
      const it = interactionAt(this.map, this.hero);
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
        break;

      case 'blocked':
        // 벽을 보고 선다. 제자리에서 발만 구르지는 않는다
        if (this.hero.dir !== dir) this.face(dir);
        else this.setIdleFrame();
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
    const it = interactionAt(this.map, this.hero);
    const label = it === null ? null : it.label;
    if (label !== this.lastPrompt) {
      this.lastPrompt = label;
      this.cbs.onPrompt(label);
    }
  }
}
