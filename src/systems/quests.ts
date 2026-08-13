/**
 * 의뢰인 퀘스트 — 순수 함수 (§16.1). 동시 1개, 기한·실패 없음. 완료는 의뢰인 교류 시.
 */

import type { GameState } from '@/types/game';
import { QUESTS, QUEST_BY_PATRON, QUEST_OFFER_TRUST, QUEST_TRUST_REWARD, type Quest, type QuestReq } from '@/data/quests';
import { REGION_ORDER } from '@/data/regions';
import { REGION_TEXT } from '@/data/content/region-text';

export function questById(id: string): Quest | undefined {
  return QUESTS.find((q) => q.id === id);
}

function exploreKey(regionId: string): string {
  return `explore:${regionId}`;
}

export function reqProgress(s: GameState, req: QuestReq): { cur: number; target: number; label: string } {
  switch (req.kind) {
    case 'exploreSuccess': {
      const cur = s.activeQuest?.progress[exploreKey(req.regionId)] ?? 0;
      return { cur: Math.min(cur, req.count), target: req.count, label: `${REGION_TEXT[req.regionId]?.label ?? req.regionId} 성공` };
    }
    case 'buildingLevel':
      return { cur: Math.min(s.settlement.buildings[req.buildingId] ?? 0, req.level), target: req.level, label: '건물 레벨' };
    case 'payResource':
      return { cur: Math.min(s.resources[req.resource], req.amount), target: req.amount, label: `${req.resource} 지불` };
    case 'threatsWon':
      return { cur: Math.min(s.counters.threatsWon, req.count), target: req.count, label: '위협 승리' };
    case 'factionRep':
      return { cur: Math.min(s.factions[req.factionId], req.value), target: req.value, label: '세력 평판' };
    case 'factionCount': {
      const n = Object.values(s.factions).filter((v) => v >= req.value).length;
      return { cur: Math.min(n, req.count), target: req.count, label: `평판 ${req.value}+ 세력` };
    }
    case 'insightTriumph':
      return { cur: s.counters.firsts['insightTriumph'] ? 1 : 0, target: 1, label: '통찰 대성공' };
  }
}

export function isReqMet(s: GameState, req: QuestReq): boolean {
  const { cur, target } = reqProgress(s, req);
  return cur >= target;
}

export function isQuestComplete(s: GameState, quest: Quest): boolean {
  return quest.requirements.every((r) => isReqMet(s, r));
}

/** 이 의뢰인이 지금 제시할 퀘스트 (신뢰 20+, 미수락, 아직 완료 안 함) */
export function offerableQuest(s: GameState, patronId: string): Quest | null {
  if (s.activeQuest) return null;
  const p = s.patrons[patronId];
  if (!p?.met || p.trust < QUEST_OFFER_TRUST) return null;
  const quest = QUEST_BY_PATRON[patronId];
  if (!quest || p.questsCleared.includes(quest.id)) return null;
  return quest;
}

export function acceptQuest(s: GameState, questId: string): void {
  const quest = questById(questId);
  if (!quest || s.activeQuest) return;
  s.activeQuest = { questId, patronId: quest.patronId, progress: {}, acceptedTurn: s.world.turn };
}

/** 탐험 성공 시 진행 갱신 (turn 엔진에서 호출) */
export function recordExploreSuccess(s: GameState, regionId: string): void {
  const q = s.activeQuest;
  if (!q) return;
  const quest = questById(q.questId);
  if (!quest) return;
  if (quest.requirements.some((r) => r.kind === 'exploreSuccess' && r.regionId === regionId)) {
    const key = exploreKey(regionId);
    q.progress[key] = (q.progress[key] ?? 0) + 1;
  }
}

export interface QuestCompletion {
  quest: Quest;
}

/** 완료 처리 — 지불 자원 차감, 신뢰 +10, 기록. 보상은 store 가 처리한다(인물 생성 등). */
export function completeQuest(s: GameState): QuestCompletion | null {
  const q = s.activeQuest;
  if (!q) return null;
  const quest = questById(q.questId);
  if (!quest || q.patronId === undefined) return null;
  if (!isQuestComplete(s, quest)) return null;

  // 지불 요구 차감
  for (const r of quest.requirements) {
    if (r.kind === 'payResource') s.resources[r.resource] = Math.max(0, s.resources[r.resource] - r.amount);
  }
  const p = s.patrons[quest.patronId];
  if (p) {
    p.questsCleared.push(quest.id);
    p.trust = Math.min(60, p.trust + QUEST_TRUST_REWARD);
  }
  // 보상: wallMaterial / unlockRegion 은 여기서, recruit 는 store 흐름
  if (quest.reward.kind === 'wallMaterial') {
    s.counters.firsts['wallMaterial'] = true;
  } else if (quest.reward.kind === 'unlockRegion') {
    const next = REGION_ORDER.find((id) => !s.world.unlockedRegions.includes(id));
    if (next) s.world.unlockedRegions.push(next);
  }
  s.activeQuest = null;
  return { quest };
}
