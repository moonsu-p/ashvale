/**
 * 원형 6종 — 기획서 §7.2 표 그대로.
 *
 * 이름과 얼굴은 플레이어가, 성격·대사·취향·고향은 원형이 제공한다.
 * 대사는 content/companion-dialogue.ts 에 있다. 여기서 쓰지 않는다.
 */

import type { FactionId, StatId } from '@/types/game';

/**
 * 동행 보정 (§7.2 표).
 *
 * 지금까지 `escortText` 로 **설명만** 있고 수치가 어디에도 안 붙었다 —
 * 데려가도 판정이 그대로였다. 여기서 형을 주고 explore 가 읽는다.
 */
export type EscortEffect =
  | { kind: 'roll'; value: number }
  | { kind: 'statRoll'; stat: StatId; value: number }
  /** 위기 결과의 기력 손실만 줄인다 */
  | { kind: 'crisisHp'; percent: number }
  /** 실패·위기 가리지 않고 기력 손실을 줄인다 */
  | { kind: 'anyHp'; percent: number }
  | { kind: 'loot'; percent: number }
  /** 유물 발견 확률에 더한다. 0.03 = +3%p */
  | { kind: 'relicFind'; points: number };

export interface ArchetypeDef {
  id: string;
  /** 표시 이름. companion-dialogue.ts 의 label 과 같다 */
  label: string;
  /** 소속 세력. 방랑자는 없다 */
  faction: FactionId | null;
  /** 선물 취향 (§10 선물 품목의 카테고리) */
  taste: string[];
  /** 고향 지역 id (§11). 관계가 깊어지면 이 지역이 열린다 */
  homeRegion: string;
  /** 동행 보정 설명. 화면에 그대로 보인다 */
  escortText: string;
  /**
   * 실제로 적용되는 보정. 방랑자는 비운다 —
   * "무작위(생성 시 고정)" 라 인물마다 다르므로 id 에서 뽑는다.
   */
  escort: EscortEffect[];
}

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'knight',
    label: '기사',
    faction: 'oath',
    taste: ['무구', '석재'],
    homeRegion: 'gate',
    escortText: '위기 결과 HP 손실 −50%',
    escort: [{ kind: 'crisisHp', percent: 50 }],
  },
  {
    id: 'hunter',
    label: '사냥꾼',
    faction: 'grove',
    taste: ['식량', '가죽'],
    homeRegion: 'whisper',
    escortText: '탐사 판정 +2',
    escort: [{ kind: 'roll', value: 2 }],
  },
  {
    id: 'mage',
    label: '마법사',
    faction: 'tower',
    taste: ['유물', '서적'],
    homeRegion: 'deep',
    escortText: '통찰 판정 +2, 유물 발견 +3%p',
    escort: [
      { kind: 'statRoll', stat: 'insight', value: 2 },
      { kind: 'relicFind', points: 0.03 },
    ],
  },
  {
    id: 'herbalist',
    label: '약초사',
    faction: 'grove',
    taste: ['씨앗', '식량'],
    homeRegion: 'marsh',
    escortText: '탐사 HP 손실 −50%',
    escort: [{ kind: 'anyHp', percent: 50 }],
  },
  {
    id: 'envoy',
    label: '사절',
    faction: 'oath',
    taste: ['금화', '예물'],
    homeRegion: 'peaks',
    escortText: '전리품 +20%',
    escort: [{ kind: 'loot', percent: 20 }],
  },
  {
    id: 'wanderer',
    label: '방랑자',
    faction: null,
    // 취향은 생성 시 무작위로 정해진다 (§7.2)
    taste: [],
    homeRegion: 'rift',
    escortText: '무작위 (생성 시 고정)',
    escort: [],
  },
];

const BY_ID = new Map(ARCHETYPES.map((a) => [a.id, a]));

export function getArchetype(id: string): ArchetypeDef | undefined {
  return BY_ID.get(id);
}

/** 관계 대상 상한 8명 (§7.1) */
export const COMPANION_LIMIT = 8;
