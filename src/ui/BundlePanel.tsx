/**
 * 저장·이미지 — 꾸러미 내보내기/불러오기(§12, §11.5) + 갤러리 진입.
 * 세이브 JSON 은 이미지를 포함하지 않는다. 꾸러미(zip)는 이미지까지 담는다.
 */

import { useRef, useState } from 'react';
import { PALETTE } from '@/data/palette';
import { SLOTS } from '@/data/slots';
import { useGameStore } from '@/store/useGameStore';
import { CompanionThumb } from './CompanionThumb';
import type { GameState } from '@/types/game';

export function BundlePanel({ state }: { state: GameState }) {
  const exportBundle = useGameStore((s) => s.exportBundle);
  const importBundle = useGameStore((s) => s.importBundle);
  const fileRef = useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = useState(false);

  const companions = Object.values(state.companions);

  return (
    <section>
      <h2 className="mb-1 font-medium">저장 · 이미지</h2>
      <div className="flex flex-wrap gap-2 text-xs">
        <button onClick={() => void exportBundle()} className="rounded px-3 py-1" style={{ background: PALETTE.slate, color: PALETTE.paper }}>
          꾸러미 내보내기
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".zip,application/zip"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importBundle(f);
            e.target.value = '';
          }}
        />
        <button onClick={() => fileRef.current?.click()} className="rounded px-3 py-1" style={{ background: PALETTE.slate, color: PALETTE.paper }}>
          꾸러미 불러오기
        </button>
        <button onClick={() => setGallery((g) => !g)} className="rounded px-3 py-1" style={{ background: PALETTE.slate, color: PALETTE.paper }}>
          갤러리
        </button>
      </div>
      <p className="mt-1 text-[10px]" style={{ color: PALETTE.inkSoft }}>
        꾸러미는 다른 브라우저·기기로 옮길 수 있습니다. JSON만 불러오면 이미지는 플레이스홀더로 뜹니다.
      </p>

      {gallery && (
        <div className="mt-2">
          {companions.length === 0 ? (
            <p className="text-xs" style={{ color: PALETTE.inkSoft }}>보관된 이미지가 없다.</p>
          ) : (
            companions.map((c) => (
              <div key={c.id} className="mb-1">
                <div className="text-xs font-medium">{c.name}</div>
                <div className="flex flex-wrap gap-1">
                  {SLOTS.filter((s) => c.affinity >= s.affinity).map((s) => (
                    <CompanionThumb key={s.slot} companion={c} slot={s.slot} size={44} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
