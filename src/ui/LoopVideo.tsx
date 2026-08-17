/**
 * 슬롯에 넣은 영상 (§9.1).
 *
 * 소리 없이 반복 재생한다.
 *   - `muted` 가 없으면 브라우저가 자동 재생을 막고 첫 프레임에서 멈춘다
 *   - `playsInline` 이 없으면 안드로이드에서 전체 화면으로 튀어나온다
 *   - 소리는 아예 받지 않는다. 대화 중에 남의 영상 소리가 끼어들면 안 된다
 *
 * **`prefers-reduced-motion` 을 지킨다.** 움직임을 줄이라고 해 둔 기기에서는
 * 반복 재생하지 않고 첫 프레임만 세워 둔다 — 자동으로 계속 움직이는 그림이
 * 바로 그 설정이 막으려는 것이다.
 */

import { useReducedMotion } from './useReducedMotion';

export function LoopVideo({ src, className }: { src: string; className?: string }) {
  const reduced = useReducedMotion();

  return (
    <video
      src={src}
      className={className}
      // 첫 프레임을 그려 두어야 멈춰 있어도 빈칸으로 보이지 않는다
      preload="metadata"
      autoPlay={!reduced}
      loop={!reduced}
      muted
      playsInline
    />
  );
}
