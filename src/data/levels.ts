/**
 * 경험치와 레벨.
 *
 * **기획서에 곡선이 없다.** §11 이 정한 것은 "기본 XP = 난이도 × 1.5" 하나뿐이다.
 * 아래 값은 그 산출량에 맞춰 잡은 잠정치다 — 속삭이는 숲(난이도 9)을 성공하면
 * 13~14 XP 이므로 첫 레벨업이 서너 번 다녀오는 거리에 놓인다.
 * 밸런스를 잡을 때 여기부터 고친다.
 */

/** 레벨 L 에서 L+1 로 가는 데 필요한 경험치 */
export function xpToNext(level: number): number {
  return 40 + (level - 1) * 35;
}

/** 레벨업 한 번의 보상. 기획서에 수치가 없어 잠정으로 둔다 */
export const LEVEL_REWARD = {
  statPoints: 2,
  skillPoints: 1,
  maxHp: 2,
} as const;
