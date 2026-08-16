/**
 * 지역 — 기획서 §11 표 그대로.
 *
 * 이름은 여기서 짓지 않는다. content/region-text.ts 의 label 을 쓴다.
 */

import type { ResourceId, StatId } from '@/types/game';
import { REGION_TEXT } from './content/region-text';

/** 전리품 범위. 성공 등급 배수를 곱하기 전 값 */
export type LootRange = Partial<Record<ResourceId, [number, number]>>;

export interface RegionDef {
  id: string;
  unlockEra: number;
  difficulty: number;
  /** 판정에 더해지는 능력치 */
  stat: StatId;
  loot: LootRange;
  /** 실패·위기에서 깎이는 HP 의 기준 */
  risk: number;
  /** 유물이 두 배로 나오는 지역 */
  doubleRelic?: boolean;
}

export const REGIONS: RegionDef[] = [
  {
    id: 'whisper',
    unlockEra: 0,
    difficulty: 9,
    stat: 'agility',
    loot: { wood: [4, 9], food: [3, 7], gold: [0, 4] },
    risk: 2,
  },
  {
    id: 'gate',
    unlockEra: 1,
    difficulty: 12,
    stat: 'might',
    loot: { stone: [5, 11], gold: [3, 8] },
    risk: 4,
  },
  {
    id: 'marsh',
    unlockEra: 2,
    difficulty: 15,
    stat: 'will',
    loot: { food: [6, 14], gold: [5, 12] },
    risk: 6,
  },
  {
    id: 'peaks',
    unlockEra: 3,
    difficulty: 18,
    stat: 'might',
    loot: { stone: [12, 24], gold: [10, 20] },
    risk: 8,
  },
  {
    id: 'deep',
    unlockEra: 4,
    difficulty: 21,
    stat: 'insight',
    loot: { stone: [20, 40], gold: [20, 40] },
    risk: 10,
  },
  {
    id: 'rift',
    unlockEra: 5,
    difficulty: 25,
    stat: 'will',
    loot: { gold: [40, 80] },
    risk: 14,
    doubleRelic: true,
  },
];

const BY_ID = new Map(REGIONS.map((r) => [r.id, r]));

export function getRegion(id: string): RegionDef | undefined {
  return BY_ID.get(id);
}

/** 표시 이름. 콘텐츠에서 가져온다 */
export function regionName(id: string): string {
  return REGION_TEXT[id]?.label ?? id;
}

/** 지역 맵 id 는 'region:whisper' 꼴이다 (§4) */
export function regionMapId(id: string): string {
  return `region:${id}`;
}

export function regionIdFromMap(mapId: string): string | null {
  return mapId.startsWith('region:') ? mapId.slice('region:'.length) : null;
}

/** 등급별 배수 (§11) */
export const GRADE_TABLE = {
  triumph: { loot: 1.8, xp: 1.5, relic: 0.12, discovery: 0.25 },
  success: { loot: 1.0, xp: 1.0, relic: 0.04, discovery: 0 },
  failure: { loot: 0.35, xp: 0.5, relic: 0, discovery: 0 },
  crisis: { loot: 0, xp: 0.25, relic: 0, discovery: 0 },
} as const;

/** 기본 XP = 난이도 × 1.5 */
export const XP_PER_DIFFICULTY = 1.5;

/** 사건 노드는 지역당 3~5개 (§11) */
export const NODE_COUNT = { min: 3, max: 5 };

/** HP 0 → 사망 아님. HP 1로 복귀, 다음 2주 탐사 불가, 금화 20% 손실 (§11) */
export const DOWNED = { hpOnReturn: 1, restWeeks: 2, goldLossPercent: 0.2 };

/**
 * 판정 연출 속도 (§11 — 단계적으로 노출한다).
 * 주사위가 돌다 멈추고, 보정이 하나씩 얹히고, 난이도 선을 넘는지 보인다.
 */
export const ROLL_ANIM = {
  /** 주사위가 도는 시간 */
  spinMs: 700,
  /** 도는 동안 눈이 바뀌는 간격 */
  spinTickMs: 60,
  /** 보정 한 줄이 얹히는 간격 */
  stepMs: 340,
  /** 합계와 난이도를 견주기까지 */
  compareMs: 460,
} as const;
