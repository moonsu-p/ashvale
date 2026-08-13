/**
 * 상단 맵 뷰 — Phaser 캔버스(배경) + React 오버레이(위). §10.3, §10.4.
 * 오버레이는 거점명·계절과 조작 힌트만 얹는다. 자원/패널 등은 하단 시트가 담당한다.
 */

import { PhaserHost } from '@/phaser/PhaserHost';
import { PALETTE } from '@/data/palette';
import { seasonName } from '@/systems/time';
import { gridSizeForEra } from '@/systems/grid';
import type { GameState } from '@/types/game';

export function SettlementView({ state }: { state: GameState }) {
  const gridSize = gridSizeForEra(state.world.eraIndex);

  return (
    <div className="relative h-full w-full">
      <PhaserHost gridSize={gridSize} seed={state.createdAt} />

      {/* 상단 좌: 거점명·계절 */}
      <div
        className="pointer-events-none absolute left-2 top-2 rounded px-2 py-1 text-xs"
        style={{ background: `${PALETTE.ink}CC`, color: PALETTE.linen }}
      >
        {state.settlement.name} · {seasonName(state.world.week)} · {gridSize}×{gridSize}
      </div>

      {/* 하단 우: 조작 힌트 */}
      <div
        className="pointer-events-none absolute bottom-2 right-2 rounded px-2 py-1 text-[10px] leading-tight"
        style={{ background: `${PALETTE.ink}99`, color: PALETTE.stoneLight }}
      >
        핀치 줌 · 드래그 이동 · 더블탭 전체보기
      </div>
    </div>
  );
}
