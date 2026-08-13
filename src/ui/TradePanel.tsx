/**
 * 교역 패널 — §16.4. 시장 Lv1 해금, 턴 무소비. 주간 한도 = 시장 레벨 × 30.
 */

import { PALETTE } from '@/data/palette';
import { useGameStore } from '@/store/useGameStore';
import { tradeUnlocked, tradeLimit, tradeRemaining, sellGoldFor, buyAmountFor } from '@/systems/trade';
import type { GameState, ResourceId } from '@/types/game';

const RES_LABEL: Record<ResourceId, string> = { wood: '목재', stone: '석재', food: '식량', gold: '금화' };
const TRADE_RES: ResourceId[] = ['wood', 'stone', 'food'];
const SELL_AMOUNT = 9; // 한 번에 파는 자원 수량
const BUY_GOLD = 6; // 한 번에 쓰는 금화

export function TradePanel({ state }: { state: GameState }) {
  const sell = useGameStore((s) => s.sell);
  const buy = useGameStore((s) => s.buy);
  if (!tradeUnlocked(state)) return null;

  return (
    <section>
      <h2 className="mb-1 font-medium">
        교역 <span className="text-xs" style={{ color: PALETTE.inkSoft }}>· 주간 한도 {tradeRemaining(state)}/{tradeLimit(state)}</span>
      </h2>
      <div className="flex flex-col gap-1 text-xs">
        {TRADE_RES.map((r) => {
          const gold = sellGoldFor(state, r, SELL_AMOUNT);
          const buyAmt = buyAmountFor(state, r, BUY_GOLD);
          return (
            <div key={r} className="flex items-center gap-2">
              <span className="w-10">{RES_LABEL[r]}</span>
              <button
                onClick={() => void sell(r, SELL_AMOUNT)}
                disabled={state.resources[r] < SELL_AMOUNT || gold > tradeRemaining(state)}
                className="rounded px-2 py-0.5"
                style={{ background: PALETTE.slate, color: PALETTE.paper }}
              >
                {SELL_AMOUNT} 팔기 → 금 {gold}
              </button>
              <button
                onClick={() => void buy(r, BUY_GOLD)}
                disabled={state.resources.gold < BUY_GOLD || BUY_GOLD > tradeRemaining(state)}
                className="rounded px-2 py-0.5"
                style={{ background: PALETTE.slate, color: PALETTE.paper }}
              >
                금 {BUY_GOLD} → {buyAmt}
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
