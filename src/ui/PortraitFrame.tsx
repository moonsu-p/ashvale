/**
 * 세로 레이아웃 골격 — 설계 기준 393×852dp (§0, §10.4).
 * 상단 55% 맵 영역, 하단 45% UI 시트. 데스크톱에서는 중앙에 폰 비율로 고정한다.
 * 맵 실체(Phaser)는 M1 에서 상단 슬롯에 들어간다.
 */

import type { ReactNode } from 'react';
import { PALETTE } from '@/data/palette';

interface Props {
  map: ReactNode;
  sheet: ReactNode;
  banner?: ReactNode;
}

export function PortraitFrame({ map, sheet, banner }: Props) {
  return (
    <div
      className="mx-auto flex h-full flex-col overflow-hidden"
      style={{
        // 폰 비율 유지: 화면 높이에 맞추되 최대 폭 393
        width: 'min(100vw, calc(100dvh * 393 / 852))',
        maxWidth: 393,
        background: PALETTE.ink,
      }}
    >
      {banner}
      {/* 상단 55% — 거점 맵 */}
      <div className="relative shrink-0 overflow-hidden" style={{ height: '55%', background: PALETTE.slate }}>
        {map}
      </div>
      {/* 하단 45% — UI 시트 */}
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        style={{ background: PALETTE.paper, color: PALETTE.ink }}
      >
        {sheet}
      </div>
    </div>
  );
}
