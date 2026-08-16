/**
 * 시장 — 교역과 선물 (§10).
 *
 * 시장을 세우기 전에는 열리지 않는다.
 * **주간 거래 한도**가 있다. 없으면 무한 환전으로 건설 곡선이 무너진다.
 */

import type { ResourceId } from '@/types/game';
import { useGameStore } from '@/store/useGameStore';
import { GIFTS } from '@/data/gifts';
import { TRADE_RATES } from '@/data/trade';
import { TOUCH_MIN } from '@/data/layout';
import { buyCost, giftReaction, giftReady, marketLevel, sellValue, weeklyLimit } from '@/systems/market';
import { displayName } from '@/systems/relationships';

const LABEL: Record<ResourceId, string> = { wood: '목재', stone: '석재', food: '식량', gold: '금화' };
const STEP = 6;

export function MarketPanel() {
  const state = useGameStore((s) => s.state);
  const traded = useGameStore((s) => s.tradedThisWeek);
  const sell = useGameStore((s) => s.sellResource);
  const buy = useGameStore((s) => s.buyResource);
  const give = useGameStore((s) => s.giveGift);

  if (state === null) return null;

  if (marketLevel(state) <= 0) {
    return (
      <p className="text-[12px] leading-relaxed text-inkSoft">
        시장이 없습니다. 성장기에 시장 부지가 열리고, 그것을 세우면 교역과 선물이 열립니다.
      </p>
    );
  }

  const limit = weeklyLimit(state);
  const companions = Object.values(state.companions).filter((c) => c.departedTurn === null);

  return (
    <div className="space-y-3 text-[12px]">
      <div className="flex justify-between border-b border-stoneDark/30 pb-1">
        <span className="text-inkSoft">이번 주 거래</span>
        <span className="tabular-nums">
          {traded} / {limit}
        </span>
      </div>

      <section>
        <h3 className="mb-1 font-medium">교역</h3>
        <ul className="space-y-1">
          {TRADE_RATES.map((rate) => (
            <li key={rate.resource} className="flex items-center gap-2">
              <span className="w-10 text-inkSoft">{LABEL[rate.resource]}</span>
              <span className="tabular-nums text-inkSoft">{state.resources[rate.resource]}</span>
              <button
                type="button"
                onClick={() => sell(rate.resource, STEP)}
                style={{ minHeight: TOUCH_MIN }}
                className="ml-auto rounded border border-stoneDark bg-paperDim px-2 text-[11px]"
              >
                {STEP} 팔기 → {sellValue(state, rate.resource, STEP)}
              </button>
              <button
                type="button"
                onClick={() => buy(rate.resource, STEP)}
                style={{ minHeight: TOUCH_MIN }}
                className="rounded border border-stoneDark bg-paperDim px-2 text-[11px]"
              >
                {STEP} 사기 ← {buyCost(state, rate.resource, STEP)}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 font-medium">선물</h3>
        {companions.length === 0 ? (
          <p className="text-inkSoft">건넬 사람이 없습니다.</p>
        ) : (
          companions.map((c) => (
            <div key={c.id} className="mb-2 border-t border-stoneDark/20 pt-1">
              <div className="flex justify-between">
                <span>{displayName(c)}</span>
                <span className="text-inkSoft">
                  {giftReady(c, state.world.turn) ? `호감 ${c.affinity}` : '얼마 전에 받음'}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                {GIFTS.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    disabled={!giftReady(c, state.world.turn) || state.resources.gold < g.gold}
                    onClick={() => give(c.id, g.id)}
                    className={`rounded border border-stoneDark px-2 py-1 text-[10px] disabled:opacity-40 ${
                      giftReaction(c, g.category) === 'match' ? 'bg-gold' : 'bg-paperDim'
                    }`}
                  >
                    {g.name} {g.gold}
                  </button>
                ))}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
