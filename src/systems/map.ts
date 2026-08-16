/**
 * 맵 불러오기와 조회.
 *
 * **여기가 Tiled 교체 지점이다.** 지금은 코드로 만든 임시 마을을 돌려주지만,
 * Tiled JSON 이 생기면 `loadMap` 안에서 파싱한 결과를 돌려주면 된다.
 * 부르는 쪽(씬·규칙)은 `TileMapData` 만 알고 있으므로 손댈 필요가 없다.
 *
 * Tiled 에서 가져올 때의 대응:
 *   ground 레이어    -> ground   (gid -> Terrain 대응표를 거친다)
 *   deco 레이어      -> deco
 *   collision 레이어 -> collision (칸이 채워져 있으면 true)
 *   objects 레이어   -> objects   (type / target 속성을 그대로 읽는다)
 */

import type { MapObject, TileMapData } from '@/types/map';
import { inBounds, tileIndex } from '@/types/map';
import { buildTownMap } from '@/data/maps/town';

const cache = new Map<string, TileMapData>();

export function loadMap(id: string): TileMapData {
  const hit = cache.get(id);
  if (hit !== undefined) return hit;

  let map: TileMapData;
  switch (id) {
    case 'town':
      map = buildTownMap();
      break;
    default:
      throw new Error(`맵 '${id}' 가 없다. src/systems/map.ts 의 loadMap 에 추가하라.`);
  }

  cache.set(id, map);
  return map;
}

/** 그 칸에 놓인 오브젝트. 한 칸에 하나만 둔다 */
export function objectAt(map: TileMapData, x: number, y: number): MapObject | undefined {
  return map.objects.find((o) => o.x === x && o.y === y);
}

/**
 * 그 칸으로 들어갈 수 없는가.
 *
 * 지형 종류를 보지 않는다 — collision 레이어와, 막는 오브젝트만 본다.
 * 인물은 밀어서 지나갈 수 없다 (§5).
 */
export function isBlocked(map: TileMapData, x: number, y: number): boolean {
  if (!inBounds(map, x, y)) return true;
  if (map.collision[tileIndex(map, x, y)] === true) return true;
  return objectAt(map, x, y)?.solid === true;
}
