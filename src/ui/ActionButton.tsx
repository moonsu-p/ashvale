/**
 * 우하단 A 버튼 (§5) — 말 걸기 / 대사 넘기기 / 확인.
 */

import { TOUCH_MIN } from '@/data/layout';
import { pressAction } from '@/phaser/inputBus';

const SIZE = TOUCH_MIN * 1.5;

export function ActionButton({ active }: { active: boolean }) {
  return (
    <button
      type="button"
      aria-label="A"
      className={`grid touch-none select-none place-items-center rounded-full border-2 text-[15px] font-medium ${
        active
          ? 'border-gold bg-gold text-ink'
          : 'border-stoneDark bg-stone text-inkSoft'
      }`}
      style={{ width: SIZE, height: SIZE }}
      onPointerDown={() => pressAction()}
      onContextMenu={(e) => e.preventDefault()}
    >
      A
    </button>
  );
}
