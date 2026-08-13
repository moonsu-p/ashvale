/**
 * 과제 카드 — §16.2. 화면 상단에 현재 목표 1개를 문어체 한 줄로. 강제하지 않는다.
 * 다섯 과제를 마치면 사라지고 다시 나타나지 않는다.
 */

import { PALETTE } from '@/data/palette';
import { currentTask } from '@/systems/onboarding';
import type { GameState } from '@/types/game';

export function QuestCard({ state }: { state: GameState }) {
  const task = currentTask(state);
  if (!task) return null;
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 text-sm"
      style={{ background: PALETTE.paperDim, color: PALETTE.ink, borderBottom: `1px solid ${PALETTE.stoneDark}` }}
    >
      <span className="text-xs" style={{ color: PALETTE.inkSoft }}>
        과제
      </span>
      <span className="font-serif">{task.label}</span>
    </div>
  );
}
