/**
 * 지역 해금 게이트 — §6 지역 표. 서술·라벨은 content/region-text.ts 에서 가져온다.
 * 해금 조건(§6): 시대 도달 + 이전 지역에서 대성공 1회. 대성공 추적은 M5 탐험이 채운다.
 */

export const REGION_ORDER = ['whisper', 'gate', 'marsh', 'peaks', 'deep', 'rift'] as const;

/** 지역별 해금 시대 (§6) */
export const REGION_UNLOCK_ERA: Record<string, number> = {
  whisper: 0,
  gate: 1,
  marsh: 2,
  peaks: 3,
  deep: 4,
  rift: 5,
};

/** 직전 지역(대성공 선행 조건 대상). 첫 지역은 없음. */
export function prevRegion(id: string): string | null {
  const i = REGION_ORDER.indexOf(id as (typeof REGION_ORDER)[number]);
  return i > 0 ? REGION_ORDER[i - 1]! : null;
}

/** 대성공 추적 키 (counters.firsts 에 저장) — M5 탐험이 세팅한다. */
export function triumphKey(regionId: string): string {
  return `triumph:${regionId}`;
}
/** 지역 최초 해금 기록 키 (연대기 중복 방지) */
export function regionUnlockKey(regionId: string): string {
  return `region:${regionId}`;
}
