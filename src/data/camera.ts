/**
 * 카메라·렌더 상수 — §10.1, §10.4. 코드에 숫자를 박지 않기 위한 단일 출처다.
 */

/** 픽셀아트 원본 타일 크기 (px). 정수배 스케일로 렌더한다 (§10.1) */
export const TILE_SRC = 16;

/** userZoom 1.0 이 화면에서 32px(=×2) 이 되도록 카메라에 곱하는 기본 배율 */
export const BASE_SCALE = 2;

/** 줌 스냅 단계 (§10.4). 임의 배율은 픽셀을 흐리게 하므로 이 값들로만 스냅한다 */
export const ZOOM_SNAPS = [0.5, 0.75, 1.0, 1.5, 2.0] as const;
export const ZOOM_MIN: number = ZOOM_SNAPS[0];
export const ZOOM_MAX: number = ZOOM_SNAPS[ZOOM_SNAPS.length - 1]!;
export const ZOOM_DEFAULT = 1.0;

/** 이 값 미만에서 워커·파티클(detail 레이어)을 숨긴다 (§10.4 LOD) */
export const LOD_HIDE_BELOW = 0.75;

/** 더블 탭 판정 시간(ms)과 탭으로 인정할 최대 이동(px) */
export const DOUBLE_TAP_MS = 300;
export const TAP_MOVE_MAX = 12;

/** 팬 한계용 여백 (타일 수) */
export const PAN_MARGIN_TILES = 3;
