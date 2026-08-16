/**
 * 스킬.
 *
 * **기획서에 스킬 트리가 없다.** 절이 따로 없고, §11 판정 공식에 `추적랭크`
 * 하나가 등장할 뿐이다. 그래서 그 하나만 실제로 둔다.
 * 트리를 지어내지 않는다 — 설계가 서면 여기에 붙인다.
 */

export interface SkillDef {
  id: string;
  name: string;
  desc: string;
  /** 랭크 한 단계에 드는 스킬 포인트 */
  cost: number;
  maxRank: number;
}

export const SKILLS: SkillDef[] = [
  {
    id: 'tracking',
    name: '추적',
    desc: '탐사 판정 +1 (랭크당)',
    cost: 1,
    maxRank: 5,
  },
];

const BY_ID = new Map(SKILLS.map((s) => [s.id, s]));

export function getSkill(id: string): SkillDef | undefined {
  return BY_ID.get(id);
}

/** 판정 보정에 들어가는 스킬 id (§11 — 추적랭크) */
export const TRACKING = 'tracking';
