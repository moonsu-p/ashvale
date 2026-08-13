/**
 * 슬롯 이미지 관리 — §7.6, §11.4. 열린 자리에 추가/교체/삭제. 잠긴 자리는 조건을 함께 보여준다.
 * 안내 문구는 §11.5 규율: "직접 만들었거나 사용 권리가 있는 이미지를 추가하세요."
 */

import { useRef } from 'react';
import { PALETTE } from '@/data/palette';
import { SLOTS } from '@/data/slots';
import { useGameStore } from '@/store/useGameStore';
import { CompanionThumb } from './CompanionThumb';
import type { CompanionRecord } from '@/types/game';

function SlotRow({ companion, slotIndex }: { companion: CompanionRecord; slotIndex: number }) {
  const setImage = useGameStore((s) => s.setCompanionImage);
  const delImage = useGameStore((s) => s.deleteCompanionImage);
  const fileRef = useRef<HTMLInputElement>(null);
  const def = SLOTS[slotIndex]!;
  const unlocked = companion.affinity >= def.affinity;
  const hasImage = !!companion.images[def.slot];

  if (!unlocked) {
    return (
      <div className="flex items-center gap-2 py-1 text-xs" style={{ color: PALETTE.inkSoft }}>
        <div className="flex h-10 w-10 items-center justify-center rounded" style={{ background: PALETTE.paperDim }}>🔒</div>
        <span>{def.label} · 호감 {def.affinity}에 열림</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 py-1 text-xs">
      <CompanionThumb companion={companion} slot={def.slot} size={40} />
      <span className="flex-1">
        {def.label}
        {!hasImage && <span style={{ color: PALETTE.inkSoft }}> · 새 이미지 자리가 열렸습니다</span>}
      </span>
      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void setImage(companion.id, def.slot, f);
          e.target.value = '';
        }}
      />
      <button
        onClick={() => fileRef.current?.click()}
        className="rounded px-2 py-0.5"
        style={{ background: PALETTE.wood, color: PALETTE.paper }}
      >
        {hasImage ? '교체' : '추가'}
      </button>
      {hasImage && (
        <button
          onClick={() => void delImage(companion.id, def.slot)}
          className="rounded px-2 py-0.5"
          style={{ background: PALETTE.stone, color: PALETTE.paper }}
        >
          삭제
        </button>
      )}
    </div>
  );
}

export function CompanionImages({ companion }: { companion: CompanionRecord }) {
  return (
    <div className="rounded p-2" style={{ background: PALETTE.paperDim }}>
      <p className="mb-1 text-[10px]" style={{ color: PALETTE.inkSoft }}>
        직접 만들었거나 사용 권리가 있는 이미지를 추가하세요. 추가 후 사진첩 원본을 지워도 게임 이미지는 남습니다.
      </p>
      {SLOTS.map((_, i) => (
        <SlotRow key={i} companion={companion} slotIndex={i} />
      ))}
    </div>
  );
}
