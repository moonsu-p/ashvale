/**
 * 온보딩 — §16.2. 스플래시·로고·인트로 애니메이션 없음. 3초 안에 시작할 수 있어야 한다.
 * [1] 제목+시작 → [2] 이름·거점 입력 → [3] 도입 3문장 탭 → 거점 화면.
 */

import { useState } from 'react';
import { PALETTE } from '@/data/palette';
import { INTRO_LINES, DEFAULT_HERO_NAME, DEFAULT_SETTLEMENT_NAME } from '@/data/onboarding';
import { useGameStore } from '@/store/useGameStore';

export function Onboarding() {
  const startNewGame = useGameStore((s) => s.startNewGame);
  const [screen, setScreen] = useState(0);
  const [hero, setHero] = useState(DEFAULT_HERO_NAME);
  const [settlement, setSettlement] = useState(DEFAULT_SETTLEMENT_NAME);

  const frame = (children: React.ReactNode) => (
    <div
      className="mx-auto flex h-full flex-col items-center justify-center gap-6 px-8 text-center"
      style={{
        width: 'min(100vw, calc(100dvh * 393 / 852))',
        maxWidth: 393,
        background: PALETTE.ink,
        color: PALETTE.linen,
      }}
    >
      {children}
    </div>
  );

  if (screen === 0) {
    return frame(
      <>
        <h1 className="font-serif text-3xl" style={{ color: PALETTE.paper }}>
          아쉬베일 연대기
        </h1>
        <button
          onClick={() => setScreen(1)}
          className="rounded px-6 py-3 text-base font-medium"
          style={{ background: PALETTE.gold, color: PALETTE.ink }}
        >
          연대기를 시작한다
        </button>
      </>
    );
  }

  if (screen === 1) {
    return frame(
      <>
        <div className="w-full text-left">
          <label className="mb-1 block text-sm" style={{ color: PALETTE.stoneLight }}>
            이름
          </label>
          <input
            value={hero}
            onChange={(e) => setHero(e.target.value)}
            maxLength={12}
            className="w-full rounded px-3 py-2 text-base"
            style={{ background: PALETTE.paper, color: PALETTE.ink }}
          />
        </div>
        <div className="w-full text-left">
          <label className="mb-1 block text-sm" style={{ color: PALETTE.stoneLight }}>
            거점 이름
          </label>
          <input
            value={settlement}
            onChange={(e) => setSettlement(e.target.value)}
            maxLength={12}
            className="w-full rounded px-3 py-2 text-base"
            style={{ background: PALETTE.paper, color: PALETTE.ink }}
          />
        </div>
        <button
          onClick={() => setScreen(2)}
          className="rounded px-6 py-3 text-base font-medium"
          style={{ background: PALETTE.gold, color: PALETTE.ink }}
        >
          다음
        </button>
      </>
    );
  }

  // 화면 3: 도입 문장 → 탭하면 즉시 거점 화면
  return (
    <div
      onClick={() => void startNewGame(hero, settlement)}
      className="mx-auto flex h-full cursor-pointer flex-col items-center justify-center gap-4 px-10 text-center"
      style={{
        width: 'min(100vw, calc(100dvh * 393 / 852))',
        maxWidth: 393,
        background: PALETTE.ink,
        color: PALETTE.linen,
      }}
    >
      {INTRO_LINES.map((line, i) => (
        <p key={i} className="font-serif text-lg leading-relaxed">
          {line}
        </p>
      ))}
      <p className="mt-6 text-xs" style={{ color: PALETTE.stoneDark }}>
        탭하여 시작
      </p>
    </div>
  );
}
