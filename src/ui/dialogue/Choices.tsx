/**
 * 선택지 (§8.3) — 대사창 아래에 세로로 쌓는다. 최대 3개.
 *
 * 선택지가 떠 있는 동안 A 는 아무 동작도 하지 않는다. 반드시 탭으로 고른다.
 * 잘못 눌러 흘려보내는 일이 없어야 하기 때문이다.
 */

import type { DialogueOption } from '@/types/dialogue';
import { MAX_CHOICES } from '@/data/dialogue';
import { TOUCH_MIN } from '@/data/layout';

interface Props {
  options: DialogueOption[];
  onChoose: (id: string) => void;
}

export function Choices({ options, onChoose }: Props) {
  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {options.slice(0, MAX_CHOICES).map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChoose(option.id)}
          style={{ minHeight: TOUCH_MIN }}
          className="rounded border border-stoneDark bg-paper px-3 py-2 text-left text-[13px] leading-snug text-ink active:bg-paperDim"
        >
          {option.text}
        </button>
      ))}
    </div>
  );
}
