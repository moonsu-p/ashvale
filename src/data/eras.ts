/**
 * 시대 — 기획서 §13, §6.
 *
 * 마을 지수(power) = 전 건물 레벨 합 = 인구. 시대의 **유일한** 게이트다 (§10).
 */

export interface EraDef {
  index: number;
  name: string;
  /** 이 시대에 들어서는 데 필요한 power */
  power: number;
}

export const ERAS: EraDef[] = [
  { index: 0, name: '개척기', power: 0 },
  { index: 1, name: '정착기', power: 6 },
  { index: 2, name: '성장기', power: 14 },
  { index: 3, name: '영주기', power: 26 },
  { index: 4, name: '왕국기', power: 42 },
  { index: 5, name: '전설기', power: 62 },
  { index: 6, name: '신화기', power: 90 },
];

/** 신화기 이후로는 이만큼마다 티어가 하나씩 오른다 (§13) */
export const MYTHIC_POWER = 90;
export const MYTHIC_TIER_STEP = 30;

/** 로마 숫자 — 신화기 II, III … 표기용 */
const ROMAN = ['', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export function eraName(eraIndex: number, eraTier: number): string {
  const base = ERAS[Math.min(eraIndex, ERAS.length - 1)]?.name ?? '개척기';
  if (eraTier <= 0) return base;
  return `${base} ${ROMAN[Math.min(eraTier, ROMAN.length - 1)] ?? ''}`.trim();
}

/**
 * 마을 크기 (§6 시대에 따른 마을 확장).
 * 맵을 여러 벌 그리지 않는다 — 큰 맵 하나에서 이 범위 바깥을 잠근다.
 */
export interface TownExtent {
  width: number;
  height: number;
}

export const TOWN_EXTENT: TownExtent[] = [
  { width: 20, height: 18 }, // 0 개척기
  { width: 20, height: 18 }, // 1 정착기
  { width: 28, height: 24 }, // 2 성장기
  { width: 28, height: 24 }, // 3 영주기
  { width: 36, height: 30 }, // 4 왕국기
  { width: 36, height: 30 }, // 5 전설기+
];

/** 가장 큰 마을. 맵은 항상 이 크기로 만들고 바깥을 잠근다 */
export const TOWN_MAX: TownExtent = { width: 36, height: 30 };

export function extentFor(eraIndex: number): TownExtent {
  return TOWN_EXTENT[Math.min(eraIndex, TOWN_EXTENT.length - 1)] ?? TOWN_MAX;
}

export interface Rect {
  x0: number;
  y0: number;
  /** 경계 포함 */
  x1: number;
  y1: number;
}

/**
 * 그 시대에 걸어다닐 수 있는 범위.
 *
 * 개척기 자리를 **남서쪽 귀퉁이**에 두고 북쪽·동쪽으로 넓어진다 —
 * §6 이 성장기에 북쪽 구역, 왕국기에 동쪽 구역을 연다고 적어 두었다.
 */
export function playableRect(eraIndex: number): Rect {
  const { width, height } = extentFor(eraIndex);
  return {
    x0: 0,
    y0: TOWN_MAX.height - height,
    x1: width - 1,
    y1: TOWN_MAX.height - 1,
  };
}

export function inRect(rect: Rect, x: number, y: number): boolean {
  return x >= rect.x0 && x <= rect.x1 && y >= rect.y0 && y <= rect.y1;
}
