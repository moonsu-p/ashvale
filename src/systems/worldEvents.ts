/**
 * 세계 이벤트 (§3 주 종료 5단계) — 순수 함수.
 * 매주 12% 확률로 하나. 서술은 world-content.ts 에서 가져온다.
 */

import type { GameState } from '@/types/game';
import { WORLD_EVENTS, type WorldEvent } from '@/data/content/world-content';
import type { Rng } from './rng';
import { shiftFaction } from './factions';

/** 주 종료마다 12% */
export const EVENT_CHANCE = 0.12;

/** 시대에 맞는 것 중에서 가중치로 하나 */
export function rollEvent(state: GameState, rng: Rng): WorldEvent | null {
  if (!rng.chance(EVENT_CHANCE)) return null;

  const pool = WORLD_EVENTS.filter((e) => state.world.eraIndex >= e.eraMin);
  if (pool.length === 0) return null;

  const total = pool.reduce((sum, e) => sum + e.weight, 0);
  let pick = rng.int(1, total);
  for (const event of pool) {
    pick -= event.weight;
    if (pick <= 0) return event;
  }
  return pool[pool.length - 1] ?? null;
}

export function applyEvent(state: GameState, event: WorldEvent): GameState {
  let next = state;

  for (const effect of event.effects) {
    switch (effect.kind) {
      case 'resource':
        next = {
          ...next,
          resources: {
            ...next.resources,
            [effect.resource]: next.resources[effect.resource] + effect.value,
          },
        };
        break;

      case 'resourcePercent': {
        const base = next.resources[effect.resource];
        next = {
          ...next,
          resources: {
            ...next.resources,
            [effect.resource]: base + Math.round((base * effect.percent) / 100),
          },
        };
        break;
      }

      case 'faction':
        next = {
          ...next,
          factions: shiftFaction(next.factions, effect.factionId, effect.value),
        };
        break;

      case 'hp':
        next = {
          ...next,
          hero: {
            ...next.hero,
            hp: Math.max(0, Math.min(next.hero.maxHp, next.hero.hp + effect.value)),
          },
        };
        break;

      case 'xp':
        next = { ...next, hero: { ...next.hero, xp: next.hero.xp + effect.value } };
        break;

      case 'skillPoint':
        next = {
          ...next,
          hero: { ...next.hero, skillPoints: next.hero.skillPoints + effect.value },
        };
        break;

      case 'popGrowth':
        // 인구는 건물 레벨의 합이라 직접 올리지 않는다.
        // 마을이 커지는 사건은 자재로 갈음한다
        next = {
          ...next,
          resources: { ...next.resources, food: next.resources.food + effect.value * 2 },
        };
        break;
    }
  }

  return next;
}
