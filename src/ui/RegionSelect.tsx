/**
 * 지역 선택 (§11).
 * 고르면 **1주가 소모된다.** 그 사실을 고르기 전에 보여 준다.
 */

import { useGameStore } from '@/store/useGameStore';
import { REGIONS, regionName } from '@/data/regions';
import { TOUCH_MIN } from '@/data/layout';
import { eraName } from '@/data/eras';
import { ESCORT_MIN_AFFINITY } from '@/data/relationships';
import { displayName } from '@/systems/relationships';

const STAT_LABEL = { might: '힘', agility: '민첩', insight: '통찰', will: '의지' } as const;

/**
 * 동행 (§11) — 주당 1명, 동료(40) 이상만.
 * 데려갈 사람이 없으면 아무것도 보이지 않는다. 빈 목록을 띄우지 않는다.
 */
function EscortPicker() {
  const state = useGameStore((s) => s.state);
  const setEscort = useGameStore((s) => s.setEscort);
  if (state === null) return null;

  const eligible = Object.values(state.companions).filter(
    (c) =>
      c.departedTurn === null &&
      c.affinity >= ESCORT_MIN_AFFINITY &&
      c.injuredUntilTurn <= state.world.turn,
  );
  if (eligible.length === 0) return null;

  return (
    <div className="mb-2 border-y border-stoneDark/30 py-2">
      <div className="mb-1 text-[11px] text-inkSoft">동행</div>
      <div className="flex flex-wrap gap-1">
        <button
          type="button"
          onClick={() => setEscort(null)}
          className={`rounded border border-stoneDark px-2 py-1 text-[11px] ${
            state.escort === null ? 'bg-gold' : 'bg-paperDim'
          }`}
        >
          혼자
        </button>
        {eligible.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setEscort(c.id)}
            className={`rounded border border-stoneDark px-2 py-1 text-[11px] ${
              state.escort === c.id ? 'bg-gold' : 'bg-paperDim'
            }`}
          >
            {displayName(c)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RegionSelect() {
  const open = useGameStore((s) => s.regionSelect);
  const state = useGameStore((s) => s.state);
  const close = useGameStore((s) => s.closeRegionSelect);
  const enter = useGameStore((s) => s.enterRegion);

  if (!open || state === null) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col bg-ink/80 p-3">
      <div className="flex min-h-0 flex-1 flex-col rounded border border-stoneDark bg-paper p-3 text-ink">
        <h2 className="text-[15px] font-medium">지역 탐사</h2>
        <p className="mb-2 text-[11px] text-inkSoft">나가면 1주가 지난다.</p>

        <EscortPicker />


        <ul className="min-h-0 flex-1 space-y-1 overflow-y-auto">
          {REGIONS.map((region) => {
            const locked = state.world.eraIndex < region.unlockEra;
            return (
              <li key={region.id}>
                <button
                  type="button"
                  disabled={locked}
                  onClick={() => enter(region.id)}
                  style={{ minHeight: TOUCH_MIN }}
                  className="w-full rounded border border-stoneDark bg-paperDim px-3 py-2 text-left disabled:opacity-50"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-[13px] font-medium">{regionName(region.id)}</span>
                    <span className="text-[11px] text-inkSoft">
                      {locked
                        ? `${eraName(region.unlockEra, 0)}에 열림`
                        : `난이도 ${region.difficulty} · ${STAT_LABEL[region.stat]}`}
                    </span>
                  </div>
                  {!locked && (
                    <div className="text-[11px] text-inkSoft">위험도 {region.risk}</div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={close}
          style={{ minHeight: TOUCH_MIN }}
          className="mt-2 rounded border border-stoneDark bg-paperDim text-[13px]"
        >
          돌아가기
        </button>
      </div>
    </div>
  );
}
