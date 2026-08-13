/**
 * 관계 대상 원형 — §7.2. 이름·얼굴은 플레이어가, 성격·취향·보너스는 원형이 제공한다.
 * 대사는 content/companion-dialogue.ts (COMPANION_VOICES). 보너스는 중첩 없이 최대값만(§7.2).
 */

import type { FactionId, StatId } from '@/types/game';

/** 원형 보너스 효과 — 해금 단계(tier: 40 동료 / 60 벗 / 80 맹우·연인)에 따라 열린다 */
export type ArchetypeEffect =
  | { kind: 'exploreRoll'; value: number } // 탐험 판정 +N (사냥꾼)
  | { kind: 'insightRoll'; value: number } // 통찰 판정 +N (마법사)
  | { kind: 'defense'; value: number } // 방어 +N (기사) — §8 M8
  | { kind: 'lootPercent'; value: number } // 전리품 +N% (사냥꾼 60)
  | { kind: 'relicFind'; value: number } // 유물 발견률 +N%p (마법사 60)
  | { kind: 'goldPerWeek'; value: number } // 금화 +N/주 (사절 40)
  | { kind: 'exploreHpPercent'; value: number } // 탐험 HP 손실 −N% (약초사 40)
  | { kind: 'dangerReduce'; value: number } // 지역 위험도 −N (사냥꾼 80)
  | { kind: 'threatXpPercent'; value: number } // 위협 승리 XP +N% (기사 80) — M8
  | { kind: 'threatPowerPercent'; value: number } // 위협 강도 −N% (사절 60) — M8
  | { kind: 'misc' }; // 겨울 페널티·부활·즉시 해금 등 콘텐츠성 (M7c/M8)

export interface ArchetypeBonus {
  tier: 40 | 60 | 80;
  effect: ArchetypeEffect;
  desc: string;
}

export interface Archetype {
  id: string;
  label: string;
  faction: FactionId | null;
  /** 선물 선호 카테고리 */
  likes: string[];
  /** 선물 혐오 카테고리 */
  dislikes: string[];
  /** 주인공을 부르는 말(벗 단계부터) — §15.1 */
  address: string;
  bonuses: ArchetypeBonus[];
}

export const ARCHETYPES: Record<string, Archetype> = {
  knight: {
    id: 'knight', label: '기사', faction: 'oath', likes: ['무구', '석재'], dislikes: ['향락'], address: '영주',
    bonuses: [
      { tier: 40, effect: { kind: 'defense', value: 5 }, desc: '방어 +5' },
      { tier: 60, effect: { kind: 'defense', value: 10 }, desc: '방어 +10' },
      { tier: 80, effect: { kind: 'threatXpPercent', value: 50 }, desc: '위협 승리 XP +50%' },
    ],
  },
  hunter: {
    id: 'hunter', label: '사냥꾼', faction: 'grove', likes: ['식량', '가죽'], dislikes: ['서적'], address: '대장',
    bonuses: [
      { tier: 40, effect: { kind: 'exploreRoll', value: 2 }, desc: '탐험 판정 +2' },
      { tier: 60, effect: { kind: 'lootPercent', value: 20 }, desc: '전리품 +20%' },
      { tier: 80, effect: { kind: 'dangerReduce', value: 3 }, desc: '지역 위험도 −3' },
    ],
  },
  mage: {
    id: 'mage', label: '마법사', faction: 'tower', likes: ['유물', '서적'], dislikes: ['무구'], address: '벗',
    bonuses: [
      { tier: 40, effect: { kind: 'insightRoll', value: 2 }, desc: '통찰 판정 +2' },
      { tier: 60, effect: { kind: 'relicFind', value: 5 }, desc: '유물 발견률 +5%p' },
      { tier: 80, effect: { kind: 'misc' }, desc: '수련 SP 확률 +10%p' },
    ],
  },
  herbalist: {
    id: 'herbalist', label: '약초사', faction: 'grove', likes: ['씨앗', '식량'], dislikes: ['무구'], address: '그대',
    bonuses: [
      { tier: 40, effect: { kind: 'exploreHpPercent', value: 50 }, desc: '탐험 HP 손실 −50%' },
      { tier: 60, effect: { kind: 'misc' }, desc: '겨울 페널티 절반' },
      { tier: 80, effect: { kind: 'misc' }, desc: '쓰러짐 시 즉시 부활 1회/시대' },
    ],
  },
  envoy: {
    id: 'envoy', label: '사절', faction: 'oath', likes: ['금화', '예물'], dislikes: ['가죽'], address: '영주님',
    bonuses: [
      { tier: 40, effect: { kind: 'goldPerWeek', value: 10 }, desc: '금화 +10/주' },
      { tier: 60, effect: { kind: 'threatPowerPercent', value: 15 }, desc: '위협 강도 −15%' },
      { tier: 80, effect: { kind: 'misc' }, desc: '신규 지역 즉시 해금' },
    ],
  },
  wanderer: {
    id: 'wanderer', label: '방랑자', faction: null, likes: ['금화'], dislikes: ['무구'], address: '친구',
    bonuses: [
      { tier: 40, effect: { kind: 'exploreRoll', value: 1 }, desc: '탐험 판정 +1' },
      { tier: 60, effect: { kind: 'lootPercent', value: 10 }, desc: '전리품 +10%' },
      { tier: 80, effect: { kind: 'misc' }, desc: '무작위 보너스' },
    ],
  },
};

/** 시작·프리셋 관계 대상 (§7.2). 이름·이미지 덮어쓰기 가능, 원형 고정. */
export interface PresetCompanion {
  id: string;
  name: string;
  archetypeId: string;
  appear: { kind: 'era'; value: number } | { kind: 'week'; value: number } | { kind: 'explores'; value: number };
}

export const PRESET_COMPANIONS: PresetCompanion[] = [
  { id: 'seria', name: '세리아', archetypeId: 'knight', appear: { kind: 'week', value: 3 } }, // §16.2 3주차
  { id: 'mira', name: '미라', archetypeId: 'hunter', appear: { kind: 'explores', value: 3 } },
  { id: 'eldrin', name: '엘드린', archetypeId: 'mage', appear: { kind: 'era', value: 2 } },
];

/** 관계 대상 상한 (§7.1) */
export const COMPANION_CAP = 8;

/** 능력치 판정용: insight 원형 매핑은 REGIONS 에서 사용 */
export type { StatId };
