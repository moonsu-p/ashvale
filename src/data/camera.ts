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

/** 건물 히트박스는 스프라이트보다 가로세로 각 이만큼 크게 (§10.4, px) */
export const HITBOX_EXPAND = 8;

/** 주민 워커 상한 (§10.4, §10.6 성능 예산) */
export const WORKER_MAX = 24;
/** 워커 이동 속도 (원본 px/초). 정수배 스케일과 무관한 월드 좌표 기준 */
export const WORKER_SPEED = 10;
/** 워커 스프라이트 지름 (원본 px) */
export const WORKER_SIZE = 6;
