/**
 * 의뢰인 퀘스트 (§7.6) — 순수 함수.
 * 동시에 하나. 기한 없음. **실패가 없다** — 조건을 채울 때까지 그냥 열려 있다.
 */

import type { GameState } from '@/types/game';
import { QUESTS, getQuest, type QuestDef } from '@/data/quests';
import { townPower } from './eras';

/** 지금 이 의뢰인이 내줄 수 있는 퀘스트. 이미 깬 것과 진행 중인 것은 뺀다 */
export function offerFor(state: GameState, patronId: string): QuestDef | null {
  const record = state.patrons[patronId];
  const active = activeQuest(state);
  if (active !== null) return null;

  return (
    QUESTS.find(
      (q) =>
        q.patronId === patronId &&
        state.world.eraIndex >= q.era &&
        !(record?.questsCleared ?? []).includes(q.id),
    ) ?? null
  );
}

/** 진행 중인 퀘스트. 동시에 하나뿐이다 */
export function activeQuest(state: GameState): QuestDef | null {
  for (const record of Object.values(state.patrons)) {
    if (record.activeQuestId !== null) return getQuest(record.activeQuestId) ?? null;
  }
  return null;
}

/** 조건을 채웠는가 */
export function isComplete(state: GameState, quest: QuestDef): boolean {
  const goal = quest.goal;
  switch (goal.kind) {
    case 'expeditions':
      return state.counters.expeditions >= goal.count;
    case 'building':
      return (state.town.buildings[goal.buildingId] ?? 0) >= goal.level;
    case 'faction':
      return state.factions[goal.faction] >= goal.value;
    case 'power':
      return townPower(state.town.buildings) >= goal.value;
  }
}

/** 진행 상황을 사람 말로 */
export function progressText(state: GameState, quest: QuestDef): string {
  const goal = quest.goal;
  switch (goal.kind) {
    case 'expeditions':
      return `${Math.min(state.counters.expeditions, goal.count)} / ${goal.count}`;
    case 'building':
      return `${state.town.buildings[goal.buildingId] ?? 0} / ${goal.level}단계`;
    case 'faction':
      return `${state.factions[goal.faction]} / ${goal.value}`;
    case 'power':
      return `${townPower(state.town.buildings)} / ${goal.value}`;
  }
}
