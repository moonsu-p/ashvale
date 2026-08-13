/**
 * 시대 테이블 — §5. 필요 power(인구)와 전환 문장(무주어 문어체).
 * 전환 문장은 기획서 §5 표의 것을 그대로 쓴다(새로 쓰지 않는다).
 */

export interface Era {
  index: number;
  name: string;
  threshold: number; // 필요 power
  transition: string; // 전환 문장 (§5)
}

export const ERAS: Era[] = [
  { index: 0, name: '개척기', threshold: 0, transition: '천막 몇 개와 굳은 결심뿐이다.' },
  { index: 1, name: '정착기', threshold: 6, transition: '연기가 피어오르고, 길이 다져진다.' },
  { index: 2, name: '성장기', threshold: 14, transition: '이름을 듣고 사람들이 찾아온다.' },
  { index: 3, name: '영주기', threshold: 26, transition: '성벽 위에 깃발이 걸린다.' },
  { index: 4, name: '왕국기', threshold: 42, transition: '왕실의 지도에 이름이 오른다.' },
  { index: 5, name: '전설기', threshold: 62, transition: '이곳의 이야기는 국경을 넘는다.' },
  { index: 6, name: '신화기', threshold: 90, transition: '세대가 지나도 연대기는 계속된다.' },
];

export const MYTHIC_ERA = 6;
/** 신화기 이후 무한 등급: eraTier = floor((power-90)/30)+1 (§5) */
export const TIER_BASE_POWER = 90;
export const TIER_STEP = 30;

/** 붕괴 1회당 시대 상승 임계값 완화 비율 (§15.2 재기 보정) */
export const REBOUND_PER_COLLAPSE = 0.05;

/** 티어 로마 숫자 표기 (II, III, …). 표기용. */
export function tierRoman(tier: number): string {
  const R = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];
  return R[tier] ?? `${tier}`;
}
