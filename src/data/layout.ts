/**
 * 화면 치수 — 기획서 §0, §2 기준. 393×852dp 세로 고정.
 * 코드에 숫자를 박지 않는다. 레이아웃 수치는 전부 여기서 가져온다.
 */

/** 기준 뷰포트 (dp) */
export const VIEWPORT = {
  width: 393,
  height: 852,
} as const;

/**
 * 세로 3단.
 *
 * 40 + 470 + 180 = 690 으로 기준 높이 852보다 작다. 남는 162는 기기마다 다른
 * 시스템 바·주소 표시줄 몫이다. 그래서 필드는 고정이 아니라 **최소 470으로 두고
 * 남는 높이를 흡수**한다. HUD와 조작부만 고정이다.
 */
export const BANDS = {
  hudHeight: 40,
  fieldMinHeight: 470,
  controlsHeight: 180,
} as const;

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
