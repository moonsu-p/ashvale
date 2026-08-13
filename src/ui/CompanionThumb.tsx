/**
 * 관계 대상 이미지 렌더 — §11.4. Blob 이 있으면 이미지, 없으면 원형 실루엣 플레이스홀더(§11.1).
 */

import { useCompanionImage } from '@/images/useCompanionImage';
import { AssetPlaceholder } from './AssetPlaceholder';
import { PALETTE } from '@/data/palette';
import type { CompanionRecord } from '@/types/game';

export function CompanionThumb({ companion, slot = 0, size = 40 }: { companion: CompanionRecord; slot?: number; size?: number }) {
  const key = companion.images[slot] ?? companion.images[0] ?? null;
  const url = useCompanionImage(key);
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'contain', background: PALETTE.ink, borderRadius: 2 }}
      />
    );
  }
  return <AssetPlaceholder id={`silhouette.${companion.archetypeId}`} size={size} />;
}
