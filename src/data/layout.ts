/**
 * 화면 치수 — 기획서 §0, §2 기준.
 * 코드에 숫자를 박지 않는다. 레이아웃 수치는 전부 여기서 가져온다.
 *
 * 기준 기기는 **갤럭시 Z 플립 4** 메인 화면이다.
 * 2640×1080 물리 픽셀, DPR 2.625 → 약 412×1006dp. 22:9 로 아주 길쭉하다.
 * (기획서 §0 은 393×852 로 적혀 있다. 실제 기기에 맞춰 여기를 올렸다.)
 */

/** 기준 뷰포트 (dp) */
export const VIEWPORT = {
  width: 412,
  height: 1006,
} as const;

/**
 * 넓은 화면에서 통이 무한정 늘어나지 않게 하는 상한.
 * 기준 폭보다 조금 넉넉히 둬서 폰에서는 항상 꽉 찬다.
 */
export const FRAME_MAX_WIDTH = 480;

/**
 * 세로 3단.
 *
 * HUD 는 고정, 필드는 남는 높이를 흡수한다.
 * 조작부는 **화면이 길수록 조금 자란다** — 22:9 기기에서 조작부를 180 에 묶어 두면
 * 필드만 25칸 넘게 길어지고 엄지가 닿는 자리는 그대로다.
 * 정수 배율(16px ×2)을 지켜야 해서 확대로는 못 메운다. 대신 조작부를 넓힌다.
 */
export const BANDS = {
  hudHeight: 40,
  fieldMinHeight: 470,
  controlsHeight: 180,
  /** 조작부가 자라는 비율과 상한 */
  controlsRatio: 0.22,
  controlsMax: 240,
} as const;

/** CSS clamp 식. 타일윈드 설정과 화면 양쪽에서 같은 값을 쓴다 */
export const CONTROLS_HEIGHT_CSS = `clamp(${BANDS.controlsHeight}px, ${
  BANDS.controlsRatio * 100
}vh, ${BANDS.controlsMax}px)`;

/** 타일 — 16px 원본을 ×2로 렌더한다 (§0) */
export const TILE = {
  source: 16,
  scale: 2,
  /** 화면에 찍히는 한 칸 크기 */
  render: 32,
} as const;

/** 터치 타깃 최소 44dp */
export const TOUCH_MIN = 44;

/** D패드 버튼은 46dp 정사각 (§5 조작) */
export const DPAD_BUTTON = 46;

/** 한 칸 이동에 걸리는 시간(ms). §5 */
export const STEP_MS = 140;

/**
 * 방향만 바꾼 뒤 걷기 시작할 때까지 두는 틈(ms).
 *
 * 0으로 두면 방향키를 누르고 있을 때 전환이 한 프레임에 지나가 버려서
 * "방향만 바뀌었다"가 눈에 안 보인다. 툭 눌러 돌아보는 맛이 여기서 나온다.
 */
export const TURN_HOLD_MS = 70;
