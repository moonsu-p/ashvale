/**
 * 하단 조작부 — 180dp 고정 (§2).
 *
 * M0에서는 자리만 잡는다. D패드와 A버튼은 이동이 붙을 때 들어온다.
 * 지금 비워 두는 건 게으름이 아니라, 손가락이 닿는 높이를 폰에서 먼저
 * 재 보기 위해서다. 여기 높이가 틀리면 뒤에 쌓는 게 전부 어긋난다.
 */

import { TOUCH_MIN } from '@/data/layout';

export function ControlsBand() {
  return (
    <footer className="flex h-controls shrink-0 items-center justify-between border-t border-stoneDark bg-slate px-4">
      {/* 왼손 — D패드 자리 */}
      <div
        className="grid place-items-center rounded border border-dashed border-stoneLight/50 text-[10px] text-paperDim"
        style={{ width: TOUCH_MIN * 3, height: TOUCH_MIN * 3 }}
      >
        방향
      </div>

      {/* 오른손 — A버튼 자리 */}
      <div
        className="grid place-items-center rounded-full border border-dashed border-stoneLight/50 text-[10px] text-paperDim"
        style={{ width: TOUCH_MIN * 1.5, height: TOUCH_MIN * 1.5 }}
      >
        A
      </div>
    </footer>
  );
}
