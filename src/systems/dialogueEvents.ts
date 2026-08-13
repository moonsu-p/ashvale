/**
 * 대화 사건·관계 트랙 — 순수 함수 (§16.3, §7.5). 주사위를 굴리지 않는다. 선택만 한다.
 * 사건은 content/dialogue-events.ts. tier 60 사건 2회 통과가 연심 진입 조건.
 */

import type { GameState } from '@/types/game';
import { DIALOGUE_EVENTS, type DialogueEvent } from '@/data/content/dialogue-events';
import { COMPANION_VOICES } from '@/data/content/companion-dialogue';
import { ARCHETYPES } from '@/data/archetypes';
import { adjustFaction } from './factions';
import { affinityTier } from './relationships';
import { AFFINITY_MAX, TIER_FRIEND } from '@/data/relationships';
import { unlockedSlotsFor } from '@/data/slots';

const TIERS = [20, 40, 60, 80] as const;

/** 이 인물에게 지금 발생할 대화 사건(승급 시 1회). 없으면 null. */
export function pendingDialogueEvent(s: GameState, companionId: string): DialogueEvent | null {
  const c = s.companions[companionId];
  if (!c || c.departedTurn !== null) return null;
  for (const tier of TIERS) {
    if (c.affinity < tier) break;
    const ev = DIALOGUE_EVENTS.find((e) => e.archetypeId === c.archetypeId && e.tier === tier);
    if (ev && !c.clearedEvents.includes(ev.id)) return ev;
  }
  return null;
}

/** 사건 대사에 이름을 치환한다(외형 묘사 없음, §7.2). */
export function dialogueSituation(s: GameState, ev: DialogueEvent): string {
  const c = Object.values(s.companions).find((x) => x.archetypeId === ev.archetypeId);
  const name = c?.name ?? '';
  const arch = ARCHETYPES[ev.archetypeId];
  return ev.situation.replace(/\{이름\}/g, name).replace(/\{호칭\}/g, arch?.address ?? '');
}

/** 선택지 적용 — 호감(상한 무시, 60 게이트를 여는 경로)·세력·clearedEvents. */
export function applyDialogueChoice(s: GameState, companionId: string, eventId: string, choiceIndex: number): void {
  const c = s.companions[companionId];
  const ev = DIALOGUE_EVENTS.find((e) => e.id === eventId);
  if (!c || !ev) return;
  const choice = ev.choices[choiceIndex];
  if (!choice) return;
  if (!c.clearedEvents.includes(eventId)) c.clearedEvents.push(eventId);
  c.affinity = Math.max(0, Math.min(AFFINITY_MAX, c.affinity + choice.affinity)); // 대화는 59 상한을 넘는다
  c.unlockedSlots = unlockedSlotsFor(c.affinity);
  if (choice.factionShift) adjustFaction(s, choice.factionShift[0], choice.factionShift[1]);
}

// ────────────────────────── 관계 트랙 (§7.5) ──────────────────────────

/** 통과한 tier 60 대화 사건 수 */
export function tier60Cleared(s: GameState, companionId: string): number {
  const c = s.companions[companionId];
  if (!c) return 0;
  return c.clearedEvents.filter((id) => {
    const ev = DIALOGUE_EVENTS.find((e) => e.id === id);
    return ev?.tier === 60;
  }).length;
}

/** 벗(60) 도달 + 트랙 미선언 → 관계 선언 사건 발생 */
export function shouldDeclareTrack(s: GameState, companionId: string): boolean {
  const c = s.companions[companionId];
  return !!c && c.departedTurn === null && c.affinity >= TIER_FRIEND && c.track === null;
}

/** 연심 진입 가능(벗 + 대화 사건 2회 통과, §7.5). 아니면 우애만 가능. */
export function romanceEligible(s: GameState, companionId: string): boolean {
  const c = s.companions[companionId];
  return !!c && c.clearedEvents.length >= 2;
}

/** 트랙 선언. 연심은 다수 허용, 질투 없음(§13 결정 11). */
export function declareTrack(s: GameState, companionId: string, track: 'bond' | 'romance'): void {
  const c = s.companions[companionId];
  if (!c) return;
  if (track === 'romance' && !romanceEligible(s, companionId)) return;
  c.track = track;
}

/** 인물의 현재 말투 단계 라벨 (§15.1) */
export function toneLabel(s: GameState, companionId: string): string {
  const c = s.companions[companionId];
  if (!c) return '';
  const t = affinityTier(c.affinity, c.track);
  return { stranger: '존댓말', ally: '존댓말', friend: '반말', lover: '반말' }[t];
}

export { COMPANION_VOICES };
