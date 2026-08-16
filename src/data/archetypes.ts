/**
 * 원형 6종 — 기획서 §7.2 표 그대로.
 *
 * 이름과 얼굴은 플레이어가, 성격·대사·취향·고향은 원형이 제공한다.
 * 대사는 content/companion-dialogue.ts 에 있다. 여기서 쓰지 않는다.
 */

import type { FactionId } from '@/types/game';

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
  /** 동행 보정 설명. 실제 수치 적용은 동행 시스템이 한다 */
  escortText: string;
}

export const ARCHETYPES: ArchetypeDef[] = [
  {
    id: 'knight',
    label: '기사',
    faction: 'oath',
    taste: ['무구', '석재'],
    homeRegion: 'gate',
    escortText: '위기 결과 HP 손실 −50%',
  },
  {
    id: 'hunter',
    label: '사냥꾼',
    faction: 'grove',
    taste: ['식량', '가죽'],
    homeRegion: 'whisper',
    escortText: '탐사 판정 +2',
  },
  {
    id: 'mage',
    label: '마법사',
    faction: 'tower',
    taste: ['유물', '서적'],
    homeRegion: 'deep',
    escortText: '통찰 판정 +2, 유물 발견 +3%p',
  },
  {
    id: 'herbalist',
    label: '약초사',
    faction: 'grove',
    taste: ['씨앗', '식량'],
    homeRegion: 'marsh',
    escortText: '탐사 HP 손실 −50%',
  },
  {
    id: 'envoy',
    label: '사절',
    faction: 'oath',
    taste: ['금화', '예물'],
    homeRegion: 'peaks',
    escortText: '전리품 +20%',
  },
  {
    id: 'wanderer',
    label: '방랑자',
    faction: null,
    // 취향은 생성 시 무작위로 정해진다 (§7.2)
    taste: [],
    homeRegion: 'rift',
    escortText: '무작위 (생성 시 고정)',
  },
];

const BY_ID = new Map(ARCHETYPES.map((a) => [a.id, a]));

export function getArchetype(id: string): ArchetypeDef | undefined {
  return BY_ID.get(id);
}

/** 관계 대상 상한 8명 (§7.1) */
export const COMPANION_LIMIT = 8;
