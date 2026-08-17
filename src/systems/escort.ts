/**
 * 동행 보정 (§7.2 표, §11 동행) — 순수 함수.
 *
 * 표는 기획서에 처음부터 있었는데 **수치가 어디에도 붙지 않았다.**
 * `rollExplore` 에는 "동행 보정은 관계 시스템이 붙을 때 이 자리에 들어온다"
 * 라는 주석만 남아 있었다 — 데려가도 판정도 전리품도 그대로였다.
 *
 * 같은 원형이 여럿이어도 **중첩하지 않고 최댓값만** 쓴다 (§7.2).
 * 지금은 한 번에 한 명만 데려가므로 그 규칙이 저절로 지켜진다.
 */

import type { CompanionRecord, GameState, StatId } from '@/types/game';
import { getArchetype, type EscortEffect } from '@/data/archetypes';

/** 지역에 함께 나간 인물. 없으면 null */
export function escortOf(state: GameState): CompanionRecord | null {
  if (state.escort === null) return null;
  const who = state.companions[state.escort];
  if (who === undefined || who.departedTurn !== null) return null;
  return who;
}

/**
 * 방랑자의 보정 — "무작위 (생성 시 고정)" (§7.2).
 *
 * 인물마다 다르되 한 번 정해지면 안 바뀌어야 한다. 세이브에 칸을 하나 더
 * 만드는 대신 **id 에서 뽑는다** — id 는 세이브 안에서 유일하고 변하지 않으므로
 * 같은 사람은 언제나 같은 보정을 받는다. 난수를 굴리면 새로고침마다 달라진다.
 */
const WANDERER_ROLL: EscortEffect[][] = [
  [{ kind: 'roll', value: 2 }],
  [{ kind: 'loot', percent: 20 }],
  [{ kind: 'anyHp', percent: 50 }],
  [{ kind: 'crisisHp', percent: 50 }],
  [{ kind: 'relicFind', points: 0.03 }],
];

function hashId(id: string): number {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function escortEffects(who: CompanionRecord | null): EscortEffect[] {
  if (who === null) return [];
  const archetype = getArchetype(who.archetypeId);
  if (archetype === undefined) return [];
  if (archetype.escort.length > 0) return archetype.escort;
  // 표가 비어 있는 원형은 방랑자뿐이다
  return WANDERER_ROLL[hashId(who.id) % WANDERER_ROLL.length] ?? [];
}

/** 화면에 적을 한 줄. 방랑자는 뽑힌 것을 그대로 말한다 */
export function escortText(who: CompanionRecord | null): string {
  if (who === null) return '';
  const archetype = getArchetype(who.archetypeId);
  if (archetype === undefined) return '';
  if (archetype.escort.length > 0) return archetype.escortText;

  return escortEffects(who).map(describeEffect).join(' · ');
}

function describeEffect(effect: EscortEffect): string {
  switch (effect.kind) {
    case 'roll':
      return `탐사 판정 +${effect.value}`;
    case 'statRoll':
      return `판정 +${effect.value}`;
    case 'crisisHp':
      return `위기 기력 손실 -${effect.percent}%`;
    case 'anyHp':
      return `기력 손실 -${effect.percent}%`;
    case 'loot':
      return `전리품 +${effect.percent}%`;
    case 'relicFind':
      return `유물 발견 +${Math.round(effect.points * 100)}%p`;
  }
}

export interface EscortBonus {
  /** 판정에 그대로 더한다 */
  roll: number;
  /** 전리품 배수에 더할 비율 */
  lootPercent: number;
  /** 위기일 때만 줄이는 기력 손실 비율 */
  crisisHpPercent: number;
  /** 실패·위기 모두 줄이는 기력 손실 비율 */
  anyHpPercent: number;
  /** 유물 확률에 더할 값 */
  relicPoints: number;
}

/**
 * 지역의 판정 능력치를 받아 보정을 합친다.
 *
 * `statRoll` 은 그 능력치로 굴리는 지역에서만 붙는다 — 마법사의 "통찰 판정 +2"
 * 는 통찰 지역(지하 대공동)에서만 값이 있다. 아무 데서나 +2 면 표가 거짓말이 된다.
 */
export function escortBonus(who: CompanionRecord | null, stat: StatId): EscortBonus {
  const out: EscortBonus = {
    roll: 0,
    lootPercent: 0,
    crisisHpPercent: 0,
    anyHpPercent: 0,
    relicPoints: 0,
  };

  for (const effect of escortEffects(who)) {
    switch (effect.kind) {
      case 'roll':
        out.roll += effect.value;
        break;
      case 'statRoll':
        if (effect.stat === stat) out.roll += effect.value;
        break;
      case 'loot':
        out.lootPercent += effect.percent;
        break;
      case 'crisisHp':
        out.crisisHpPercent += effect.percent;
        break;
      case 'anyHp':
        out.anyHpPercent += effect.percent;
        break;
      case 'relicFind':
        out.relicPoints += effect.points;
        break;
    }
  }

  return out;
}
