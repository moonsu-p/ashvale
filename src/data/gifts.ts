/**
 * 선물 (§10 선물 품목, §7.3 호감).
 * 시장 Lv1 에서 산다. 취향은 원형이 정한다 (§7.2).
 */

import type { ResourceId } from '@/types/game';

export interface GiftItem {
  id: string;
  name: string;
  gold: number;
  /** 원형의 취향 목록과 맞춰 본다 */
  category: string;
}

export const GIFTS: GiftItem[] = [
  { id: 'sword', name: '잘 벼린 검', gold: 30, category: '무구' },
  { id: 'book', name: '필사한 서적', gold: 25, category: '서적' },
  { id: 'leather', name: '다듬은 가죽', gold: 15, category: '가죽' },
  { id: 'tools', name: '장인의 도구', gold: 20, category: '도구' },
  { id: 'silver', name: '은세공 예물', gold: 40, category: '예물' },
  { id: 'seed', name: '희귀한 씨앗', gold: 15, category: '씨앗' },
];

/** 자원을 그대로 건네는 것도 선물이다. 20 씩 */
export const RESOURCE_GIFT_AMOUNT = 20;

export const RESOURCE_GIFT_CATEGORY: Partial<Record<ResourceId, string>> = {
  wood: '목재',
  stone: '석재',
  food: '식량',
};

const BY_ID = new Map(GIFTS.map((g) => [g.id, g]));

export function getGift(id: string): GiftItem | undefined {
  return BY_ID.get(id);
}

/** 유물을 넘기면 취향과 무관하게 +25 (§10). 유물은 사라진다 */
export const RELIC_GIFT_AFFINITY = 25;
