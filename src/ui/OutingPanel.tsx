/**
 * 나들이 (§7.6, §10).
 *
 * 나와 있는 사람에게 말을 걸면 열린다. 대화 → 놀이 → 마무리.
 * 초상은 대화와 같은 것을 쓴다 — 다른 화면처럼 보이면 안 된다.
 *
 * 규칙은 계산하지 않는다. 상태를 읽어 보여주고 누르면 스토어 액션을 부른다.
 */

import { useGameStore } from '@/store/useGameStore';
import { usePortraitImage } from './dialogue/usePortraitImage';
import { Portrait } from './dialogue/Portrait';
import { MiniGame } from './MiniGame';
import { getArchetype } from '@/data/archetypes';
import { displayName } from '@/systems/relationships';
import { TOUCH_MIN } from '@/data/layout';

export function OutingPanel() {
  const open = useGameStore((s) => s.outing);
  const state = useGameStore((s) => s.state);
  const startGame = useGameStore((s) => s.startOutingGame);
  const finishGame = useGameStore((s) => s.finishOutingGame);
  const close = useGameStore((s) => s.closeOuting);

  const who = open === null ? undefined : state?.companions[open.companionId];
  const archetype = who === undefined ? undefined : getArchetype(who.archetypeId);

  // 훅은 조건 앞에서 부른다
  const media = usePortraitImage(
    {
      speaker: { kind: 'companion', id: who?.archetypeId ?? '' },
      wantSlot: 0,
      label: archetype?.label ?? '',
    },
    null,
  );

  if (open === null || state === null || who === undefined) return null;

  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end bg-ink/80">
      <div className="flex min-h-0 flex-1 items-end justify-center p-2">
        <Portrait
          portrait={{
            speaker: { kind: 'companion', id: who.archetypeId },
            wantSlot: 0,
            label: archetype?.label ?? '',
          }}
          media={media}
        />
      </div>

      <div className="rounded-t border-t border-stoneDark bg-paper p-3 text-ink">
        <div className="text-[11px] font-medium text-gold">{displayName(who)}</div>

        {/* 상황과 대사. 놀이 중에는 접어 둔다 — 화면이 좁다 */}
        {open.phase !== 'playing' && (
          <div className="mt-1 space-y-1">
            {open.lines.map((line) => (
              <p key={line} className="text-[13px] leading-relaxed">
                {line}
              </p>
            ))}
          </div>
        )}

        {open.phase === 'intro' && (
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={startGame}
              style={{ minHeight: TOUCH_MIN }}
              className="flex-1 rounded border border-stoneDark bg-gold text-[13px] font-medium"
            >
              같이 한다
            </button>
            <button
              type="button"
              onClick={close}
              style={{ minHeight: TOUCH_MIN }}
              className="flex-1 rounded border border-stoneDark bg-paperDim text-[13px]"
            >
              다음에
            </button>
          </div>
        )}

        {open.phase === 'playing' && (
          <div className="mt-2">
            <MiniGame onFinish={finishGame} />
          </div>
        )}

        {open.phase === 'after' && (
          <button
            type="button"
            onClick={close}
            style={{ minHeight: TOUCH_MIN }}
            className="mt-3 w-full rounded border border-stoneDark bg-paperDim text-[13px]"
          >
            닫기
          </button>
        )}
      </div>
    </div>
  );
}
