/**
 * 위협·방어 상수 — §8. 위협은 content/world-content.ts 의 THREATS.
 */

/** 위협 발생: 시대 1부터 이 주기(주)마다 */
export const THREAT_CYCLE = 6;
export const THREAT_MIN_ERA = 1;
/** 탐험 위기 결과에서 위협 발생 확률 (§6) */
export const THREAT_FROM_CRISIS = 0.35;
/** 준비 기간(주) */
export const THREAT_PREP_WEEKS = 2;
/** 방비 행동 1회당 prepBonus */
export const PREP_BONUS_PER_ACTION = 8;

/** 위협 강도 = BASE + eraIndex×ERA + floor(turn/TURN_DIV), × 겨울1.2 × (1+eraTier×0.1) */
export const THREAT_BASE = 10;
export const THREAT_PER_ERA = 12;
export const THREAT_TURN_DIV = 4;
export const WINTER_THREAT_MULT = 1.2;
export const TIER_THREAT_MULT = 0.1;

/** 방어력 계수 (§8) */
export const DEF_WALL = 3;
export const DEF_YARD = 2;
/** 판정: 방어력 + 1d20 vs 강도 + 이 값 */
export const THREAT_MARGIN = 10;

/** 패배 시 자원 손실 비율, HP·평판 손실 */
export const LOSE_RESOURCE_PCT = 0.3;
export const LOSE_HP = 8;
export const LOSE_REP = 3;
/** 승리 시 세력 평판 상승 */
export const WIN_REP = 5;

/** 의뢰인 하를 거래처(20) 방어 보너스 (§7.3) */
export const PATRON_HARL_DEFENSE = 4;
