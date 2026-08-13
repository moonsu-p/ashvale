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
