/**
 * 이름표 + 대사창 (§8.1).
 *
 * 글자당 26ms 로 찍는다. A 를 누르면 즉시 전체가 뜨고, 한 번 더 누르면 다음 줄로 간다 —
 * 그 두 번째 누름은 스토어의 상태 기계가 맡는다. 여기서는 찍는 일만 한다.
 *
 * `prefers-reduced-motion` 이면 타이핑 없이 즉시 (§8.1).
 */

import { useEffect, useState } from 'react';
import { TYPE_MS } from '@/data/dialogue';
import { useReducedMotion } from '../useReducedMotion';

interface Props {
  speakerName: string;
  text: string;
  /** 참이면 찍는 중. 거짓이면 전체를 그대로 보여 준다 */
  typing: boolean;
  /** 다 찍었을 때. 대기(▼) 로 넘어간다 */
  onTyped: () => void;
}

export function TextBox({ speakerName, text, typing, onTyped }: Props) {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!typing) return;

    if (reduced) {
      setCount(text.length);
      onTyped();
      return;
    }

    setCount(0);
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        clearInterval(id);
        onTyped();
      }
    }, TYPE_MS);

    return () => clearInterval(id);
    // onTyped 는 스토어 액션이라 신원이 변하지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, typing, reduced]);

  const shown = typing && !reduced ? text.slice(0, count) : text;
  const done = !typing;

  return (
    <div className="rounded border border-stoneDark bg-ink/92 px-3 pb-3 pt-2">
      <div className="mb-1 text-[12px] font-medium text-gold">{speakerName}</div>
      <p className="min-h-[3.6em] whitespace-pre-wrap text-[13px] leading-relaxed text-paper">
        {shown}
      </p>
      {/* 대기 표시. 다 찍힌 뒤에만 보인다 */}
      <div className="h-3 text-right text-[11px] text-paperDim">{done ? '▼' : ''}</div>
    </div>
  );
}
