/**
 * 첫 안내 한 줄 (온보딩).
 * 스플래시도 로고도 인트로도 없다. 그 자리에서 필요한 말만 하고 사라진다.
 */

import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { HINTS } from '@/data/onboarding';

const SHOW_MS = 4200;

export function Hint() {
  const state = useGameStore((s) => s.state);
  const hint = useGameStore((s) => s.hint);
  const showHint = useGameStore((s) => s.showHint);
  const dismissHint = useGameStore((s) => s.dismissHint);

  const map = state?.world.currentMap ?? null;
  const prompt = useGameStore((s) => s.prompt);

  // 상황에 맞는 첫 안내를 띄운다
  useEffect(() => {
    if (map === 'town') showHint(HINTS.town!.id, HINTS.town!.text);
  }, [map, showHint]);

  useEffect(() => {
    if (prompt === '건설' || prompt === '증축') showHint(HINTS.plot!.id, HINTS.plot!.text);
    if (prompt === '나가기') showHint(HINTS.gateway!.id, HINTS.gateway!.text);
  }, [prompt, showHint]);

  useEffect(() => {
    if (hint === null) return;
    const id = window.setTimeout(dismissHint, SHOW_MS);
    return () => window.clearTimeout(id);
  }, [hint, dismissHint]);

  if (hint === null) return null;

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-12 z-30 flex justify-center px-3">
      <div className="rounded border border-stoneDark bg-ink/88 px-3 py-1.5 text-[11px] text-paperDim">
        {hint}
      </div>
    </div>
  );
}
