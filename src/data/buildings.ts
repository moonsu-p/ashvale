/**
 * 건물표 — 기획서 §10 그대로.
 *
 * 다음 레벨 비용 = 기본 비용 × (현재 레벨 + 1). **최대 레벨 없음.**
 * 건설은 시간을 쓰지 않는다. 자원이 유일한 제약이다.
 */

import type { ResourceId } from '@/types/game';

export type Cost = Partial<Record<ResourceId, number>>;

export interface BuildingDef {
  id: string;
  name: string;
  /** 이 시대부터 지을 수 있다 */
  unlockEra: number;
  /** 레벨 1을 올리는 비용. 이후는 여기에 (현재 레벨 + 1)을 곱한다 */
  baseCost: Cost;
  /** 레벨당 주간 자원 산출. 경제 계산이 읽는다 */
  yieldPerLevel?: Cost;
  /** 효과 설명. §10 의 문구를 그대로 쓴다 — 패널에 그대로 보인다 */
  effectText: string;
  /** 실내가 있는가 (§6) */
  indoor: boolean;
}

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'hall',
    name: '회관',
    unlockEra: 0,
    baseCost: { wood: 20, stone: 10 },
    yieldPerLevel: { gold: 1 },
    effectText: '금화 +1',
    indoor: true,
  },
  {
    id: 'lumber',
    name: '목재소',
    unlockEra: 0,
    baseCost: { wood: 10, gold: 5 },
    yieldPerLevel: { wood: 2 },
    effectText: '목재 +2',
    indoor: false,
  },
  {
    id: 'farm',
    name: '농장',
    unlockEra: 0,
    baseCost: { wood: 15, gold: 5 },
    yieldPerLevel: { food: 3 },
    effectText: '식량 +3',
    indoor: false,
  },
  {
    id: 'quarry',
    name: '채석장',
    unlockEra: 1,
    baseCost: { wood: 20, gold: 10 },
    yieldPerLevel: { stone: 2 },
    effectText: '석재 +2',
    indoor: false,
  },
  {
    id: 'wall',
    name: '성벽',
    unlockEra: 1,
    baseCost: { stone: 25, wood: 10 },
    effectText: '지역 위험도 −1 (3레벨당)',
    indoor: false,
  },
  {
    id: 'lodge',
    name: '숙소',
    unlockEra: 1,
    baseCost: { wood: 25, stone: 10 },
    effectText: '관계 대상 상주 자리 +2',
    indoor: true,
  },
  {
    id: 'market',
    name: '시장',
    unlockEra: 2,
    baseCost: { wood: 30, stone: 20, gold: 20 },
    yieldPerLevel: { gold: 3 },
    effectText: '금화 +3, 교역·선물 구매',
    indoor: true,
  },
  {
    id: 'library',
    name: '서고',
    unlockEra: 2,
    baseCost: { stone: 35, gold: 25 },
    effectText: '탐사 판정 +1 (2레벨당)',
    indoor: true,
  },
  {
    id: 'shrine',
    name: '신전',
    unlockEra: 2,
    baseCost: { stone: 30, gold: 20 },
    effectText: 'HP 회복 +2/주',
    indoor: true,
  },
  {
    id: 'guildhall',
    name: '길드관',
    unlockEra: 3,
    baseCost: { wood: 50, stone: 40, gold: 40 },
    effectText: '호감 획득 +10%',
    indoor: true,
  },
  {
    id: 'academy',
    name: '마법학당',
    unlockEra: 4,
    baseCost: { stone: 70, gold: 80 },
    effectText: 'XP +50%',
    indoor: true,
  },
  {
    id: 'spire',
    name: '별의 첨탑',
    unlockEra: 5,
    baseCost: { stone: 120, gold: 150 },
    effectText: '모든 판정 +1',
    indoor: true,
  },
];

const BY_ID = new Map(BUILDINGS.map((b) => [b.id, b]));

export function getBuilding(id: string): BuildingDef | undefined {
  return BY_ID.get(id);
}

/**
 * 시각 단계는 레벨 1 / 4 / 10 세 개뿐이다 (§10).
 * 매 레벨 스프라이트를 갈면 에셋이 폭발한다.
 */
export type VisualStage = 0 | 1 | 2 | 3;

export function visualStage(level: number): VisualStage {
  if (level <= 0) return 0;
  if (level < 4) return 1;
  if (level < 10) return 2;
  return 3;
}

/** 성벽 단계: 1–3 나무 울타리, 4–9 석벽, 10+ 탑 (§10) */
export type WallStage = 'none' | 'fence' | 'stone' | 'tower';

export function wallStage(level: number): WallStage {
  if (level <= 0) return 'none';
  if (level < 4) return 'fence';
  if (level < 10) return 'stone';
  return 'tower';
}

/** 주간 식량 소비 = 인구 × 1 (§10) */
export const FOOD_PER_POP = 1;

/** 신전 레벨당 주간 HP 회복 (§10). 주 종료 3단계 '회복' 이 읽는다 */
export const SHRINE_HEAL_PER_LEVEL = 2;

/**
 * 신전 없이도 한 주에 이만큼 돌아온다.
 *
 * **§10 에 없는 값이다.** 신전은 성장기에나 지어지는데 그 전까지 회복 수단이
 * 하나도 없으면 초반에 몇 번 실패한 판은 영영 기력이 낮은 채로 남는다.
 * 위험이 되돌릴 수 없는 손실이면 그건 위험이 아니라 그냥 벌이다.
 * 신전은 이 위에 얹혀 회복을 **빠르게** 하는 물건이 된다.
 */
export const REST_HEAL_PER_WEEK = 1;

/** 숙소 레벨당 관계 대상 상주 자리 (§10) */
export const LODGE_SLOTS_PER_LEVEL = 2;
