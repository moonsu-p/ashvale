/**
 * 시대 판정 — 순수 함수 (§5, §15.2). power(인구)로 시대·티어를 정한다.
 * 시대는 단조 증가(붕괴로만 하락). 붕괴 1회당 임계값 5% 완화(재기 보정).
 */

import { ERAS, MYTHIC_ERA, TIER_BASE_POWER, TIER_STEP, REBOUND_PER_COLLAPSE } from '@/data/eras';

/** 붕괴 횟수만큼 완화된 임계값 */
export function relaxedThreshold(base: number, collapses: number): number {
  return base * (1 - REBOUND_PER_COLLAPSE * collapses);
}

/** power 로 도달 가능한 최고 시대 인덱스 (완화 반영) */
export function eraFromPower(power: number, collapses: number): number {
  let idx = 0;
  for (const era of ERAS) {
    if (power >= relaxedThreshold(era.threshold, collapses)) idx = era.index;
  }
  return idx;
}

/** 신화기 이후 무한 등급 (§5). eraIndex < 6 이면 0. */
export function eraTierFromPower(power: number): number {
  if (power < TIER_BASE_POWER) return 0;
  return Math.floor((power - TIER_BASE_POWER) / TIER_STEP) + 1;
}

export function eraName(index: number): string {
  return ERAS[Math.min(index, ERAS.length - 1)]?.name ?? '';
}

export const MAX_ERA = MYTHIC_ERA;
