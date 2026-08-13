/**
 * 탐험 판정 — 순수 함수 (§6). 판정 공식을 단계로 분해해 화면에서 공개한다(§1 원칙 2).
 * 서술은 content/region-text.ts 에서 가져온다(새로 쓰지 않는다).
 * 스킬·유물 보너스가 판정 연출에 숫자 단계로 나타난다(§4·§9, M6).
 *
 * resolveExplore 는 상태를 바꾸지 않고 결과 분해(ExploreOutcome)만 만든다 → UI 가 그대로 연출한다.
 * applyExploreOutcome 이 상태에 반영한다. 둘 다 같은 시드로 계산하면 결과가 일치한다.
 */

import type { ChronicleEntry, GameState, ResourceId, Season, StatId } from '@/types/game';
import type { Rng } from './rng';
import type { Grade } from '@/data/content/region-text';
import { REGION_TEXT } from '@/data/content/region-text';
import { REGIONS, GRADES, XP_PER_DIFFICULTY, DIE_SIDES, DOWNED_WEEKS, DOWNED_GOLD_LOSS } from '@/data/explore';
import {
  skillTrackRoll,
  skillInsightRoll,
  skillLootPercent,
  skillExploreHpReduce,
  skillCrisisHpReduce,
} from './skills';
import { relicRollBonus, relicStatBonus, relicLootPercent, rollRelicFind, relicById } from './relics';

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
  relicFound: string | null;
}

const STAT_NAME: Record<StatId, string> = { might: '힘', agility: '민첩', insight: '통찰', will: '의지' };

/** 탐험보너스 성분 (§6) — 존재하는 것만 step 으로 낸다. */
function bonusSteps(state: GameState, regionStat: StatId): ExploreStep[] {
  const steps: ExploreStep[] = [];
  const track = skillTrackRoll(state);
  if (track) steps.push({ label: '추적', value: track });
  if (regionStat === 'insight') {
    const lore = skillInsightRoll(state);
    if (lore) steps.push({ label: '고문헌', value: lore });
  }
  const lib = Math.floor((state.settlement.buildings.library ?? 0) / 2);
  if (lib) steps.push({ label: '서고', value: lib });
  const spire = state.settlement.buildings.spire ?? 0;
  if (spire) steps.push({ label: '첨탑', value: spire });
  const relic = relicRollBonus(state);
  if (relic) steps.push({ label: '유물', value: relic });
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
  return !isDowned(state) && state.world.unlockedRegions.includes(regionId) && regionId in REGIONS;
}

export function resolveExplore(state: GameState, regionId: string, rng: Rng): ExploreOutcome {
  const region = REGIONS[regionId]!;
  const statId = region.stat;
  const statVal = state.hero.stats[statId] + relicStatBonus(state, statId); // 유물 능력치 반영

  const d20 = rng.int(1, DIE_SIDES);
  const steps: ExploreStep[] = [{ label: STAT_NAME[statId], value: statVal }, ...bonusSteps(state, statId)];
  const total = d20 + steps.reduce((a, s) => a + s.value, 0);
  const margin = total - region.difficulty;
  const gdef = gradeFor(margin);
  const grade: Grade = gdef.grade;

  const pool = REGION_TEXT[regionId]?.lines[grade] ?? [];
  const raw = pool.length > 0 ? pool[rng.int(0, pool.length - 1)]! : '';
  const narrative = raw.replace(/\{거점\}/g, state.settlement.name);

  // 전리품: 등급 배수 × (1 + 연금·유물 전리품%)
  const lootMult = gdef.lootMult * (1 + (skillLootPercent(state) + relicLootPercent(state)) / 100);
  const loot: Partial<Record<ResourceId, number>> = {};
  for (const [r, range] of Object.entries(region.loot) as [ResourceId, [number, number]][]) {
    const rolled = rng.int(range[0], range[1]);
    const amount = Math.round(rolled * lootMult);
    if (amount > 0) loot[r] = amount;
  }

  const xp = Math.round(region.difficulty * XP_PER_DIFFICULTY * gdef.xpMult);

  // HP 손실: 야영 랭크만큼 감소, 위기는 결의 랭크로 −25%/랭크 (§6)
  let hpDelta = 0;
  const camp = skillExploreHpReduce(state);
  if (grade === 'failure') {
    hpDelta = -Math.max(0, Math.floor(region.danger / 2) - camp);
  } else if (grade === 'crisis') {
    const reduced = Math.max(0, region.danger - camp) * (1 - skillCrisisHpReduce(state));
    hpDelta = -Math.round(reduced);
  }

  const downed = state.hero.hp + hpDelta <= 0;
  const relicFound = rollRelicFind(state, grade, rng);

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
    relicFound,
  };
}

/** 결과를 상태에 반영하고 연대기 항목들(서술 + 유물 획득)을 돌려준다. */
export function applyExploreOutcome(
  s: GameState,
  outcome: ExploreOutcome,
  stamp: { year: number; week: number; season: Season }
): ChronicleEntry[] {
  const entries: ChronicleEntry[] = [];

  for (const [r, v] of Object.entries(outcome.loot) as [ResourceId, number][]) {
    s.resources[r] = Math.max(0, s.resources[r] + v);
  }
  s.hero.xp += outcome.xp;

  if (outcome.downed) {
    s.hero.hp = 1;
    s.hero.downedUntilTurn = s.world.turn + DOWNED_WEEKS;
    s.resources.gold = Math.max(0, Math.round(s.resources.gold * (1 - DOWNED_GOLD_LOSS)));
  } else {
    s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + outcome.hpDelta);
  }

  s.counters.explores += 1;
  if (outcome.triumph) s.counters.firsts[`triumph:${outcome.regionId}`] = true;

  entries.push({ ...stamp, kind: 'quest', text: outcome.narrative });

  if (outcome.relicFound && !s.hero.relics.includes(outcome.relicFound)) {
    s.hero.relics.push(outcome.relicFound);
    const relic = relicById(outcome.relicFound);
    if (relic) entries.push({ ...stamp, kind: 'milestone', text: relic.found });
  }

  return entries;
}
