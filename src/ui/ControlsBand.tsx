/**
 * 하단 조작부 (§2) — 최소 180dp, 화면이 길면 조금 자란다.
 * 왼손 D패드, 오른손 A. 둘 다 엄지가 닿는 바깥쪽으로 붙인다.
 *
 * 아래쪽 안전 영역을 비운다. 플립4는 여기에 제스처 바가 지나간다 —
 * 비우지 않으면 D패드 아래줄이 시스템 제스처와 겹친다.
 */

import { DPad } from './DPad';
import { ActionButton } from './ActionButton';

export function ControlsBand({ actionActive }: { actionActive: boolean }) {
  return (
    <footer className="h-controls shrink-0 border-t border-stoneDark bg-slate pb-safe-b">
      <div className="flex h-full items-center justify-between px-5">
        <DPad />
        <ActionButton active={actionActive} />
      </div>
    </footer>
  );
}
