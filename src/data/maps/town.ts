/**
 * 개척기 마을 20×18 (§6 시대 표의 0 개척기: 회관, 공터).
 *
 * **임시다.** Tiled 로 그린 JSON 이 들어오면 이 파일을 지운다.
 * 그때를 위해 만들어 내는 모양은 Tiled 레이어 규약과 똑같이 맞춰 뒀다 —
 * ground / deco / collision / objects. 로더만 갈아끼우면 된다.
 *
 * 충돌은 지형에서 유도하지 않는다. 놓을 때마다 collision 에 직접 표시한다.
 */

import type { TileMapData, Terrain, MapObject } from '@/types/map';
import { createRng } from '@/systems/rng';

const WIDTH = 20;
const HEIGHT = 18;

/** 회관. 지붕 두 줄 + 벽 한 줄, 가운데가 문 */
const HALL = { x0: 8, x1: 12, yRoof0: 3, yRoof1: 4, yWall: 5, doorX: 10 };

/** 남쪽 길목. 여기로 지역 선택으로 나간다 */
const GATEWAY = { x: 10, y: HEIGHT - 1 };

/** 남북으로 난 흙길 */
const PATH_X = 10;

/** 못 */
const POND = { x0: 2, x1: 4, y0: 12, y1: 14 };

/** 공터 */
const PLOT = { x0: 14, x1: 17, y0: 8, y1: 11 };

export function buildTownMap(): TileMapData {
  const size = WIDTH * HEIGHT;
  const ground: Terrain[] = new Array<Terrain>(size).fill('grass');
  const deco: (Terrain | null)[] = new Array<Terrain | null>(size).fill(null);
  const collision: boolean[] = new Array<boolean>(size).fill(false);

  const at = (x: number, y: number) => y * WIDTH + x;
  const put = (x: number, y: number, t: Terrain, solid: boolean) => {
    ground[at(x, y)] = t;
    collision[at(x, y)] = solid;
  };

  // 풀숲 무늬. 시드를 고정해서 새로고침해도 같은 그림이 나오게 한다
  const rng = createRng('town:deco');
  for (let i = 0; i < size; i++) {
    if (rng.chance(0.12)) ground[i] = 'grassTuft';
  }

  // 공터
  for (let y = PLOT.y0; y <= PLOT.y1; y++) {
    for (let x = PLOT.x0; x <= PLOT.x1; x++) put(x, y, 'plot', false);
  }

  // 흙길 — 회관 문 앞에서 남쪽 길목까지
  for (let y = HALL.yWall; y < HEIGHT; y++) put(PATH_X, y, 'path', false);

  // 못
  for (let y = POND.y0; y <= POND.y1; y++) {
    for (let x = POND.x0; x <= POND.x1; x++) put(x, y, 'water', true);
  }

  // 회관
  for (let x = HALL.x0; x <= HALL.x1; x++) {
    put(x, HALL.yRoof0, 'roof', true);
    put(x, HALL.yRoof1, 'roof', true);
    put(x, HALL.yWall, 'wall', true);
  }
  // 문은 밟고 서서 A 를 누르는 자리다. 막지 않는다
  put(HALL.doorX, HALL.yWall, 'door', false);

  // 바깥 테두리는 나무로 막는다
  for (let x = 0; x < WIDTH; x++) {
    put(x, 0, 'tree', true);
    put(x, HEIGHT - 1, 'tree', true);
  }
  for (let y = 0; y < HEIGHT; y++) {
    put(0, y, 'tree', true);
    put(WIDTH - 1, y, 'tree', true);
  }

  // 길목 한 칸만 열어 둔다
  put(GATEWAY.x, GATEWAY.y, 'gateway', false);

  // 바위 몇 개
  for (const [x, y] of [
    [5, 4],
    [15, 5],
    [4, 8],
  ] as const) {
    put(x, y, 'rock', true);
  }

  const objects: MapObject[] = [
    {
      id: 'hall-door',
      type: 'door',
      x: HALL.doorX,
      y: HALL.yWall,
      target: 'indoor:hall',
      solid: false,
    },
    {
      id: 'south-gateway',
      type: 'gateway',
      x: GATEWAY.x,
      y: GATEWAY.y,
      target: 'region-select',
      solid: false,
    },
    // 인물은 밀어서 지나갈 수 없다 (§5). 통로를 막지 않는 자리에 세운다
    { id: 'npc-a', type: 'npc', x: 8, y: 8, sprite: 'char.patron.bartek', solid: true },
    { id: 'npc-b', type: 'npc', x: 13, y: 12, sprite: 'char.comp.1', solid: true },
    { id: 'notice', type: 'node', x: 12, y: 7, solid: true },
  ];

  return { id: 'town', width: WIDTH, height: HEIGHT, ground, deco, collision, objects };
}
