/**
 * 상단 HUD 를 눌러 여는 메뉴 (§5 조작).
 * 인물 · 연대기 · 꾸러미.
 */

import { useGameStore } from '@/store/useGameStore';
import { TOUCH_MIN } from '@/data/layout';
import { CompanionGallery } from './CompanionGallery';
import { BundlePanel } from './BundlePanel';
import { MarketPanel } from './MarketPanel';

const TABS = [
  { id: 'companions', label: '인물' },
  { id: 'market', label: '시장' },
  { id: 'chronicle', label: '연대기' },
  { id: 'bundle', label: '꾸러미' },
  { id: 'settings', label: '설정' },
] as const;

/** 소리는 파일 없이 그 자리에서 합성한다. 끌 수 있어야 한다 */
function SettingsPanel() {
  const audio = useGameStore((s) => s.audio);
  const setAudio = useGameStore((s) => s.setAudio);
  const persisted = useGameStore((s) => s.persisted);
  const request = useGameStore((s) => s.requestPersistence);

  return (
    <div className="space-y-3 text-[12px]">
      <label className="flex items-center justify-between border-b border-stoneDark/25 pb-2">
        <span>효과음</span>
        <button
          type="button"
          onClick={() => setAudio(!audio)}
          style={{ minHeight: TOUCH_MIN }}
          className={`rounded border border-stoneDark px-4 text-[12px] ${
            audio ? 'bg-gold text-ink' : 'bg-paperDim text-inkSoft'
          }`}
        >
          {audio ? '켜짐' : '꺼짐'}
        </button>
      </label>
      <p className="text-[11px] leading-relaxed text-inkSoft">
        음원 파일을 쓰지 않습니다. 소리는 그 자리에서 만들어 냅니다 — 받아오는 것이 없습니다.
      </p>

      <label className="flex items-center justify-between border-b border-stoneDark/25 pb-2">
        <span>지속 저장</span>
        <button
          type="button"
          disabled={persisted}
          onClick={() => void request()}
          style={{ minHeight: TOUCH_MIN }}
          className="rounded border border-stoneDark bg-paperDim px-4 text-[12px] disabled:opacity-50"
        >
          {persisted ? '승인됨' : '요청'}
        </button>
      </label>
      <p className="text-[11px] leading-relaxed text-inkSoft">
        승인해 두면 브라우저가 저장 공간을 함부로 비우지 않습니다.
      </p>
    </div>
  );
}

/** 연대기는 무주어 문어체다. 최근 것이 위로 오게 뒤집어 보여 준다 */
function ChroniclePanel() {
  const chronicle = useGameStore((s) => s.state?.chronicle) ?? [];
  if (chronicle.length === 0) {
    return <p className="text-[12px] text-inkSoft">아직 적힌 것이 없습니다.</p>;
  }
  return (
    <ol className="space-y-1">
      {[...chronicle].reverse().map((entry) => (
        <li
          key={entry.id}
          className="border-b border-stoneDark/20 pb-1 font-serif text-[12px] leading-relaxed"
        >
          {entry.text}
        </li>
      ))}
    </ol>
  );
}

export function MenuOverlay() {
  const menu = useGameStore((s) => s.menu);
  const open = useGameStore((s) => s.openMenu);
  const close = useGameStore((s) => s.closeMenu);

  if (menu === null) return null;

  return (
    <div className="absolute inset-0 z-40 flex flex-col bg-ink/80 p-3">
      <div className="flex min-h-0 flex-1 flex-col rounded border border-stoneDark bg-paper text-ink">
        <nav className="flex shrink-0 border-b border-stoneDark">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => open(tab.id)}
              style={{ minHeight: TOUCH_MIN }}
              className={`flex-1 text-[13px] ${
                menu === tab.id ? 'bg-paperDim font-medium' : 'text-inkSoft'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {menu === 'companions' && <CompanionGallery />}
          {menu === 'market' && <MarketPanel />}
          {menu === 'chronicle' && <ChroniclePanel />}
          {menu === 'bundle' && <BundlePanel />}
          {menu === 'settings' && <SettingsPanel />}
        </div>

        <button
          type="button"
          onClick={close}
          style={{ minHeight: TOUCH_MIN }}
          className="shrink-0 border-t border-stoneDark text-[13px]"
        >
          닫기
        </button>
      </div>
    </div>
  );
}
