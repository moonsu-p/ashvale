/**
 * 레벨 곡선·보상 — §4. 레벨업 필요 XP = 40 + (level-1)×25 (레벨 내 누적).
 */

export const XP_BASE = 40;
export const XP_PER_LEVEL = 25;

/** level → level+1 에 필요한 XP */
export function xpForLevel(level: number): number {
  return XP_BASE + (level - 1) * XP_PER_LEVEL;
}

/** 레벨업 보상 (§4) */
export const LEVEL_HP = 3;
export const LEVEL_SKILL_POINT = 1;
export const LEVEL_STAT_POINT = 1;
