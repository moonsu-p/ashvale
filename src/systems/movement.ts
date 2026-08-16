/**
 * 이동과 상호작용 규칙 (§5) — 순수 함수.
 *
 * 여기서 시간을 재지 않는다. 한 칸에 140ms 를 흘려보내는 건 씬의 일이고,
 * "갈 수 있는가 / 방향만 바꾸는가"를 정하는 건 여기 일이다.
 */

import type { Dir } from '@/types/game';
import type { MapObject, TileMapData } from '@/types/map';
import { isBlocked, objectAt } from './map';

export interface HeroTile {
  x: number;
  y: number;
  dir: Dir;
}

const DELTA: Record<Dir, { dx: number; dy: number }> = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

export type MoveOutcome =
  /** 방향만 바꾼다. 정지 상태에서 다른 방향을 처음 눌렀을 때 */
  | { kind: 'turn'; dir: Dir }
  /** 한 칸 간다 */
  | { kind: 'step'; dir: Dir; to: { x: number; y: number } }
  /** 막혔다. 방향은 바뀐다 — 벽을 보고 서게 된다 */
  | { kind: 'blocked'; dir: Dir };

/** 바라보는 칸 */
export function facingTile(hero: HeroTile): { x: number; y: number } {
  const d = DELTA[hero.dir];
  return { x: hero.x + d.dx, y: hero.y + d.dy };
}

/**
 * 입력 하나를 어떻게 처리할지 정한다.
 *
 * `fromStandstill` 이 참일 때만 방향 전환 규칙이 걸린다.
 * 걷는 도중에 꺾을 때까지 한 번 멈춰 세우면 모퉁이를 돌 때마다 걸린다.
 */
export function resolveMove(
  hero: HeroTile,
  map: TileMapData,
  dir: Dir,
  opts: { fromStandstill: boolean },
): MoveOutcome {
  // 벽을 보고 말을 걸어야 할 때가 있다 (§5)
  if (opts.fromStandstill && hero.dir !== dir) {
    return { kind: 'turn', dir };
  }

  const d = DELTA[dir];
  const to = { x: hero.x + d.dx, y: hero.y + d.dy };

  if (isBlocked(map, to.x, to.y)) return { kind: 'blocked', dir };
  return { kind: 'step', dir, to };
}

/** 오브젝트 종류별 프롬프트 문구 (§5) */
const PROMPT: Record<MapObject['type'], string> = {
  npc: '말 걸기',
  door: '들어가기',
  node: '살펴보기',
  gateway: '나가기',
};

export interface Interaction {
  object: MapObject;
  /** 하단에 띄울 문구. 'A — 말 걸기' 형태로 조립해서 쓴다 */
  label: string;
}

/** 건물 부지면 문구가 갈린다 — 아직 없으면 건설, 있으면 증축 (§10) */
function labelFor(object: MapObject, buildings?: Record<string, number>): string {
  if (object.building !== undefined) {
    const level = buildings?.[object.building] ?? 0;
    return level === 0 ? '건설' : '증축';
  }
  return PROMPT[object.type];
}

/**
 * 지금 A 를 누르면 무엇이 되는가.
 *
 * 바라보는 칸을 먼저 본다 (§5). 거기 아무것도 없으면 **밟고 선 칸**의
 * 문·길목·건물 부지를 본다 (§6 — 문 타일을 밟고 A). 둘 다 없으면 null.
 */
export function interactionAt(
  map: TileMapData,
  hero: HeroTile,
  buildings?: Record<string, number>,
): Interaction | null {
  const front = facingTile(hero);
  const faced = objectAt(map, front.x, front.y);
  if (faced !== undefined) {
    return { object: faced, label: labelFor(faced, buildings) };
  }

  const under = objectAt(map, hero.x, hero.y);
  if (
    under !== undefined &&
    (under.type === 'door' || under.type === 'gateway' || under.building !== undefined)
  ) {
    return { object: under, label: labelFor(under, buildings) };
  }

  return null;
}
