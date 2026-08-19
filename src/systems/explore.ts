/**
 * 탐사 판정 (§11) — 순수 함수.
 *
 *   roll   = 1d20 + stats[지역.능력치] + 탐사보너스
 *   탐사보너스 = 추적랭크 + floor(서고레벨/2) + 동행보정 + 유물보정 + 첨탑레벨
 *   margin = roll − 지역.난이도
 *
 * **판정은 화면에 단계적으로 노출한다** (§11). 그래서 결과 하나만 돌려주지 않고
 * 더해진 보정을 순서대로 담아 돌려준다. 연출이 이 목록을 하나씩 펼친다.
 */

import type { GameState, ResourceId } from '@/types/game';
import type { Grade } from '@/data/content/region-text';
import { GRADE_TABLE, XP_PER_DIFFICULTY, type RegionDef } from '@/data/regions';
import { TRACKING } from '@/data/skills';
import type { Rng } from './rng';
import { relicBonus } from './relics';
import { escortBonus, escortOf } from './escort';
import { devotionTotals } from './devotion';
import { factionEffects } from './factions';

const STAT_LABEL = {
  might: '힘',
  agility: '민첩',
  insight: '통찰',
  will: '의지',
} as const;

/** 판정에 더해진 값 한 줄. 연출이 이걸 하나씩 보여 준다 */
export interface RollStep {
  label: string;
  value: number;
}

export interface ExploreRoll {
  /** 1d20 눈 */
  die: number;
  steps: RollStep[];
  total: number;
  difficulty: number;
  margin: number;
  grade: Grade;
}

export function gradeFor(margin: number): Grade {
  if (margin >= 8) return 'triumph';
  if (margin >= 0) return 'success';
  if (margin >= -7) return 'failure';
  return 'crisis';
}

/** 0 인 보정은 줄로 만들지 않는다. 화면에 '+0' 이 늘어서면 읽기 나빠진다 */
function push(steps: RollStep[], label: string, value: number): void {
  if (value !== 0) steps.push({ label, value });
}

export function rollExplore(state: GameState, region: RegionDef, rng: Rng): ExploreRoll {
  const die = rng.int(1, 20);
  const steps: RollStep[] = [];

  const bonus = relicBonus(state);

  const statValue = state.hero.stats[region.stat] + (bonus.stats[region.stat] ?? 0);
  push(steps, STAT_LABEL[region.stat], statValue);

  push(steps, '추적', state.hero.skills[TRACKING] ?? 0);

  const library = state.town.buildings['library'] ?? 0;
  push(steps, '서고', Math.floor(library / 2));

  // 동행 보정 (§7.2 표, §11). 원형마다 다르고, 통찰 보정은 통찰 지역에서만 붙는다
  const escort = escortBonus(escortOf(state), region.stat);
  push(steps, '동행', escort.roll);

  // 세력의 태도 (§7). 마탑이 우호적이면 판정이 붙고, 냉담하면 깎인다
  push(steps, '세력', factionEffects(state.factions).roll);

  push(steps, '유물', bonus.roll);
  push(steps, '첨탑', state.town.buildings['spire'] ?? 0);

  const total = steps.reduce((sum, s) => sum + s.value, die);
  const margin = total - region.difficulty;

  return { die, steps, total, difficulty: region.difficulty, margin, grade: gradeFor(margin) };
}

export interface ExploreOutcome {
  roll: ExploreRoll;
  loot: Partial<Record<ResourceId, number>>;
  xp: number;
  /** 깎이는 HP. 0 이상 */
  hpLoss: number;
  /** 얻은 유물 id. 없으면 null */
  relicId: string | null;
}

/**
 * 판정 결과를 전리품·경험치·피해로 옮긴다.
 * 유물 추첨은 부르는 쪽이 넘긴 rng 로 한다.
 */
export function resolveExplore(
  state: GameState,
  region: RegionDef,
  roll: ExploreRoll,
  rng: Rng,
  relicPicker: (rng: Rng) => string | null,
): ExploreOutcome {
  const table = GRADE_TABLE[roll.grade];
  const bonus = relicBonus(state);
  const escort = escortBonus(escortOf(state), region.stat);
  // 최대 호감이 남긴 것 (§7 헌신) — 유물과 위기 방어에 붙는다
  const devoted = devotionTotals(state);

  const loot: Partial<Record<ResourceId, number>> = {};
  if (table.loot > 0) {
    for (const [key, range] of Object.entries(region.loot)) {
      const [min, max] = range;
      const base = rng.int(min, max);
      const scaled =
        base * table.loot * (1 + (bonus.lootPercent + escort.lootPercent) / 100);
      const amount = Math.round(scaled);
      if (amount > 0) loot[key as ResourceId] = amount;
    }
  }

  const xp = Math.round(region.difficulty * XP_PER_DIFFICULTY * table.xp);

  let hpLoss = 0;
  if (roll.grade === 'failure') hpLoss = Math.floor(region.risk / 2);
  if (roll.grade === 'crisis') hpLoss = region.risk;

  /**
   * 동행자가 대신 맞아 준다 (§7.2).
   * 기사는 위기에서만, 약초사는 실패·위기 모두. 둘 다 데려갈 수는 없으니
   * 겹칠 일은 없지만 더해서 100% 를 넘지 않게 자른다.
   */
  const cut = Math.min(
    100,
    escort.anyHpPercent +
      (roll.grade === 'crisis'
        ? escort.crisisHpPercent + devoted.crisisHpPercent + factionEffects(state.factions).crisisHpPercent
        : 0),
  );
  if (cut > 0) hpLoss = Math.round(hpLoss * (1 - cut / 100));

  // 별의 균열은 유물이 두 배로 나온다
  const chance =
    table.relic * (region.doubleRelic === true ? 2 : 1) + escort.relicPoints + devoted.relicPoints;
  const relicId = chance > 0 && rng.chance(chance) ? relicPicker(rng) : null;

  return { roll, loot, xp, hpLoss, relicId };
}
