/**
 * 세력 평판 (§7.6) — 순수 함수.
 *
 * 세력은 서로 얽혀 있다. 한쪽에 기울면 반대쪽이 상한다 —
 * 마탑에 +5 하면 숲의 부족이 −2 된다. 그래야 선택이 값을 갖는다.
 */

import type { FactionId } from '@/types/game';
import {
  FACTION_BACKLASH,
  FACTION_MAX,
  FACTION_MIN,
  FACTION_OPPOSED,
} from '@/data/relationships';

const clamp = (n: number) => Math.max(FACTION_MIN, Math.min(FACTION_MAX, n));

export function shiftFaction(
  factions: Record<FactionId, number>,
  id: FactionId,
  delta: number,
): Record<FactionId, number> {
  const next = { ...factions, [id]: clamp((factions[id] ?? 0) + delta) };

  // 반대 세력은 오른 만큼의 일부를 잃는다. 내려갈 때는 반사가 없다
  const opposed = FACTION_OPPOSED[id];
  if (opposed !== undefined && delta > 0) {
    const backlash = Math.round(delta * FACTION_BACKLASH);
    if (backlash > 0) next[opposed] = clamp((factions[opposed] ?? 0) - backlash);
  }

  return next;
}

export function factionStanding(value: number): string {
  if (value >= 60) return '우호';
  if (value >= 20) return '호의';
  if (value > -20) return '중립';
  if (value > -60) return '냉담';
  return '적대';
}
