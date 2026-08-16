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

export function Hud({ state, onOpenMenu }: { state: GameState; onOpenMenu: () => void }) {
  return (
    // 상단 안전 영역만큼 내려 앉힌다. 플립4는 펀치홀이 이 자리에 있다
    <header className="shrink-0 border-b border-stoneDark bg-slate px-2 pt-safe-t text-[11px] text-paper">
      {/* HUD 를 누르면 메뉴가 열린다 (§5) */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex h-hud w-full items-center gap-2 text-left"
      >
        <span className="font-medium">{state.town.name}</span>

        <span className="text-paperDim">
          {state.world.year}년 {state.world.week}주·{SEASON_LABEL[seasonOf(state.world.week)]}
        </span>

        <span className="text-paperDim">{eraName(state.world.eraIndex, state.world.eraTier)}</span>

        <div className="ml-auto flex gap-2 tabular-nums">
          {ORDER.map((id) => (
            <span key={id} className="text-paperDim">
              {RESOURCE_LABEL[id]} <span className="text-paper">{state.resources[id]}</span>
            </span>
          ))}
        </div>
      </button>
    </header>
  );
}
