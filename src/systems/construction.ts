/**
 * 건설·증축 — 순수 함수 (§5). 건설은 턴을 소비하지 않는다. 자원이 유일한 제약(§2).
 * 다음 레벨 비용 = 기본 비용 × (현재 레벨 + 1). 최대 레벨 없음.
 */

import type { GameState, ResourceId, Season } from '@/types/game';
import { BUILDING_COST, BUILDING_UNLOCK_ERA } from '@/data/buildings';
import { buildText } from '@/data/chronicle-system';
import { seasonOf } from './time';

export type Cost = Partial<Record<ResourceId, number>>;

export function currentLevel(state: GameState, id: string): number {
  return state.settlement.buildings[id] ?? 0;
}

export function isUnlocked(state: GameState, id: string): boolean {
  const gate = BUILDING_UNLOCK_ERA[id];
  if (gate === undefined) return false;
  return state.world.eraIndex >= gate;
}

/** id 를 현재 레벨에서 한 단계 올리는 비용. */
export function nextCost(state: GameState, id: string): Cost {
  const base = BUILDING_COST[id];
  if (!base) return {};
  const mult = currentLevel(state, id) + 1;
  const out: Cost = {};
  for (const [r, v] of Object.entries(base) as [ResourceId, number][]) {
    out[r] = v * mult;
  }
  return out;
}

export function canAfford(state: GameState, cost: Cost): boolean {
  return (Object.entries(cost) as [ResourceId, number][]).every(
    ([r, v]) => state.resources[r] >= v
  );
}

export function canBuild(state: GameState, id: string): boolean {
  if (!(id in BUILDING_COST)) return false;
  return isUnlocked(state, id) && canAfford(state, nextCost(state, id));
}

/**
 * 건설/증축을 적용한 새 상태를 돌려준다. 불가하면 원본을 그대로 돌려준다(무변화).
 * 연대기('build')와 counters.buildsMade 를 갱신한다. 즉시 저장은 경계(store)가 한다.
 */
export function applyBuild(prev: GameState, id: string): GameState {
  if (!canBuild(prev, id)) return prev;
  const s: GameState = structuredClone(prev);
  const cost = nextCost(prev, id);
  for (const [r, v] of Object.entries(cost) as [ResourceId, number][]) {
    s.resources[r] -= v;
  }
  const level = (s.settlement.buildings[id] ?? 0) + 1;
  s.settlement.buildings[id] = level;
  s.counters.buildsMade += 1;

  const season: Season = seasonOf(s.world.week);
  s.chronicle.push({
    year: s.world.year,
    week: s.world.week,
    season,
    kind: 'build',
    text: buildText(id, level),
  });
  return s;
}
