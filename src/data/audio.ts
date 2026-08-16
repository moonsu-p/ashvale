/**
 * 효과음 — **파일이 없다.** 전부 그 자리에서 합성한다.
 *
 * 음원을 받아 넣지 않는 이유:
 *  1. 비통신 요구사항(§14)과 부딪히지 않는다. 받을 것도 실을 것도 없다
 *  2. 번들이 한 바이트도 안 는다. 이미 §12 목표를 넘고 있다
 *  3. 16px 픽셀 화면에 칩튠 쪽이 어울린다
 *
 * 소리는 짧아야 한다. 한 칸 걷는 데 140ms 인데 발소리가 그보다 길면 겹친다.
 */

export type Wave = 'square' | 'triangle' | 'sawtooth' | 'sine' | 'noise';

export interface Tone {
  wave: Wave;
  /** Hz. 여러 개면 차례로 이어 낸다 */
  freq: number[];
  /** 음 하나의 길이(ms) */
  step: number;
  /** 0..1 */
  gain: number;
  /** 끝을 얼마나 부드럽게 끊을지(ms) */
  release?: number;
}

/** 전체 음량. 게임 소리가 크면 아무도 안 켠다 */
export const MASTER_GAIN = 0.22;

export const SFX: Record<string, Tone> = {
  /** 한 칸 걸음. 아주 짧고 낮게 — 계속 들리는 소리다 */
  step: { wave: 'square', freq: [110], step: 34, gain: 0.35, release: 20 },
  /** 방향만 바꿈 */
  turn: { wave: 'square', freq: [90], step: 26, gain: 0.22, release: 14 },
  /** 벽에 막힘 */
  bump: { wave: 'square', freq: [70], step: 50, gain: 0.3, release: 30 },

  /** A — 확인 */
  confirm: { wave: 'square', freq: [440, 660], step: 42, gain: 0.4, release: 40 },
  /** 물러남·닫기 */
  cancel: { wave: 'square', freq: [330, 220], step: 42, gain: 0.32, release: 40 },
  /** 대사 한 줄 넘김 */
  talk: { wave: 'triangle', freq: [520], step: 26, gain: 0.22, release: 20 },
  /** 선택지 고름 */
  choose: { wave: 'square', freq: [590, 790], step: 48, gain: 0.4, release: 50 },

  /** 주사위 구르는 소리 */
  dice: { wave: 'noise', freq: [0], step: 46, gain: 0.28, release: 30 },
  /** 성공·대성공 */
  good: { wave: 'square', freq: [523, 659, 784], step: 62, gain: 0.4, release: 90 },
  /** 실패·위기 */
  bad: { wave: 'sawtooth', freq: [330, 262, 196], step: 74, gain: 0.34, release: 110 },

  /** 건물이 올라감 */
  build: { wave: 'square', freq: [147, 196], step: 66, gain: 0.4, release: 80 },
  /** 레벨업 */
  levelUp: { wave: 'square', freq: [523, 659, 784, 1047], step: 66, gain: 0.42, release: 120 },
  /** 선물·호감 */
  warm: { wave: 'triangle', freq: [659, 880], step: 70, gain: 0.34, release: 100 },
  /** 마을이 무너짐 */
  collapse: { wave: 'sawtooth', freq: [196, 147, 110, 82], step: 150, gain: 0.4, release: 300 },
};

export type SfxId = keyof typeof SFX;

/** 소리 설정은 세이브와 별개다. 판을 지워도 남는다 */
export const AUDIO_KEY = 'ashvale:audio';
