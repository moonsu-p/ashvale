/**
 * 대화 화면 수치 — 기획서 §8.1, §8.3.
 * 이 게임의 얼굴이다. 값을 눈대중으로 바꾸지 말고 여기서 고친다.
 */

/** 글자당 타이핑 간격(ms) */
export const TYPE_MS = 26;

/** 인물 이미지가 떠오르는 거리(px)와 시간(ms) */
export const PORTRAIT_RISE = 14;
export const PORTRAIT_FADE_MS = 280;

/** 인물 이미지 폭 — 화면폭 대비. 비율은 3:4 세로 */
export const PORTRAIT_WIDTH_RATIO = 0.78;
export const PORTRAIT_ASPECT = 3 / 4;

/** 선택지는 최대 3개까지만 세로로 쌓는다 (§8.3) */
export const MAX_CHOICES = 3;

/** 필드를 지우지 않고 어둡게만 깐다. 어디서 대화 중인지 보여야 한다 */
export const FIELD_DIM = 0.62;
