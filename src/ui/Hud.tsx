/**
 * 상단 HUD — 40dp 고정 (§2).
 * 여기서 규칙을 계산하지 않는다. 상태를 읽어 표시만 한다.
 */

import type { GameState, ResourceId } from '@/types/game';
import { SEASON_LABEL, seasonOf } from '@/data/seasons';
import { eraName } from '@/data/eras';

const RESOURCE_LABEL: Record<ResourceId, string> = {
  wood: '목재',
  stone: '석재',
  food: '식량',
  gold: '금화',
};

const ORDER: ResourceId[] = ['wood', 'stone', 'food', 'gold'];

export function Hud({ state }: { state: GameState }) {
  return (
    <header className="flex h-hud shrink-0 items-center gap-2 border-b border-stoneDark bg-slate px-2 text-[11px] text-paper">
      <span className="font-medium">{state.town.name}</span>

      <span className="text-paperDim">
        {state.world.year}년 {state.world.week}주·{SEASON_LABEL[seasonOf(state.world.week)]}
      </span>

      <span className="text-paperDim">{eraName(state.world.eraIndex, state.world.eraTier)}</span>

      <div className="ml-auto flex gap-2 tabular-nums">
        {ORDER.map((id) => (
          <span key={id} className="text-paperDim">
            {RESOURCE_LABEL[id]}{' '}
            <span className="text-paper">{state.resources[id]}</span>
          </span>
        ))}
      </div>
    </header>
  );
}
