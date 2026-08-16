/**
 * 시대 판정 (§13) — 순수 함수.
 *
 * power = 전 건물 레벨 합 = 인구. 시대의 유일한 게이트다 (§10).
 */

import { ERAS, MYTHIC_POWER, MYTHIC_TIER_STEP } from '@/data/eras';

/** 마을 지수. 인구와 같은 값이다 */
export function townPower(buildings: Record<string, number>): number {
  let sum = 0;
  for (const level of Object.values(buildings)) sum += level;
  return sum;
}

export interface EraStanding {
  eraIndex: number;
  /** 신화기 이후의 무한 티어. 그 전에는 0 */
  eraTier: number;
}

export function eraFor(power: number): EraStanding {
  let eraIndex = 0;
  for (const era of ERAS) {
    if (power >= era.power) eraIndex = era.index;
  }

  // power ≥ 90 부터 30 마다 티어가 하나씩 오른다 — 끝이 없다
  const eraTier =
    power >= MYTHIC_POWER ? Math.floor((power - MYTHIC_POWER) / MYTHIC_TIER_STEP) + 1 : 0;

  return { eraIndex, eraTier };
}

/** 그 시대에 해금되는 건물인가 */
export function isUnlocked(unlockEra: number, eraIndex: number): boolean {
  return eraIndex >= unlockEra;
}
