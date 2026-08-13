/**
 * 세력 평판 조정 — 순수 함수 (§7). 상충 규칙을 자동 적용한다(마탑↑ → 숲↓).
 */

import type { FactionId, GameState } from '@/types/game';
import { FACTION_CONFLICT, FACTION_MIN, FACTION_MAX } from '@/data/factions';

function clampFaction(v: number): number {
  return Math.min(FACTION_MAX, Math.max(FACTION_MIN, v));
}

/**
 * 세력 평판을 delta 만큼 바꾸고 상충 상대를 반대로 움직인다(§7 상충 규칙).
 * 상태를 제자리에서 변이한다.
 */
export function adjustFaction(s: GameState, id: FactionId, delta: number): void {
  s.factions[id] = clampFaction(s.factions[id] + delta);
  if (delta === 0) return;
  for (const c of FACTION_CONFLICT) {
    let other: FactionId | null = null;
    if (c.a === id) other = c.b;
    else if (c.b === id) other = c.a;
    if (other) {
      const opp = -Math.round(delta * c.ratio);
      s.factions[other] = clampFaction(s.factions[other] + opp);
    }
  }
}
