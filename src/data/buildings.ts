/**
 * 건물 주간 효과 — §5. M2 는 턴 루프의 생산/회복에 필요한 부분만 정의한다.
 * 건설 비용·해금 시대·점유 타일은 각각 M3/M4 에서 필요할 때 추가한다(미리 비워두지 않음).
 *
 * 값은 "레벨당 주간 효과"다. 실제 생산 = 효과 × 레벨.
 */

export interface BuildingWeekly {
  gold?: number;
  wood?: number;
  stone?: number;
  food?: number;
  /** 주간 XP (훈련장) */
  xp?: number;
  /** 주간 HP 회복 (신전) */
  heal?: number;
}

export const BUILDING_WEEKLY: Record<string, BuildingWeekly> = {
  hall: { gold: 1 },
  lumber: { wood: 2 },
  farm: { food: 3 },
  quarry: { stone: 2 },
  yard: { xp: 2 }, // 방어력(+2)은 §8 M8 에서
  market: { gold: 3 }, // 교역 해금은 M7c
  shrine: { heal: 2 }, // 기근 피해 완화는 economy 상수로
  // library(SP·통찰)·guildhall(평판·호감)·academy·spire 는 각 시스템 마일스톤에서
};

import type { ResourceId } from '@/types/game';

/** 건물 기본 건설 비용 (§5). 다음 레벨 비용 = 기본 × (현재 레벨 + 1). */
export const BUILDING_COST: Record<string, Partial<Record<ResourceId, number>>> = {
  hall: { wood: 20, stone: 10 },
  lumber: { wood: 10, gold: 5 },
  farm: { wood: 15, gold: 5 },
  quarry: { wood: 20, gold: 10 },
  wall: { stone: 25, wood: 10 },
  yard: { wood: 25, stone: 10 },
  market: { wood: 30, stone: 20, gold: 20 },
  library: { stone: 35, gold: 25 },
  shrine: { stone: 30, gold: 20 },
  guildhall: { wood: 50, stone: 40, gold: 40 },
  academy: { stone: 70, gold: 80 },
  spire: { stone: 120, gold: 150 },
};

/** 해금 시대 (§5). eraIndex 가 이 값 이상이어야 건설 가능. */
export const BUILDING_UNLOCK_ERA: Record<string, number> = {
  hall: 0,
  lumber: 0,
  farm: 0,
  quarry: 1,
  wall: 1,
  yard: 1,
  market: 2,
  library: 2,
  shrine: 2,
  guildhall: 3,
  academy: 4,
  spire: 5,
};

/** 배치(deriveLayout) 순서. 회관을 먼저 중앙에 두고 나머지를 나선으로 채운다 (§10.4). */
export const BUILD_ORDER: string[] = [
  'hall',
  'lumber',
  'farm',
  'quarry',
  'yard',
  'market',
  'library',
  'shrine',
  'guildhall',
  'academy',
  'spire',
  'house',
];

/** 성벽은 자리를 차지하지 않고 둘레 링으로 그린다 (§5, §10.4). 배치에서 제외한다. */
export const RING_BUILDINGS = new Set<string>(['wall']);

/** 연대기·안내 표기용 건물명 (§5) */
export const BUILDING_NAMES: Record<string, string> = {
  hall: '회관',
  lumber: '목재소',
  farm: '농장',
  quarry: '채석장',
  wall: '성벽',
  yard: '훈련장',
  market: '시장',
  library: '서고',
  shrine: '신전',
  guildhall: '길드관',
  academy: '마법학당',
  spire: '별의 첨탑',
  house: '민가',
};
