/**
 * 공용 팔레트 — 32색 고정
 * 기획서 §10.2 준수. 이 파일이 유일한 색 출처다.
 *
 * 규칙:
 *  1. 여기 없는 색을 코드 어디에도 쓰지 않는다. Tailwind 기본 팔레트도 쓰지 않는다.
 *     맵과 UI의 색온도가 어긋나는 원인이 그것이다.
 *  2. 외부에서 가져온 타일셋은 scripts/remap-palette.ts로 이 팔레트에 맞춘다.
 *  3. 계절 틴트도 이 안의 색으로만 만든다. 새 색을 추가하지 않는다.
 */

export const PALETTE = {
  // ── 지형·자연 (8)
  grassLight: '#7A9E4B',
  grass: '#5C7F38',
  grassDark: '#3F5C28',
  dirtLight: '#A8875C',
  dirt: '#86673F',
  soilDark: '#5B452A',
  water: '#3E7A8C',
  waterDeep: '#275663',

  // ── 석재·구조 (6)
  stoneLight: '#B9B4A6',
  stone: '#8E897B',
  stoneDark: '#64605A',
  slate: '#4A4A4E',
  woodLight: '#B0824C',
  wood: '#8A5F35',

  // ── 지붕·금속 (5)
  roofRed: '#9E4B3C',
  roofBlue: '#4A6389',
  thatch: '#C9A055',
  metal: '#9FA6AE',
  gold: '#D2A33C',

  // ── 천·인물 (4)
  linen: '#E4D9C0',
  clothWarm: '#C97F5A',
  clothCool: '#6B7C9E',
  clothDark: '#43414C',

  // ── 빛·효과 (5)
  flame: '#E0803A',
  flameBright: '#F3C05A',
  frost: '#BCD6DE',
  rift: '#9C7FD4',
  blood: '#7A2F2F',

  // ── UI (4)
  ink: '#1E1D22',
  inkSoft: '#3A3840',
  paper: '#EFE7D5',
  paperDim: '#CFC5AE',
} as const;

export type PaletteKey = keyof typeof PALETTE;
export const PALETTE_HEXES: string[] = Object.values(PALETTE);

/**
 * 계절 틴트 — 곱셈 오버레이용. 팔레트 내 색만 사용 (§2 계절 보정과 연동)
 * alpha는 SettlementScene에서 곱해지는 강도
 */
export const SEASON_TINT = {
  spring: { color: PALETTE.grassLight, alpha: 0.10 },
  summer: { color: PALETTE.flameBright, alpha: 0.08 },
  autumn: { color: PALETTE.thatch, alpha: 0.16 },
  winter: { color: PALETTE.frost, alpha: 0.22 },
} as const;

/** 역할별 UI 색. 새 색을 만들지 말고 여기서 뽑아 쓴다 */
export const UI = {
  bg: PALETTE.paper,
  bgSunken: PALETTE.paperDim,
  text: PALETTE.ink,
  textMuted: PALETTE.inkSoft,
  border: PALETTE.stoneDark,
  accent: PALETTE.gold,
  danger: PALETTE.blood,
  success: PALETTE.grass,
  warning: PALETTE.flame,
  /** 미완성 에셋 표시용. §11.1 debugAssets */
  debug: PALETTE.rift,
} as const;
