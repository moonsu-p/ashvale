import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { isDebugAssets } from '@/render/debugAssets';
import { PortraitFrame } from '@/ui/PortraitFrame';
import { StorageBanner } from '@/ui/StorageBanner';
import { GameWarning } from '@/ui/GameWarning';
import { QuestCard } from '@/ui/QuestCard';
import { QuestBar } from '@/ui/QuestBar';
import { SettlementView } from '@/ui/SettlementView';
import { BottomSheet } from '@/ui/BottomSheet';
import { Onboarding } from '@/ui/Onboarding';
import { ExploreOverlay } from '@/ui/ExploreOverlay';
import { RelationshipOverlays } from '@/ui/RelationshipOverlays';
import { AssetGallery } from '@/ui/AssetGallery';
import { PALETTE } from '@/data/palette';

export default function App() {
  const boot = useGameStore((s) => s.boot);
  const status = useGameStore((s) => s.status);
  const state = useGameStore((s) => s.state);
  const onboarding = useGameStore((s) => s.onboarding);
  const pendingExplore = useGameStore((s) => s.pendingExplore);

  useEffect(() => {
    void boot();
  }, [boot]);

  if (isDebugAssets()) return <AssetGallery />;

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: PALETTE.linen }}>
        불러오는 중…
      </div>
    );
  }

  if (onboarding) return <Onboarding />;

  if (!state) {
    return (
      <div className="flex h-full flex-col">
        <StorageBanner />
        <div className="flex flex-1 items-center justify-center px-6 text-center" style={{ color: PALETTE.linen }}>
          세이브를 불러오지 못했습니다. 배너의 안내를 따르세요.
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      <PortraitFrame
        banner={
          <>
            <StorageBanner />
            <GameWarning state={state} />
            <QuestCard state={state} />
            <QuestBar state={state} />
          </>
        }
        map={<SettlementView state={state} />}
        sheet={<BottomSheet state={state} />}
      />
      {pendingExplore && (
        <div className="absolute inset-0 flex justify-center">
          <div
            className="relative h-full w-full"
            style={{ width: 'min(100vw, calc(100dvh * 393 / 852))', maxWidth: 393 }}
          >
            <ExploreOverlay outcome={pendingExplore} />
          </div>
        </div>
      )}
      <RelationshipOverlays />
    </div>
  );
}
