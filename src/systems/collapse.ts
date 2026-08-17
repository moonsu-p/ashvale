/**
 * 붕괴 (§13) — 순수 함수.
 *
 * **업로드 이미지는 100% 보존한다. 예외 없다.**
 * 연대기와 갤러리도 남는다. 무너지는 것은 마을이지 기록이 아니다.
 */

import type { GameState } from '@/types/game';
import type { Rng } from './rng';
import {
  COLLAPSE,
  ERA_RELIEF_PER_COLLAPSE,
  REBUILD_GRANT,
  STAY_AFFINITY,
} from '@/data/collapse';
import { START_BUILDINGS } from '@/data/start';
import { townPower } from './eras';

/** 붕괴까지 몇 주 남았는가. 0 이면 이번 주에 무너진다. null 이면 위험하지 않다 */
export function weeksToCollapse(state: GameState): number | null {
  if (state.resources.food >= 0) return null;
  if (townPower(state.town.buildings) > COLLAPSE.maxPopulation) return null;
  return Math.max(0, COLLAPSE.famineWeeks - state.counters.famineWeeks);
}

export function shouldCollapse(state: GameState): boolean {
  return (
    state.resources.food < 0 &&
    state.counters.famineWeeks >= COLLAPSE.famineWeeks &&
    townPower(state.town.buildings) <= COLLAPSE.maxPopulation
  );
}

/**
 * 시대 임계값 완화 — 붕괴 1회당 5%.
 * 두 번째 판이 첫 판과 똑같이 무거우면 다시 일어설 마음이 안 난다.
 */
export function eraThresholdScale(collapses: number): number {
  return Math.max(0.5, 1 - collapses * ERA_RELIEF_PER_COLLAPSE);
}

export interface CollapseResult {
  state: GameState;
  /** 몇 대째인가. 연대기에 적는다 */
  generation: number;
}

export function collapse(state: GameState, rng: Rng): CollapseResult {
  const generation = state.counters.collapses + 2; // 첫 붕괴 뒤가 제2대

  // 건물 초기화 — 회관 Lv1 만 남는다
  const buildings = { ...START_BUILDINGS };

  // 스킬은 랭크 절반을 회수하고 SP 로 돌려준다
  const skills: Record<string, number> = {};
  let refunded = 0;
  for (const [id, rank] of Object.entries(state.hero.skills)) {
    const keep = Math.floor(rank / 2);
    refunded += rank - keep;
    if (keep > 0) skills[id] = keep;
  }

  // 유물 절반 유실
  const kept = rng.shuffle(state.hero.relics).slice(0, Math.floor(state.hero.relics.length / 2));

  // 관계 대상: 호감 절반. 벗(60) 미만은 떠난다 — **레코드는 지우지 않는다**
  const companions = { ...state.companions };
  for (const c of Object.values(companions)) {
    if (c.departedTurn !== null) continue;
    const affinity = Math.floor(c.affinity / 2);
    companions[c.id] = {
      ...c,
      affinity,
      // 이미지 참조는 그대로 둔다. 갤러리는 붕괴로 비지 않는다
      departedTurn: c.affinity < STAY_AFFINITY ? state.world.turn : null,
    };
  }

  return {
    state: {
      ...state,
      hero: {
        ...state.hero,
        // 레벨과 능력치는 유지된다
        skills,
        skillPoints: state.hero.skillPoints + refunded,
        relics: kept,
        hp: state.hero.maxHp,
        // 무너지고 다시 세우는 자리에서까지 금족을 끌고 가지 않는다
        restUntilTurn: 0,
      },
      town: { ...state.town, buildings },
      resources: { wood: REBUILD_GRANT.wood, stone: 0, food: REBUILD_GRANT.food, gold: 0 },
      world: {
        ...state.world,
        // 시대는 한 단계만 내려간다
        eraIndex: Math.max(0, state.world.eraIndex - 1),
        eraTier: 0,
        currentMap: 'town',
      },
      companions,
      escort: null,
      pendingApproach: [],
      // 연대기는 보존한다 (§13)
      counters: {
        ...state.counters,
        collapses: state.counters.collapses + 1,
        famineWeeks: 0,
      },
    },
    generation,
  };
}
