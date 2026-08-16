/**
 * 교역 — 시장 Lv1 (§10).
 *
 * **주간 한도가 반드시 있어야 한다.** 없으면 무한 환전으로 건설 곡선이 무너진다.
 */

import type { ResourceId } from '@/types/game';

export interface TradeRate {
  resource: ResourceId;
  /** 이만큼 팔면 금화 1 */
  sellPer: number;
  /** 금화 이만큼으로 buyAmount 만큼 산다 */
  buyGold: number;
  buyAmount: number;
}

export const TRADE_RATES: TradeRate[] = [
  { resource: 'wood', sellPer: 3, buyGold: 2, buyAmount: 3 },
  { resource: 'stone', sellPer: 2, buyGold: 3, buyAmount: 2 },
  { resource: 'food', sellPer: 3, buyGold: 2, buyAmount: 3 },
];

/** 주간 거래 한도 = 시장 레벨 × 30 금화 상당 */
export const WEEKLY_LIMIT_PER_LEVEL = 30;

/** 시장 레벨당 판매가 +5% */
export const SELL_BONUS_PER_LEVEL = 0.05;
/** 바르텍이 거래처(신뢰 20) 이상이면 +10%, 오랜 벗(40)이면 +20% */
export const PATRON_SELL_BONUS = { client: 0.1, oldFriend: 0.2 };

/** 겨울에는 식량 구매가 +50% (§10) */
export const WINTER_FOOD_MARKUP = 0.5;
