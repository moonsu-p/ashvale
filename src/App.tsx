import { useEffect } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { isDebugAssets } from '@/render/debugAssets';
import { PortraitFrame } from '@/ui/PortraitFrame';
import { StorageBanner } from '@/ui/StorageBanner';
import { SettlementSlot } from '@/ui/SettlementSlot';
import { BottomSheet } from '@/ui/BottomSheet';
import { AssetGallery } from '@/ui/AssetGallery';
import { PALETTE } from '@/data/palette';

export default function App() {
  const boot = useGameStore((s) => s.boot);
  const status = useGameStore((s) => s.status);
  const state = useGameStore((s) => s.state);

  useEffect(() => {
    void boot();
  }, [boot]);

  // 개발용 에셋 갤러리
  if (isDebugAssets()) return <AssetGallery />;

  if (status === 'loading' || status === 'idle') {
    return (
      <div className="flex h-full items-center justify-center" style={{ color: PALETTE.linen }}>
        불러오는 중…
      </div>
    );
  }

  if (!state) {
    // 오류 상태에서도 배너로 안내하고 앱은 멈추지 않는다
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
    <PortraitFrame
      banner={<StorageBanner />}
      map={<SettlementSlot state={state} />}
      sheet={<BottomSheet state={state} />}
    />
  );
}
