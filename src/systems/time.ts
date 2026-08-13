/**
 * 시간·계절 파생 — 순수 함수. 시각 상태(계절 틴트 등)는 저장하지 않고 여기서 파생한다 (§3).
 * 1년 = 48주, 계절당 12주. week 는 1..48.
 */

import type { Season } from '@/types/game';

export const WEEKS_PER_YEAR = 48;
export const WEEKS_PER_SEASON = 12;

export function seasonOf(week: number): Season {
  const idx = Math.floor(((week - 1 + WEEKS_PER_YEAR) % WEEKS_PER_YEAR) / WEEKS_PER_SEASON);
  return (idx % 4) as Season;
}

export const SEASON_NAMES = ['봄', '여름', '가을', '겨울'] as const;

export function seasonName(week: number): string {
  return SEASON_NAMES[seasonOf(week)];
}
