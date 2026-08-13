/**
 * 색 사각형 + 라벨 UI 컴포넌트 — 에셋이 없을 때의 대체 표시 (§11.1).
 * placeholderFor() 로 색·라벨·debug 외곽선을 결정한다. 색은 팔레트에서만 온다.
 */

import { placeholderFor } from '@/render/placeholder';
import { PALETTE } from '@/data/palette';

interface Props {
  id: string;
  size?: number;
  className?: string;
}

export function AssetPlaceholder({ id, size = 40, className }: Props) {
  const v = placeholderFor(id);
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        background: v.color,
        outline: v.outline ? `2px solid ${v.outlineColor}` : undefined,
        outlineOffset: -2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: PALETTE.ink,
        fontSize: Math.max(8, Math.min(12, Math.floor(size / 4))),
        lineHeight: 1,
        textAlign: 'center',
        overflow: 'hidden',
        borderRadius: 2,
      }}
      title={id}
    >
      {v.label}
    </div>
  );
}
