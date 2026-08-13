/**
 * 격자 크기 파생 — 순수 함수. 시대에 따라 확장한다 (§10.4).
 * 시대 0–1: 12×12 · 2–3: 18×18 · 4+: 24×24.
 */

/** 시대 인덱스별 격자 한 변 길이 (타일 수). 인덱스 4 이상은 24 로 고정. */
export const GRID_BY_ERA = [12, 12, 18, 18, 24] as const;

export function gridSizeForEra(eraIndex: number): number {
  const clamped = Math.min(Math.max(eraIndex, 0), GRID_BY_ERA.length - 1);
  return GRID_BY_ERA[clamped]!;
}
