/**
 * 효과음 재생 — Web Audio 로 그 자리에서 합성한다. 음원 파일이 없다.
 *
 * 브라우저는 사용자가 화면을 건드리기 전에는 소리를 못 내게 막는다.
 * 그래서 AudioContext 를 미리 만들지 않고, 첫 입력 때 깨운다.
 *
 * 여기가 오디오 API 를 부르는 유일한 자리다.
 */

import { MASTER_GAIN, SFX, type SfxId, type Tone } from '@/data/audio';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;

/** 잡음용 짧은 버퍼. 매번 만들지 않고 한 번만 굽는다 */
let noiseBuffer: AudioBuffer | null = null;

function ensureContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;

  if (ctx === null) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (Ctor === undefined) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = MASTER_GAIN;
    master.connect(ctx.destination);
  }

  // 자동 재생 정책으로 잠들어 있으면 깨운다
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function getNoise(context: AudioContext): AudioBuffer {
  if (noiseBuffer === null) {
    const length = Math.floor(context.sampleRate * 0.2);
    noiseBuffer = context.createBuffer(1, length, context.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    // 결정적이어도 상관없다. 짧아서 반복이 안 들린다
    let seed = 1;
    for (let i = 0; i < length; i++) {
      seed = (seed * 1103515245 + 12345) & 0x7fffffff;
      data[i] = (seed / 0x3fffffff - 1) * 0.6;
    }
  }
  return noiseBuffer;
}

function playTone(context: AudioContext, tone: Tone, at: number, freq: number): void {
  const gain = context.createGain();
  gain.connect(master ?? context.destination);

  const dur = tone.step / 1000;
  const release = (tone.release ?? 20) / 1000;

  // 딱 끊으면 '틱' 소리가 난다. 짧게 붙였다 뗀다
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(tone.gain, at + 0.004);
  gain.gain.setValueAtTime(tone.gain, at + dur);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + dur + release);

  if (tone.wave === 'noise') {
    const src = context.createBufferSource();
    src.buffer = getNoise(context);
    src.connect(gain);
    src.start(at);
    src.stop(at + dur + release);
    return;
  }

  const osc = context.createOscillator();
  osc.type = tone.wave;
  osc.frequency.setValueAtTime(freq, at);
  osc.connect(gain);
  osc.start(at);
  osc.stop(at + dur + release);
}

export function play(id: SfxId): void {
  if (!enabled) return;
  const tone = SFX[id];
  if (tone === undefined) return;

  const context = ensureContext();
  if (context === null) return;

  const start = context.currentTime;
  tone.freq.forEach((freq, i) => {
    playTone(context, tone, start + (i * tone.step) / 1000, freq);
  });
}

/**
 * 켜고 끄기. **저장은 여기서 하지 않는다** —
 * localStorage 를 직접 부르는 건 StorageAdapter 밖에서 금지다 (CLAUDE.md).
 * 읽고 쓰는 일은 스토어가 어댑터를 거쳐 한다.
 */
export function setAudioEnabled(on: boolean): void {
  enabled = on;
}

export function isAudioEnabled(): boolean {
  return enabled;
}
