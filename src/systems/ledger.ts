/**
 * 원장 규칙 (§14) — 순수 함수.
 *
 * 원장은 세이브와 **별도 키**이며 한 방향으로만 움직인다.
 * 오래된 세이브를 불러와도 도달한 최대치는 내려가지 않는다.
 * 그래서 "붕괴 직전 세이브로 되돌려 붕괴를 없던 일로 만들기"가 통하지 않는다.
 */

import type { GameState, Ledger } from '@/types/game';
import { LEDGER_VERSION } from '@/data/save';

/** 둘 중 큰 쪽. null 은 아직 없음이므로 값이 있는 쪽이 이긴다 */
function maxNullable(a: number | null, b: number | null): number | null {
  if (a === null) return b;
  if (b === null) return a;
  return Math.max(a, b);
}

/**
 * 두 원장을 합친다. **어느 값도 낮아지지 않는다.**
 * 불러오기·꾸러미 가져오기·다른 기기에서 온 원장에 전부 같은 규칙을 쓴다.
 */
export function mergeLedger(a: Ledger, b: Ledger): Ledger {
  return {
    ledgerVersion: LEDGER_VERSION,
    maxTurnReached: Math.max(a.maxTurnReached, b.maxTurnReached),
    collapses: Math.max(a.collapses, b.collapses),
    lastCollapseTurn: maxNullable(a.lastCollapseTurn, b.lastCollapseTurn),
  };
}

/** 이 상태가 주장하는 원장 값. 저장된 원장과 합칠 재료로 쓴다 */
export function ledgerFromState(state: GameState): Ledger {
  return {
    ledgerVersion: LEDGER_VERSION,
    maxTurnReached: state.world.turn,
    collapses: state.counters.collapses,
    lastCollapseTurn: null,
  };
}

/**
 * 상태가 앞으로 나아간 만큼 원장을 끌어올린다.
 * 상태가 뒤로 간 경우(오래된 세이브)에는 아무것도 낮추지 않는다.
 */
export function advanceLedger(ledger: Ledger, state: GameState): Ledger {
  return mergeLedger(ledger, ledgerFromState(state));
}

/**
 * 저장된 원장이 상태보다 앞서 있는가.
 * 참이면 붕괴 이전 세이브를 불러온 것이다 — 붕괴 재적용은 붕괴 시스템이 맡는다.
 */
export function ledgerIsAhead(ledger: Ledger, state: GameState): boolean {
  return (
    ledger.maxTurnReached > state.world.turn || ledger.collapses > state.counters.collapses
  );
}
