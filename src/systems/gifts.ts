/**
 * 선물 품목 — 순수 함수 (§16.5). 취향 일치 +12 / 불일치 +4 / 혐오 −3, 유물 양도 +25(취향 무관).
 * 4주 쿨다운. 교류·선물 상한 59 적용.
 */

import type { GameState } from '@/types/game';
import { GIFT_ITEMS, RESOURCE_GIFT_COST, RELIC_GIFT_AFFINITY, type GiftItem } from '@/data/gifts';
import { giftReactionFor, canGift } from './relationships';
import { GIFT_MATCH, GIFT_MISMATCH, GIFT_DISLIKE, AFFINITY_SOFT_CAP, AFFINITY_MAX, TIER_FRIEND } from '@/data/relationships';
import { unlockedSlotsFor } from '@/data/slots';
import { marketLevel } from './trade';

export type GiftItemResult = 'match' | 'mismatch' | 'dislike' | 'relic' | 'cooldown' | 'unavailable' | 'cannot';

export function giftItemById(id: string): GiftItem | undefined {
  return GIFT_ITEMS.find((g) => g.id === id);
}

export function giftAvailable(s: GameState, item: GiftItem): boolean {
  if (!item.alwaysAvailable && marketLevel(s) < 1) return false;
  if (item.gold !== undefined) return s.resources.gold >= item.gold;
  if (item.resource) return s.resources[item.resource] >= RESOURCE_GIFT_COST;
  if (item.relic) return s.hero.relics.length > 0;
  return true;
}

function cap(affinity: number): number {
  return affinity < TIER_FRIEND ? AFFINITY_SOFT_CAP : AFFINITY_MAX;
}

export function applyGiftItem(s: GameState, companionId: string, itemId: string): GiftItemResult {
  const c = s.companions[companionId];
  const item = giftItemById(itemId);
  if (!c || !item) return 'cannot';
  if (!canGift(s, c.id)) return 'cooldown';
  if (!giftAvailable(s, item)) return 'unavailable';

  // 비용 차감
  if (item.gold !== undefined) s.resources.gold -= item.gold;
  else if (item.resource) s.resources[item.resource] = Math.max(0, s.resources[item.resource] - RESOURCE_GIFT_COST);
  else if (item.relic) s.hero.relics.pop(); // 유물 1개 소멸

  let delta: number;
  let result: GiftItemResult;
  if (item.relic) {
    delta = RELIC_GIFT_AFFINITY;
    result = 'relic';
  } else {
    const reaction = giftReactionFor(c.archetypeId, item.category);
    delta = reaction === 'match' ? GIFT_MATCH : reaction === 'dislike' ? GIFT_DISLIKE : GIFT_MISMATCH;
    result = reaction;
  }
  c.affinity = Math.max(0, delta < 0 ? c.affinity + delta : Math.min(cap(c.affinity), c.affinity + delta));
  c.unlockedSlots = unlockedSlotsFor(c.affinity);
  c.lastGiftTurn = s.world.turn;
  return result;
}
