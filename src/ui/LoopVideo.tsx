/**
 * 슬롯에 넣은 영상 (§9.1).
 *
 * 소리 없이 반복 재생한다.
 *   - `muted` 가 없으면 브라우저가 자동 재생을 막고 첫 프레임에서 멈춘다
 *   - `playsInline` 이 없으면 안드로이드에서 전체 화면으로 튀어나온다
 *   - 소리는 아예 받지 않는다. 대화 중에 남의 영상 소리가 끼어들면 안 된다
 *
 * **잘라내지 않는다.** 그림은 넣을 때 캔버스로 규격에 맞춰 다시 굽지만(§9.1)
 * 영상은 그러지 못한다. `object-cover` 로 채우면 세로로 긴 화면에서 가운데만
 * 남고 위아래가 잘려 나간다 — 얼굴이 통째로 사라진다.
 * `object-contain` 으로 전체를 넣고 남는 자리는 어둡게 둔다.
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
      /**
       * 채우기 방식은 여기서만 정한다.
       *
       * 호출부에서 `object-cover` 를 같이 넘기면 뒤에 붙여도 이기지 못한다 —
       * 두 클래스의 우선순위가 같아서 class 속성 순서가 아니라 스타일시트
       * 순서로 갈린다. 그래서 부르는 쪽은 크기만 넘기고 여기서 맞춘다.
       */
      className={`${className ?? ''} bg-ink object-contain`}
      // 첫 프레임을 그려 두어야 멈춰 있어도 빈칸으로 보이지 않는다
      preload="metadata"
      autoPlay={!reduced}
      loop={!reduced}
      muted
      playsInline
    />
  );
}
