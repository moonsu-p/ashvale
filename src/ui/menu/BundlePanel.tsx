/**
 * 꾸러미 내보내기·불러오기 (§14).
 *
 * **배포 주소를 바꾸기 전에 내보낸다.** 출처가 바뀌면 세이브가 따라오지 않는다.
 * 내보낸 zip 은 파일 관리자에 보이지만 갤러리에는 뜨지 않는다 (§9.2).
 */

import { useRef, useState } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { TOUCH_MIN } from '@/data/layout';

function stamp(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`;
}

export function BundlePanel() {
  const state = useGameStore((s) => s.state);
  const doExport = useGameStore((s) => s.exportBundle);
  const doImport = useGameStore((s) => s.importBundle);
  const input = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onExport = async () => {
    setBusy(true);
    const blob = await doExport();
    setBusy(false);
    if (blob === null) return;

    // 공유 영역에 임시 파일을 만들지 않는다. 메모리의 Blob 을 그대로 내린다
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ashvale-${stamp(new Date())}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setNote(`내보냈습니다. ${(blob.size / 1024).toFixed(0)}KB`);
  };

  return (
    <div className="space-y-3 text-[12px]">
      <p className="leading-relaxed text-inkSoft">
        세이브·원장·인물 이미지를 zip 하나로 묶습니다.
        <br />
        주소가 바뀌면 저장한 것이 따라오지 않습니다. 옮기기 전에 내보내 두세요.
      </p>

      <dl className="space-y-1">
        <div className="flex justify-between border-t border-stoneDark/25 pt-1">
          <dt className="text-inkSoft">인물</dt>
          <dd>{Object.keys(state?.companions ?? {}).length}명</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-inkSoft">이미지</dt>
          <dd>
            {Object.values(state?.companions ?? {}).reduce(
              (n, c) => n + Object.values(c.images).filter((k) => k !== null).length,
              0,
            )}
            장
          </dd>
        </div>
      </dl>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void onExport()}
          style={{ minHeight: TOUCH_MIN }}
          className="flex-1 rounded border border-stoneDark bg-gold text-[13px] font-medium text-ink disabled:opacity-50"
        >
          내보내기
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => input.current?.click()}
          style={{ minHeight: TOUCH_MIN }}
          className="flex-1 rounded border border-stoneDark bg-paperDim text-[13px] disabled:opacity-50"
        >
          불러오기
        </button>
      </div>

      {note !== null && <p className="text-grass">{note}</p>}

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
          setNote(null);
          void doImport(file).finally(() => {
            setBusy(false);
            setNote('불러왔습니다.');
          });
        }}
      />
    </div>
  );
}
