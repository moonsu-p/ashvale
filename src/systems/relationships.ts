/**
 * 관계 시스템 — 순수 함수 (§7). 호감(교류·선물, 상한 59), 신뢰, 세력 평판, 원형 보너스(최대값), 등장.
 * 대사는 content 파일에서 가져온다(여기서 문장을 만들지 않는다).
 */

import type { ChronicleEntry, GameState, Season } from '@/types/game';
import { COMPANION_VOICES, type AffinityTier } from '@/data/content/companion-dialogue';
import { PATRON_VOICES } from '@/data/content/patron-dialogue';
import { ARCHETYPES, PRESET_COMPANIONS, type ArchetypeEffect } from '@/data/archetypes';
import { PRESET_PATRONS, trustStage } from '@/data/patrons';
import { adjustFaction } from './factions';
import {
  talkGain, TALK_FACTION_GAIN,
  GIFT_MATCH, GIFT_MISMATCH, GIFT_DISLIKE, GIFT_COOLDOWN_WEEKS,
  AFFINITY_SOFT_CAP, AFFINITY_MAX,
  TIER_ALLY, TIER_FRIEND, TIER_BOND,
  PATRON_TALK_GAIN, PATRON_FACTION_GAIN,
} from '@/data/relationships';
import { TRUST_MAX } from '@/data/patrons';

// ────────────────────────── 단계·말투 ──────────────────────────

export function affinityTier(affinity: number, track: string | null): AffinityTier {
  if (affinity < TIER_ALLY) return 'stranger';
  if (affinity < TIER_FRIEND) return 'ally';
  if (affinity < TIER_BOND) return 'friend';
  return track === 'romance' ? 'lover' : 'friend';
}

/** 교류·선물이 넘지 못하는 상한. 60 미만이면 59, 이미 벗(60+) 이면 100. */
function methodCap(affinity: number): number {
  return affinity < TIER_FRIEND ? AFFINITY_SOFT_CAP : AFFINITY_MAX;
}

// ────────────────────────── 교류 ──────────────────────────

/** 관계 대상 교류(턴 소비). 연속 체감 + 소속 세력 평판. 제자리 변이. */
export function applyTalkCompanion(s: GameState, id: string): void {
  const c = s.companions[id];
  if (!c) return;
  const gain = talkGain(c.consecutiveTalks);
  // 다른 인물 연속 기록 초기화
  for (const other of Object.values(s.companions)) {
    if (other.id !== id) other.consecutiveTalks = 0;
  }
  c.consecutiveTalks += 1;
  c.affinity = Math.min(methodCap(c.affinity), c.affinity + gain);
  const arch = ARCHETYPES[c.archetypeId];
  if (arch?.faction) adjustFaction(s, arch.faction, TALK_FACTION_GAIN);
}

/** 의뢰인 교류(턴 소비). 신뢰 + 소속 세력 평판. */
export function applyTalkPatron(s: GameState, id: string): void {
  const p = s.patrons[id];
  if (!p) return;
  p.trust = Math.min(TRUST_MAX, p.trust + PATRON_TALK_GAIN);
  const preset = PRESET_PATRONS.find((x) => x.id === id);
  if (preset?.faction) adjustFaction(s, preset.faction, PATRON_FACTION_GAIN);
}

// ────────────────────────── 선물 ──────────────────────────

export type GiftReaction = 'match' | 'mismatch' | 'dislike' | 'cooldown';

export function giftReactionFor(archetypeId: string, category: string): 'match' | 'mismatch' | 'dislike' {
  const arch = ARCHETYPES[archetypeId];
  if (arch?.likes.includes(category)) return 'match';
  if (arch?.dislikes.includes(category)) return 'dislike';
  return 'mismatch';
}

export function canGift(s: GameState, id: string): boolean {
  const c = s.companions[id];
  if (!c) return false;
  return s.world.turn - c.lastGiftTurn >= GIFT_COOLDOWN_WEEKS;
}

/** 선물(턴 무소비). 취향 판정 → 호감. 4주 쿨다운. 제자리 변이. 반응을 돌려준다. */
export function applyGiftCompanion(s: GameState, id: string, category: string): GiftReaction {
  const c = s.companions[id];
  if (!c) return 'cooldown';
  if (!canGift(s, id)) return 'cooldown';
  const reaction = giftReactionFor(c.archetypeId, category);
  const delta = reaction === 'match' ? GIFT_MATCH : reaction === 'dislike' ? GIFT_DISLIKE : GIFT_MISMATCH;
  const capped = Math.min(methodCap(c.affinity), c.affinity + delta);
  c.affinity = Math.max(0, delta < 0 ? c.affinity + delta : capped);
  c.lastGiftTurn = s.world.turn;
  return reaction;
}

// ────────────────────────── 대사 (content 에서) ──────────────────────────

function substitute(text: string, name: string, address: string, settlement: string): string {
  return text
    .replace(/\{이름\}/g, name)
    .replace(/\{호칭\}/g, address)
    .replace(/\{거점\}/g, settlement);
}

export function companionTalkLine(s: GameState, id: string): string {
  const c = s.companions[id];
  if (!c) return '';
  const voice = COMPANION_VOICES[c.archetypeId];
  const arch = ARCHETYPES[c.archetypeId];
  if (!voice || !arch) return '';
  const tier = affinityTier(c.affinity, c.track);
  const lines = voice.talk[tier];
  const line = lines[c.consecutiveTalks % lines.length] ?? lines[0] ?? '';
  return substitute(line, c.name, arch.address, s.settlement.name);
}

export function companionGiftLine(s: GameState, id: string, reaction: 'match' | 'mismatch' | 'dislike'): string {
  const c = s.companions[id];
  if (!c) return '';
  const voice = COMPANION_VOICES[c.archetypeId];
  const arch = ARCHETYPES[c.archetypeId];
  if (!voice || !arch) return '';
  return substitute(voice.gift[reaction], c.name, arch.address, s.settlement.name);
}

export function companionRefuseCooldown(s: GameState, id: string): string {
  const c = s.companions[id];
  const voice = c ? COMPANION_VOICES[c.archetypeId] : null;
  const arch = c ? ARCHETYPES[c.archetypeId] : null;
  if (!c || !voice || !arch) return '';
  return substitute(voice.refuse.cooldown, c.name, arch.address, s.settlement.name);
}

export function patronGreetLine(s: GameState, id: string): string {
  const p = s.patrons[id];
  const voice = PATRON_VOICES[id];
  if (!p || !voice) return '';
  return voice.greet[trustStage(p.trust)];
}

// ────────────────────────── 원형 보너스 (최대값만) ──────────────────────────

/** 해당 인물이 현재 호감에서 연 원형 효과들 */
function unlockedEffects(archetypeId: string, affinity: number): ArchetypeEffect[] {
  const arch = ARCHETYPES[archetypeId];
  if (!arch) return [];
  return arch.bonuses.filter((b) => affinity >= b.tier).map((b) => b.effect);
}

/** 특정 kind 의 동료 보너스 최대값(중첩 없음, §7.2). departed 는 제외. */
export function companionBonus(s: GameState, kind: ArchetypeEffect['kind']): number {
  let best = 0;
  for (const c of Object.values(s.companions)) {
    if (c.departedTurn !== null) continue;
    for (const eff of unlockedEffects(c.archetypeId, c.affinity)) {
      if (eff.kind === kind && 'value' in eff) best = Math.max(best, eff.value);
    }
  }
  return best;
}

// ────────────────────────── 등장 ──────────────────────────

function stamp(s: GameState, season: Season): { year: number; week: number; season: Season } {
  return { year: s.world.year, week: s.world.week, season };
}

/** 조건을 만족한 프리셋 관계 대상/의뢰인을 등장시키고 연대기 항목을 돌려준다. */
export function checkPeopleAppearances(s: GameState, season: Season): ChronicleEntry[] {
  const entries: ChronicleEntry[] = [];

  // 관계 대상 (프리셋)
  for (const preset of PRESET_COMPANIONS) {
    if (s.companions[preset.id]) continue;
    const cond = preset.appear;
    const ok =
      (cond.kind === 'era' && s.world.eraIndex >= cond.value) ||
      (cond.kind === 'week' && s.world.turn + 1 >= cond.value) || // 3주차 = turn 2 시점(§16.2)
      (cond.kind === 'explores' && s.counters.explores >= cond.value);
    if (!ok) continue;
    s.companions[preset.id] = {
      id: preset.id,
      archetypeId: preset.archetypeId,
      name: preset.name,
      affinity: 0,
      track: null,
      consecutiveTalks: 0,
      lastGiftTurn: -GIFT_COOLDOWN_WEEKS,
      clearedEvents: [],
      injuredUntilTurn: 0,
      images: {},
      unlockedSlots: [0],
      origin: 'preset',
      joinedTurn: s.world.turn,
      departedTurn: null,
    };
    entries.push({ ...stamp(s, season), kind: 'bond', text: `${preset.name}이(가) ${s.settlement.name}에 합류했다.` });
  }

  // 의뢰인 (프리셋)
  for (const preset of PRESET_PATRONS) {
    if (s.patrons[preset.id]?.met) continue;
    if (s.world.eraIndex < preset.appearEra) continue;
    s.patrons[preset.id] = {
      id: preset.id,
      met: true,
      trust: 0,
      questsCleared: [],
      activeQuestId: null,
    };
    entries.push({ ...stamp(s, season), kind: 'bond', text: `의뢰인 ${preset.name}을(를) 만났다.` });
  }

  return entries;
}
