/**
 * 교역 — §16.4. 시장 Lv1 해금, 턴 무소비. 주간 거래 한도 = 시장 레벨 × 30 금화 상당(필수).
 */

import type { ResourceId } from '@/types/game';

/** 판매: 이 수량의 자원 → 금화 1 (기본 환율) */
export const SELL_RATE: Partial<Record<ResourceId, number>> = { wood: 3, stone: 2, food: 3 };
/** 구매: 금화 N → 이 수량의 자원 */
export const BUY_RATE: Partial<Record<ResourceId, { gold: number; amount: number }>> = {
  wood: { gold: 2, amount: 3 },
  stone: { gold: 3, amount: 2 },
  food: { gold: 2, amount: 3 },
};

/** 주간 한도 = 시장 레벨 × 이 값 (금화 상당) */
export const TRADE_LIMIT_PER_MARKET = 30;

/** 환율 개선: 시장 레벨당 판매가 +5%, 바르텍 거래처 +10%, 오랜 벗 +20% (합산) */
export const SELL_BONUS_PER_MARKET = 0.05;
export const SELL_BONUS_BARTEK_CLIENT = 0.1;
export const SELL_BONUS_BARTEK_OLDFRIEND = 0.2;

/** 겨울 식량 구매가 +50% */
export const WINTER_FOOD_BUY_MULT = 1.5;
