/**
 * 대화 대본 조립 (§8) — 순수 함수.
 *
 * **여기서 대사를 쓰지 않는다.** 문구는 전부 src/data/content/ 에서 가져온다.
 * 문체 규약(§15)에 맞춰 쓰인 글이라, 새로 쓰거나 다듬으면 톤이 무너진다.
 * 이 파일이 하는 일은 어떤 줄을 어떤 차례로 보여줄지 고르고, 치환 토큰을 채우는 것뿐이다.
 */

import type { DialogueOption, DialogueScript, SpeakerRef } from '@/types/dialogue';
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
  tier: AffinityTier = 'stranger',
): DialogueScript | null {
  const voice = COMPANION_VOICES[archetypeId];
  if (voice === undefined) return null;

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

  // 대화 사건이 있으면 상황 서술을 얹고 선택지를 연다 (§8.4)
  const event = DIALOGUE_EVENTS.find((e) => e.archetypeId === archetypeId && e.tier === 20);

  let choices: DialogueOption[] | undefined;
  if (event !== undefined) {
    lines.push(fillTokens(event.situation, ctx));
    choices = event.choices.slice(0, MAX_CHOICES).map((c, i) => ({
      id: `${event.id}:${i}`,
      text: fillTokens(c.text, ctx),
      // 선택지별 결과 대사는 콘텐츠에 없다. 그 인물의 다른 대사로 갈음한다 —
      // 여기서 새 문장을 지어내면 문체가 무너진다.
      // 0번은 이미 첫 줄로 썼으므로 1번부터 돌린다. 같은 말을 두 번 하지 않게
      reply: fillTokens(talkLine(archetypeId, tier, replyIndex(archetypeId, tier, i)) ?? '', ctx),
    }));
  }

  return {
    speakerName: ctx.characterName,
    portrait: { speaker: { kind: 'companion', id: archetypeId }, wantSlot: 0, label: voice.label },
    lines,
    ...(choices !== undefined ? { choices } : {}),
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
