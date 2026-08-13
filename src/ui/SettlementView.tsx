/**
 * 상단 맵 뷰 — Phaser 캔버스(배경) + React 오버레이(위). §10.3, §10.4.
 * 배치는 deriveLayout(state)로 파생해 씬에 넘긴다. 건물 탭은 스토어의 선택 상태로 흐른다.
 */

import { useMemo } from 'react';
import { PhaserHost } from '@/phaser/PhaserHost';
import { PALETTE } from '@/data/palette';
import { seasonName, seasonOf } from '@/systems/time';
import { deriveLayout } from '@/systems/layout';
import { useGameStore } from '@/store/useGameStore';
import type { GameState } from '@/types/game';

export function SettlementView({ state }: { state: GameState }) {
  const selectBuilding = useGameStore((s) => s.selectBuilding);
  const layout = useMemo(() => deriveLayout(state), [state]);

  return (
    <div className="relative h-full w-full">
      <PhaserHost
        seed={state.createdAt}
        season={seasonOf(state.world.week)}
        layout={layout}
        onBuildingTap={selectBuilding}
      />

      <div
        className="pointer-events-none absolute left-2 top-2 rounded px-2 py-1 text-xs"
        style={{ background: `${PALETTE.ink}CC`, color: PALETTE.linen }}
      >
        {state.settlement.name} · {seasonName(state.world.week)} · {layout.gridSize}×{layout.gridSize}
      </div>

      <div
        className="pointer-events-none absolute bottom-2 right-2 rounded px-2 py-1 text-[10px] leading-tight"
        style={{ background: `${PALETTE.ink}99`, color: PALETTE.stoneLight }}
      >
        핀치 줌 · 드래그 이동 · 더블탭 전체보기 · 건물 탭
      </div>
    </div>
  );
}
