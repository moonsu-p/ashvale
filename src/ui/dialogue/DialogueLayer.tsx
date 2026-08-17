/**
 * 대화 레이어 (§2, §8).
 *
 * 필드 위에 덮인다. **필드를 지우지 않고 어둡게만 깐다** — 지금 어디에 서서
 * 이야기하고 있는지가 뒤에 비쳐야 장소감이 유지된다.
 */

import { useEffect } from 'react';
import type { DialogueState, PortraitRef } from '@/types/dialogue';
import { useGameStore } from '@/store/useGameStore';
import { FIELD_DIM } from '@/data/dialogue';
import { PALETTE } from '@/data/palette';
import { onActionPress } from '@/phaser/inputBus';
import { Portrait } from './Portrait';
import { TextBox } from './TextBox';
import { Choices } from './Choices';
import { usePortraitImage } from './usePortraitImage';

export function DialogueLayer() {
  const dialogue = useGameStore((s) => s.dialogue);
  if (dialogue === null) return null;
  return <OpenDialogue dialogue={dialogue} />;
}

/** 오른쪽에 서는 사람. 훅 규칙 때문에 따로 뗀다 */
function SecondPortrait({ portrait }: { portrait: PortraitRef }) {
  const url = usePortraitImage(portrait);
  return <Portrait portrait={portrait} imageUrl={url} />;
}

function OpenDialogue({ dialogue }: { dialogue: DialogueState }) {
  const advance = useGameStore((s) => s.advanceDialogue);
  const finishTyping = useGameStore((s) => s.finishTyping);
  const choose = useGameStore((s) => s.chooseDialogue);

  const { script, lineIndex, phase, reply } = dialogue;
  const imageUrl = usePortraitImage(script.portrait);

  // A 버튼과 Space/Enter 가 여기로 들어온다. 필드는 이 동안 멈춰 있다
  useEffect(() => onActionPress(() => advance()), [advance]);

  const text = reply ?? script.lines[lineIndex] ?? '';
  const choosing = phase === 'choosing';

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      {/* 필드를 덮되 지우지 않는다 */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: PALETTE.ink, opacity: FIELD_DIM }}
      />

      <div className="relative flex h-full flex-col justify-end gap-2 p-2">
        {/* 두 사람이 동시에 나오는 사건은 슬롯 0을 나란히 세운다 (§7.5) */}
        <div className="flex min-h-0 flex-1 items-end justify-center gap-2 pt-1">
          <Portrait portrait={script.portrait} imageUrl={imageUrl} />
          {script.secondPortrait !== undefined && (
            <SecondPortrait portrait={script.secondPortrait} />
          )}
        </div>

        {/* 대사창을 눌러도 넘어간다. 선택지가 떠 있을 때는 막는다 */}
        <div
          onPointerDown={choosing ? undefined : () => advance()}
          className={choosing ? '' : 'cursor-pointer'}
        >
          <TextBox
            speakerName={script.speakerName}
            text={text}
            typing={phase === 'typing'}
            onTyped={finishTyping}
          />
        </div>

        {choosing && script.choices !== undefined && (
          <Choices options={script.choices} onChoose={choose} />
        )}
      </div>
    </div>
  );
}
