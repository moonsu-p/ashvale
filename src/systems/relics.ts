/**
 * 유물 패시브·발견 — 순수 함수 (§9). 목록은 content/world-content.ts 의 RELICS.
 * 각 유물은 영구 패시브 1개. 효과를 시스템별로 합산해 꺼내 쓴다.
 */

import type { GameState, ResourceId, StatId } from '@/types/game';
import type { Rng } from './rng';
import { RELICS } from '@/data/content/world-content';
import { skillRelicFind } from './skills';

const RELIC_MAP = Object.fromEntries(RELICS.map((r) => [r.id, r]));

export function ownedRelics(state: GameState) {
  return state.hero.relics.map((id) => RELIC_MAP[id]).filter((r): r is (typeof RELICS)[number] => !!r);
}

export function relicRollBonus(state: GameState): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'roll' ? r.effect.value : 0), 0);
}
export function relicStatBonus(state: GameState, stat: StatId): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'stat' && r.effect.stat === stat ? r.effect.value : 0), 0);
}
export function relicProduction(state: GameState, resource: ResourceId): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'production' && r.effect.resource === resource ? r.effect.value : 0), 0);
}
export function relicBuildCostPercent(state: GameState): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'buildCost' ? r.effect.percent : 0), 0);
}
export function relicLootPercent(state: GameState): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'loot' ? r.effect.percent : 0), 0);
}
export function relicFindBonus(state: GameState): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'relicFind' ? r.effect.points : 0), 0);
}
export function relicDefense(state: GameState): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'defense' ? r.effect.value : 0), 0);
}
export function relicAffinityPercent(state: GameState): number {
  return ownedRelics(state).reduce((a, r) => a + (r.effect.kind === 'affinityGain' ? r.effect.percent : 0), 0);
}

/** 등급별 기본 유물 발견 확률(%) — §6 */
export function baseRelicChance(grade: string): number {
  if (grade === 'triumph') return 12;
  if (grade === 'success') return 4;
  return 0;
}

/**
 * 탐험 시 유물 발견 판정. 발견하면 유물 id, 아니면 null.
 * 시대 게이트를 넘고 아직 없는 유물 중에서 고른다.
 */
export function rollRelicFind(state: GameState, grade: string, rng: Rng): string | null {
  const chance = baseRelicChance(grade) + skillRelicFind(state) + relicFindBonus(state);
  if (chance <= 0) return null;
  if (rng.next() * 100 >= chance) return null;
  const pool = RELICS.filter((r) => r.eraGate <= state.world.eraIndex && !state.hero.relics.includes(r.id));
  if (pool.length === 0) return null;
  return pool[rng.int(0, pool.length - 1)]!.id;
}

export function relicById(id: string) {
  return RELIC_MAP[id] ?? null;
}
