/**
 * 온보딩 과제 진행 — 순수 함수 (§16.2). 순서 고정, 강제하지 않는다.
 * 세리아 관련(seria)은 M7 인물 시스템이 완성한다 — 그전까지 그 단계에서 대기한다.
 */

import type { GameState } from '@/types/game';
import { ONBOARDING_TASKS } from '@/data/onboarding';

export function isTaskDone(state: GameState, taskId: string): boolean {
  switch (taskId) {
    case 'farm':
      return (state.settlement.buildings.farm ?? 0) > 0;
    case 'explore':
      return state.counters.explores > 0;
    case 'lumber':
      return (state.settlement.buildings.lumber ?? 0) > 0;
    case 'seria':
      // 세리아 등장·교류는 M7. 그전까지 완료되지 않는다.
      return Object.keys(state.companions).length > 0;
    case 'era1':
      return state.world.eraIndex >= 1;
    default:
      return false;
  }
}

/** 현재 안내할 과제(첫 미완료). 모두 끝났으면 null → 카드 사라짐. */
export function currentTask(state: GameState): (typeof ONBOARDING_TASKS)[number] | null {
  for (const t of ONBOARDING_TASKS) {
    if (!isTaskDone(state, t.id)) return t;
  }
  return null;
}

/** 첫 5턴 동안만 권장 행동을 강조한다 (§16.2). */
export function inRecommendWindow(state: GameState): boolean {
  return state.world.turn < 5;
}
