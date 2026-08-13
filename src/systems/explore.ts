/**
 * 탐험 판정 — 순수 함수 (§6). 판정 공식을 단계로 분해해 화면에서 공개할 수 있게 한다(§1 원칙 2).
 * 서술은 content/region-text.ts 에서 가져온다(새로 쓰지 않는다).
 *
 * resolveExplore 는 상태를 바꾸지 않고 결과 분해(ExploreOutcome)만 만든다 → UI 가 그대로 연출한다.
 * applyExploreOutcome 이 상태에 반영한다. 둘 다 같은 시드로 계산하면 결과가 일치한다.
 */

import type { ChronicleEntry, GameState, ResourceId, Season, StatId } from '@/types/game';
import type { Rng } from './rng';
import type { Grade } from '@/data/content/region-text';
import { REGION_TEXT } from '@/data/content/region-text';
import { RELICS } from '@/data/content/world-content';
import { REGIONS, GRADES, XP_PER_DIFFICULTY, DIE_SIDES, DOWNED_WEEKS, DOWNED_GOLD_LOSS } from '@/data/explore';

export interface ExploreStep {
  label: string;
  value: number;
}

export interface ExploreOutcome {
  regionId: string;
  statId: StatId;
  d20: number;
  steps: ExploreStep[]; // 능력치·탐험보너스 분해 (연출용)
  total: number;
  difficulty: number;
  margin: number;
  grade: Grade;
  narrative: string;
  loot: Partial<Record<ResourceId, number>>;
  xp: number;
  hpDelta: number;
  downed: boolean;
  triumph: boolean;
}

const STAT_NAME: Record<StatId, string> = { might: '힘', agility: '민첩', insight: '통찰', will: '의지' };

/** 유물의 판정 보너스 합 (kind==='roll') */
function relicRollBonus(state: GameState): number {
  let b = 0;
  for (const id of state.hero.relics) {
    const r = RELICS.find((x) => x.id === id);
    if (r && r.effect.kind === 'roll') b += r.effect.value;
  }
  return b;
}

/** 탐험보너스 성분 (§6). 존재하는 것만 step 으로 낸다. M6/M7 시스템이 자동으로 채워진다. */
function bonusSteps(state: GameState): ExploreStep[] {
  const steps: ExploreStep[] = [];
  const lib = Math.floor((state.settlement.buildings.library ?? 0) / 2);
  const spire = state.settlement.buildings.spire ?? 0;
  const track = state.hero.skills.track ?? 0; // 스킬 트리는 M6
  const relic = relicRollBonus(state);
  if (track) steps.push({ label: '추적', value: track });
  if (lib) steps.push({ label: '서고', value: lib });
  if (relic) steps.push({ label: '유물', value: relic });
  if (spire) steps.push({ label: '첨탑', value: spire });
  return steps;
}

function gradeFor(margin: number): (typeof GRADES)[number] {
  for (const g of GRADES) if (margin >= g.minMargin) return g;
  return GRADES[GRADES.length - 1]!;
}

export function isDowned(state: GameState): boolean {
  return state.world.turn < state.hero.downedUntilTurn;
}

export function canExplore(state: GameState, regionId: string): boolean {
  return (
    !isDowned(state) &&
    state.world.unlockedRegions.includes(regionId) &&
    regionId in REGIONS
  );
}

/** 판정 결과 분해를 만든다(무변이). */
export function resolveExplore(state: GameState, regionId: string, rng: Rng): ExploreOutcome {
  const region = REGIONS[regionId]!;
  const statId = region.stat;
  const statVal = state.hero.stats[statId];

  const d20 = rng.int(1, DIE_SIDES);
  const steps: ExploreStep[] = [{ label: STAT_NAME[statId], value: statVal }, ...bonusSteps(state)];
  const total = d20 + steps.reduce((a, s) => a + s.value, 0);
  const margin = total - region.difficulty;
  const gdef = gradeFor(margin);
  const grade: Grade = gdef.grade;

  // 서술 선택 (rng)
  const pool = REGION_TEXT[regionId]?.lines[grade] ?? [];
  const raw = pool.length > 0 ? pool[rng.int(0, pool.length - 1)]! : '';
  const narrative = raw.replace(/\{거점\}/g, state.settlement.name);

  // 전리품
  const loot: Partial<Record<ResourceId, number>> = {};
  for (const [r, range] of Object.entries(region.loot) as [ResourceId, [number, number]][]) {
    const rolled = rng.int(range[0], range[1]);
    const amount = Math.round(rolled * gdef.lootMult);
    if (amount > 0) loot[r] = amount;
  }

  const xp = Math.round(region.difficulty * XP_PER_DIFFICULTY * gdef.xpMult);

  let hpDelta = 0;
  if (grade === 'failure') hpDelta = -Math.floor(region.danger / 2);
  else if (grade === 'crisis') hpDelta = -region.danger;

  const downed = state.hero.hp + hpDelta <= 0;

  return {
    regionId,
    statId,
    d20,
    steps,
    total,
    difficulty: region.difficulty,
    margin,
    grade,
    narrative,
    loot,
    xp,
    hpDelta,
    downed,
    triumph: grade === 'triumph',
  };
}

/** 결과를 상태에 반영하고 연대기 항목을 돌려준다(무주어 문어체 서술). */
export function applyExploreOutcome(
  s: GameState,
  outcome: ExploreOutcome,
  stamp: { year: number; week: number; season: Season }
): ChronicleEntry {
  for (const [r, v] of Object.entries(outcome.loot) as [ResourceId, number][]) {
    s.resources[r] = Math.max(0, s.resources[r] + v);
  }
  s.hero.xp += outcome.xp;

  if (outcome.downed) {
    // 쓰러진 채 실려 옴 (§6): HP 1, 다음 N주 강제 휴식, 금화 손실
    s.hero.hp = 1;
    s.hero.downedUntilTurn = s.world.turn + DOWNED_WEEKS;
    s.resources.gold = Math.max(0, Math.round(s.resources.gold * (1 - DOWNED_GOLD_LOSS)));
  } else {
    s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + outcome.hpDelta);
  }

  s.counters.explores += 1;
  if (outcome.triumph) {
    // 대성공 → 다음 지역 해금의 선행 조건 충족 (§6, M4 해금 로직이 읽는다)
    s.counters.firsts[`triumph:${outcome.regionId}`] = true;
  }

  return {
    year: stamp.year,
    week: stamp.week,
    season: stamp.season,
    kind: 'quest',
    text: outcome.narrative,
  };
}
