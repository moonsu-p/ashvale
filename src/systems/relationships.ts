/**
 * 관계 규칙 (§7.3) — 순수 함수.
 *
 * **교류 버튼이 없다.** 호감을 올리는 길은 넷뿐이다:
 * 동행 탐사 · 고향 지역 탐사 · 선물 · 대화 사건.
 * 그리고 문턱을 넘으면 **인물이 다가온다.** 플레이어가 찾아가지 않는다.
 */

import type { CompanionRecord, GameState } from '@/types/game';
import type { AffinityTier } from '@/data/content/companion-dialogue';
import { DIALOGUE_EVENTS } from '@/data/content/dialogue-events';
import { getArchetype } from '@/data/archetypes';
import { shouldConfess } from './confession';
import {
  AFFINITY_MAX,
  AFFINITY_MIN,
  AFFINITY_STAGES,
  EVENT_TIERS,
  type AffinityStage,
  type EventTier,
} from '@/data/relationships';

export function stageFor(affinity: number): AffinityStage {
  let found = AFFINITY_STAGES[0] as AffinityStage;
  for (const stage of AFFINITY_STAGES) if (affinity >= stage.at) found = stage;
  return found;
}

/**
 * 말투 단계 (§15). 연인은 수치가 아니라 트랙으로 정해진다 —
 * 고백을 받아들인 뒤부터 호칭이 바뀐다.
 */
export function toneFor(companion: CompanionRecord): AffinityTier {
  if (companion.track === 'romance' && companion.confessed === 'accepted') return 'lover';
  return stageFor(companion.affinity).tone;
}

/** 화면에 쓸 이름. 아직 이름을 붙이지 않았으면 원형 이름표 (§7.1) */
export function displayName(companion: CompanionRecord): string {
  if (companion.name !== '') return companion.name;
  return getArchetype(companion.archetypeId)?.label ?? companion.archetypeId;
}

export function withAffinity(companion: CompanionRecord, delta: number): CompanionRecord {
  const affinity = Math.max(AFFINITY_MIN, Math.min(AFFINITY_MAX, companion.affinity + delta));
  return { ...companion, affinity };
}

/** 그 원형·문턱의 대화 사건이 존재하는가 */
function hasEvent(archetypeId: string, tier: EventTier): boolean {
  return DIALOGUE_EVENTS.some((e) => e.archetypeId === archetypeId && e.tier === tier);
}

export function eventIdFor(archetypeId: string, tier: EventTier): string | null {
  return DIALOGUE_EVENTS.find((e) => e.archetypeId === archetypeId && e.tier === tier)?.id ?? null;
}

/**
 * 지금 이 인물이 들고 올 사건의 문턱.
 * 호감이 넘었고 아직 소화하지 않은 것 중 **가장 낮은** 문턱부터 하나씩.
 */
export function pendingTier(companion: CompanionRecord): EventTier | null {
  for (const tier of EVENT_TIERS) {
    if (companion.affinity < tier) continue;
    if (!hasEvent(companion.archetypeId, tier)) continue;
    const id = eventIdFor(companion.archetypeId, tier);
    if (id !== null && !companion.clearedEvents.includes(id)) return tier;
  }
  return null;
}

/**
 * 다가올 준비가 된 인물인가. 부상 중이면 오지 않는다 (§11 동행).
 * 고백도 다가옴으로 온다 (§7.4) — 사건이 없어도 고백할 때가 되면 온다.
 */
export function readyToApproach(companion: CompanionRecord, turn: number): boolean {
  if (companion.departedTurn !== null) return false;
  if (companion.injuredUntilTurn > turn) return false;
  return pendingTier(companion) !== null || shouldConfess(companion, turn);
}

/**
 * 다가옴 대기열을 다시 짠다 — 주 종료 4단계 (§7.3).
 * 대기 중인 인물이 둘 이상이면 **호감이 높은 쪽부터** 한 명씩 세운다.
 */
export function queueApproaches(state: GameState): string[] {
  return Object.values(state.companions)
    .filter((c) => readyToApproach(c, state.world.turn))
    .sort((a, b) => b.affinity - a.affinity)
    .map((c) => c.id);
}

/** 대기열 맨 앞. 한 번에 하나만 발생시킨다 */
export function nextApproach(state: GameState): CompanionRecord | null {
  const id = state.pendingApproach[0];
  if (id === undefined) return null;
  return state.companions[id] ?? null;
}

/** 고향 지역을 탐사했는가 (§7.3 — 동행 여부 무관) */
export function isHomeRegion(companion: CompanionRecord, regionId: string): boolean {
  return companion.homeRegion === regionId;
}
