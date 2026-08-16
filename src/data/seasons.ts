/**
 * 계절 — 기획서 §3.
 *
 * 1주 = 지역 탐사 1회. 12주 = 1계절, 4계절 = 48주 = 1년.
 * 계절 틴트 색은 palette.ts 의 SEASON_TINT 를 쓴다. 여기서 색을 만들지 않는다.
 */

import type { ResourceId } from '@/types/game';

export type SeasonId = 'spring' | 'summer' | 'autumn' | 'winter';

export const WEEKS_PER_SEASON = 12;
export const SEASONS_PER_YEAR = 4;
export const WEEKS_PER_YEAR = WEEKS_PER_SEASON * SEASONS_PER_YEAR;

export const SEASON_ORDER: SeasonId[] = ['spring', 'summer', 'autumn', 'winter'];

export const SEASON_LABEL: Record<SeasonId, string> = {
  spring: '봄',
  summer: '여름',
  autumn: '가을',
  winter: '겨울',
};

/**
 * 계절 보정 — 산출에 곱해지는 비율 (§3).
 * 봄 식량 +20% / 여름 목재·석재 +20% / 가을 식량 +50% / 겨울 식량 −50%
 */
export const SEASON_YIELD: Record<SeasonId, Partial<Record<ResourceId, number>>> = {
  spring: { food: 0.2 },
  summer: { wood: 0.2, stone: 0.2 },
  autumn: { food: 0.5 },
  winter: { food: -0.5 },
};

/** 겨울에는 지역 위험도 +20% (§3). 탐사 판정이 읽어 간다 */
export const SEASON_REGION_RISK: Record<SeasonId, number> = {
  spring: 0,
  summer: 0,
  autumn: 0,
  winter: 0.2,
};

/** 주차(1부터)로 계절을 구한다 */
export function seasonOf(week: number): SeasonId {
  const index = Math.floor((week - 1) / WEEKS_PER_SEASON) % SEASONS_PER_YEAR;
  return SEASON_ORDER[index] ?? 'spring';
}
