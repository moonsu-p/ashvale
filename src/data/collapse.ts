/**
 * 붕괴 상수 — §15.2. 냉정하되 기습하지 않는다.
 */

import type { ResourceId } from '@/types/game';

/** 붕괴 조건 1: 식량<0 이 이 주 수만큼 연속 + 인구 이하 (§15.2) */
export const COLLAPSE_FOOD_STREAK = 4;
export const COLLAPSE_POP_MAX = 3;

/** 붕괴 판정 며칠 전부터 경고를 띄우는가(주). streak 이 (STREAK-WARN) 이상이면 경고. */
export const COLLAPSE_WARN_BEFORE = 2;

/** 붕괴 재건 지원 자원 (§15.2) */
export const COLLAPSE_REBUILD_RESOURCES: Record<ResourceId, number> = {
  wood: 20,
  stone: 0,
  food: 20,
  gold: 0,
};
