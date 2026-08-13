/**
 * SettlementScene — 거점 격자 맵 (골격). §10.3, §10.4.
 *
 * 규칙(§10.3): 이 씬은 GameState 를 읽기만 한다. 상태를 바꾸지 않는다.
 * 입력은 씬 → 콜백 → 스토어로만 흐른다(카메라 조작은 순수 뷰라 예외).
 *
 * M1 범위: 격자 렌더 + 카메라(핀치 줌·팬·더블탭 전체보기·줌 스냅) + LOD.
 * 건물 배치(deriveLayout)·워커·시대 전환 연출은 이후 마일스톤에서 들어온다.
 */

import Phaser from 'phaser';
import { createRng } from '@/systems/rng';
import {
  TILE_SRC,
  BASE_SCALE,
  ZOOM_SNAPS,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
  LOD_HIDE_BELOW,
  DOUBLE_TAP_MS,
  TAP_MOVE_MAX,
  PAN_MARGIN_TILES,
} from '@/data/camera';
import { GROUND_COLORS, GRID_LINE_COLOR, GRID_LINE_ALPHA } from '@/data/terrain';
import { SEASON_TINT } from '@/data/palette';
import type { Season } from '@/types/game';

export interface SettlementSceneData {
  gridSize: number;
  seed: number;
  season: Season;
}

const TINT_KEYS = ['spring', 'summer', 'autumn', 'winter'] as const;

const GROUND_TEX_PREFIX = 'ground_';

export class SettlementScene extends Phaser.Scene {
  static readonly KEY = 'settlement';

  private gridSize = 12;
  private seed = 0;
  private season: Season = 0;

  private groundLayer!: Phaser.GameObjects.Container;
  private detailLayer!: Phaser.GameObjects.Container;
  private gridGfx!: Phaser.GameObjects.Graphics;
  private seasonTint!: Phaser.GameObjects.Rectangle;

  /** 사용자 기준 줌(스냅 값 중 하나). 실제 카메라 줌 = userZoom × BASE_SCALE */
  private userZoom = ZOOM_DEFAULT;

  // 입력 상태
  private isPanning = false;
  private panLast = new Phaser.Math.Vector2();
  private pinchStartDist = 0;
  private pinchStartZoom = 0;
  private lastTapTime = 0;
  private lastTapPos = new Phaser.Math.Vector2();
  private downTime = 0;
  private downPos = new Phaser.Math.Vector2();

  constructor() {
    super(SettlementScene.KEY);
  }

  init(data: SettlementSceneData): void {
    this.gridSize = data.gridSize;
    this.seed = data.seed;
    this.season = data.season ?? 0;
  }

  create(): void {
    this.ensureGroundTextures();

    this.groundLayer = this.add.container(0, 0);
    this.gridGfx = this.add.graphics();
    // 계절 틴트: 지면 위, detail 아래. 곱셈 블렌드로 색온도만 바꾼다 (§10.2, §10.4)
    this.seasonTint = this.add
      .rectangle(0, 0, 1, 1, 0xffffff, 1)
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.detailLayer = this.add.container(0, 0);

    this.buildMap();
    this.applySeasonTint();
    this.setupInput();
    this.applyZoom(this.userZoom);
    this.fitView();
  }

  // ── 상태 동기화 (단방향, §10.3): 격자 크기가 바뀌면 다시 그린다 ──
  syncGrid(gridSize: number, seed: number): void {
    if (gridSize === this.gridSize && seed === this.seed) return;
    this.gridSize = gridSize;
    this.seed = seed;
    this.buildMap();
    this.applySeasonTint();
    this.fitView();
  }

  /** 계절 변화 → 화면 색온도 갱신 (§2, §10.4) */
  syncSeason(season: Season): void {
    if (season === this.season) return;
    this.season = season;
    this.applySeasonTint();
  }

  private applySeasonTint(): void {
    const size = this.gridSize * TILE_SRC;
    this.seasonTint.setPosition(0, 0);
    this.seasonTint.setSize(size, size);
    const tint = SEASON_TINT[TINT_KEYS[this.season]];
    this.seasonTint.setFillStyle(Phaser.Display.Color.HexStringToColor(tint.color).color, 1);
    this.seasonTint.setAlpha(tint.alpha);
  }

  // ────────────────────────── 텍스처 ──────────────────────────

  private ensureGroundTextures(): void {
    GROUND_COLORS.forEach((color, i) => {
      const key = `${GROUND_TEX_PREFIX}${i}`;
      if (this.textures.exists(key)) return;
      const canvas = this.textures.createCanvas(key, TILE_SRC, TILE_SRC);
      if (!canvas) return;
      const ctx = canvas.getContext();
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, TILE_SRC, TILE_SRC);
      canvas.refresh();
    });
  }

  // ────────────────────────── 맵 구성 ──────────────────────────

  private buildMap(): void {
    this.groundLayer.removeAll(true);
    this.detailLayer.removeAll(true);
    this.gridGfx.clear();

    const rng = createRng(`${this.seed}:terrain`);
    const n = this.gridSize;

    // 지면 타일 (결정론적 변주)
    for (let ty = 0; ty < n; ty++) {
      for (let tx = 0; tx < n; tx++) {
        const idx = weightedIndex(rng.next(), GROUND_COLORS.length);
        const img = this.add.image(tx * TILE_SRC, ty * TILE_SRC, `${GROUND_TEX_PREFIX}${idx}`);
        img.setOrigin(0, 0);
        this.groundLayer.add(img);
      }
    }

    // 격자선 오버레이
    const size = n * TILE_SRC;
    this.gridGfx.lineStyle(1, Phaser.Display.Color.HexStringToColor(GRID_LINE_COLOR).color, GRID_LINE_ALPHA);
    for (let i = 0; i <= n; i++) {
      const p = i * TILE_SRC;
      this.gridGfx.lineBetween(p, 0, p, size);
      this.gridGfx.lineBetween(0, p, size, p);
    }

    // detail 레이어(LOD 대상) — M1 골격 데모 마커. M3 에서 실제 워커 스프라이트로 대체된다.
    const dRng = createRng(`${this.seed}:detail`);
    const markerCount = Math.min(6, Math.floor(n / 2));
    const dot = this.add.graphics();
    dot.fillStyle(Phaser.Display.Color.HexStringToColor('#C97F5A').color, 1); // PALETTE.clothWarm
    dot.fillCircle(0, 0, 3);
    dot.generateTexture('detail_dot', 8, 8);
    dot.destroy();
    for (let i = 0; i < markerCount; i++) {
      const tx = dRng.int(0, n - 1);
      const ty = dRng.int(0, n - 1);
      const m = this.add.image(tx * TILE_SRC + TILE_SRC / 2, ty * TILE_SRC + TILE_SRC / 2, 'detail_dot');
      this.detailLayer.add(m);
    }

    // 카메라 팬 한계
    const margin = PAN_MARGIN_TILES * TILE_SRC;
    this.cameras.main.setBounds(-margin, -margin, size + margin * 2, size + margin * 2);

    this.updateLOD();
  }

  // ────────────────────────── 카메라 ──────────────────────────

  private applyZoom(userZoom: number): void {
    this.userZoom = Phaser.Math.Clamp(userZoom, ZOOM_MIN, ZOOM_MAX);
    this.cameras.main.setZoom(this.userZoom * BASE_SCALE);
    this.updateLOD();
  }

  /** 연속 줌(핀치 중) — 스냅 없이 부드럽게, 손을 떼면 스냅한다 */
  private applyContinuousZoom(userZoom: number): void {
    const z = Phaser.Math.Clamp(userZoom, ZOOM_MIN, ZOOM_MAX);
    this.userZoom = z;
    this.cameras.main.setZoom(z * BASE_SCALE);
    this.updateLOD();
  }

  private snapZoom(): void {
    let best = ZOOM_SNAPS[0] as number;
    let bestD = Infinity;
    for (const s of ZOOM_SNAPS) {
      const d = Math.abs(s - this.userZoom);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    this.applyZoom(best);
  }

  private updateLOD(): void {
    // 0.75× 미만에서 워커·파티클 숨김 (§10.4)
    this.detailLayer.setVisible(this.userZoom >= LOD_HIDE_BELOW);
  }

  /** 더블 탭: 점유 영역(현재는 격자 전체)이 화면에 꽉 차도록 (§10.4) */
  private fitView(): void {
    const size = this.gridSize * TILE_SRC;
    const cam = this.cameras.main;
    const pad = 1.06; // 가장자리 약간 여유
    const fitCamZoom = Math.min(cam.width / (size * pad), cam.height / (size * pad));
    const fitUserZoom = fitCamZoom / BASE_SCALE;

    // 스냅 값 중 화면에 다 들어오는 가장 큰 값 선택 (없으면 최소)
    let chosen = ZOOM_MIN as number;
    for (const s of ZOOM_SNAPS) {
      if (s <= fitUserZoom + 1e-6) chosen = s;
    }
    this.applyZoom(chosen);
    cam.centerOn(size / 2, size / 2);
  }

  // ────────────────────────── 입력 ──────────────────────────

  private setupInput(): void {
    const cam = this.cameras.main;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      const active = this.pointersDown();
      if (active >= 2) {
        this.beginPinch();
        this.isPanning = false;
        return;
      }
      this.isPanning = true;
      this.panLast.set(p.x, p.y);
      this.downTime = this.time.now;
      this.downPos.set(p.x, p.y);
    });

    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      const active = this.pointersDown();
      if (active >= 2) {
        this.updatePinch();
        return;
      }
      if (!this.isPanning || !p.isDown) return;
      cam.scrollX -= (p.x - this.panLast.x) / cam.zoom;
      cam.scrollY -= (p.y - this.panLast.y) / cam.zoom;
      this.panLast.set(p.x, p.y);
    });

    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      const stillDown = this.pointersDown();
      if (this.pinchStartDist > 0 && stillDown < 2) {
        // 핀치 종료 → 스냅
        this.pinchStartDist = 0;
        this.snapZoom();
      }
      if (stillDown === 0) {
        this.isPanning = false;
        this.handleTap(p);
      }
    });

    // 데스크톱 확인용 휠 줌 (스냅 단계 이동)
    this.input.on(
      'wheel',
      (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
        this.stepZoom(dy < 0 ? 1 : -1);
      }
    );
  }

  private pointersDown(): number {
    let c = 0;
    for (const ptr of this.input.manager.pointers) {
      if (ptr.isDown) c++;
    }
    return c;
  }

  private twoPointers(): [Phaser.Input.Pointer, Phaser.Input.Pointer] | null {
    const down = this.input.manager.pointers.filter((p) => p.isDown);
    if (down.length < 2) return null;
    return [down[0]!, down[1]!];
  }

  private beginPinch(): void {
    const pair = this.twoPointers();
    if (!pair) return;
    this.pinchStartDist = Phaser.Math.Distance.Between(pair[0].x, pair[0].y, pair[1].x, pair[1].y);
    this.pinchStartZoom = this.userZoom;
  }

  private updatePinch(): void {
    const pair = this.twoPointers();
    if (!pair || this.pinchStartDist <= 0) return;
    const dist = Phaser.Math.Distance.Between(pair[0].x, pair[0].y, pair[1].x, pair[1].y);
    const ratio = dist / this.pinchStartDist;
    this.applyContinuousZoom(this.pinchStartZoom * ratio);
  }

  private stepZoom(dir: number): void {
    // 현재 userZoom 에서 스냅 인덱스를 찾아 한 칸 이동
    let idx = 0;
    let bestD = Infinity;
    ZOOM_SNAPS.forEach((s, i) => {
      const d = Math.abs(s - this.userZoom);
      if (d < bestD) {
        bestD = d;
        idx = i;
      }
    });
    const next = Phaser.Math.Clamp(idx + dir, 0, ZOOM_SNAPS.length - 1);
    this.applyZoom(ZOOM_SNAPS[next]!);
  }

  private handleTap(p: Phaser.Input.Pointer): void {
    const moved = Phaser.Math.Distance.Between(p.x, p.y, this.downPos.x, this.downPos.y);
    const dt = this.time.now - this.downTime;
    if (moved > TAP_MOVE_MAX || dt > 400) return; // 탭이 아니라 팬/롱프레스

    const now = this.time.now;
    const sinceLast = now - this.lastTapTime;
    const nearLast = Phaser.Math.Distance.Between(p.x, p.y, this.lastTapPos.x, this.lastTapPos.y);
    if (sinceLast <= DOUBLE_TAP_MS && nearLast <= TAP_MOVE_MAX * 3) {
      this.fitView(); // 더블 탭 = 전체 보기
      this.lastTapTime = 0;
      return;
    }
    this.lastTapTime = now;
    this.lastTapPos.set(p.x, p.y);
  }
}

/** [0,1) 난수를 가중 인덱스로: 앞쪽 색이 더 자주 나오게 제곱 편향 */
function weightedIndex(r: number, len: number): number {
  const biased = r * r; // 0에 몰림 → 앞쪽(grass) 빈도↑
  return Math.min(len - 1, Math.floor(biased * len));
}
