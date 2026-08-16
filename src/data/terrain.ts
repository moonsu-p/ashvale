/**
 * 지형별 표시 색 — 타일셋 원본이 없는 동안 쓰는 플레이스홀더 값.
 *
 * 색은 팔레트에서만 가져온다. 여기 없는 색을 쓰지 않는다.
 * Kenney 타일셋이 들어오면 이 표는 지형 -> 타일 id 대응표로 바뀐다.
 */

import type { PaletteKey } from './palette';
import type { Terrain } from '@/types/map';

export interface TerrainLook {
  /** 바탕색 */
  base: PaletteKey;
  /** 무늬색. 같은 색이면 무늬를 그리지 않는다 */
  detail: PaletteKey;
}

export const TERRAIN_LOOK: Record<Terrain, TerrainLook> = {
  grass: { base: 'grass', detail: 'grass' },
  grassTuft: { base: 'grass', detail: 'grassLight' },
  path: { base: 'dirt', detail: 'dirtLight' },
  plot: { base: 'soilDark', detail: 'dirt' },
  water: { base: 'water', detail: 'waterDeep' },
  tree: { base: 'grassDark', detail: 'grass' },
  rock: { base: 'stone', detail: 'stoneLight' },
  wall: { base: 'stoneLight', detail: 'stone' },
  roof: { base: 'roofRed', detail: 'roofBlue' },
  door: { base: 'wood', detail: 'woodLight' },
  gateway: { base: 'dirtLight', detail: 'dirt' },

  // 성벽 링 (§10) — 1–3 나무 울타리, 4–9 석벽, 10+ 탑
  fence: { base: 'wood', detail: 'woodLight' },
  rampart: { base: 'stone', detail: 'stoneLight' },
  tower: { base: 'stoneDark', detail: 'metal' },

  // 아직 열리지 않은 자리. 시대가 오르면 치운다
  overgrown: { base: 'grassDark', detail: 'grass' },
};
