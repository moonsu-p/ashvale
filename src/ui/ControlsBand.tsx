/**
 * 하단 조작부 — 180dp 고정 (§2).
 * 왼손 D패드, 오른손 A. 둘 다 엄지가 닿는 바깥쪽으로 붙인다.
 */

import { DPad } from './DPad';
import { ActionButton } from './ActionButton';

export function ControlsBand({ actionActive }: { actionActive: boolean }) {
  return (
    <footer className="flex h-controls shrink-0 items-center justify-between border-t border-stoneDark bg-slate px-5">
      <DPad />
      <ActionButton active={actionActive} />
    </footer>
  );
}
