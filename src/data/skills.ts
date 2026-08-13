/**
 * 스킬 트리 — §4. 12 스킬 × 4 계열. 랭크당 SP 1개.
 * 상위 스킬은 같은 계열 기본 스킬 2랭크 필요. 최대 랭크 이후 초월 랭크(비용 누진).
 */

export type SkillLine = 'combat' | 'explore' | 'knowledge' | 'command';

export type SkillEffect =
  | { kind: 'exploreRoll'; value: number } // 탐험 판정 +N (추적)
  | { kind: 'insightRoll'; value: number } // 통찰 지역 판정 +N (고문헌)
  | { kind: 'combatRoll'; value: number } // 전투 판정 +N (검술) — §8 M8
  | { kind: 'defense'; value: number } // 방어력 +N (방벽·징병) — §8 M8
  | { kind: 'crisisHpReduce'; value: number } // 위기 HP 손실 −value/랭크 (결의)
  | { kind: 'exploreHpReduce'; value: number } // 탐험 HP 손실 −N (야영)
  | { kind: 'lootPercent'; value: number } // 전리품 +N% (연금)
  | { kind: 'relicFind'; value: number } // 유물 발견률 +N%p (감정)
  | { kind: 'buildCostPercent'; value: number } // 건설 비용 +N%(음수) (설계)
  | { kind: 'affinityPercent'; value: number } // 호감 획득 +N% (웅변) — §7 M7
  | { kind: 'productionPercent'; value: number }; // 자원 생산 +N% (행정)

export interface SkillDef {
  id: string;
  name: string;
  line: SkillLine;
  max: number;
  effect: SkillEffect;
  prereq?: { skill: string; rank: number };
}

export const SKILL_LINE_NAME: Record<SkillLine, string> = {
  combat: '전투',
  explore: '탐험',
  knowledge: '지식',
  command: '통솔',
};

export const SKILLS: SkillDef[] = [
  { id: 'sword', name: '검술', line: 'combat', max: 5, effect: { kind: 'combatRoll', value: 1 } },
  { id: 'bulwark', name: '방벽', line: 'combat', max: 5, effect: { kind: 'defense', value: 3 }, prereq: { skill: 'sword', rank: 2 } },
  { id: 'resolve', name: '결의', line: 'combat', max: 3, effect: { kind: 'crisisHpReduce', value: 0.25 }, prereq: { skill: 'sword', rank: 2 } },
  { id: 'track', name: '추적', line: 'explore', max: 5, effect: { kind: 'exploreRoll', value: 1 } },
  { id: 'camp', name: '야영', line: 'explore', max: 3, effect: { kind: 'exploreHpReduce', value: 1 }, prereq: { skill: 'track', rank: 2 } },
  { id: 'alchemy', name: '연금', line: 'explore', max: 3, effect: { kind: 'lootPercent', value: 15 }, prereq: { skill: 'track', rank: 2 } },
  { id: 'lore', name: '고문헌', line: 'knowledge', max: 5, effect: { kind: 'insightRoll', value: 1 } },
  { id: 'appraise', name: '감정', line: 'knowledge', max: 3, effect: { kind: 'relicFind', value: 3 }, prereq: { skill: 'lore', rank: 2 } },
  { id: 'design', name: '설계', line: 'knowledge', max: 3, effect: { kind: 'buildCostPercent', value: -8 }, prereq: { skill: 'lore', rank: 2 } },
  { id: 'oratory', name: '웅변', line: 'command', max: 5, effect: { kind: 'affinityPercent', value: 20 } },
  { id: 'admin', name: '행정', line: 'command', max: 5, effect: { kind: 'productionPercent', value: 8 }, prereq: { skill: 'oratory', rank: 2 } },
  { id: 'conscript', name: '징병', line: 'command', max: 3, effect: { kind: 'defense', value: 4 }, prereq: { skill: 'oratory', rank: 2 } },
];

export const SKILL_MAP: Record<string, SkillDef> = Object.fromEntries(SKILLS.map((s) => [s.id, s]));

/** 랭크 r 에서 r+1 로 올리는 SP 비용. 최대 이하면 1, 초월(≥max)이면 누진(§4). */
export function skillUpCost(rank: number, max: number): number {
  return rank < max ? 1 : rank - max + 2;
}
