/**
 * 공용 팔레트 v2 — 세계 32색 + 캐릭터 8색 = 40색 고정
 * 기획서 v2 §12 준수. 이 파일이 유일한 색 출처다.
 *
 * v2 변경: 캐릭터 팩(15 Top-Down Character Sprites, CC0)의 8색이 메가드라이브풍
 * 밝은 파스텔이어서, 기존 차분한 흙색 세계 팔레트와 붙이면 캐릭터가 스티커처럼 떴다.
 * 캐릭터를 리맵하는 대신 **세계 색의 명도·채도를 올려** 같은 시대의 그림으로 읽히게 맞췄다.
 *
 * 규칙:
 *  1. 여기 없는 색을 코드 어디에도 쓰지 않는다. Tailwind 기본 팔레트도 쓰지 않는다.
 *  2. CHAR 그룹은 **절대 수정하지 않는다.** 캐릭터 팩 원본 색이며 15종이 공유한다.
 *  3. 외부 타일셋은 scripts/remap-palette.ts 로 WORLD 그룹에 맞춘다.
 *     캐릭터 팩은 리맵 대상에서 제외한다.
 */

/** 캐릭터 팩 원본 8색. 수정 금지 */
export const CHAR = {
  outline: '#000048',   // 외곽선 (짙은 남색)
  hair:    '#FFFF92',   // 밝은 금발
  skin:    '#FFDBB6',
  skinShade:'#FFB692',
  clothA:  '#2092DB',   // 밝은 파랑
  clothB:  '#006DB6',   // 짙은 파랑
  accent:  '#FF6D6D',   // 신발·입
  white:   '#FFFFFF',
} as const;

/** 세계 32색. 캐릭터 팩과 어울리도록 v1보다 밝고 채도를 올렸다 */
export const PALETTE = {
  // ── 지형·자연 (8)
  grassLight: '#8FB85A',
  grass:      '#6D9642',
  grassDark:  '#4C7030',
  dirtLight:  '#C09A66',
  dirt:       '#9C7848',
  soilDark:   '#6B5231',
  water:      '#4A93A8',
  waterDeep:  '#2E6675',

  // ── 석재·구조 (6)
  stoneLight: '#CFC9B8',
  stone:      '#A29C8C',
  stoneDark:  '#736E64',
  slate:      '#545458',
  woodLight:  '#C4915A',
  wood:       '#9A6B3C',

  // ── 지붕·금속 (5)
  roofRed:    '#B85647',
  roofBlue:   '#54719C',
  thatch:     '#DDB25F',
  metal:      '#AEB5BD',
  gold:       '#E8B646',

  // ── 천·인물 보조 (4)
  linen:      '#F0E6CE',
  clothWarm:  '#DC8C63',
  clothCool:  '#7789AC',
  clothDark:  '#4B4954',

  // ── 빛·효과 (5)
  flame:      '#F08E42',
  flameBright:'#FFD265',
  frost:      '#CFE4EA',
  rift:       '#A88CE0',
  blood:      '#8A3636',

  // ── UI (4)
  ink:        '#1E1D22',
  inkSoft:    '#3A3840',
  paper:      '#F4ECDA',
  paperDim:   '#D6CCB6',
} as const;

export type PaletteKey = keyof typeof PALETTE;

/** 리맵 스크립트가 목표로 삼는 색. 캐릭터 색은 제외한다 */
export const WORLD_HEXES: string[] = Object.values(PALETTE);

/** 전체 40색. 검증·문서용 */
export const ALL_HEXES: string[] = [...WORLD_HEXES, ...Object.values(CHAR)];

/** 계절 틴트 — 곱셈 오버레이. 캐릭터 레이어에는 적용 강도를 절반으로 낮춘다 */
export const SEASON_TINT = {
  spring: { color: PALETTE.grassLight,  alpha: 0.10 },
  summer: { color: PALETTE.flameBright, alpha: 0.08 },
  autumn: { color: PALETTE.thatch,      alpha: 0.16 },
  winter: { color: PALETTE.frost,       alpha: 0.22 },
} as const;

/** 캐릭터에 걸리는 틴트 배율. 1.0이면 인물이 배경과 함께 물들어 안 읽힌다 */
export const CHAR_TINT_SCALE = 0.5;

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
  debug: PALETTE.rift,
} as const;
