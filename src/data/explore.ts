/**
 * 탐험 판정 데이터 — §6 지역 표 + 판정 공식. 서술은 content/region-text.ts.
 */

import type { ResourceId, StatId } from '@/types/game';
import type { Grade } from './content/region-text';

export interface RegionDef {
  id: string;
  stat: StatId; // 판정 능력치
  difficulty: number;
  danger: number; // 위험도 (실패·위기 HP 손실)
  loot: Partial<Record<ResourceId, [number, number]>>; // 성공 기준 범위
}

/** §6 지역 표 */
export const REGIONS: Record<string, RegionDef> = {
  whisper: { id: 'whisper', stat: 'agility', difficulty: 9, danger: 2, loot: { wood: [4, 9], food: [3, 7], gold: [0, 4] } },
  gate: { id: 'gate', stat: 'might', difficulty: 12, danger: 4, loot: { stone: [5, 11], gold: [3, 8] } },
  marsh: { id: 'marsh', stat: 'will', difficulty: 15, danger: 6, loot: { food: [6, 14], gold: [5, 12] } },
  peaks: { id: 'peaks', stat: 'might', difficulty: 18, danger: 8, loot: { stone: [12, 24], gold: [10, 20] } },
  deep: { id: 'deep', stat: 'insight', difficulty: 21, danger: 10, loot: { stone: [20, 40], gold: [20, 40] } },
  rift: { id: 'rift', stat: 'will', difficulty: 25, danger: 14, loot: { gold: [40, 80] } },
};

export interface GradeDef {
  grade: Grade;
  minMargin: number; // 이 값 이상이면 해당 등급 (높은 것부터 검사)
  lootMult: number;
  xpMult: number;
}

/** §6 판정 결과 표 (높은 margin 순) */
export const GRADES: GradeDef[] = [
  { grade: 'triumph', minMargin: 8, lootMult: 1.8, xpMult: 1.5 },
  { grade: 'success', minMargin: 0, lootMult: 1.0, xpMult: 1.0 },
  { grade: 'failure', minMargin: -7, lootMult: 0.35, xpMult: 0.5 },
  { grade: 'crisis', minMargin: -Infinity, lootMult: 0, xpMult: 0.25 },
];

/** 기본 XP = 난이도 × 이 값 (§6) */
export const XP_PER_DIFFICULTY = 1.5;

/** 1d20 */
export const DIE_SIDES = 20;

/** HP 0 이하 → 쓰러진 채 실려 옴 (§6): HP 1, 다음 N주 강제 휴식, 금화 손실 비율 */
export const DOWNED_WEEKS = 2;
export const DOWNED_GOLD_LOSS = 0.2;
