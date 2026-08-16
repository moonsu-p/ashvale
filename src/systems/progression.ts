/**
 * 경험치·레벨업·스킬 (§11) — 순수 함수.
 * 레벨업은 여러 단계가 한 번에 오를 수 있다. 큰 판정 하나로 두 단계가 뛰기도 한다.
 */

import type { GameState } from '@/types/game';
import { LEVEL_REWARD, xpToNext } from '@/data/levels';
import { getSkill } from '@/data/skills';

export interface LevelUp {
  from: number;
  to: number;
  statPoints: number;
  skillPoints: number;
  maxHp: number;
}

/** 경험치를 더하고 오를 만큼 올린다 */
export function gainXp(state: GameState, amount: number): { state: GameState; levelUp: LevelUp | null } {
  if (amount <= 0) return { state, levelUp: null };

  let { level, xp, maxHp, statPoints, skillPoints } = state.hero;
  const from = level;
  xp += amount;

  let gainedStat = 0;
  let gainedSkill = 0;
  let gainedHp = 0;

  while (xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level += 1;
    gainedStat += LEVEL_REWARD.statPoints;
    gainedSkill += LEVEL_REWARD.skillPoints;
    gainedHp += LEVEL_REWARD.maxHp;
  }

  const next: GameState = {
    ...state,
    hero: {
      ...state.hero,
      level,
      xp,
      maxHp: maxHp + gainedHp,
      // 최대치가 오른 만큼 지금 체력도 함께 오른다
      hp: state.hero.hp + gainedHp,
      statPoints: statPoints + gainedStat,
      skillPoints: skillPoints + gainedSkill,
    },
  };

  return {
    state: next,
    levelUp:
      level > from
        ? { from, to: level, statPoints: gainedStat, skillPoints: gainedSkill, maxHp: gainedHp }
        : null,
  };
}

/** 다음 레벨까지 얼마나 왔는가. 0..1 */
export function levelProgress(state: GameState): number {
  const need = xpToNext(state.hero.level);
  return need <= 0 ? 0 : Math.min(1, state.hero.xp / need);
}

export type SpendBlock = 'ok' | 'no-points' | 'maxed' | 'unknown';

/** 스킬 한 랭크를 올린다 */
export function raiseSkill(state: GameState, skillId: string): { state: GameState; blocked: SpendBlock } {
  const def = getSkill(skillId);
  if (def === undefined) return { state, blocked: 'unknown' };

  const rank = state.hero.skills[skillId] ?? 0;
  if (rank >= def.maxRank) return { state, blocked: 'maxed' };
  if (state.hero.skillPoints < def.cost) return { state, blocked: 'no-points' };

  return {
    state: {
      ...state,
      hero: {
        ...state.hero,
        skillPoints: state.hero.skillPoints - def.cost,
        skills: { ...state.hero.skills, [skillId]: rank + 1 },
      },
    },
    blocked: 'ok',
  };
}
