/**
 * 계절 생산 보정 — §2 계절 보정. 생산에 곱하는 비율(±)이다.
 * 봄: 식량 +20% · 여름: 목재·석재 +20% · 가을: 식량 +50% · 겨울: 식량 −50%.
 */

import type { ResourceId, Season } from '@/types/game';

export const SEASON_PRODUCTION: Record<Season, Partial<Record<ResourceId, number>>> = {
  0: { food: 0.2 }, // 봄
  1: { wood: 0.2, stone: 0.2 }, // 여름
  2: { food: 0.5 }, // 가을
  3: { food: -0.5 }, // 겨울
};

/** 겨울 위협 강도 배수 (§2) — §8 M8 에서 사용 */
export const WINTER_THREAT_MULT = 1.2;
