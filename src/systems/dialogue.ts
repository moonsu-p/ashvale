/**
 * 대화 대본 조립 (§8) — 순수 함수.
 *
 * **여기서 대사를 쓰지 않는다.** 문구는 전부 src/data/content/ 에서 가져온다.
 * 문체 규약(§15)에 맞춰 쓰인 글이라, 새로 쓰거나 다듬으면 톤이 무너진다.
 * 이 파일이 하는 일은 어떤 줄을 어떤 차례로 보여줄지 고르고, 치환 토큰을 채우는 것뿐이다.
 */

import type { CompanionRecord } from '@/types/game';
import type { DialogueOption, DialogueScript, SpeakerRef } from '@/types/dialogue';
import { toneFor } from './relationships';
import { COMPANION_VOICES, type AffinityTier } from '@/data/content/companion-dialogue';
import { PATRON_VOICES } from '@/data/content/patron-dialogue';
import { DIALOGUE_EVENTS } from '@/data/content/dialogue-events';
import { MAX_CHOICES } from '@/data/dialogue';
import { applyToken } from './korean';

export interface DialogueContext {
  /** {거점} */
  townName: string;
  /** {이름} — 인물 이름 */
  characterName: string;
  /** {호칭} — 그 인물이 주인공을 부르는 말 */
  address: string;
}

/** 부르는 쪽이 아는 것만 넘기면 나머지는 콘텐츠에서 채운다 */
export interface DialogueRequest {
  townName: string;
  /** 플레이어가 붙인 이름. 아직 없으면 비워 둔다 — 원형 이름표로 대신한다 */
  characterName?: string;
  /** 말투 단계 (§15). 없으면 낯선 사람으로 본다 */
  tone?: AffinityTier;
}

/** 콘텐츠의 치환 토큰을 채운다. 뒤따르는 조사는 앞말에 맞춰진다 */
export function fillTokens(text: string, ctx: DialogueContext): string {
  let out = applyToken(text, '{거점}', ctx.townName);
  out = applyToken(out, '{이름}', ctx.characterName);
  return applyToken(out, '{호칭}', ctx.address);
}

/** 그 원형의 단계별 말투에서 한 줄. 인덱스는 부르는 쪽이 정한다 */
function talkLine(archetypeId: string, tier: AffinityTier, index: number): string | null {
  const voice = COMPANION_VOICES[archetypeId];
  if (voice === undefined) return null;
  const lines = voice.talk[tier];
  if (lines.length === 0) return null;
  return lines[index % lines.length] ?? null;
}

/**
 * 마무리 대사로 쓸 줄 번호.
 * 0번은 첫 줄로 이미 썼으니 1번 이후에서 고른다. 줄이 하나뿐이면 어쩔 수 없이 0번.
 */
function replyIndex(archetypeId: string, tier: AffinityTier, choiceIndex: number): number {
  const count = COMPANION_VOICES[archetypeId]?.talk[tier].length ?? 0;
  if (count <= 1) return 0;
  return 1 + (choiceIndex % (count - 1));
}

/**
 * 관계 대상과의 대화.
 *
 * 아직 호감 수치가 붙기 전이라 단계는 stranger 로 고정한다.
 * 호감·명단이 들어오면 tier 를 인자로 받아 갈라진다.
 */
export function buildCompanionScript(
  archetypeId: string,
  req: DialogueRequest,
  tone?: AffinityTier,
): DialogueScript | null {
  const voice = COMPANION_VOICES[archetypeId];
  if (voice === undefined) return null;
  const tier: AffinityTier = tone ?? req.tone ?? 'stranger';

  // 이름은 플레이어가 붙인다. 아직 없으면 원형 이름표로 대신한다
  const ctx: DialogueContext = {
    townName: req.townName,
    characterName:
      req.characterName !== undefined && req.characterName !== '' ? req.characterName : voice.label,
    address: voice.address[tier],
  };

  const lines: string[] = [];
  const opener = talkLine(archetypeId, tier, 0);
  if (opener !== null) lines.push(fillTokens(opener, ctx));

  // 그냥 말을 건 것뿐이다. 선택지는 다가옴 사건에서만 열린다 (§7.3, §8.4)
  return {
    speakerName: ctx.characterName,
    portrait: { speaker: { kind: 'companion', id: archetypeId }, wantSlot: 0, label: voice.label },
    lines,
  };
}

/**
 * 다가옴으로 열리는 대화 사건 (§8.4).
 *
 * **주사위를 굴리지 않는다.** 탐사는 판정이지만 대화는 선택이다.
 * 정답이 없다 — 호감이 적게 오르는 선택지는 세력 평판 같은 다른 것을 준다.
 */
export function buildEventScript(
  companion: CompanionRecord,
  tier: number,
  req: DialogueRequest,
): DialogueScript | null {
  const voice = COMPANION_VOICES[companion.archetypeId];
  const event = DIALOGUE_EVENTS.find(
    (e) => e.archetypeId === companion.archetypeId && e.tier === tier,
  );
  if (voice === undefined || event === undefined) return null;

  const tone = toneFor(companion);
  const name = req.characterName !== undefined && req.characterName !== '' ? req.characterName : voice.label;
  const ctx: DialogueContext = {
    townName: req.townName,
    characterName: name,
    address: voice.address[tone],
  };

  const choices: DialogueOption[] = event.choices.slice(0, MAX_CHOICES).map((c, i) => ({
    id: `${event.id}:${i}`,
    text: fillTokens(c.text, ctx),
    reply: fillTokens(talkLine(companion.archetypeId, tone, replyIndex(companion.archetypeId, tone, i)) ?? '', ctx),
    effect: {
      companionId: companion.id,
      affinity: c.affinity,
      ...(c.factionShift !== undefined ? { factionShift: c.factionShift } : {}),
      clearedEvent: event.id,
    },
  }));

  return {
    speakerName: name,
    portrait: {
      speaker: { kind: 'companion', id: companion.archetypeId },
      // 감정이 실린 대사는 슬롯 1. 없으면 조용히 0으로 내려간다 (§8.2)
      wantSlot: 1,
      label: voice.label,
    },
    lines: [fillTokens(event.situation, ctx)],
    choices,
  };
}

/** 의뢰인과의 대화. 선택지 없이 인사와 용건만 (§7.6) */
export function buildPatronScript(
  patronId: string,
  req: DialogueRequest,
): DialogueScript | null {
  const voice = PATRON_VOICES[patronId];
  if (voice === undefined) return null;

  const ctx: DialogueContext = {
    townName: req.townName,
    characterName: voice.name,
    address: '',
  };

  return {
    speakerName: voice.name,
    portrait: { speaker: { kind: 'patron', id: patronId }, wantSlot: 0, label: voice.role },
    lines: [fillTokens(voice.greet.acquaintance, ctx), fillTokens(voice.questOffer, ctx)],
  };
}

export function buildScript(speaker: SpeakerRef, req: DialogueRequest): DialogueScript | null {
  return speaker.kind === 'companion'
    ? buildCompanionScript(speaker.id, req)
    : buildPatronScript(speaker.id, req);
}
