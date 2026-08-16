/**
 * 지역 맵 (§11).
 *
 * 지역은 **걸어다니는 맵**이다. 목록에서 고르고 결과만 보는 방식이 아니다.
 * 맵에 사건 노드 3~5개가 놓이고, 밟으면 판정이 돈다.
 *
 * **임시다.** Tiled JSON 이 들어오면 지형과 노드 배치는 그쪽에서 온다.
 * 노드 자리는 지역 id 로 시드를 고정해서, 같은 지역은 늘 같은 지도가 되게 한다.
 */

import type { MapObject, Terrain, TileMapData } from '@/types/map';
import { NODE_COUNT, regionMapId } from '@/data/regions';
import { createRng } from '@/systems/rng';

const W = 24;
const H = 20;

/** 입구 — 남쪽 가운데. 여기로 들어오고 여기로 나간다 */
const ENTRY_X = 12;

export const REGION_ENTRY = { x: ENTRY_X, y: H - 2, dir: 'up' } as const;

/** 지역마다 바닥과 막힌 것이 다르다 */
interface RegionLook {
  floor: Terrain;
  accent: Terrain;
  block: Terrain;
}

const LOOK: Record<string, RegionLook> = {
  whisper: { floor: 'grass', accent: 'grassTuft', block: 'tree' },
  gate: { floor: 'sand', accent: 'path', block: 'rock' },
  marsh: { floor: 'bog', accent: 'plot', block: 'water' },
  peaks: { floor: 'scree', accent: 'rock', block: 'rampart' },
  deep: { floor: 'scree', accent: 'rock', block: 'tower' },
  rift: { floor: 'riftGround', accent: 'rock', block: 'tower' },
};

const FALLBACK: RegionLook = { floor: 'grass', accent: 'grassTuft', block: 'tree' };

export function buildRegionMap(regionId: string): TileMapData {
  const size = W * H;
  const look = LOOK[regionId] ?? FALLBACK;

  const ground: Terrain[] = new Array<Terrain>(size).fill(look.floor);
  const deco: (Terrain | null)[] = new Array<Terrain | null>(size).fill(null);
  const collision: boolean[] = new Array<boolean>(size).fill(false);

  const at = (x: number, y: number) => y * W + x;
  const put = (x: number, y: number, t: Terrain, solid: boolean) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    ground[at(x, y)] = t;
    collision[at(x, y)] = solid;
  };

  // 지역마다 늘 같은 지도가 나오게 시드를 고정한다
  const rng = createRng(`region:${regionId}`);

  for (let i = 0; i < size; i++) {
    if (rng.chance(0.14)) ground[i] = look.accent;
  }

  // 테두리
  for (let x = 0; x < W; x++) {
    put(x, 0, look.block, true);
    put(x, H - 1, look.block, true);
  }
  for (let y = 0; y < H; y++) {
    put(0, y, look.block, true);
    put(W - 1, y, look.block, true);
  }

  // 흩어진 장애물. 길이 막히지 않게 성기게 둔다
  for (let i = 0; i < 26; i++) {
    const x = rng.int(2, W - 3);
    const y = rng.int(2, H - 3);
    if (x === ENTRY_X) continue; // 입구에서 북쪽으로 난 길은 비워 둔다
    put(x, y, look.block, true);
  }

  // 입구에서 위로 뻗는 길은 반드시 열어 둔다
  for (let y = 1; y < H - 1; y++) put(ENTRY_X, y, look.accent, false);
  put(ENTRY_X, H - 1, 'gateway', false);

  const objects: MapObject[] = [
    { id: 'exit', type: 'gateway', x: ENTRY_X, y: H - 1, target: 'town', solid: false },
  ];

  // ── 사건 노드 ──────────────────────────────────────
  // 전리품 노드 2~3 + 사건 노드 1 (§11)
  const total = rng.int(NODE_COUNT.min, NODE_COUNT.max);
  const lootCount = total - 1;

  const taken = new Set<string>();
  for (let i = 0; i < total; i++) {
    let x = 0;
    let y = 0;
    let tries = 0;
    do {
      x = rng.int(1, W - 2);
      y = rng.int(1, H - 3);
      tries += 1;
    } while ((collision[at(x, y)] === true || taken.has(`${x},${y}`)) && tries < 60);

    if (collision[at(x, y)] === true) continue;
    taken.add(`${x},${y}`);

    objects.push({
      id: `node-${i}`,
      type: 'node',
      x,
      y,
      // 밟으면 판정이다 (§11). 막지 않는다
      solid: false,
      nodeKind: i < lootCount ? 'loot' : 'event',
    });
  }

  return { id: regionMapId(regionId), width: W, height: H, ground, deco, collision, objects };
}
