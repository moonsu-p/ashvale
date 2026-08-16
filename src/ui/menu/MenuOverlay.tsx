/**
 * 상단 HUD 를 눌러 여는 메뉴 (§5 조작).
 * 인물 · 연대기 · 꾸러미.
 */

import { useGameStore } from '@/store/useGameStore';
import { TOUCH_MIN } from '@/data/layout';
import { CompanionGallery } from './CompanionGallery';
import { BundlePanel } from './BundlePanel';

const TABS = [
  { id: 'companions', label: '인물' },
  { id: 'chronicle', label: '연대기' },
  { id: 'bundle', label: '꾸러미' },
] as const;

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
          {menu === 'chronicle' && <ChroniclePanel />}
          {menu === 'bundle' && <BundlePanel />}
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
