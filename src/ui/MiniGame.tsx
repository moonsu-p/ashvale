/**
 * 따라 하기 — 나들이에서 하는 작은 놀이 (§8).
 *
 * 보여 주는 순서대로 누르면 이긴다. **어렵게 만들지 않는다.**
 * 이기려고 하는 놀이가 아니라 이기고 나서 하는 대화가 목적이다.
 *   - 세 번뿐이다
 *   - 보여 주는 속도가 느리다
 *   - 틀려도 벌이 없다. 다시 할 수 있다
 *
 * 조작은 이 게임이 이미 쓰는 어휘 그대로 — 네 방향과 A.
 * `prefers-reduced-motion` 이면 깜빡이지 않고 순서를 글자로 적어 준다.
 */

import { useEffect, useRef, useState } from 'react';
import type { Dir } from '@/types/game';
import { GAME_HOW, GAME_TITLE } from '@/data/content/outing-events';
import { TOUCH_MIN } from '@/data/layout';
import { useReducedMotion } from './useReducedMotion';

const ARROW: Record<Dir, string> = { up: '▲', down: '▼', left: '◀', right: '▶' };
const DIRS: Dir[] = ['up', 'right', 'down', 'left'];

/** 몇 번 따라 하는가. 늘리지 않는다 */
const STEPS = 3;
/** 한 칸을 보여 주는 시간과 사이 틈 */
const SHOW_MS = 620;
const GAP_MS = 220;

type Phase = 'showing' | 'input' | 'done';

export function MiniGame({ onFinish }: { onFinish: (won: boolean) => void }) {
  const reduced = useReducedMotion();
  const [seq, setSeq] = useState<Dir[]>([]);
  const [phase, setPhase] = useState<Phase>('showing');
  const [lit, setLit] = useState<number>(-1);
  const [at, setAt] = useState(0);
  const [wrong, setWrong] = useState(false);
  const timers = useRef<number[]>([]);

  /** 순서를 새로 뽑고 보여 준다 */
  const start = () => {
    const next: Dir[] = Array.from(
      { length: STEPS },
      () => DIRS[Math.floor(Math.random() * DIRS.length)] ?? 'up',
    );
    setSeq(next);
    setAt(0);
    setWrong(false);
    setPhase('showing');
  };

  useEffect(start, []);

  // 한 칸씩 밝힌다. 움직임을 줄이라고 해 뒀으면 글자로만 보여 준다
  useEffect(() => {
    if (phase !== 'showing' || seq.length === 0) return;
    if (reduced) {
      setPhase('input');
      return;
    }

    for (const id of timers.current) window.clearTimeout(id);
    timers.current = [];

    seq.forEach((_, i) => {
      timers.current.push(
        window.setTimeout(() => setLit(i), i * (SHOW_MS + GAP_MS)),
      );
      timers.current.push(
        window.setTimeout(() => setLit(-1), i * (SHOW_MS + GAP_MS) + SHOW_MS),
      );
    });
    timers.current.push(
      window.setTimeout(() => setPhase('input'), seq.length * (SHOW_MS + GAP_MS)),
    );

    return () => {
      for (const id of timers.current) window.clearTimeout(id);
      timers.current = [];
    };
  }, [phase, seq, reduced]);

  const press = (dir: Dir) => {
    if (phase !== 'input') return;

    if (seq[at] !== dir) {
      setWrong(true);
      setPhase('done');
      return;
    }
    const next = at + 1;
    setAt(next);
    if (next >= seq.length) setPhase('done');
  };

  const won = phase === 'done' && !wrong;

  return (
    <div className="rounded border border-stoneDark bg-paperDim p-3">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-medium">{GAME_TITLE}</span>
        <span className="text-[11px] tabular-nums text-inkSoft">
          {phase === 'showing' ? '잘 봐라' : `${Math.min(at + 1, STEPS)} / ${STEPS}`}
        </span>
      </div>
      <p className="text-[11px] text-inkSoft">{GAME_HOW}</p>

      {/* 순서를 보여 주는 자리. 움직임을 줄였으면 글자로 남는다 */}
      <div className="my-2 flex h-10 items-center justify-center gap-2">
        {reduced && phase !== 'done'
          ? seq.map((d, i) => (
              <span key={i} className="text-[20px]">
                {ARROW[d]}
              </span>
            ))
          : seq.map((d, i) => (
              <span
                key={i}
                className={`text-[24px] ${
                  phase === 'showing' && lit === i
                    ? 'text-gold'
                    : phase === 'input' && i < at
                      ? 'text-grassDark'
                      : 'text-stoneDark/30'
                }`}
              >
                {phase === 'showing' && lit !== i ? '·' : ARROW[d]}
              </span>
            ))}
      </div>

      {phase === 'done' ? (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onFinish(won)}
            style={{ minHeight: TOUCH_MIN }}
            className="flex-1 rounded border border-stoneDark bg-gold text-[13px] font-medium text-ink"
          >
            {won ? '맞췄다' : '틀렸다'}
          </button>
          {!won && (
            <button
              type="button"
              onClick={start}
              style={{ minHeight: TOUCH_MIN }}
              className="flex-1 rounded border border-stoneDark bg-paper text-[13px]"
            >
              다시
            </button>
          )}
        </div>
      ) : (
        <div className="mx-auto grid w-40 grid-cols-3 gap-1">
          <span />
          <Key dir="up" onPress={press} live={phase === 'input'} />
          <span />
          <Key dir="left" onPress={press} live={phase === 'input'} />
          <span />
          <Key dir="right" onPress={press} live={phase === 'input'} />
          <span />
          <Key dir="down" onPress={press} live={phase === 'input'} />
          <span />
        </div>
      )}
    </div>
  );
}

function Key({
  dir,
  onPress,
  live,
}: {
  dir: Dir;
  onPress: (d: Dir) => void;
  live: boolean;
}) {
  return (
    <button
      type="button"
      disabled={!live}
      onClick={() => onPress(dir)}
      style={{ minHeight: TOUCH_MIN }}
      className="rounded border border-stoneDark bg-paper text-[16px] disabled:opacity-40"
    >
      {ARROW[dir]}
    </button>
  );
}
