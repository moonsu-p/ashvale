/**
 * 경쟁 사건 (§7.5) — 순수 함수.
 *
 * 연인이 둘 이상이면 8주마다 한 번, 두 사람이 동시에 등장한다.
 * **질투 페널티는 없다.** 수치를 깎는 대신 편들 자리를 만든다 —
 * 편든 쪽이 오르고 반대쪽이 내린다. 중립은 가장 안전하고 가장 적다.
 */

import type { CompanionRecord, GameState } from '@/types/game';
import type { DialogueOption, DialogueScript } from '@/types/dialogue';
import {
  RIVAL_AFFINITY,
  RIVAL_EVENTS,
  RIVAL_INTERVAL_WEEKS,
  RIVAL_MIN_LOVERS,
} from '@/data/content/rival-events';
import { COMPANION_VOICES } from '@/data/content/companion-dialogue';
import type { Rng } from './rng';
import { applyToken } from './korean';
import { displayName } from './relationships';

/** 지금 연인인 사람들 */
export function lovers(state: GameState): CompanionRecord[] {
  return Object.values(state.companions).filter(
    (c) => c.departedTurn === null && c.track === 'romance' && c.confessed === 'accepted',
  );
}

export interface RivalPick {
  eventId: string;
  firstId: string;
  secondId: string;
}

/**
 * 이번 주에 경쟁 사건이 일어나는가.
 * 주차로만 판정해서 따로 세어 둘 필요가 없다.
 */
export function rollRival(state: GameState, rng: Rng): RivalPick | null {
  if (state.world.turn <= 0 || state.world.turn % RIVAL_INTERVAL_WEEKS !== 0) return null;

  const pool = lovers(state);
  if (pool.length < RIVAL_MIN_LOVERS) return null;

  const picked = rng.shuffle(pool).slice(0, 2);
  const [first, second] = picked;
  if (first === undefined || second === undefined) return null;

  const event = rng.pick(RIVAL_EVENTS);
  if (event === undefined) return null;

  return { eventId: event.id, firstId: first.id, secondId: second.id };
}

/** 두 사람이 나란히 서는 대본. 전용 슬롯을 쓰지 않고 양쪽 슬롯 0을 쓴다 (§7.5) */
export function buildRivalScript(
  state: GameState,
  pick: RivalPick,
  townName: string,
): DialogueScript | null {
  const event = RIVAL_EVENTS.find((e) => e.id === pick.eventId);
  const first = state.companions[pick.firstId];
  const second = state.companions[pick.secondId];
  if (event === undefined || first === undefined || second === undefined) return null;

  const nameA = displayName(first);
  const nameB = displayName(second);
  const fill = (text: string) =>
    applyToken(applyToken(applyToken(text, '{이름}', nameA), '{상대}', nameB), '{거점}', townName);

  const choices: DialogueOption[] = event.choices.map((c, i) => ({
    id: `${event.id}:${i}`,
    text: fill(c.text),
    reply: '',
    effect: {
      rival: {
        firstId: pick.firstId,
        secondId: pick.secondId,
        side: c.side,
      },
    },
  }));

  return {
    speakerName: `${nameA} · ${nameB}`,
    portrait: {
      speaker: { kind: 'companion', id: first.archetypeId },
      wantSlot: 0,
      label: COMPANION_VOICES[first.archetypeId]?.label ?? '',
    },
    // 두 사람을 나란히 세운다
    secondPortrait: {
      speaker: { kind: 'companion', id: second.archetypeId },
      wantSlot: 0,
      label: COMPANION_VOICES[second.archetypeId]?.label ?? '',
    },
    lines: [fill(event.situation)],
    choices,
  };
}

/** 편든 결과. 편든 쪽 +6, 반대쪽 −4 / 중립은 양쪽 +1 */
export function rivalDeltas(side: 'first' | 'second' | 'neutral'): {
  first: number;
  second: number;
} {
  if (side === 'neutral') return { first: RIVAL_AFFINITY.neutral, second: RIVAL_AFFINITY.neutral };
  if (side === 'first') return { first: RIVAL_AFFINITY.sided, second: RIVAL_AFFINITY.opposed };
  return { first: RIVAL_AFFINITY.opposed, second: RIVAL_AFFINITY.sided };
}
