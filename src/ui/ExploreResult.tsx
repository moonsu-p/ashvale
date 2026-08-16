/**
 * 탐사 판정 연출 (§11).
 *
 * **판정은 화면에 단계적으로 노출한다.**
 * 1d20 이 돌아가다 멈추고 → 보정값이 하나씩 얹히고 → 난이도 선을 넘는지 보인다.
 * 결과만 툭 던지면 왜 그렇게 됐는지 알 수 없고, 다음에 무엇을 올려야 할지도 모른다.
 *
 * 서술은 content/region-text.ts 에서 온다. 여기서 문장을 짓지 않는다.
 */

import { useEffect, useRef, useState } from 'react';
import type { ResourceId } from '@/types/game';
import { useGameStore } from '@/store/useGameStore';
import { ROLL_ANIM, regionName } from '@/data/regions';
import { TOUCH_MIN } from '@/data/layout';
import { useReducedMotion } from './useReducedMotion';

const GRADE_LABEL = {
  triumph: '대성공',
  success: '성공',
  failure: '실패',
  crisis: '위기',
} as const;

const RESOURCE_LABEL: Record<ResourceId, string> = {
  wood: '목재',
  stone: '석재',
  food: '식량',
  gold: '금화',
};

const sign = (n: number) => (n >= 0 ? `+${n}` : `${n}`);

export function ExploreResult() {
  const view = useGameStore((s) => s.explore);
  const close = useGameStore((s) => s.closeExplore);
  const reduced = useReducedMotion();

  const roll = view?.outcome.roll;
  /** 0 굴리는 중 · 1 눈 확정 · 2..1+n 보정 · 2+n 합계 대조 · 3+n 결과 */
  const lastStage = roll === undefined ? 0 : roll.steps.length + 3;

  const [stage, setStage] = useState(0);
  const [face, setFace] = useState(1);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];
    if (roll === undefined) return;

    if (reduced) {
      setFace(roll.die);
      setStage(lastStage);
      return;
    }

    setStage(0);

    // 주사위가 도는 동안 눈이 계속 바뀐다
    const spin = window.setInterval(() => setFace(1 + Math.floor(Math.random() * 20)), ROLL_ANIM.spinTickMs);
    const stop = window.setTimeout(() => {
      window.clearInterval(spin);
      setFace(roll.die);
      setStage(1);
    }, ROLL_ANIM.spinMs);
    timers.current.push(stop);

    // 보정을 하나씩 얹는다
    let t = ROLL_ANIM.spinMs;
    for (let i = 0; i < roll.steps.length; i++) {
      t += ROLL_ANIM.stepMs;
      timers.current.push(window.setTimeout(() => setStage(2 + i), t));
    }
    t += ROLL_ANIM.compareMs;
    timers.current.push(window.setTimeout(() => setStage(2 + roll.steps.length), t));
    t += ROLL_ANIM.compareMs;
    timers.current.push(window.setTimeout(() => setStage(3 + roll.steps.length), t));

    return () => {
      window.clearInterval(spin);
      for (const id of timers.current) window.clearTimeout(id);
    };
  }, [roll, reduced, lastStage]);

  if (view === undefined || view === null || roll === undefined) return null;

  const done = stage >= lastStage;
  const shownSteps = Math.max(0, Math.min(roll.steps.length, stage - 1));
  // 도는 동안에는 돌아가는 눈을 그대로 보여 준다. 확정값을 미리 띄우면 굴리는 뜻이 없다
  const running =
    stage === 0 ? face : roll.steps.slice(0, shownSteps).reduce((sum, s) => sum + s.value, roll.die);

  const skip = () => {
    for (const id of timers.current) window.clearTimeout(id);
    setFace(roll.die);
    setStage(lastStage);
  };

  const loot = Object.entries(view.outcome.loot) as [ResourceId, number][];

  return (
    <div
      className="absolute inset-0 z-30 flex flex-col justify-end bg-ink/80 p-3"
      onPointerDown={done ? undefined : skip}
    >
      <div className="rounded border border-stoneDark bg-paper p-3 text-ink">
        <div className="flex items-baseline justify-between">
          <h2 className="text-[14px] font-medium">{regionName(view.regionId)}</h2>
          <span className="text-[11px] text-inkSoft">난이도 {roll.difficulty}</span>
        </div>

        {/* 1d20 */}
        <div className="my-2 flex items-center gap-3">
          <div
            className={`grid h-12 w-12 shrink-0 place-items-center rounded border-2 text-[18px] font-medium tabular-nums ${
              stage === 0 ? 'border-stoneDark bg-paperDim text-inkSoft' : 'border-gold bg-gold text-ink'
            }`}
          >
            {face}
          </div>
          <div className="text-[11px] text-inkSoft">
            {stage === 0 ? '주사위를 굴린다' : '1d20'}
          </div>
          <div className="ml-auto text-[18px] font-medium tabular-nums">{running}</div>
        </div>

        {/* 보정이 하나씩 얹힌다 */}
        <ul className="space-y-0.5 text-[12px]">
          {roll.steps.map((step, i) => (
            <li
              key={step.label}
              className={`flex justify-between border-t border-stoneDark/20 pt-0.5 transition-opacity ${
                i < shownSteps ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <span className="text-inkSoft">{step.label}</span>
              <span className="tabular-nums">{sign(step.value)}</span>
            </li>
          ))}
        </ul>

        {/* 난이도 선을 넘었는가 */}
        {stage >= 2 + roll.steps.length && (
          <div className="mt-2 flex items-baseline justify-between border-t border-stoneDark pt-1 text-[13px]">
            <span className="tabular-nums">
              {roll.total} − {roll.difficulty} = {sign(roll.margin)}
            </span>
            <span
              className={`font-medium ${
                roll.grade === 'triumph' || roll.grade === 'success' ? 'text-grass' : 'text-blood'
              }`}
            >
              {GRADE_LABEL[roll.grade]}
            </span>
          </div>
        )}

        {/* 결과 */}
        {done && (
          <div className="mt-2 space-y-1 border-t border-stoneDark pt-2 text-[12px]">
            <p className="leading-relaxed">{view.narration}</p>

            <div className="flex flex-wrap gap-x-3 text-inkSoft tabular-nums">
              {loot.map(([r, n]) => (
                <span key={r}>
                  {RESOURCE_LABEL[r]} +{n}
                </span>
              ))}
              <span>경험 +{view.outcome.xp}</span>
              {view.outcome.hpLoss > 0 && (
                <span className="text-blood">기력 −{view.outcome.hpLoss}</span>
              )}
            </div>

            {view.relicName !== null && (
              <p className="text-gold">유물 — {view.relicName}</p>
            )}
            {view.levelUp !== null && (
              <p className="text-grass">
                {view.levelUp.to}단계가 되었다. 능력치 {view.levelUp.statPoints} · 스킬{' '}
                {view.levelUp.skillPoints}
              </p>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={done ? close : skip}
          style={{ minHeight: TOUCH_MIN }}
          className="mt-3 w-full rounded border border-stoneDark bg-paperDim text-[13px]"
        >
          {done ? '닫기' : '건너뛰기'}
        </button>
      </div>
    </div>
  );
}
