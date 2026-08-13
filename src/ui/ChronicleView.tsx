/**
 * 연대기 — 순수 React (§9, §10.4). 연·주·계절과 종류별 색으로 항목을 보여준다.
 * 무주어 문어체 텍스트는 시스템/콘텐츠에서 이미 작성되어 들어온다(여기서 문장을 만들지 않는다).
 * 필터·강조 등 시그니처 UI 다듬기는 이후 확장한다. M2 는 최근 항목 목록까지.
 */

import { PALETTE } from '@/data/palette';
import { SEASON_NAMES } from '@/systems/time';
import type { ChronicleEntry } from '@/types/game';

const KIND_COLOR: Record<ChronicleEntry['kind'], string> = {
  quest: PALETTE.flame,
  build: PALETTE.woodLight,
  bond: PALETTE.clothWarm,
  threat: PALETTE.blood,
  era: PALETTE.gold,
  world: PALETTE.frost,
  milestone: PALETTE.rift,
};

export function ChronicleView({ entries, max = 12 }: { entries: ChronicleEntry[]; max?: number }) {
  const recent = entries.slice(-max).reverse();

  return (
    <section>
      <h2 className="mb-1 font-medium">연대기</h2>
      {recent.length === 0 ? (
        <p className="text-xs" style={{ color: PALETTE.inkSoft }}>
          아직 기록된 일이 없다.
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {recent.map((e, i) => (
            <li key={`${e.year}-${e.week}-${i}`} className="flex gap-2 text-xs leading-snug">
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full"
                style={{ background: KIND_COLOR[e.kind] }}
                aria-hidden
              />
              <span className="shrink-0 tabular-nums" style={{ color: PALETTE.inkSoft }}>
                {e.year}년 {e.week}주 {SEASON_NAMES[e.season]}
              </span>
              <span className="flex-1">{e.text}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
