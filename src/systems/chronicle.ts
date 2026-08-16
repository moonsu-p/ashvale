/**
 * 연대기 기록 (§4) — 순수 함수.
 * 최근 CHRONICLE_MAX 개만 남기고 오래된 것부터 버린다.
 */

import type { ChronicleEntry } from '@/types/game';
import { CHRONICLE_MAX } from '@/data/save';

/**
 * 한 주 안에서도 여러 줄이 쌓인다. 그래서 id 에 순번을 붙인다.
 * 시각이나 난수를 쓰지 않는다 — 같은 상태에서 같은 id 가 나와야 한다.
 */
export function makeEntry(turn: number, seq: number, text: string): ChronicleEntry {
  return { id: `${turn}:${seq}`, turn, text };
}

/** 여러 줄을 한 번에 붙이고 상한을 지킨다 */
export function appendEntries(
  chronicle: ChronicleEntry[],
  entries: ChronicleEntry[],
): ChronicleEntry[] {
  if (entries.length === 0) return chronicle;
  const merged = [...chronicle, ...entries];
  return merged.length <= CHRONICLE_MAX ? merged : merged.slice(merged.length - CHRONICLE_MAX);
}
