/**
 * 스킬 배분·효과 — 순수 함수 (§4). 선행 조건·초월 비용을 검사하고, 효과를 계열별로 합산한다.
 */

import type { GameState, StatId } from '@/types/game';
import { SKILLS, SKILL_MAP, skillUpCost, type SkillEffect } from '@/data/skills';

export function skillRank(state: GameState, id: string): number {
  return state.hero.skills[id] ?? 0;
}

/** 선행 조건(같은 계열 기본 스킬 N랭크) 충족 여부 */
export function prereqMet(state: GameState, id: string): boolean {
  const def = SKILL_MAP[id];
  if (!def?.prereq) return true;
  return skillRank(state, def.prereq.skill) >= def.prereq.rank;
}

/** 다음 랭크 비용(SP). null 이면 정의 없음. */
export function nextSkillCost(state: GameState, id: string): number | null {
  const def = SKILL_MAP[id];
  if (!def) return null;
  return skillUpCost(skillRank(state, id), def.max);
}

export function canLearn(state: GameState, id: string): boolean {
  const cost = nextSkillCost(state, id);
  if (cost === null) return false;
  return prereqMet(state, id) && state.hero.skillPoints >= cost;
}

/** 스킬 1랭크 투자한 새 상태. 불가하면 원본 그대로. */
export function applyLearnSkill(prev: GameState, id: string): GameState {
  if (!canLearn(prev, id)) return prev;
  const cost = nextSkillCost(prev, id)!;
  const s: GameState = structuredClone(prev);
  s.hero.skillPoints -= cost;
  s.hero.skills[id] = (s.hero.skills[id] ?? 0) + 1;
  return s;
}

// ── 효과 합산 (kind별로 rank × value 합) ──

function sumEffect(state: GameState, kind: SkillEffect['kind']): number {
  let total = 0;
  for (const def of SKILLS) {
    if (def.effect.kind !== kind) continue;
    total += skillRank(state, def.id) * def.effect.value;
  }
  return total;
}

export const skillTrackRoll = (s: GameState) => sumEffect(s, 'exploreRoll'); // 추적
export const skillInsightRoll = (s: GameState) => sumEffect(s, 'insightRoll'); // 고문헌
export function skillExploreRoll(state: GameState, regionStat: StatId): number {
  return skillTrackRoll(state) + (regionStat === 'insight' ? skillInsightRoll(state) : 0);
}
export const skillLootPercent = (s: GameState) => sumEffect(s, 'lootPercent');
export const skillExploreHpReduce = (s: GameState) => sumEffect(s, 'exploreHpReduce');
export const skillCrisisHpReduce = (s: GameState) => Math.min(0.9, sumEffect(s, 'crisisHpReduce'));
export const skillRelicFind = (s: GameState) => sumEffect(s, 'relicFind');
export const skillBuildCostPercent = (s: GameState) => sumEffect(s, 'buildCostPercent');
export const skillProductionPercent = (s: GameState) => sumEffect(s, 'productionPercent');
export const skillDefense = (s: GameState) => sumEffect(s, 'defense'); // §8 M8
export const skillCombatRoll = (s: GameState) => sumEffect(s, 'combatRoll'); // §8 M8
export const skillAffinityPercent = (s: GameState) => sumEffect(s, 'affinityPercent'); // §7 M7
