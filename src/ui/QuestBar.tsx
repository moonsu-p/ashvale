/**
 * 활성 퀘스트 진행 표시 — §16.1. 행동 화면 상단에 한 줄로 상시. 완료 조건 충족 시 강조.
 */

import { PALETTE } from '@/data/palette';
import { questById, reqProgress, isQuestComplete } from '@/systems/quests';
import { PRESET_PATRONS } from '@/data/patrons';
import type { GameState } from '@/types/game';

const PATRON_NAME: Record<string, string> = Object.fromEntries(PRESET_PATRONS.map((p) => [p.id, p.name]));

export function QuestBar({ state }: { state: GameState }) {
  const q = state.activeQuest;
  if (!q) return null;
  const quest = questById(q.questId);
  if (!quest) return null;
  const done = isQuestComplete(state, quest);
  const parts = quest.requirements.map((r) => {
    const p = reqProgress(state, r);
    return `${p.label} ${p.cur}/${p.target}`;
  });
  return (
    <div className="flex items-center gap-2 px-3 py-1 text-xs" style={{ background: done ? PALETTE.grass : PALETTE.inkSoft, color: PALETTE.paper }}>
      <span className="font-medium">{quest.title}</span>
      <span>{parts.join(' · ')}</span>
      {done && <span className="ml-auto">{PATRON_NAME[quest.patronId]}에게 보고</span>}
    </div>
  );
}
