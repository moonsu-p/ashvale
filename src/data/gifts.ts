/**
 * 선물 품목 — §16.5. 원형 취향과 일치 +12 / 불일치 +4 / 혐오 −3. 유물 양도는 취향 무관 +25.
 */

import type { ResourceId } from '@/types/game';

export interface GiftItem {
  id: string;
  label: string;
  category: string;
  /** 금화 소비 (시장 Lv1부터 구매 가능) */
  gold?: number;
  /** 자원 직접 전달: 이 자원 20 소비 (시장 없이도 가능) */
  resource?: ResourceId;
  /** 유물 양도: 취향 무관 +25 */
  relic?: boolean;
  /** 시장이 없어도 가능한가 */
  alwaysAvailable?: boolean;
}

export const GIFT_ITEMS: GiftItem[] = [
  { id: 'sword', label: '잘 벼린 검', category: '무구', gold: 30 },
  { id: 'book', label: '필사한 서적', category: '서적', gold: 25 },
  { id: 'leather', label: '다듬은 가죽', category: '가죽', gold: 15 },
  { id: 'tools', label: '장인의 도구', category: '도구', gold: 20 },
  { id: 'silver', label: '은세공 예물', category: '예물', gold: 40 },
  { id: 'seed', label: '희귀한 씨앗', category: '씨앗', gold: 15 },
  { id: 'give_wood', label: '목재 전달', category: '목재', resource: 'wood', alwaysAvailable: true },
  { id: 'give_stone', label: '석재 전달', category: '석재', resource: 'stone', alwaysAvailable: true },
  { id: 'give_food', label: '식량 전달', category: '식량', resource: 'food', alwaysAvailable: true },
  { id: 'give_relic', label: '유물 양도', category: '유물', relic: true, alwaysAvailable: true },
];

export const RESOURCE_GIFT_COST = 20;
export const RELIC_GIFT_AFFINITY = 25;
