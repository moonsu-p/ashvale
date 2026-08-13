/**
 * 재개 줄 — §15.3. 앱을 열면 직전 연대기 1~2줄을 상단에 보여준다.
 * 어디까지 했는지 다시 파악하는 비용을 없앤다. 한 턴이라도 진행하면 최신 항목으로 갱신된다.
 */

import { PALETTE } from '@/data/palette';
import { SEASON_NAMES } from '@/systems/time';
import type { GameState } from '@/types/game';

export function ResumeLine({ state }: { state: GameState }) {
  const recent = state.chronicle.slice(-1);
  if (recent.length === 0) return null;
  const e = recent[0]!;
  return (
    <div className="truncate px-3 py-1 text-xs" style={{ background: PALETTE.inkSoft, color: PALETTE.linen }}>
      <span style={{ color: PALETTE.stoneLight }}>
        {e.year}년 {e.week}주 {SEASON_NAMES[e.season]}
      </span>{' '}
      {e.text}
    </div>
  );
}
