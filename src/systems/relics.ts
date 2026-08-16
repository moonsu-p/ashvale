/**
 * 유물 (§11, world-content.ts) — 순수 함수.
 *
 * 유물 목록과 발견 서술은 콘텐츠에 있다. 여기서 만들지 않는다.
 */

import type { GameState, ResourceId, StatId } from '@/types/game';
import { RELICS, type Relic } from '@/data/content/world-content';
import type { Rng } from './rng';

const BY_ID = new Map(RELICS.map((r) => [r.id, r]));

export function getRelic(id: string): Relic | undefined {
  return BY_ID.get(id);
}

export function heldRelics(state: GameState): Relic[] {
  return state.hero.relics.map((id) => BY_ID.get(id)).filter((r): r is Relic => r !== undefined);
}

/** 들고 있는 유물이 주는 누적 보정 */
export interface RelicBonus {
  roll: number;
  defense: number;
  lootPercent: number;
  buildCostPercent: number;
  affinityPercent: number;
  relicFindPoints: number;
  stats: Partial<Record<StatId, number>>;
  production: Partial<Record<ResourceId, number>>;
}

export function relicBonus(state: GameState): RelicBonus {
  const out: RelicBonus = {
    roll: 0,
    defense: 0,
    lootPercent: 0,
    buildCostPercent: 0,
    affinityPercent: 0,
    relicFindPoints: 0,
    stats: {},
    production: {},
  };

  for (const relic of heldRelics(state)) {
    const e = relic.effect;
    switch (e.kind) {
      case 'roll':
        out.roll += e.value;
        break;
      case 'defense':
        out.defense += e.value;
        break;
      case 'loot':
        out.lootPercent += e.percent;
        break;
      case 'buildCost':
        out.buildCostPercent += e.percent;
        break;
      case 'affinityGain':
        out.affinityPercent += e.percent;
        break;
      case 'relicFind':
        out.relicFindPoints += e.points;
        break;
      case 'stat':
        out.stats[e.stat] = (out.stats[e.stat] ?? 0) + e.value;
        break;
      case 'production':
        out.production[e.resource] = (out.production[e.resource] ?? 0) + e.value;
        break;
    }
  }

  return out;
}

/**
 * 아직 없는 유물 중에서 하나. 시대 문턱을 넘은 것만 나온다.
 * 다 모았으면 null.
 */
export function rollRelic(state: GameState, rng: Rng): Relic | null {
  const owned = new Set(state.hero.relics);
  const pool = RELICS.filter((r) => !owned.has(r.id) && state.world.eraIndex >= r.eraGate);
  if (pool.length === 0) return null;
  return rng.pick(pool) ?? null;
}
