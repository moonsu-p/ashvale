/**
 * 지역 해금 — 순수 함수 (§6). 시대 도달 + 이전 지역 대성공(counters.firsts)이 모두 만족돼야 열린다.
 * 대성공 추적(triumphKey)은 M5 탐험이 채운다. M4 는 해금 메커니즘과 연대기 기록을 배선한다.
 */

import type { GameState, ChronicleEntry, Season } from '@/types/game';
import { REGION_ORDER, REGION_UNLOCK_ERA, prevRegion, triumphKey, regionUnlockKey } from '@/data/regions';
import { regionUnlockText } from '@/data/chronicle-system';

export function isRegionUnlockable(state: GameState, id: string): boolean {
  const gate = REGION_UNLOCK_ERA[id];
  if (gate === undefined) return false;
  if (state.world.eraIndex < gate) return false;
  const prev = prevRegion(id);
  if (prev === null) return true; // 첫 지역은 선행 조건 없음
  return state.counters.firsts[triumphKey(prev)] === true;
}

/**
 * 해금 가능한 지역을 unlockedRegions 에 추가하고 최초 해금 연대기를 만든다.
 * 상태를 변이하고 새로 열린 지역의 연대기 항목 배열을 돌려준다.
 */
export function checkRegionUnlocks(state: GameState, season: Season): ChronicleEntry[] {
  const entries: ChronicleEntry[] = [];
  for (const id of REGION_ORDER) {
    if (state.world.unlockedRegions.includes(id)) continue;
    if (!isRegionUnlockable(state, id)) continue;
    state.world.unlockedRegions.push(id);
    if (!state.counters.firsts[regionUnlockKey(id)]) {
      state.counters.firsts[regionUnlockKey(id)] = true;
      entries.push({
        year: state.world.year,
        week: state.world.week,
        season,
        kind: 'milestone',
        text: regionUnlockText(id),
      });
    }
  }
  return entries;
}
