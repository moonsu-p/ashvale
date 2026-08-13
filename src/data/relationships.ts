/**
 * 관계 수치 상수 — §7.4. 반복 클릭이 되지 않게 네 경로를 모두 써야 상한에 닿는다.
 */

/** 교류: 기본 +6, 연속 체감(2회차 +4, 3회차 이후 +2). 다른 인물 교류 시 초기화. */
export const TALK_GAINS = [6, 4, 2];
export function talkGain(consecutive: number): number {
  return TALK_GAINS[Math.min(consecutive, TALK_GAINS.length - 1)]!;
}
/** 교류 시 소속 세력 평판 +N */
export const TALK_FACTION_GAIN = 2;

/** 선물: 취향 일치 +12 / 불일치 +4 / 혐오 −3. 인물당 쿨다운(주). 힌트는 아는 사이(20)부터. */
export const GIFT_MATCH = 12;
export const GIFT_MISMATCH = 4;
export const GIFT_DISLIKE = -3;
export const GIFT_COOLDOWN_WEEKS = 4;
export const GIFT_HINT_AFFINITY = 20;

/** 교류·선물만으로는 59가 상한. 60+ 는 대화 사건·동행 탐험(M7c). */
export const AFFINITY_SOFT_CAP = 59;
export const AFFINITY_MAX = 100;

/** 관계 단계 경계 */
export const TIER_ALLY = 20; // 아는 사이
export const TIER_COMPANION = 40; // 동료
export const TIER_FRIEND = 60; // 벗
export const TIER_BOND = 80; // 맹우·연인

/** 의뢰인 신뢰: 교류 +3, 소속 세력 평판 상승 시 +2, 퀘스트 완수 +10(M7c) */
export const PATRON_TALK_GAIN = 3;
export const PATRON_FACTION_GAIN = 2;
