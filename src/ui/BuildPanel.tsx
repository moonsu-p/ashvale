/**
 * 건설·증축 패널 — §5, §10.4. 해금된 건물의 현재 레벨과 다음 비용을 보여주고 올린다.
 * 건설은 턴을 소비하지 않는다. 맵에서 탭한 건물은 강조된다.
 * 안내 문구는 무엇을 하면 되는지 명시한다(§15.1).
 */

import { PALETTE } from '@/data/palette';
import { BUILDING_COST, BUILDING_NAMES, BUILD_ORDER } from '@/data/buildings';
import { useGameStore } from '@/store/useGameStore';
import { currentLevel, isUnlocked, nextCost, canAfford } from '@/systems/construction';
import type { GameState, ResourceId } from '@/types/game';

const RES_LABEL: Record<ResourceId, string> = { wood: '목', stone: '석', food: '식', gold: '금' };

function CostTags({ cost, state }: { cost: Partial<Record<ResourceId, number>>; state: GameState }) {
  return (
    <span className="flex gap-1.5">
      {(Object.entries(cost) as [ResourceId, number][]).map(([r, v]) => {
        const short = state.resources[r] < v;
        return (
          <span key={r} className="tabular-nums" style={{ color: short ? PALETTE.blood : PALETTE.inkSoft }}>
            {RES_LABEL[r]}{v}
          </span>
        );
      })}
    </span>
  );
}

export function BuildPanel({ state }: { state: GameState }) {
  const build = useGameStore((s) => s.build);
  const selected = useGameStore((s) => s.selectedBuilding);
  const selectBuilding = useGameStore((s) => s.selectBuilding);

  const ids = BUILD_ORDER.filter((id) => id in BUILDING_COST && isUnlocked(state, id));

  return (
    <section>
      <h2 className="mb-1 font-medium">건설 · 증축</h2>
      <ul className="flex flex-col gap-1">
        {ids.map((id) => {
          const level = currentLevel(state, id);
          const cost = nextCost(state, id);
          const afford = canAfford(state, cost);
          const isSel = selected === id;
          return (
            <li
              key={id}
              onClick={() => selectBuilding(id)}
              className="flex items-center gap-2 rounded px-2 py-1.5 text-xs"
              style={{
                background: isSel ? PALETTE.paperDim : 'transparent',
                outline: isSel ? `1px solid ${PALETTE.gold}` : undefined,
              }}
            >
              <span className="w-16 shrink-0 font-medium">{BUILDING_NAMES[id] ?? id}</span>
              <span className="w-12 shrink-0 tabular-nums" style={{ color: PALETTE.inkSoft }}>
                {level === 0 ? '미건설' : `Lv.${level}`}
              </span>
              <CostTags cost={cost} state={state} />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (afford) void build(id);
                }}
                disabled={!afford}
                className="ml-auto shrink-0 rounded px-2 py-1 text-xs font-medium"
                style={{
                  background: afford ? PALETTE.wood : PALETTE.stone,
                  color: PALETTE.paper,
                  opacity: afford ? 1 : 0.6,
                }}
              >
                {level === 0 ? '건설' : '증축'}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
