/**
 * 고백 (§7.4) — 순수 함수.
 *
 * **고백은 인물이 한다.** 플레이어가 고백하는 선택지는 없다.
 * 벗(60)에 닿으면 다가옴 사건으로 저절로 온다.
 *
 * **보류가 이 장르의 핵심이다.** 수락도 거절도 아닌 채로 인물이 계속
 * 다가오는 것이 긴장을 만든다. 6주 뒤 다시 오고, 세 번까지.
 */

import type { CompanionRecord } from '@/types/game';
import { CONFESS_AT } from '@/data/relationships';

export const HOLD_RETRY_WEEKS = 6;
export const HOLD_LIMIT = 3;

/**
 * 보류 횟수를 clearedEvents 에 표식으로 남긴다.
 * §4 의 CompanionRecord 에 셀 자리가 없어서인데, 세이브에 남아야
 * 앱을 껐다 켜도 "세 번까지"가 지켜진다.
 */
const HOLD_MARK = 'confess:hold:';

export function holdCount(companion: CompanionRecord): number {
  return companion.clearedEvents.filter((e) => e.startsWith(HOLD_MARK)).length;
}

function withHoldMark(companion: CompanionRecord): CompanionRecord {
  const next = holdCount(companion) + 1;
  return { ...companion, clearedEvents: [...companion.clearedEvents, `${HOLD_MARK}${next}`] };
}

/** 지금 고백해 올 때인가 */
export function shouldConfess(companion: CompanionRecord, turn: number): boolean {
  if (companion.departedTurn !== null) return false;
  if (companion.injuredUntilTurn > turn) return false;
  if (companion.affinity < CONFESS_AT) return false;

  if (companion.confessed === 'accepted' || companion.confessed === 'declined') return false;

  if (companion.confessed === 'pending') {
    // 보류 뒤에는 6주를 기다린다. 세 번을 넘기면 더 오지 않는다
    if (holdCount(companion) >= HOLD_LIMIT) return false;
    return turn - companion.lastApproachTurn >= HOLD_RETRY_WEEKS;
  }

  return true;
}

export type ConfessAnswer = 'accept' | 'hold' | 'decline';

/** 응답 세 가지 (§7.4). 플레이어가 고르는 건 이것뿐이다 */
export function answerConfession(
  companion: CompanionRecord,
  answer: ConfessAnswer,
  turn: number,
): CompanionRecord {
  const base = { ...companion, lastApproachTurn: turn };

  switch (answer) {
    case 'accept':
      return {
        ...base,
        track: 'romance',
        confessed: 'accepted',
        // 연심 트랙 전용 슬롯이 열린다 (§8.2)
        unlockedSlots: base.unlockedSlots.includes(4)
          ? base.unlockedSlots
          : [...base.unlockedSlots, 4],
      };

    case 'hold':
      // 관계는 그대로다. 호감은 계속 오르고 6주 뒤 다시 온다
      return withHoldMark({ ...base, confessed: 'pending' });

    case 'decline':
      // 우애 트랙으로 굳는다. 소개 연쇄는 계속 가능하다
      return {
        ...base,
        track: 'bond',
        confessed: 'declined',
        affinity: Math.max(0, base.affinity - 10),
      };
  }
}

/** 맹우(80) 우애 트랙만 새 인물을 데려온다 (§7.4 소개 연쇄) */
export const REFERRAL_AT = 80;

export function canRefer(companion: CompanionRecord): boolean {
  return companion.track === 'bond' && companion.affinity >= REFERRAL_AT;
}
