/**
 * 새 게임 상태 생성 — 순수 함수. createdAt(now) 은 밖에서 주입한다.
 * createdAt 은 이후 deriveLayout 의 시드로도 쓰이므로 한 번 정해지면 바뀌지 않는다. §3
 */

import { CURRENT_SCHEMA, type GameState } from '@/types/game';
import {
  START_BUILDINGS,
  START_FACTIONS,
  START_HERO_STATS,
  START_HP,
  START_REGIONS,
  START_RESOURCES,
  START_SETTLEMENT_NAME,
} from '@/data/start';

export function createInitialState(now: number, heroName = ''): GameState {
  return {
    schemaVersion: CURRENT_SCHEMA,
    createdAt: now,

    hero: {
      name: heroName,
      level: 1,
      xp: 0,
      hp: START_HP,
      maxHp: START_HP,
      stats: { ...START_HERO_STATS },
      statPoints: 0,
      skillPoints: 0,
      skills: {},
      relics: [],
    },

    settlement: {
      name: START_SETTLEMENT_NAME,
      buildings: { ...START_BUILDINGS },
    },

    resources: { ...START_RESOURCES },

    world: {
      year: 1,
      week: 1,
      turn: 0,
      eraIndex: 0,
      eraTier: 0,
      unlockedRegions: [...START_REGIONS],
    },

    companions: {},
    patrons: {},
    factions: { ...START_FACTIONS },

    threat: null,

    chronicle: [],
    counters: {
      explores: 0,
      threatsWon: 0,
      threatsLost: 0,
      buildsMade: 0,
      collapses: 0,
      foodDeficitStreak: 0,
      firsts: {},
    },
  };
}
