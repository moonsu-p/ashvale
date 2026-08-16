/**
 * 인물 갤러리 (§8.2, §9).
 *
 * 슬롯 6개. **비어 있어도 게임은 정상 작동한다** — 실루엣이 대신 선다.
 * 고른 사진은 즉시 WebP 로 다시 구워 넣고, 원본을 가리키는 값은 남기지 않는다.
 *
 * `createObjectURL` 결과를 상태에 담지 않는다. 그릴 때 만들고 떠날 때 되돌린다 (§9.1).
 */

import { useEffect, useRef, useState } from 'react';
import type { CompanionRecord } from '@/types/game';
import { useGameStore } from '@/store/useGameStore';
import { getArchetype } from '@/data/archetypes';
import { ACCEPT_ATTR, AFTER_UPLOAD_NOTE, SLOT_COUNT, SLOT_LABEL } from '@/data/images';
import { getStorage } from '@/storage';
import { stageFor } from '@/systems/relationships';

/** 저장된 Blob 을 화면에 걸 주소로. 떠날 때 반드시 되돌린다 */
function useBlobUrl(key: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (key === null) {
      setUrl(null);
      return;
    }
    let alive = true;
    let made: string | null = null;

    void getStorage()
      .getImage(key)
      .then((blob) => {
        if (!alive || blob === null) return;
        made = URL.createObjectURL(blob);
        setUrl(made);
      })
      .catch(() => setUrl(null));

    return () => {
      alive = false;
      // 이걸 빼먹으면 인물 화면을 오래 열어 둘수록 메모리가 샌다
      if (made !== null) URL.revokeObjectURL(made);
    };
  }, [key]);

  return url;
}

function Slot({ companion, slot }: { companion: CompanionRecord; slot: number }) {
  const put = useGameStore((s) => s.putImage);
  const clear = useGameStore((s) => s.clearImage);
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const key = companion.images[slot] ?? null;
  const url = useBlobUrl(key);
  const unlocked = companion.unlockedSlots.includes(slot);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        disabled={!unlocked || busy}
        onClick={() => input.current?.click()}
        className="relative aspect-[3/4] overflow-hidden rounded border border-stoneDark bg-paperDim disabled:opacity-40"
      >
        {url !== null ? (
          <img src={url} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="grid h-full w-full place-items-center text-[10px] text-inkSoft">
            {unlocked ? (busy ? '넣는 중' : '+') : '잠김'}
          </span>
        )}
      </button>

      <div className="flex items-center justify-between text-[9px] text-inkSoft">
        <span>{SLOT_LABEL[slot]}</span>
        {key !== null && (
          <button type="button" onClick={() => void clear(companion.id, slot)} className="text-blood">
            비우기
          </button>
        )}
      </div>

      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // 값을 비워야 같은 사진을 다시 골라도 이벤트가 뜬다
          e.target.value = '';
          if (file === undefined) return;
          setBusy(true);
          void put(companion.id, slot, file).finally(() => setBusy(false));
        }}
      />
    </div>
  );
}

function CompanionCard({ companion }: { companion: CompanionRecord }) {
  const archetype = getArchetype(companion.archetypeId);
  const rename = useGameStore((s) => s.renameCompanion);
  const [draft, setDraft] = useState(companion.name);

  const stage = stageFor(companion.affinity);
  const track =
    companion.track === 'romance' ? '연심' : companion.track === 'bond' ? '우애' : null;

  return (
    <section className="border-t border-stoneDark/30 pt-2">
      <div className="flex items-baseline justify-between gap-2">
        {/* 이름은 플레이어가 붙인다 (§7.1) */}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            if (draft.trim() !== companion.name) rename(companion.id, draft);
          }}
          placeholder={archetype?.label ?? '이름'}
          maxLength={12}
          className="min-w-0 flex-1 border-b border-stoneDark/40 bg-transparent text-[13px] font-medium text-ink outline-none placeholder:text-inkSoft/70"
        />
        <span className="shrink-0 text-[11px] text-inkSoft">
          {archetype?.label} · {stage.name} {companion.affinity}
          {track !== null ? ` · ${track}` : ''}
        </span>
      </div>

      <div className="mt-1 grid grid-cols-3 gap-2">
        {Array.from({ length: SLOT_COUNT }, (_, slot) => (
          <Slot key={slot} companion={companion} slot={slot} />
        ))}
      </div>
    </section>
  );
}

export function CompanionGallery() {
  const companions = useGameStore((s) => s.state?.companions);
  const list = Object.values(companions ?? {});

  if (list.length === 0) {
    return <p className="text-[12px] text-inkSoft">아직 아는 사람이 없습니다.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-inkSoft">{AFTER_UPLOAD_NOTE}</p>
      {list.map((companion) => (
        <CompanionCard key={companion.id} companion={companion} />
      ))}
    </div>
  );
}
