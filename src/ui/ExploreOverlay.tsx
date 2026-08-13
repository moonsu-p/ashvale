/**
 * 탐험 판정 연출 — §1 원칙 2(판정 공개)를 그래픽으로. §6, §10.4, §10.5.
 * 1d20 이 돌아가다 멈추고, 보정값이 하나씩 더해지며 난이도 선을 넘는지 단계적으로 보인다.
 * 대성공 섬광 · 위기 흔들림+붉은 비네트. 탭으로 스킵, reduced-motion 은 즉시 결과.
 * 서술은 content/region-text.ts 에서 왔다(여기서 문장을 만들지 않는다).
 */

import { useEffect, useRef, useState } from 'react';
import { PALETTE } from '@/data/palette';
import { REGION_TEXT, type Grade } from '@/data/content/region-text';
import { useGameStore } from '@/store/useGameStore';
import { relicById } from '@/systems/relics';
import type { ExploreOutcome } from '@/systems/explore';
import type { ResourceId } from '@/types/game';

const GRADE_LABEL: Record<Grade, string> = {
  triumph: '대성공',
  success: '성공',
  failure: '실패',
  crisis: '위기',
};
const GRADE_COLOR: Record<Grade, string> = {
  triumph: PALETTE.flameBright,
  success: PALETTE.grassLight,
  failure: PALETTE.flame,
  crisis: PALETTE.blood,
};
const RES_LABEL: Record<ResourceId, string> = { wood: '목재', stone: '석재', food: '식량', gold: '금화' };

function reduced(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}

export function ExploreOverlay({ outcome }: { outcome: ExploreOutcome }) {
  const confirmExplore = useGameStore((s) => s.confirmExplore);
  const label = REGION_TEXT[outcome.regionId]?.label ?? outcome.regionId;

  const doneStep = outcome.steps.length + 1;
  const [step, setStep] = useState(0); // 0: 굴리는 중, 1..n: 보정 공개, doneStep: 결과
  const [die, setDie] = useState(outcome.d20);
  const timers = useRef<number[]>([]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setDie(outcome.d20);
    setStep(doneStep);
  };

  useEffect(() => {
    if (reduced()) {
      setStep(doneStep);
      return;
    }
    const dieTimer = window.setInterval(() => setDie(1 + Math.floor(Math.random() * 20)), 60);
    const t: number[] = [];
    t.push(window.setTimeout(() => {
      window.clearInterval(dieTimer);
      setDie(outcome.d20);
      setStep(1);
    }, 700));
    for (let i = 0; i < outcome.steps.length; i++) {
      t.push(window.setTimeout(() => setStep(2 + i), 700 + (i + 1) * 350));
    }
    t.push(window.setTimeout(() => setStep(doneStep), 700 + (outcome.steps.length + 1) * 350));
    timers.current = t;
    return () => {
      window.clearInterval(dieTimer);
      t.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDone = step >= doneStep;
  const revealed = Math.max(0, Math.min(outcome.steps.length, step - 1));
  const runningTotal = die + outcome.steps.slice(0, revealed).reduce((a, s) => a + s.value, 0);

  const effectClass = isDone && !reduced()
    ? outcome.grade === 'crisis'
      ? 'ash-shake'
      : ''
    : '';

  return (
    <div
      onClick={() => (isDone ? undefined : skip())}
      className={`absolute inset-0 z-20 flex flex-col ${effectClass}`}
      style={{ background: PALETTE.slate }}
    >
      {/* 지역 배경 (일러스트 플레이스홀더) */}
      <div className="absolute inset-0" style={{ background: PALETTE.slate, opacity: 0.4 }} />
      {/* 위기 붉은 비네트 */}
      {isDone && outcome.grade === 'crisis' && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{ boxShadow: `inset 0 0 120px 40px ${PALETTE.blood}`, opacity: 0.7 }}
        />
      )}
      {/* 대성공 섬광 */}
      {isDone && outcome.grade === 'triumph' && !reduced() && (
        <div className="ash-flash pointer-events-none absolute inset-0" style={{ background: PALETTE.flameBright }} />
      )}

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center" style={{ color: PALETTE.linen }}>
        <h2 className="font-serif text-xl" style={{ color: PALETTE.paper }}>
          {label}
        </h2>

        {/* 주사위 + 누적 계산식 */}
        <div className="flex items-center gap-2 text-lg tabular-nums">
          <span
            className="flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold"
            style={{ background: PALETTE.paper, color: PALETTE.ink }}
          >
            {die}
          </span>
          {outcome.steps.slice(0, revealed).map((s, i) => (
            <span key={i} style={{ color: PALETTE.frost }}>
              +{s.value}
              <span className="ml-0.5 text-xs" style={{ color: PALETTE.stoneLight }}>
                ({s.label})
              </span>
            </span>
          ))}
        </div>

        <div className="text-sm" style={{ color: PALETTE.stoneLight }}>
          합계 <b style={{ color: PALETTE.paper }}>{isDone ? outcome.total : runningTotal}</b> · 난이도{' '}
          <b style={{ color: PALETTE.paper }}>{outcome.difficulty}</b>
        </div>

        {isDone && (
          <>
            <div className="text-sm" style={{ color: PALETTE.stoneLight }}>
              margin {outcome.margin >= 0 ? `+${outcome.margin}` : outcome.margin}
            </div>
            <div className="text-3xl font-bold" style={{ color: GRADE_COLOR[outcome.grade] }}>
              {GRADE_LABEL[outcome.grade]}
            </div>
            <p className="max-w-xs font-serif text-sm leading-relaxed">{outcome.narrative}</p>

            <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-xs">
              {(Object.entries(outcome.loot) as [ResourceId, number][]).map(([r, v]) => (
                <span key={r} style={{ color: PALETTE.grassLight }}>
                  {RES_LABEL[r]} +{v}
                </span>
              ))}
              <span style={{ color: PALETTE.frost }}>XP +{outcome.xp}</span>
              {outcome.hpDelta < 0 && <span style={{ color: PALETTE.blood }}>HP {outcome.hpDelta}</span>}
              {outcome.downed && <span style={{ color: PALETTE.blood }}>쓰러진 채 실려 옴 · 2주 휴식</span>}
            </div>

            {outcome.relicFound && (
              <p className="text-sm font-medium" style={{ color: PALETTE.gold }}>
                유물 발견 — {relicById(outcome.relicFound)?.name}
              </p>
            )}

            <button
              onClick={() => void confirmExplore()}
              className="mt-2 rounded px-6 py-2.5 text-sm font-medium"
              style={{ background: PALETTE.gold, color: PALETTE.ink }}
            >
              돌아온다
            </button>
          </>
        )}

        {!isDone && (
          <p className="absolute bottom-4 text-[10px]" style={{ color: PALETTE.stoneDark }}>
            탭하여 건너뛰기
          </p>
        )}
      </div>
    </div>
  );
}
