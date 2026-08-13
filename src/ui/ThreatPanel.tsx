/**
 * 위협 패널 — §8. 준비 기간에 방어력과 위협 강도를 숫자로 나란히 보여준다.
 * 못 이길 싸움임을 알 수 있어야 한다. 방비로 방어력을 올린다.
 */

import { PALETTE } from '@/data/palette';
import { THREATS } from '@/data/content/world-content';
import { THREAT_MARGIN } from '@/data/threat';
import { useGameStore } from '@/store/useGameStore';
import { defense } from '@/systems/threat';
import type { GameState } from '@/types/game';

export function ThreatPanel({ state }: { state: GameState }) {
  const prep = useGameStore((s) => s.prep);
  const th = state.threat;
  if (!th) return null;
  const def = THREATS.find((t) => t.id === th.id);
  const myDef = defense(state);
  const target = th.power + THREAT_MARGIN;
  const winnable = myDef + 20 >= target; // 최선의 주사위로도 이길 수 있는가

  return (
    <section className="rounded p-2" style={{ background: `${PALETTE.blood}22`, border: `1px solid ${PALETTE.blood}` }}>
      <h2 className="mb-1 font-medium" style={{ color: PALETTE.blood }}>
        위협 · {def?.name ?? th.id}
      </h2>
      <div className="flex items-center justify-around text-center text-sm">
        <div>
          <div className="text-xs" style={{ color: PALETTE.inkSoft }}>방어력</div>
          <div className="text-lg font-bold tabular-nums">{myDef}</div>
        </div>
        <div style={{ color: PALETTE.inkSoft }}>vs</div>
        <div>
          <div className="text-xs" style={{ color: PALETTE.inkSoft }}>필요치</div>
          <div className="text-lg font-bold tabular-nums" style={{ color: PALETTE.blood }}>{target}</div>
        </div>
      </div>
      <p className="mt-1 text-center text-xs" style={{ color: winnable ? PALETTE.inkSoft : PALETTE.blood }}>
        {th.weeksLeft}주 뒤 · {winnable ? '방비하면 해볼 만하다' : '이대로는 이기기 어렵다'}
      </p>
      <button
        onClick={() => void prep()}
        className="mt-1 w-full rounded py-1.5 text-sm font-medium"
        style={{ background: PALETTE.slate, color: PALETTE.paper }}
      >
        방비 — 방어 +8 (한 주)
      </button>
    </section>
  );
}
