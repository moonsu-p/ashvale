/**
 * 지역 사건 (§11 사건 노드).
 *
 * 전리품 노드는 1d20 연출을 쓰지만 여기는 **고르는 자리**다.
 * 주사위를 굴리지 않는다 — 셋 다 같은 주사위면 지역이 단조로워진다.
 *
 * 규칙은 계산하지 않는다. 상태를 읽어 보여주고 누르면 스토어 액션을 부른다.
 */

import { useGameStore } from '@/store/useGameStore';
import { fillEventText } from '@/systems/regionEvents';
import { TOUCH_MIN } from '@/data/layout';

export function RegionEventPanel() {
  const open = useGameStore((s) => s.regionEvent);
  const state = useGameStore((s) => s.state);
  const choose = useGameStore((s) => s.chooseRegionEvent);
  const close = useGameStore((s) => s.closeRegionEvent);

  if (open === null || state === null) return null;

  const { event, result } = open;

  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-ink/80 p-3">
      <div className="w-full rounded border border-stoneDark bg-paper p-3 text-ink">
        {/* 상황과 결과는 무주어 문어체다 (§15). 본문 글꼴을 세리프로 둔다 */}
        <p className="font-serif text-[13px] leading-relaxed">
          {fillEventText(event.situation, state)}
        </p>

        {result === null ? (
          <div className="mt-3 space-y-1">
            {event.choices.map((choice, i) => (
              <button
                key={choice.text}
                type="button"
                onClick={() => choose(i)}
                style={{ minHeight: TOUCH_MIN }}
                className="w-full rounded border border-stoneDark bg-paperDim px-3 text-left text-[13px]"
              >
                {fillEventText(choice.text, state)}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-3">
            <p className="border-t border-stoneDark/25 pt-2 font-serif text-[13px] leading-relaxed">
              {result.result}
            </p>

            {result.relicFound !== null && (
              <p className="mt-2 font-serif text-[12px] leading-relaxed text-inkSoft">
                {result.relicFound}
              </p>
            )}

            <div className="mt-2 flex flex-wrap gap-2 text-[12px] tabular-nums">
              {result.xp > 0 && <span>경험 +{result.xp}</span>}
              {result.notes.map((note) => (
                <span key={note} className="text-inkSoft">
                  {note}
                </span>
              ))}
              {result.relicName !== null && (
                <span className="text-gold">유물 · {result.relicName}</span>
              )}
            </div>

            {result.levelUp !== null && (
              <p className="mt-1 text-[12px] text-gold">
                {result.levelUp.to}단계가 되었다. 능력치 {result.levelUp.statPoints} · 기술{' '}
                {result.levelUp.skillPoints}
              </p>
            )}

            <button
              type="button"
              onClick={close}
              style={{ minHeight: TOUCH_MIN }}
              className="mt-3 w-full rounded border border-stoneDark bg-paperDim text-[13px]"
            >
              닫기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
