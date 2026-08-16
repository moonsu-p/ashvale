/**
 * 꾸러미 불러오기 단추.
 *
 * 시작 화면에도 있어야 한다 — 새 기기나 새 주소에서는 세이브가 없는 채로
 * 여기 도착한다. 그때 되돌릴 길이 없으면 꾸러미를 만들어 둔 뜻이 없다 (§14).
 */

import { useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { TOUCH_MIN } from '@/data/layout';

export function ImportButton({ className = '' }: { className?: string }) {
  const doImport = useGameStore((s) => s.importBundle);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => input.current?.click()}
        style={{ minHeight: TOUCH_MIN }}
        className={`rounded border border-stoneDark bg-paperDim px-4 text-[12px] text-ink disabled:opacity-50 ${className}`}
      >
        {busy ? '불러오는 중' : '꾸러미 불러오기'}
      </button>

      <input
        ref={input}
        type="file"
        accept=".zip,application/zip"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file === undefined) return;
          setBusy(true);
          void doImport(file).finally(() => setBusy(false));
        }}
      />
    </>
  );
}
