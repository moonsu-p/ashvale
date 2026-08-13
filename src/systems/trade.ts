/**
 * 교역 — 순수 함수 (§16.4). 시장 Lv1 해금, 턴 무소비. 주간 한도 = 시장 레벨 × 30 금화(필수).
 */

import type { GameState, ResourceId } from '@/types/game';
import {
  SELL_RATE, BUY_RATE, TRADE_LIMIT_PER_MARKET,
  SELL_BONUS_PER_MARKET, SELL_BONUS_BARTEK_CLIENT, SELL_BONUS_BARTEK_OLDFRIEND,
  WINTER_FOOD_BUY_MULT,
} from '@/data/trade';
import { seasonOf } from './time';

export function marketLevel(s: GameState): number {
  return s.settlement.buildings.market ?? 0;
}
export function tradeUnlocked(s: GameState): boolean {
  return marketLevel(s) >= 1;
}
export function tradeLimit(s: GameState): number {
  return marketLevel(s) * TRADE_LIMIT_PER_MARKET;
}
export function tradeRemaining(s: GameState): number {
  return Math.max(0, tradeLimit(s) - s.weeklyTradeUsed);
}

function sellMultiplier(s: GameState): number {
  let m = 1 + marketLevel(s) * SELL_BONUS_PER_MARKET;
  const bartek = s.patrons.bartek;
  if (bartek?.met) {
    if (bartek.trust >= 40) m += SELL_BONUS_BARTEK_OLDFRIEND;
    else if (bartek.trust >= 20) m += SELL_BONUS_BARTEK_CLIENT;
  }
  return m;
}

/** 자원 amount 를 팔았을 때 얻는 금화 */
export function sellGoldFor(s: GameState, resource: ResourceId, amount: number): number {
  const rate = SELL_RATE[resource];
  if (!rate) return 0;
  return Math.floor((amount / rate) * sellMultiplier(s));
}

/** 금화 gold 로 살 수 있는 자원 양 (겨울 식량 구매가 +50%) */
export function buyAmountFor(s: GameState, resource: ResourceId, gold: number): number {
  const rate = BUY_RATE[resource];
  if (!rate) return 0;
  let cost = rate.gold;
  if (resource === 'food' && seasonOf(s.world.week) === 3) cost = Math.ceil(cost * WINTER_FOOD_BUY_MULT);
  return Math.floor((gold / cost) * rate.amount);
}

export type TradeResult = 'ok' | 'unavailable' | 'limit' | 'insufficient';

/** 판매: 자원 → 금화. 얻는 금화가 남은 한도를 넘으면 거절(§16.4). */
export function applySell(s: GameState, resource: ResourceId, amount: number): TradeResult {
  if (!tradeUnlocked(s)) return 'unavailable';
  if (s.resources[resource] < amount || amount <= 0) return 'insufficient';
  const gold = sellGoldFor(s, resource, amount);
  if (gold <= 0) return 'insufficient';
  if (gold > tradeRemaining(s)) return 'limit';
  s.resources[resource] -= amount;
  s.resources.gold += gold;
  s.weeklyTradeUsed += gold;
  return 'ok';
}

/** 구매: 금화 → 자원. 쓰는 금화가 남은 한도를 넘으면 거절. */
export function applyBuy(s: GameState, resource: ResourceId, gold: number): TradeResult {
  if (!tradeUnlocked(s)) return 'unavailable';
  if (s.resources.gold < gold || gold <= 0) return 'insufficient';
  if (gold > tradeRemaining(s)) return 'limit';
  const amount = buyAmountFor(s, resource, gold);
  if (amount <= 0) return 'insufficient';
  s.resources.gold -= gold;
  s.resources[resource] += amount;
  s.weeklyTradeUsed += gold;
  return 'ok';
}
