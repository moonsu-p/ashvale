/**
 * 게임플레이 경고 배너 — §15.2. 식량 마이너스 주부터 상시 표시, 붕괴 임박 시 문어체 경고.
 * 기습이 아니라 예고. 저장 오류 배너(StorageBanner)와는 별개다.
 */

import { PALETTE } from '@/data/palette';
import { isCollapseImminent } from '@/systems/collapse';
import { FOOD_SHORTAGE_TEXT, COLLAPSE_WARNING_TEXT } from '@/data/chronicle-system';
import type { GameState } from '@/types/game';

export function GameWarning({ state }: { state: GameState }) {
  const imminent = isCollapseImminent(state);
  const foodShort = state.resources.food < 0;
  if (!imminent && !foodShort) return null;

  const text = imminent ? COLLAPSE_WARNING_TEXT : FOOD_SHORTAGE_TEXT;
  const bg = imminent ? PALETTE.blood : PALETTE.flame;
  return (
    <div role="alert" className="px-3 py-1.5 text-center text-sm font-medium" style={{ background: bg, color: PALETTE.paper }}>
      {text}
    </div>
  );
}
