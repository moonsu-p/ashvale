/**
 * 결과 토스트 (§8.3) — `호감 +8` 처럼 짧게, 화면 위쪽에 잠깐.
 * 실제로 적용된 변화만 적는다.
 */

import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';

const SHOW_MS = 1800;

export function Toast() {
  const toast = useGameStore((s) => s.toast);
  const clear = useGameStore((s) => s.clearToast);

  useEffect(() => {
    if (toast === null) return;
    const id = window.setTimeout(clear, SHOW_MS);
    return () => window.clearTimeout(id);
  }, [toast, clear]);

  if (toast === null) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-2 z-50 flex justify-center">
      <div className="rounded border border-gold bg-ink/90 px-3 py-1 text-[12px] text-gold">
        {toast}
      </div>
    </div>
  );
}
