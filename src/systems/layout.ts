/**
 * deriveLayout — 시각 배치를 GameState 에서 결정론적으로 파생한다 (§3, §10.4).
 * 시각 상태를 저장하지 않는다. 같은 세이브(createdAt)는 항상 같은 배치를 그린다.
 *
 * 회관을 중앙에 두고 나머지 건물을 나선으로 채운다. 성벽은 자리 대신 둘레 링이므로 제외한다.
 * 시각 단계는 레벨 1/4/10 세 개(§5). 점유 타일은 단계별로 커진다(assets 매니페스트에서 읽음).
 */

import type { GameState } from '@/types/game';
import { ASSET_MAP } from '@/data/assets';
import { BUILD_ORDER, RING_BUILDINGS } from '@/data/buildings';
import { gridSizeForEra } from './grid';
import { population } from './economy';
import { WORKER_MAX } from '@/data/camera';

/** 레벨 → 시각 단계 인덱스 (0: 1–3, 1: 4–9, 2: 10+). 레벨 0 은 미건설. */
export function stageOfLevel(level: number): number {
  if (level >= 10) return 2;
  if (level >= 4) return 1;
  return 0;
}

/** 건물+단계의 점유 타일 (assets 매니페스트가 유일한 출처). 없으면 1×1. */
export function occupancyOf(id: string, stage: number): [number, number] {
  const entry = ASSET_MAP[`building.${id}.s${stage + 1}`];
  return entry?.grid ?? [1, 1];
}

export interface PlacedBuilding {
  id: string;
  level: number;
  stage: number;
  /** 타일 좌표(좌상단) */
  tx: number;
  ty: number;
  w: number;
  h: number;
}

export interface DerivedLayout {
  gridSize: number;
  buildings: PlacedBuilding[];
  workerCount: number;
  wall: { present: boolean; level: number };
  /** 점유 영역 경계 (타일). 전체보기·성벽 링(M8)에 쓴다. */
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

/** 중심에서 바깥으로 도는 나선 좌표를 순서대로 만든다. */
function spiralCells(n: number, cx: number, cy: number): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  const inb = (x: number, y: number) => x >= 0 && y >= 0 && x < n && y < n;
  let x = cx;
  let y = cy;
  if (inb(x, y)) cells.push([x, y]);
  let step = 1;
  // 오른→아래→왼→위 를 늘려가며 도는 표준 나선
  while (cells.length < n * n) {
    for (let i = 0; i < step; i++) {
      x += 1;
      if (inb(x, y)) cells.push([x, y]);
    }
    for (let i = 0; i < step; i++) {
      y += 1;
      if (inb(x, y)) cells.push([x, y]);
    }
    step += 1;
    for (let i = 0; i < step; i++) {
      x -= 1;
      if (inb(x, y)) cells.push([x, y]);
    }
    for (let i = 0; i < step; i++) {
      y -= 1;
      if (inb(x, y)) cells.push([x, y]);
    }
    step += 1;
  }
  return cells;
}

export function deriveLayout(state: GameState): DerivedLayout {
  const n = gridSizeForEra(state.world.eraIndex);
  const occupied: boolean[] = new Array(n * n).fill(false);
  const idx = (x: number, y: number) => y * n + x;

  const fits = (tx: number, ty: number, w: number, h: number): boolean => {
    if (tx < 0 || ty < 0 || tx + w > n || ty + h > n) return false;
    for (let yy = ty; yy < ty + h; yy++) {
      for (let xx = tx; xx < tx + w; xx++) {
        if (occupied[idx(xx, yy)]) return false;
      }
    }
    return true;
  };
  const mark = (tx: number, ty: number, w: number, h: number): void => {
    for (let yy = ty; yy < ty + h; yy++) {
      for (let xx = tx; xx < tx + w; xx++) occupied[idx(xx, yy)] = true;
    }
  };

  const buildings: PlacedBuilding[] = [];
  const place = (id: string, tx: number, ty: number, level: number, stage: number, w: number, h: number) => {
    mark(tx, ty, w, h);
    buildings.push({ id, level, stage, tx, ty, w, h });
  };

  const cx = Math.floor(n / 2);
  const cy = Math.floor(n / 2);

  // 회관 중앙 배치
  const hallLevel = state.settlement.buildings.hall ?? 0;
  if (hallLevel > 0) {
    const st = stageOfLevel(hallLevel);
    const [w, h] = occupancyOf('hall', st);
    const hx = Math.max(0, Math.min(n - w, cx - Math.floor(w / 2)));
    const hy = Math.max(0, Math.min(n - h, cy - Math.floor(h / 2)));
    place('hall', hx, hy, hallLevel, st, w, h);
  }

  const cells = spiralCells(n, cx, cy);

  for (const id of BUILD_ORDER) {
    if (id === 'hall' || RING_BUILDINGS.has(id)) continue;
    const level = state.settlement.buildings[id] ?? 0;
    if (level <= 0) continue;
    const st = stageOfLevel(level);
    const [w, h] = occupancyOf(id, st);
    for (const [sx, sy] of cells) {
      if (fits(sx, sy, w, h)) {
        place(id, sx, sy, level, st, w, h);
        break;
      }
    }
  }

  // 점유 경계
  let minX = n;
  let minY = n;
  let maxX = 0;
  let maxY = 0;
  for (const b of buildings) {
    minX = Math.min(minX, b.tx);
    minY = Math.min(minY, b.ty);
    maxX = Math.max(maxX, b.tx + b.w);
    maxY = Math.max(maxY, b.ty + b.h);
  }
  if (buildings.length === 0) {
    minX = cx;
    minY = cy;
    maxX = cx;
    maxY = cy;
  }

  const wallLevel = state.settlement.buildings.wall ?? 0;

  return {
    gridSize: n,
    buildings,
    workerCount: Math.min(population(state), WORKER_MAX),
    wall: { present: wallLevel > 0, level: wallLevel },
    bounds: { minX, minY, maxX, maxY },
  };
}
