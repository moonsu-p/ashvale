/**
 * 거점 지면 색 — M1 골격의 격자 지면 표현용. 색은 팔레트에서만 온다 (§10.2).
 *
 * assets.ts 의 지형 플레이스홀더는 전부 단색(grass)이라 격자 대비가 안 난다.
 * 지면은 파생 시각 요소이므로(§3) 여기서 팔레트 내 변주 색을 정의해 결정론적으로 깐다.
 * 실제 타일셋이 들어오면 이 표는 제거되고 assets 매니페스트가 그 자리를 맡는다.
 */

import { PALETTE } from './palette';

/** 가중치 순: 앞쪽일수록 자주 등장 */
export const GROUND_COLORS: string[] = [
  PALETTE.grass,
  PALETTE.grass,
  PALETTE.grassLight,
  PALETTE.grassDark,
  PALETTE.dirtLight,
];

/** 격자선 색 (팔레트 내, 낮은 알파로 오버레이) */
export const GRID_LINE_COLOR = PALETTE.ink;
export const GRID_LINE_ALPHA = 0.12;
