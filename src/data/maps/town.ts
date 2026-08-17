/**
 * 아쉬베일 마을 — 기획서 §6, §10.
 *
 * **맵은 한 벌뿐이다.** 시대마다 별도 파일을 그리면 유지가 불가능해진다 (§6).
 * 36×30 을 통째로 만들고, 아직 열리지 않은 바깥을 수풀로 막는다.
 * 시대가 오르면 그 수풀이 치워지면서 마을이 넓어진다.
 *
 * 건물은 걸어다니며 보이는 것이다 (§10). 레벨에 따라 부지 안의 구조물이 커지고,
 * 시각 단계는 1 / 4 / 10 세 개뿐이다.
 *
 * **임시다.** Tiled JSON 이 들어오면 지형과 부지 배치는 그쪽에서 온다.
 */

import type { MapObject, Terrain, TileMapData } from '@/types/map';
import { TOWN_MAX, inRect, playableRect } from '@/data/eras';
import { visualStage, wallStage } from '@/data/buildings';
import { createRng } from '@/systems/rng';

const W = TOWN_MAX.width;
const H = TOWN_MAX.height;

/** 건물 부지. 최대 단계에서 이만큼을 차지한다 */
interface Plot {
  buildingId: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

/** 부지는 그 건물이 열리는 시대의 범위 안에 있어야 한다 */
const PLOTS: Plot[] = [
  { buildingId: 'hall', x: 8, y: 15, w: 5, h: 4 },
  { buildingId: 'lumber', x: 3, y: 17, w: 3, h: 3 },
  { buildingId: 'farm', x: 14, y: 19, w: 4, h: 4 },
  { buildingId: 'quarry', x: 3, y: 22, w: 3, h: 3 },
  { buildingId: 'lodge', x: 14, y: 24, w: 4, h: 3 },
  // 성장기 — 북쪽 구역
  { buildingId: 'market', x: 9, y: 7, w: 4, h: 4 },
  { buildingId: 'library', x: 16, y: 8, w: 3, h: 3 },
  { buildingId: 'shrine', x: 4, y: 8, w: 3, h: 3 },
  // 영주기
  { buildingId: 'guildhall', x: 21, y: 15, w: 4, h: 4 },
  // 왕국기 — 동쪽 구역
  { buildingId: 'academy', x: 28, y: 10, w: 4, h: 4 },
  { buildingId: 'spire', x: 28, y: 20, w: 4, h: 5 },
];

/** 남쪽 길목. 여기로 지역에 나간다 */
const GATEWAY_X = 10;

export interface TownContext {
  eraIndex: number;
  buildings: Record<string, number>;
}

/** 같은 입력이면 같은 맵이다. 씬이 이 열쇠로 다시 그릴지 판단한다 */
export function townKey(ctx: TownContext): string {
  const levels = Object.keys(ctx.buildings)
    .sort()
    .map((id) => `${id}${ctx.buildings[id] ?? 0}`)
    .join(',');
  return `town:${ctx.eraIndex}:${levels}`;
}

export function buildTownMap(ctx: TownContext): TileMapData {
  const size = W * H;
  const ground: Terrain[] = new Array<Terrain>(size).fill('grass');
  const deco: (Terrain | null)[] = new Array<Terrain | null>(size).fill(null);
  const collision: boolean[] = new Array<boolean>(size).fill(false);
  const objects: MapObject[] = [];

  const at = (x: number, y: number) => y * W + x;
  const put = (x: number, y: number, t: Terrain, solid: boolean) => {
    if (x < 0 || y < 0 || x >= W || y >= H) return;
    ground[at(x, y)] = t;
    collision[at(x, y)] = solid;
  };

  const rect = playableRect(ctx.eraIndex);

  // 풀숲 무늬. 시드를 고정해 새로 그려도 같은 그림이 나오게 한다
  const rng = createRng('town:deco');
  for (let i = 0; i < size; i++) {
    if (rng.chance(0.12)) ground[i] = 'grassTuft';
  }

  // ── 아직 열리지 않은 바깥을 막는다 ──────────────────
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (!inRect(rect, x, y)) put(x, y, 'overgrown', true);
    }
  }

  // ── 못과 길 ────────────────────────────────────────
  for (let y = 25; y <= 27; y++) {
    for (let x = 2; x <= 4; x++) if (inRect(rect, x, y)) put(x, y, 'water', true);
  }
  for (let y = 19; y <= rect.y1; y++) if (inRect(rect, GATEWAY_X, y)) put(GATEWAY_X, y, 'path', false);

  // ── 건물 ───────────────────────────────────────────
  for (const plot of PLOTS) {
    if (!inRect(rect, plot.x, plot.y)) continue;

    const level = ctx.buildings[plot.buildingId] ?? 0;
    const stage = visualStage(level);

    // 비어 있는 자리도 부지로 보여야 무엇을 지을 수 있는지 알 수 있다
    for (let y = plot.y; y < plot.y + plot.h; y++) {
      for (let x = plot.x; x < plot.x + plot.w; x++) put(x, y, 'plot', false);
    }

    const built = stampBuilding(put, plot, stage);
    objects.push({
      id: `plot-${plot.buildingId}`,
      type: 'node',
      x: built.doorX,
      y: built.doorY,
      // 부지는 밟고 서서 A 를 누른다. 막지 않는다
      solid: false,
      building: plot.buildingId,
    });
  }

  // ── 성벽 링 ────────────────────────────────────────
  // 개별 건물이 아니라 마을 둘레를 감싸는 타일 링이다 (§10)
  const wallLevel = ctx.buildings['wall'] ?? 0;
  const ring = wallStage(wallLevel);
  const ringTerrain: Terrain | null =
    ring === 'fence' ? 'fence' : ring === 'stone' ? 'rampart' : ring === 'tower' ? 'tower' : null;

  for (let x = rect.x0; x <= rect.x1; x++) {
    put(x, rect.y0, ringTerrain ?? 'tree', true);
    put(x, rect.y1, ringTerrain ?? 'tree', true);
  }
  for (let y = rect.y0; y <= rect.y1; y++) {
    put(rect.x0, y, ringTerrain ?? 'tree', true);
    put(rect.x1, y, ringTerrain ?? 'tree', true);
  }

  // 길목 한 칸은 늘 열려 있다
  put(GATEWAY_X, rect.y1, 'gateway', false);
  objects.push({
    id: 'south-gateway',
    type: 'gateway',
    x: GATEWAY_X,
    y: rect.y1,
    target: 'region-select',
    solid: false,
  });

  // ── 인물 ───────────────────────────────────────────
  const npcs: MapObject[] = [
    // 의뢰인은 길바닥에 서 있지 않는다. 회관 안에 상주한다 (§7.6, §10)
    {
      id: 'npc-b',
      type: 'npc',
      x: 13,
      y: 23,
      sprite: 'char.comp.1',
      voice: { kind: 'companion', id: 'knight' },
      solid: true,
    },
  ];
  for (const npc of npcs) if (inRect(rect, npc.x, npc.y)) objects.push(npc);

  return { id: 'town', width: W, height: H, ground, deco, collision, objects };
}

/**
 * 부지 안에 구조물을 찍는다. 단계가 오를수록 커진다.
 *
 * 구조물을 부지 가운데에 맞추고 문을 **부지의 가운데 칸**에 둔다.
 * 그래야 단계가 올라도 문이 제자리에 있다 — 문이 움직이면 방금 증축을 누른
 * 자리가 벽이 되어 사람이 벽 안에 서게 된다.
 */
function stampBuilding(
  put: (x: number, y: number, t: Terrain, solid: boolean) => void,
  plot: Plot,
  stage: number,
): { doorX: number; doorY: number } {
  const doorX = plot.x + Math.floor(plot.w / 2);
  const y1 = plot.y + plot.h - 1;

  if (stage === 0) return { doorX, doorY: y1 };

  // 단계별 구조물 크기. 부지를 넘지 않는다
  const w = Math.min(plot.w, stage === 1 ? 2 : stage === 2 ? 3 : plot.w);
  const h = Math.min(plot.h, stage === 1 ? 2 : stage === 2 ? 3 : plot.h);

  const x0 = plot.x + Math.floor((plot.w - w) / 2);
  const y0 = y1 - h + 1;

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x < x0 + w; x++) {
      // 맨 아랫줄은 벽, 그 위는 지붕
      put(x, y, y === y1 ? 'wall' : 'roof', true);
    }
  }

  // 문은 늘 걸어 들어갈 수 있다
  put(doorX, y1, 'door', false);
  return { doorX, doorY: y1 };
}
