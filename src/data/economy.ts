/**
 * 경제·턴 상수 — §2, §5, §9. 코드에 숫자를 박지 않기 위한 단일 출처다.
 */

/** 주간 식량 소비 = 인구 × 이 값 (§5 식량 수지) */
export const FOOD_PER_POP = 1;

/** 세계 이벤트 발생 확률 (매 턴) — §9 */
export const WORLD_EVENT_CHANCE = 0.12;

/** 기근: 식량 부족분 1당 잃는 금화 (§5) */
export const FAMINE_GOLD_PER_DEFICIT = 3;

/** 기근: 무작위 건물 1레벨 하락 확률 (§5) */
export const FAMINE_BUILDING_LOSS_CHANCE = 0.4;

/** 신전 보유 시 기근 피해·확률에 곱하는 완화 계수 (§5 "기근 피해 −20%") */
export const SHRINE_FAMINE_MULT = 0.8;
