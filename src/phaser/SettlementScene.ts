/**
 * SettlementScene — 거점 격자 맵. §10.3, §10.4.
 *
 * 규칙(§10.3): 이 씬은 GameState 에서 파생된 배치(DerivedLayout)를 읽기만 한다. 상태를 바꾸지 않는다.
 * 입력은 씬 → 콜백(onBuildingTap) → 스토어로만 흐른다(카메라 조작은 순수 뷰라 예외).
 *
 * 범위: 격자·계절 틴트·카메라(M1/M2) + 건물 3단계 스프라이트·주민 워커·건물 탭(M3).
 * 성벽 둘레 링 렌더와 시대 전환 연출은 이후 마일스톤(M8/M4).
 */

import Phaser from 'phaser';
import { createRng, type Rng } from '@/systems/rng';
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
  HITBOX_EXPAND,
  WORKER_SIZE,
  WORKER_SPEED,
  ERA_ZOOM_MS,
} from '@/data/camera';
import { GROUND_COLORS, GRID_LINE_COLOR, GRID_LINE_ALPHA } from '@/data/terrain';
import { SEASON_TINT, PALETTE } from '@/data/palette';
import { BUILDING_NAMES } from '@/data/buildings';
import { placeholderFor } from '@/render/placeholder';
import type { Season } from '@/types/game';
import type { DerivedLayout } from '@/systems/layout';

export interface SettlementSceneData {
  seed: number;
  season: Season;
  layout: DerivedLayout;
}

const TINT_KEYS = ['spring', 'summer', 'autumn', 'winter'] as const;
const GROUND_TEX_PREFIX = 'ground_';
const WORKER_TEX = 'worker_dot';

interface PlacedRect {
  id: string;
  px: number;
  py: number;
  pw: number;
  ph: number;
}

interface Worker {
  img: Phaser.GameObjects.Image;
  x: number;
  y: number;
  tgx: number;
  tgy: number;
}

export class SettlementScene extends Phaser.Scene {
  static readonly KEY = 'settlement';

  private seed = 0;
  private season: Season = 0;
  private gridSize = 12;
  private layout!: DerivedLayout;

  private groundLayer!: Phaser.GameObjects.Container;
  private gridGfx!: Phaser.GameObjects.Graphics;
  private buildingLayer!: Phaser.GameObjects.Container;
  private seasonTint!: Phaser.GameObjects.Rectangle;
  private detailLayer!: Phaser.GameObjects.Container; // 워커·파티클 (LOD 대상)

  private placed: PlacedRect[] = [];
  private workers: Worker[] = [];
  private workerRng!: Rng;
  private expandTween: Phaser.Tweens.Tween | null = null;

  /** 건물 탭 콜백 — 씬 → React → 스토어 (§10.3) */
  onBuildingTap: ((id: string) => void) | null = null;

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
    this.seed = data.seed;
    this.season = data.season ?? 0;
    this.layout = data.layout;
    this.gridSize = data.layout.gridSize;
  }

  create(): void {
    this.ensureTextures();
    this.workerRng = createRng(`${this.seed}:workers`);

    this.groundLayer = this.add.container(0, 0);
    this.gridGfx = this.add.graphics();
    this.buildingLayer = this.add.container(0, 0); // 지면 위, 계절 틴트 아래(계절색 적용됨)
    this.seasonTint = this.add
      .rectangle(0, 0, 1, 1, 0xffffff, 1)
      .setOrigin(0, 0)
      .setBlendMode(Phaser.BlendModes.MULTIPLY);
    this.detailLayer = this.add.container(0, 0); // 워커는 틴트 위(눈에 띄게)

    this.buildGround();
    this.renderBuildings();
    this.applySeasonTint();
    this.setupInput();
    this.applyZoom(this.userZoom);
    this.fitView();
  }

  // ── 상태 동기화 (단방향, §10.3) ──
  syncLayout(layout: DerivedLayout): void {
    const prevSize = this.gridSize;
    const grew = layout.gridSize > prevSize;
    const gridChanged = layout.gridSize !== prevSize;
    this.layout = layout;
    if (gridChanged) {
      this.gridSize = layout.gridSize;
      this.buildGround();
      this.applySeasonTint();
      if (grew) this.playExpansion();
      else this.fitView();
    }
    this.renderBuildings();
  }

  /** 시대 전환 맵 확장 — 줌아웃 연출(1.5초, §10.4). 탭으로 스킵, reduced-motion 은 즉시. */
  private playExpansion(): void {
    const cam = this.cameras.main;
    const size = this.gridSize * TILE_SRC;
    cam.centerOn(size / 2, size / 2);
    const targetZoom = this.fitUserZoom();

    if (this.expandTween) this.expandTween.stop();
    if (prefersReducedMotion()) {
      this.applyZoom(targetZoom);
      return;
    }
    // 현재(더 확대된) 줌에서 목표(더 축소된) 줌으로 부드럽게 이동
    const startCamZoom = cam.zoom;
    const target = { z: targetZoom * BASE_SCALE };
    cam.setZoom(startCamZoom);
    this.expandTween = this.tweens.add({
      targets: { z: startCamZoom },
      z: target.z,
      duration: ERA_ZOOM_MS,
      ease: 'Cubic.out',
      onUpdate: (tw) => {
        const z = tw.getValue();
        if (z == null) return;
        cam.setZoom(z);
        this.userZoom = z / BASE_SCALE;
        this.updateLOD();
      },
      onComplete: () => {
        this.applyZoom(targetZoom);
        this.expandTween = null;
      },
    });
  }

  syncSeason(season: Season): void {
    if (season === this.season) return;
    this.season = season;
    this.applySeasonTint();
  }

  // ────────────────────────── 텍스처 ──────────────────────────

  private ensureTextures(): void {
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

    if (!this.textures.exists(WORKER_TEX)) {
      const g = this.add.graphics();
      g.fillStyle(hex(PALETTE.clothWarm), 1);
      g.fillCircle(WORKER_SIZE / 2, WORKER_SIZE / 2, WORKER_SIZE / 2);
      g.generateTexture(WORKER_TEX, WORKER_SIZE, WORKER_SIZE);
      g.destroy();
    }
  }

  // ────────────────────────── 지면 ──────────────────────────

  private buildGround(): void {
    this.groundLayer.removeAll(true);
    this.gridGfx.clear();

    const rng = createRng(`${this.seed}:terrain`);
    const n = this.gridSize;

    for (let ty = 0; ty < n; ty++) {
      for (let tx = 0; tx < n; tx++) {
        const idx = weightedIndex(rng.next(), GROUND_COLORS.length);
        const img = this.add.image(tx * TILE_SRC, ty * TILE_SRC, `${GROUND_TEX_PREFIX}${idx}`);
        img.setOrigin(0, 0);
        this.groundLayer.add(img);
      }
    }

    const size = n * TILE_SRC;
    this.gridGfx.lineStyle(1, hex(GRID_LINE_COLOR), GRID_LINE_ALPHA);
    for (let i = 0; i <= n; i++) {
      const p = i * TILE_SRC;
      this.gridGfx.lineBetween(p, 0, p, size);
      this.gridGfx.lineBetween(0, p, size, p);
    }

    const margin = PAN_MARGIN_TILES * TILE_SRC;
    this.cameras.main.setBounds(-margin, -margin, size + margin * 2, size + margin * 2);
  }

  // ────────────────────────── 건물 ──────────────────────────

  private renderBuildings(): void {
    this.buildingLayer.removeAll(true);
    this.placed = [];

    for (const b of this.layout.buildings) {
      const px = b.tx * TILE_SRC;
      const py = b.ty * TILE_SRC;
      const pw = b.w * TILE_SRC;
      const ph = b.h * TILE_SRC;

      const ph_ = placeholderFor(`building.${b.id}.s${b.stage + 1}`);
      const rect = this.add
        .rectangle(px, py, pw, ph, hex(ph_.color), 1)
        .setOrigin(0, 0)
        .setStrokeStyle(1, hex(PALETTE.ink), 0.5);
      this.buildingLayer.add(rect);

      const label = this.add
        .text(px + pw / 2, py + ph / 2, BUILDING_NAMES[b.id] ?? b.id, {
          fontFamily: 'system-ui, sans-serif',
          fontSize: `${Math.max(7, Math.min(11, Math.floor(pw / 3)))}px`,
          color: PALETTE.ink,
        })
        .setOrigin(0.5, 0.5);
      this.buildingLayer.add(label);

      this.placed.push({ id: b.id, px, py, pw, ph });
    }

    this.syncWorkers(this.layout.workerCount);
  }

  // ────────────────────────── 워커 ──────────────────────────

  private syncWorkers(count: number): void {
    const n = this.gridSize;
    // 부족하면 추가
    while (this.workers.length < count) {
      const tx = this.workerRng.int(0, n - 1);
      const ty = this.workerRng.int(0, n - 1);
      const x = tx * TILE_SRC + TILE_SRC / 2;
      const y = ty * TILE_SRC + TILE_SRC / 2;
      const img = this.add.image(x, y, WORKER_TEX);
      this.detailLayer.add(img);
      this.workers.push({ img, x, y, tgx: x, tgy: y });
    }
    // 넘치면 제거
    while (this.workers.length > count) {
      const w = this.workers.pop();
      w?.img.destroy();
    }
    this.updateLOD();
  }

  private pickWorkerTarget(w: Worker): void {
    const n = this.gridSize;
    const tx = this.workerRng.int(0, n - 1);
    const ty = this.workerRng.int(0, n - 1);
    w.tgx = tx * TILE_SRC + TILE_SRC / 2;
    w.tgy = ty * TILE_SRC + TILE_SRC / 2;
  }

  update(_time: number, delta: number): void {
    if (this.workers.length === 0 || this.userZoom < LOD_HIDE_BELOW) return; // LOD: 숨김 상태면 이동 생략
    const dist = (WORKER_SPEED * delta) / 1000;
    for (const w of this.workers) {
      const dx = w.tgx - w.x;
      const dy = w.tgy - w.y;
      const len = Math.hypot(dx, dy);
      if (len < 0.5) {
        this.pickWorkerTarget(w);
        continue;
      }
      const step = Math.min(dist, len);
      w.x += (dx / len) * step;
      w.y += (dy / len) * step;
      w.img.setPosition(w.x, w.y);
    }
  }

  // ────────────────────────── 계절 틴트 ──────────────────────────

  private applySeasonTint(): void {
    const size = this.gridSize * TILE_SRC;
    this.seasonTint.setPosition(0, 0);
    this.seasonTint.setSize(size, size);
    const tint = SEASON_TINT[TINT_KEYS[this.season]];
    this.seasonTint.setFillStyle(hex(tint.color), 1);
    this.seasonTint.setAlpha(tint.alpha);
  }

  // ────────────────────────── 카메라 ──────────────────────────

  private applyZoom(userZoom: number): void {
    this.userZoom = Phaser.Math.Clamp(userZoom, ZOOM_MIN, ZOOM_MAX);
    this.cameras.main.setZoom(this.userZoom * BASE_SCALE);
    this.updateLOD();
  }

  private applyContinuousZoom(userZoom: number): void {
    const z = Phaser.Math.Clamp(userZoom, ZOOM_MIN, ZOOM_MAX);
    this.userZoom = z;
    this.cameras.main.setZoom(z * BASE_SCALE);
    this.updateLOD();
  }

  private snapZoom(): void {
    let best = ZOOM_MIN;
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
    this.detailLayer.setVisible(this.userZoom >= LOD_HIDE_BELOW);
  }

  /** 격자 전체가 화면에 들어오는 가장 큰 스냅 줌 (없으면 최소) */
  private fitUserZoom(): number {
    const size = this.gridSize * TILE_SRC;
    const cam = this.cameras.main;
    const pad = 1.06;
    const fitCamZoom = Math.min(cam.width / (size * pad), cam.height / (size * pad));
    const target = fitCamZoom / BASE_SCALE;
    let chosen = ZOOM_MIN;
    for (const s of ZOOM_SNAPS) {
      if (s <= target + 1e-6) chosen = s;
    }
    return chosen;
  }

  private fitView(): void {
    const size = this.gridSize * TILE_SRC;
    this.applyZoom(this.fitUserZoom());
    this.cameras.main.centerOn(size / 2, size / 2);
  }

  // ────────────────────────── 입력 ──────────────────────────

  private setupInput(): void {
    const cam = this.cameras.main;

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      // 연출 중이면 탭으로 즉시 완료 (§10.5)
      if (this.expandTween && this.expandTween.isPlaying()) {
        this.expandTween.complete();
      }
      if (this.pointersDown() >= 2) {
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
      if (this.pointersDown() >= 2) {
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
        this.pinchStartDist = 0;
        this.snapZoom();
      }
      if (stillDown === 0) {
        this.isPanning = false;
        this.handleTap(p);
      }
    });

    this.input.on('wheel', (_p: Phaser.Input.Pointer, _o: unknown, _dx: number, dy: number) => {
      this.stepZoom(dy < 0 ? 1 : -1);
    });
  }

  private pointersDown(): number {
    let c = 0;
    for (const ptr of this.input.manager.pointers) if (ptr.isDown) c++;
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
    this.applyContinuousZoom(this.pinchStartZoom * (dist / this.pinchStartDist));
  }

  private stepZoom(dir: number): void {
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
    if (moved > TAP_MOVE_MAX || dt > 400) return;

    const now = this.time.now;
    const nearLast = Phaser.Math.Distance.Between(p.x, p.y, this.lastTapPos.x, this.lastTapPos.y);
    if (now - this.lastTapTime <= DOUBLE_TAP_MS && nearLast <= TAP_MOVE_MAX * 3) {
      this.fitView();
      this.lastTapTime = 0;
      return;
    }
    this.lastTapTime = now;
    this.lastTapPos.set(p.x, p.y);

    // 건물 탭 판정 (히트박스는 스프라이트보다 각 HITBOX_EXPAND 크게, §10.4)
    const world = this.cameras.main.getWorldPoint(p.x, p.y);
    const hit = this.buildingAt(world.x, world.y);
    if (hit && this.onBuildingTap) this.onBuildingTap(hit);
  }

  private buildingAt(wx: number, wy: number): string | null {
    const e = HITBOX_EXPAND;
    // 겹치면 가까운 순 — 뒤에 그려진(위) 건물 우선하도록 역순 탐색
    for (let i = this.placed.length - 1; i >= 0; i--) {
      const b = this.placed[i]!;
      if (wx >= b.px - e && wx <= b.px + b.pw + e && wy >= b.py - e && wy <= b.py + b.ph + e) {
        return b.id;
      }
    }
    return null;
  }
}

function hex(color: string): number {
  return Phaser.Display.Color.HexStringToColor(color).color;
}

function prefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

/** [0,1) 난수를 가중 인덱스로: 앞쪽 색이 더 자주 나오게 제곱 편향 */
function weightedIndex(r: number, len: number): number {
  return Math.min(len - 1, Math.floor(r * r * len));
}
