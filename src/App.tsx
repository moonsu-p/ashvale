import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { DebugAssets, isDebugAssets } from '@/render/DebugAssets';
import { Hud } from '@/ui/Hud';
import { FieldBand } from '@/ui/FieldBand';
import { ControlsBand } from '@/ui/ControlsBand';
import { useKeyboard } from '@/ui/useKeyboard';
import { MenuOverlay } from '@/ui/menu/MenuOverlay';
import { ImportButton } from '@/ui/ImportButton';

/**
 * 세로 한 통. 폰에서는 화면을 꽉 채우고, 넓은 화면에서만 가운데로 모은다.
 * 좌우 안전 영역을 비우는 건 접는 기기·곡면 화면 때문이다.
 */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex h-full w-full max-w-viewport flex-col bg-paper pl-safe-l pr-safe-r">
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <Frame>
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        {children}
      </div>
    </Frame>
  );
}

export default function App() {
  const status = useGameStore((s) => s.status);
  const state = useGameStore((s) => s.state);
  const error = useGameStore((s) => s.error);
  const backupKey = useGameStore((s) => s.backupKey);
  const prompt = useGameStore((s) => s.prompt);
  const talking = useGameStore((s) => s.dialogue !== null);
  const boot = useGameStore((s) => s.boot);
  const openMenu = useGameStore((s) => s.openMenu);
  const startNewGame = useGameStore((s) => s.startNewGame);

  useKeyboard();

  useEffect(() => {
    void boot();
  }, [boot]);

  if (isDebugAssets()) return <DebugAssets />;

  if (status === 'booting') {
    return (
      <Centered>
        <p className="text-[12px] text-inkSoft">불러오는 중</p>
      </Centered>
    );
  }

  // 마이그레이션이 실패한 자리. 원본을 지우지 않았으므로 되돌릴 길이 남아 있다
  if (status === 'failed') {
    return (
      <Centered>
        <h1 className="font-medium text-blood">세이브를 열지 못했다</h1>
        <p className="text-[12px] leading-relaxed text-ink">{error}</p>
        {backupKey !== null && (
          <p className="text-[11px] leading-relaxed text-inkSoft">
            원본은 지우지 않고 아래 자리에 보관했다.
            <br />
            <code className="break-all">{backupKey}</code>
          </p>
        )}
        <button
          type="button"
          onClick={() => void startNewGame()}
          className="min-h-touch rounded border border-stoneDark bg-paperDim px-4 text-[12px] text-ink"
        >
          새로 시작
        </button>
      </Centered>
    );
  }

  if (status === 'empty' || state === null) {
    return (
      <Centered>
        <h1 className="font-serif text-lg text-ink">아쉬베일 연대기</h1>
        <button
          type="button"
          onClick={() => void startNewGame()}
          className="min-h-touch rounded border border-stoneDark bg-gold px-6 text-[13px] font-medium text-ink"
        >
          새 게임
        </button>
        {/* 새 기기·새 주소에서는 여기가 되돌릴 유일한 길이다 */}
        <ImportButton />
        {error !== null && <p className="text-[11px] text-blood">{error}</p>}
      </Centered>
    );
  }

  return (
    <Frame>
      <Hud state={state} onOpenMenu={() => openMenu('companions')} />
      <FieldBand prompt={prompt} talking={talking} />
      <ControlsBand actionActive={talking || prompt !== null} />
      <MenuOverlay />
      {error !== null && (
        <p className="bg-blood px-2 py-1 text-[11px] text-paper">{error}</p>
      )}
    </Frame>
  );
}
