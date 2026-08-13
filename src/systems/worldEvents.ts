/**
 * 세계 이벤트 판정·적용 — 순수 함수 (§9). 서술은 content/world-content.ts 에서 가져온다.
 * 자원·평판·HP 등을 소폭 흔들고 연대기에 기록한다.
 */

import type { GameState } from '@/types/game';
import type { Rng } from './rng';
import { WORLD_EVENTS, type WorldEvent } from '@/data/content/world-content';
import { addResource } from './economy';

/** 현재 시대에 가능한 이벤트 중 가중치로 하나 선택. 없으면 null. */
export function pickWorldEvent(state: GameState, rng: Rng): WorldEvent | null {
  const pool = WORLD_EVENTS.filter((e) => e.eraMin <= state.world.eraIndex);
  if (pool.length === 0) return null;
  const total = pool.reduce((a, e) => a + e.weight, 0);
  let roll = rng.next() * total;
  for (const e of pool) {
    roll -= e.weight;
    if (roll <= 0) return e;
  }
  return pool[pool.length - 1] ?? null;
}

/** 선택된 이벤트 효과를 작업 사본에 적용한다(변이). */
export function applyWorldEvent(state: GameState, event: WorldEvent): void {
  for (const eff of event.effects) {
    switch (eff.kind) {
      case 'resource':
        addResource(state, eff.resource, eff.value);
        break;
      case 'resourcePercent': {
        const cur = state.resources[eff.resource];
        addResource(state, eff.resource, Math.round((cur * eff.percent) / 100));
        break;
      }
      case 'faction':
        state.factions[eff.factionId] = clamp(state.factions[eff.factionId] + eff.value, -100, 100);
        break;
      case 'hp':
        state.hero.hp = clamp(state.hero.hp + eff.value, 0, state.hero.maxHp);
        break;
      case 'xp':
        // 누적만. 레벨업 처리는 §4 (M5).
        state.hero.xp += eff.value;
        break;
      case 'skillPoint':
        state.hero.skillPoints += eff.value;
        break;
      case 'popGrowth':
        // 인구는 건물 레벨 합이므로 민가로 유입시킨다 (§5).
        state.settlement.buildings.house = (state.settlement.buildings.house ?? 0) + eff.value;
        break;
    }
  }
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
