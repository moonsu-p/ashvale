/**
 * 자원 생산과 소비 (§3, §10) — 순수 함수.
 *
 * 주 종료 2단계가 이것을 쓴다: 자원 생산 − 식량 소비 (계절 보정).
 */

import type { GameState, ResourceId } from '@/types/game';
import { BUILDINGS, FOOD_PER_POP, SHRINE_HEAL_PER_LEVEL } from '@/data/buildings';
import { SEASON_YIELD, type SeasonId } from '@/data/seasons';
import { townPower } from './eras';

const RESOURCES: ResourceId[] = ['wood', 'stone', 'food', 'gold'];

function empty(): Record<ResourceId, number> {
  return { wood: 0, stone: 0, food: 0, gold: 0 };
}

export interface Production {
  /** 건물이 낸 기본 산출 */
  gross: Record<ResourceId, number>;
  /** 계절 보정분. 겨울 식량처럼 음수일 수 있다 */
  season: Record<ResourceId, number>;
  /** 인구가 먹는 식량 */
  foodConsumed: number;
  /** 실제로 자원에 더해질 값 */
  net: Record<ResourceId, number>;
}

/** 건물 레벨에서 나오는 주간 산출 */
export function grossYield(buildings: Record<string, number>): Record<ResourceId, number> {
  const out = empty();
  for (const def of BUILDINGS) {
    const level = buildings[def.id] ?? 0;
    if (level <= 0 || def.yieldPerLevel === undefined) continue;
    for (const r of RESOURCES) {
      const per = def.yieldPerLevel[r];
      if (per !== undefined) out[r] += per * level;
    }
  }
  return out;
}

/**
 * 한 주치 수지.
 *
 * 계절 보정은 **생산에만** 걸린다. 이미 쌓아 둔 자원이 겨울에 줄지는 않는다.
 * 소비는 인구 × 1 식량이며 계절과 무관하다.
 */
export function computeProduction(
  buildings: Record<string, number>,
  season: SeasonId,
): Production {
  const gross = grossYield(buildings);
  const seasonAdj = empty();

  const rates = SEASON_YIELD[season];
  for (const r of RESOURCES) {
    const rate = rates[r];
    if (rate !== undefined) seasonAdj[r] = Math.round(gross[r] * rate);
  }

  const foodConsumed = townPower(buildings) * FOOD_PER_POP;

  const net = empty();
  for (const r of RESOURCES) net[r] = gross[r] + seasonAdj[r];
  net.food -= foodConsumed;

  return { gross, season: seasonAdj, foodConsumed, net };
}

/** 수지를 자원에 더한다. **음수를 막지 않는다** — 식량이 마이너스로 가야 기근이 보인다 */
export function applyProduction(
  resources: Record<ResourceId, number>,
  production: Production,
): Record<ResourceId, number> {
  const out = { ...resources };
  for (const r of RESOURCES) out[r] += production.net[r];
  return out;
}

/** 회복 — 주 종료 3단계. 신전 레벨만큼 HP 가 오른다 (§10) */
export function computeHeal(state: GameState): number {
  const shrine = state.town.buildings['shrine'] ?? 0;
  if (shrine <= 0) return 0;
  const missing = state.hero.maxHp - state.hero.hp;
  if (missing <= 0) return 0;
  return Math.min(missing, shrine * SHRINE_HEAL_PER_LEVEL);
}
