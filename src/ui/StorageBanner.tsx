/**
 * 저장 실패 배너 — 조용히 넘기지 않고 상단에 지속 노출한다 (§12).
 * 오류 메시지는 무엇을 하면 되는지 이미 담고 있다(문체 규약).
 */

import { PALETTE } from '@/data/palette';
import { useGameStore } from '@/store/useGameStore';

export function StorageBanner() {
  const msg = useGameStore((s) => s.storageBanner);
  const dismiss = useGameStore((s) => s.dismissBanner);
  if (!msg) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 px-3 py-2 text-sm"
      style={{ background: PALETTE.blood, color: PALETTE.paper }}
    >
      <span className="flex-1 leading-snug">{msg}</span>
      <button
        onClick={dismiss}
        className="shrink-0 rounded px-2 py-0.5 text-xs"
        style={{ background: PALETTE.paper, color: PALETTE.ink }}
      >
        닫기
      </button>
    </div>
  );
}
