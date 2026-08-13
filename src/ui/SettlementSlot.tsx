/**
 * 상단 맵 슬롯 (M0 골격). 실제 Phaser 거점 맵은 M1 에서 이 자리에 들어간다.
 * 지금은 계절 틴트 색과 안내, 플레이스홀더 렌더러 데모를 보여준다.
 */

import { PALETTE, SEASON_TINT } from '@/data/palette';
import { seasonName, seasonOf } from '@/systems/time';
import { AssetPlaceholder } from './AssetPlaceholder';
import type { GameState } from '@/types/game';

const TINT_KEYS = ['spring', 'summer', 'autumn', 'winter'] as const;

export function SettlementSlot({ state }: { state: GameState }) {
  const season = seasonOf(state.world.week);
  const tint = SEASON_TINT[TINT_KEYS[season]];

  return (
    <div className="relative h-full w-full">
      {/* 계절 틴트 오버레이 미리보기 (M2 에서 실제 씬에 곱셈 적용) */}
      <div className="absolute inset-0" style={{ background: tint.color, opacity: tint.alpha }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-4 text-center">
        <div className="flex items-end gap-2">
          <AssetPlaceholder id="building.hall.s1" size={56} />
          <AssetPlaceholder id="actor.hero" size={40} />
          <AssetPlaceholder id="actor.worker.0" size={40} />
        </div>
        <p className="text-sm" style={{ color: PALETTE.linen }}>
          {state.settlement.name} · {seasonName(state.world.week)}
        </p>
        <p className="text-xs" style={{ color: PALETTE.stoneLight }}>
          거점 맵은 M1에서 이 자리에 들어온다
        </p>
      </div>
    </div>
  );
}
