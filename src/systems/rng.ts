/**
 * 시드 주입 가능한 난수 (§4 구현 지침).
 *
 * 규칙 로직은 `Math.random()`을 부르지 않는다. 전부 이 Rng를 인자로 받는다:
 *   (state, input, rng) => { state, entries }
 * 그래야 같은 시드에서 같은 결과가 나오고, 판정을 재현해서 확인할 수 있다.
 *
 * 상태는 32비트 정수 하나뿐이다. 필요하면 `snapshot()`으로 꺼내고
 * `createRng(seed, state)`로 그 자리에서 다시 시작할 수 있다.
 */

export interface Rng {
  /** [0, 1) */
  next(): number;
  /** [min, max] 정수 양끝 포함 */
  int(min: number, max: number): number;
  /** 확률 p(0..1)로 참 */
  chance(p: number): boolean;
  /** 배열에서 하나. 빈 배열이면 undefined */
  pick<T>(items: readonly T[]): T | undefined;
  /** 원본을 건드리지 않고 섞은 새 배열 */
  shuffle<T>(items: readonly T[]): T[];
  /** 서로 간섭하지 않는 갈래. 한 판정이 다른 판정의 순서를 밀지 않게 할 때 */
  fork(label: string): Rng;
  /** 현재 내부 상태. 이어서 돌리려면 이 값을 보관한다 */
  snapshot(): number;
}

/** 문자열·숫자 아무거나 32비트 시드로 (FNV-1a) */
export function hashSeed(seed: string | number): number {
  const text = typeof seed === 'number' ? String(seed) : seed;
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * mulberry32. 작고 빠르고 주기가 이 게임에 충분하다.
 * 암호용이 아니다 — 쓸 일도 없다.
 */
export function createRng(seed: string | number, state?: number): Rng {
  let s = (state ?? hashSeed(seed)) >>> 0;

  const next = (): number => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,

    int(min, max) {
      if (max < min) [min, max] = [max, min];
      return min + Math.floor(next() * (max - min + 1));
    },

    chance(p) {
      return next() < p;
    },

    pick(items) {
      if (items.length === 0) return undefined;
      return items[Math.floor(next() * items.length)];
    },

    shuffle(items) {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(next() * (i + 1));
        const tmp = out[i]!;
        out[i] = out[j]!;
        out[j] = tmp;
      }
      return out;
    },

    fork(label) {
      return createRng(`${s}:${label}`);
    },

    snapshot() {
      return s;
    },
  };

  return rng;
}
