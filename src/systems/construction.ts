/**
 * 건설과 증축 (§10) — 순수 함수.
 *
 * 건설은 시간을 쓰지 않는다. 자원이 유일한 제약이다.
 * 최대 레벨이 없다 — 비용만 계속 무거워진다.
 */

import type { GameState, ResourceId } from '@/types/game';
import { getBuilding, type Cost } from '@/data/buildings';
import { eraFor, townPower } from './eras';
import { josa } from './korean';

const RESOURCES: ResourceId[] = ['wood', 'stone', 'food', 'gold'];

const RESOURCE_LABEL: Record<ResourceId, string> = {
  wood: '목재',
  stone: '석재',
  food: '식량',
  gold: '금화',
};

/** 다음 레벨 비용 = 기본 비용 × (현재 레벨 + 1) */
export function nextCost(buildingId: string, currentLevel: number): Cost | null {
  const def = getBuilding(buildingId);
  if (def === undefined) return null;

  const multiplier = currentLevel + 1;
  const out: Cost = {};
  for (const r of RESOURCES) {
    const base = def.baseCost[r];
    if (base !== undefined) out[r] = base * multiplier;
  }
  return out;
}

export type BuildBlock =
  | { kind: 'ok' }
  | { kind: 'locked'; needEra: number }
  | { kind: 'poor'; missing: Cost }
  | { kind: 'unknown' };

/** 지을 수 있는가. 못 지으면 왜 못 짓는지까지 돌려준다 */
export function canBuild(state: GameState, buildingId: string): BuildBlock {
  const def = getBuilding(buildingId);
  if (def === undefined) return { kind: 'unknown' };

  const { eraIndex } = eraFor(townPower(state.town.buildings));
  if (eraIndex < def.unlockEra) return { kind: 'locked', needEra: def.unlockEra };

  const level = state.town.buildings[buildingId] ?? 0;
  const cost = nextCost(buildingId, level);
  if (cost === null) return { kind: 'unknown' };

  const missing: Cost = {};
  let poor = false;
  for (const r of RESOURCES) {
    const need = cost[r];
    if (need === undefined) continue;
    const short = need - state.resources[r];
    if (short > 0) {
      missing[r] = short;
      poor = true;
    }
  }

  return poor ? { kind: 'poor', missing } : { kind: 'ok' };
}

/**
 * 오류 문구는 무엇을 하면 되는지 말한다 (§15).
 * "석재가 12 부족합니다. 채석장을 올리거나 교역하세요."
 */
export function blockMessage(block: BuildBlock): string | null {
  switch (block.kind) {
    case 'ok':
      return null;
    case 'locked':
      return `${block.needEra}시대에 열립니다. 건물을 올려 마을을 키우세요.`;
    case 'poor': {
      // '식량가' 가 아니라 '식량이' 여야 한다
      const parts = RESOURCES.filter((r) => block.missing[r] !== undefined).map(
        (r) => `${josa(RESOURCE_LABEL[r], '이')} ${block.missing[r]}`,
      );
      return `${parts.join(', ')} 부족합니다. 자원을 모으거나 교역하세요.`;
    }
    case 'unknown':
      return '없는 건물입니다.';
  }
}

export interface BuildResult {
  state: GameState;
  /** 올라간 뒤의 레벨. 실패면 null */
  level: number | null;
  /** 실패 사유 */
  blocked: BuildBlock;
}

/** 한 단계 올린다. 자원을 깎고 레벨을 더한다. 시간은 흐르지 않는다 */
export function build(state: GameState, buildingId: string): BuildResult {
  const blocked = canBuild(state, buildingId);
  if (blocked.kind !== 'ok') return { state, level: null, blocked };

  const level = state.town.buildings[buildingId] ?? 0;
  const cost = nextCost(buildingId, level);
  if (cost === null) return { state, level: null, blocked: { kind: 'unknown' } };

  const resources = { ...state.resources };
  for (const r of RESOURCES) {
    const need = cost[r];
    if (need !== undefined) resources[r] -= need;
  }

  const next = level + 1;
  return {
    state: {
      ...state,
      resources,
      town: { ...state.town, buildings: { ...state.town.buildings, [buildingId]: next } },
      counters: { ...state.counters, buildsMade: state.counters.buildsMade + 1 },
    },
    level: next,
    blocked: { kind: 'ok' },
  };
}

export function costText(cost: Cost): string {
  return RESOURCES.filter((r) => cost[r] !== undefined)
    .map((r) => `${RESOURCE_LABEL[r]} ${cost[r]}`)
    .join(' · ');
}
