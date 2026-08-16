/**
 * 기근 경고 (§13).
 *
 * **냉정함은 예고 없음이 아니라 되돌리기 어려움이다.**
 * 식량이 마이너스로 돌아선 주부터 배너가 뜨고, 2주 전에 문어체 경고가 오고,
 * 직전 1주에는 유물을 넘겨 시간을 사는 거래가 한 번 열린다.
 */

import { useGameStore } from '@/store/useGameStore';
import { COLLAPSE_TEXT, RELIC_SALE_WEEKS } from '@/data/collapse';
import { TOUCH_MIN } from '@/data/layout';
import { weeksToCollapse } from '@/systems/collapse';

export function FamineBanner() {
  const state = useGameStore((s) => s.state);
  const sellRelic = useGameStore((s) => s.sellRelicForTime);
  if (state === null) return null;

  const left = weeksToCollapse(state);
  if (left === null) return null;

  const text =
    left <= 1 ? COLLAPSE_TEXT.lastCall : left <= 2 ? COLLAPSE_TEXT.warning : COLLAPSE_TEXT.famineBegan;

  // 직전 한 주에만, 유물이 있을 때만 거래가 열린다. 한 번뿐이다
  const canSell = left <= 1 && state.hero.relics.length > 0;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-40 p-2">
      <div className="pointer-events-auto rounded border border-blood bg-ink/92 px-3 py-2">
        <p className="font-serif text-[12px] leading-relaxed text-paper">{text}</p>
        <p className="mt-0.5 text-[11px] text-paperDim">
          {left <= 0 ? '이번 주를 넘기지 못한다.' : `${left}주 남았다.`}
        </p>

        {canSell && (
          <button
            type="button"
            onClick={() => sellRelic()}
            style={{ minHeight: TOUCH_MIN }}
            className="mt-2 w-full rounded border border-gold bg-gold text-[12px] font-medium text-ink"
          >
            유물을 넘기고 {RELIC_SALE_WEEKS}주를 산다
          </button>
        )}
      </div>
    </div>
  );
}
