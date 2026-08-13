/**
 * 레벨업 처리 — 순수 함수 (§4). 턴 종료 6단계에서 호출한다.
 * XP 가 임계값을 넘으면 레벨을 올리고 보상을 준다. 능력치·스킬 점수 배분은 M6.
 */

import type { GameState } from '@/types/game';
import { xpForLevel, LEVEL_HP, LEVEL_SKILL_POINT, LEVEL_STAT_POINT } from '@/data/levels';

/** 누적 XP 로 가능한 만큼 레벨을 올린다. 오른 레벨 수를 돌려준다. */
export function applyLevelUps(s: GameState): number {
  let gained = 0;
  // 폭주 방지 상한 (한 턴에 100레벨 이상은 없다)
  while (gained < 100 && s.hero.xp >= xpForLevel(s.hero.level)) {
    s.hero.xp -= xpForLevel(s.hero.level);
    s.hero.level += 1;
    s.hero.maxHp += LEVEL_HP;
    s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + LEVEL_HP);
    s.hero.skillPoints += LEVEL_SKILL_POINT;
    s.hero.statPoints += LEVEL_STAT_POINT;
    gained += 1;
  }
  return gained;
}
