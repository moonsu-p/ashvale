/**
 * 시드 주입 가능한 RNG — 테스트·재현·결정론적 파생(deriveLayout 등)에 쓴다. §3
 *
 * 규칙 로직은 (state, input, rng) => { state, entries } 형태의 순수 함수로 작성하고
 * 난수는 반드시 이 인터페이스를 통해 받는다. Math.random 을 규칙 코드에서 직접 쓰지 않는다.
 */

export interface Rng {
  /** [0, 1) */
  next(): number;
  /** 양끝 포함 정수 [min, max] */
  int(min: number, max: number): number;
  /** 확률 p 로 true (기본 0.5) */
  bool(p?: number): boolean;
  /** 배열에서 하나 선택 (비어 있으면 예외) */
  pick<T>(arr: readonly T[]): T;
  /** 주사위 1..sides */
  d(sides: number): number;
  /** salt 로 결정론적 하위 RNG 를 만든다 (배치·이벤트별 분기용) */
  fork(salt: number | string): Rng;
}

/** 문자열/숫자를 32비트 시드로 해싱 (xmur3 변형) */
export function hashSeed(seed: number | string): number {
  const str = typeof seed === 'number' ? seed.toString(36) : seed;
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/** mulberry32 — 빠르고 결정론적. 시드 하나로 완전 재현 가능 */
export function createRng(seed: number | string): Rng {
  let a = hashSeed(seed);

  const next = (): number => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const rng: Rng = {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    bool: (p = 0.5) => next() < p,
    pick: (arr) => {
      if (arr.length === 0) throw new Error('rng.pick: 빈 배열');
      return arr[Math.floor(next() * arr.length)] as (typeof arr)[number];
    },
    d: (sides) => 1 + Math.floor(next() * sides),
    fork: (salt) => createRng(hashSeed(`${a}:${salt}`)),
  };
  return rng;
}
