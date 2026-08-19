/**
 * 세력 평판 (§7.6) — 순수 함수.
 *
 * 세력은 서로 얽혀 있다. 한쪽에 기울면 반대쪽이 상한다 —
 * 마탑에 +5 하면 숲의 부족이 −2 된다. 그래야 선택이 값을 갖는다.
 */

import type { FactionId } from '@/types/game';
import {
  FACTION_BACKLASH,
  FACTION_EFFECT,
  FACTION_LABEL,
  FACTION_MAX,
  FACTION_MIN,
  FACTION_OPPOSED,
  FACTION_STANDING,
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

/**
 * 세력의 태도가 실제로 하는 일 (§7).
 *
 * 평판이 문턱을 넘으면 편의를 봐주고, 내려가면 불편해진다.
 * 마탑과 숲의 부족은 서로 반대라 넷을 다 챙길 수는 없다 — 그게 갈래다.
 */
export interface FactionStanding {
  /** 주간 거래 한도에 더한다 */
  tradeLimit: number;
  /** 위기 기력 손실 비율. 음수면 늘어난다 */
  crisisHpPercent: number;
  /** 주간 식량 */
  weeklyFood: number;
  /** 탐사 판정 */
  roll: number;
}

export function factionEffects(factions: Record<FactionId, number>): FactionStanding {
  const out: FactionStanding = { tradeLimit: 0, crisisHpPercent: 0, weeklyFood: 0, roll: 0 };

  const at = (id: FactionId): 1 | 0 | -1 => {
    const value = factions[id] ?? 0;
    if (value >= FACTION_STANDING.boon) return 1;
    if (value <= FACTION_STANDING.grudge) return -1;
    return 0;
  };

  const guild = at('guild');
  if (guild === 1) out.tradeLimit += 30;
  if (guild === -1) out.tradeLimit -= 20;

  const oath = at('oath');
  if (oath === 1) out.crisisHpPercent += 20;
  if (oath === -1) out.crisisHpPercent -= 20;

  const grove = at('grove');
  if (grove === 1) out.weeklyFood += 3;
  if (grove === -1) out.weeklyFood -= 2;

  const tower = at('tower');
  if (tower === 1) out.roll += 1;
  if (tower === -1) out.roll -= 1;

  return out;
}

/** 화면에 적을 줄. 지금 무엇이 걸려 있는가 */
export function standingLines(
  factions: Record<FactionId, number>,
): { name: string; text: string; good: boolean }[] {
  const out: { name: string; text: string; good: boolean }[] = [];
  for (const id of Object.keys(FACTION_EFFECT) as FactionId[]) {
    const value = factions[id] ?? 0;
    const effect = FACTION_EFFECT[id];
    if (value >= FACTION_STANDING.boon) {
      out.push({ name: FACTION_LABEL[id], text: effect.boonText, good: true });
    } else if (value <= FACTION_STANDING.grudge) {
      out.push({ name: FACTION_LABEL[id], text: effect.grudgeText, good: false });
    }
  }
  return out;
}
