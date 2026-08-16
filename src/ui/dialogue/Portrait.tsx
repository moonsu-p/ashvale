/**
 * 인물 이미지 (§8.1) — 3:4, 화면폭 78%. 아래에서 14px 올라오며 280ms 페이드 인.
 *
 * 슬롯 폴백은 systems/portrait.ts 가 정한다. 여기서는 결과만 그린다.
 * 이미지가 하나도 없으면 원형 실루엣이 대신 선다. 조용히 바꾼다 (§8.2).
 */

import { useEffect, useState } from 'react';
import type { PortraitRef } from '@/types/dialogue';
import {
  PORTRAIT_ASPECT,
  PORTRAIT_FADE_MS,
  PORTRAIT_RISE,
  PORTRAIT_WIDTH_RATIO,
} from '@/data/dialogue';
import { useReducedMotion } from '../useReducedMotion';
import { Silhouette } from './Silhouette';

interface Props {
  portrait: PortraitRef;
  /** 해석된 이미지. 아직 업로드 기능이 없어 항상 null 이다 */
  imageUrl?: string | null;
}

export function Portrait({ portrait, imageUrl = null }: Props) {
  const reduced = useReducedMotion();
  const [shown, setShown] = useState(reduced);

  useEffect(() => {
    if (reduced) {
      setShown(true);
      return;
    }
    // 다음 프레임에 켜야 전환이 걸린다
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, [reduced, portrait.speaker.id]);

  return (
    <div
      className="mx-auto overflow-hidden rounded border border-stoneDark"
      style={{
        width: `${PORTRAIT_WIDTH_RATIO * 100}%`,
        aspectRatio: `${PORTRAIT_ASPECT}`,
        opacity: shown ? 1 : 0,
        transform: `translateY(${shown ? 0 : PORTRAIT_RISE}px)`,
        transition: reduced
          ? 'none'
          : `opacity ${PORTRAIT_FADE_MS}ms ease-out, transform ${PORTRAIT_FADE_MS}ms ease-out`,
      }}
    >
      {imageUrl === null ? (
        <Silhouette label={portrait.label} />
      ) : (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      )}
    </div>
  );
}
