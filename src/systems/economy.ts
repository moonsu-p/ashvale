/**
 * 경제 파생·생산 계산 — 순수 함수 (§2, §5).
 * 인구 = 전 건물 레벨 합 = 거점 지수(power). 생산은 계절 보정을 곱한다.
 */

import type { GameState, ResourceId, Season } from '@/types/game';
import { BUILDING_WEEKLY } from '@/data/buildings';
import { SEASON_PRODUCTION } from '@/data/seasons';
import { relicProduction } from './relics';
import { skillProductionPercent } from './skills';
import { companionBonus } from './relationships';

/** 인구 = 전 건물 레벨 합 (§5) */
export function population(state: GameState): number {
  return Object.values(state.settlement.buildings).reduce((a, b) => a + b, 0);
}

/** 거점 지수 = 인구 (§5) */
export function powerOf(state: GameState): number {
  return population(state);
}

const RESOURCE_IDS: ResourceId[] = ['wood', 'stone', 'food', 'gold'];

/**
 * 이번 주 자원 생산량 (계절 보정 적용). 소비는 포함하지 않는다.
 */
export function computeProduction(state: GameState, season: Season): Record<ResourceId, number> {
  const out: Record<ResourceId, number> = { wood: 0, stone: 0, food: 0, gold: 0 };

  for (const [id, level] of Object.entries(state.settlement.buildings)) {
    if (level <= 0) continue;
    const w = BUILDING_WEEKLY[id];
    if (!w) continue;
    if (w.wood) out.wood += w.wood * level;
    if (w.stone) out.stone += w.stone * level;
    if (w.food) out.food += w.food * level;
    if (w.gold) out.gold += w.gold * level;
  }

  // 유물 생산 보너스(항아리·셈돌·광석 등, §9)
  for (const r of RESOURCE_IDS) out[r] += relicProduction(state, r);
  // 사절 동료: 금화 +N/주 (§7.2)
  out.gold += companionBonus(state, 'goldPerWeek');

  // 계절 보정 + 행정 스킬 자원 생산 %
  const mod = SEASON_PRODUCTION[season];
  const adminMult = 1 + skillProductionPercent(state) / 100;
  for (const r of RESOURCE_IDS) {
    const seasonMult = 1 + (mod[r] ?? 0);
    out[r] = Math.round(out[r] * seasonMult * adminMult);
  }
  return out;
}

/**
 * 자원 가감 헬퍼. 식량은 음수를 허용한다(기근·붕괴 판정용, §15.2).
 * 그 외 자원은 0 미만으로 내려가지 않는다.
 */
export function addResource(state: GameState, r: ResourceId, v: number): void {
  if (r === 'food') state.resources.food += v;
  else state.resources[r] = Math.max(0, state.resources[r] + v);
}
