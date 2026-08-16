/**
 * 좌하단 D패드 (§5).
 *
 * 화면 탭으로 이동하는 방식은 쓰지 않는다 — 인물에게 말을 걸 때 좌표가 애매해진다.
 * 버튼은 46dp 정사각이다.
 *
 * 누름·뗌을 그대로 입력 버퍼에 넘긴다. 게임 규칙은 여기 없다.
 */

import type { Dir } from '@/types/game';
import { DPAD_BUTTON } from '@/data/layout';
import { pressDir, releaseAll, releaseDir } from '@/phaser/inputBus';

/** 3×3 격자에서 각 방향이 앉는 자리 */
const CELL: Record<Dir, string> = {
  up: 'col-start-2 row-start-1',
  left: 'col-start-1 row-start-2',
  right: 'col-start-3 row-start-2',
  down: 'col-start-2 row-start-3',
};

const GLYPH: Record<Dir, string> = { up: '▲', left: '◀', right: '▶', down: '▼' };

function PadButton({ dir }: { dir: Dir }) {
  return (
    <button
      type="button"
      aria-label={dir}
      className={`${CELL[dir]} grid touch-none select-none place-items-center rounded border border-stoneDark bg-stone text-[13px] text-ink active:bg-stoneLight`}
      style={{ width: DPAD_BUTTON, height: DPAD_BUTTON }}
      onPointerDown={(e) => {
        // 손가락이 버튼 밖으로 미끄러져도 뗌을 받으려면 포인터를 붙잡아야 한다
        e.currentTarget.setPointerCapture(e.pointerId);
        pressDir(dir);
      }}
      onPointerUp={() => releaseDir(dir)}
      onPointerCancel={() => releaseAll()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {GLYPH[dir]}
    </button>
  );
}

export function DPad() {
  return (
    <div className="grid grid-cols-3 grid-rows-3 gap-1">
      <PadButton dir="up" />
      <PadButton dir="left" />
      <PadButton dir="right" />
      <PadButton dir="down" />
    </div>
  );
}
