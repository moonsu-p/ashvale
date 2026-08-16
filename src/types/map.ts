/**
 * 맵 자료 구조 — 기획서 §6.
 *
 * Tiled 에디터의 레이어 규약을 그대로 옮긴 모양이다:
 *   ground(바닥) / deco(위에 겹치는 장식) / collision(충돌, 보이지 않음) / objects(문·NPC·사건 노드)
 *
 * **충돌은 collision 레이어로만 판정한다.** 타일 종류로 판정하지 않는다 —
 * 나중에 타일셋을 바꾸면 전부 깨진다.
 */

/**
 * 지형 종류.
 *
 * 타일셋 원본이 아직 없어서 숫자 타일 id 대신 의미로 적는다.
 * 타일셋이 들어오면 Tiled 로더가 gid -> Terrain 대응표를 거쳐 같은 모양을 채운다.
 * 그림이 없는 동안에는 지형별 팔레트 색으로 그린다.
 */
export type Terrain =
  | 'grass'
  | 'grassTuft'
  | 'path'
  | 'plot'
  | 'water'
  | 'tree'
  | 'rock'
  | 'wall'
  | 'roof'
  | 'door'
  | 'gateway'
  // 성벽 링 — 레벨에 따라 셋 중 하나로 그린다 (§10)
  | 'fence'
  | 'rampart'
  | 'tower'
  /** 시대가 오르면 치워지는 잠긴 자리 (§6) */
  | 'overgrown';

/** 오브젝트 종류 (§6). 상호작용 문구가 여기서 갈린다 (§5) */
export type MapObjectType = 'door' | 'npc' | 'node' | 'gateway';

export interface MapObject {
  id: string;
  type: MapObjectType;
  x: number;
  y: number;
  /** door·gateway 가 가리키는 맵 id */
  target?: string;
  /** npc 일 때 쓸 에셋 매니페스트 id */
  sprite?: string;
  /** npc 일 때 대사를 끌어올 곳. 없으면 말을 걸어도 대화가 열리지 않는다 */
  voice?: { kind: 'companion' | 'patron'; id: string };
  /** 건물 부지면 그 건물 id. 여기 서서 A 를 누르면 건설·증축 패널이 열린다 (§10) */
  building?: string;
  /** 지나갈 수 없는가. 인물은 밀어서 지나갈 수 없다 (§5) */
  solid?: boolean;
}

export interface TileMapData {
  id: string;
  width: number;
  height: number;
  /** 길이 width*height. 행 우선 */
  ground: Terrain[];
  /** 바닥 위에 겹치는 장식. 없으면 null */
  deco: (Terrain | null)[];
  /** true 면 막힘. 지형에서 유도하지 않고 별도로 들고 있는다 */
  collision: boolean[];
  objects: MapObject[];
}

export function tileIndex(map: { width: number }, x: number, y: number): number {
  return y * map.width + x;
}

export function inBounds(map: TileMapData, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < map.width && y < map.height;
}
