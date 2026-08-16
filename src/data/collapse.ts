/**
 * 붕괴 (§13).
 *
 * **냉정함은 예고 없음이 아니라 되돌리기 어려움이다.**
 * 식량이 마이너스가 되는 주부터 경고가 뜨고, 2주 전에 문어체 경고가 오고,
 * 직전 1주에는 유물을 팔아 시간을 사는 거래가 한 번 열린다.
 */

/** 조건: 식량 0 미만이 4주 연속 + 인구 3 이하 */
export const COLLAPSE = {
  famineWeeks: 4,
  maxPopulation: 3,
} as const;

/** 재건 지원 */
export const REBUILD_GRANT = { wood: 20, food: 20 } as const;

/** 붕괴 1회당 시대 임계값 5% 완화 (재기 보정) */
export const ERA_RELIEF_PER_COLLAPSE = 0.05;

/** 벗(60) 미만은 떠난다. 레코드는 보존한다 — 갤러리와 연대기가 남아야 하기 때문이다 */
export const STAY_AFFINITY = 60;

/** 직전 1주에 유물을 팔아 살 수 있는 시간(주) */
export const RELIC_SALE_WEEKS = 4;
/** 그 거래로 들어오는 식량 */
export const RELIC_SALE_FOOD = 30;

/**
 * 경고 문구 (§15 — 무주어 문어체, 과거형).
 * 붕괴는 서사의 일부다. UI 경고문처럼 읽히면 안 된다.
 */
export const COLLAPSE_TEXT = {
  /** 식량이 마이너스로 돌아선 주 */
  famineBegan: '곳간이 비었다. 사람들이 배급을 반으로 줄였다.',
  /** 2주 전 */
  warning: '떠나는 이가 생겼다. 이대로 두 주가 지나면 남는 것이 없다.',
  /** 직전 1주 */
  lastCall: '남은 것은 유물뿐이었다. 그것을 넘기면 한 철은 버틸 수 있다.',
  /** 유물을 넘겼다 */
  relicSold: '유물을 내주고 곡식을 받았다. 값을 따지지 않았다.',
  /** 붕괴 */
  collapsed(generation: number, townName: string): string {
    return `${townName}이 무너졌다. 남은 사람들이 회관 자리에 다시 천막을 세웠다. 제${generation}대가 시작되었다.`;
  },
} as const;
