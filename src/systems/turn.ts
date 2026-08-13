/**
 * 턴 엔진 — §2 턴 종료 처리 8단계. 순수 함수: (state, action, rng) => { state, entries }.
 * 이 순서를 고정한다. 씬·컴포넌트에 규칙을 넣지 않는다(§3, §10.3).
 *
 * M2 구현 범위: 1 행동(휴식) · 2 생산−소비(계절·기근) · 3 주간회복 · 5 세계이벤트 · 7 주차·연대기.
 * 4 위협(§8 M8) · 6 레벨업/시대/해금(§4·§5 M4·M5) 은 통과 지점만 두고 구현하지 않는다.
 * 8 자동저장은 경계(store)가 맡는다.
 */

import {
  CHRONICLE_MAX,
  type ChronicleEntry,
  type GameState,
  type ResourceId,
  type Season,
} from '@/types/game';
import { createRng, type Rng } from './rng';
import { seasonOf, WEEKS_PER_YEAR } from './time';
import { addResource, computeProduction, population } from './economy';
import { pickWorldEvent, applyWorldEvent } from './worldEvents';
import { eraFromPower, eraTierFromPower } from './progression';
import { shouldCollapse, applyCollapse } from './collapse';
import { checkRegionUnlocks } from './regions';
import { applyLevelUps } from './levels';
import { resolveExplore, applyExploreOutcome } from './explore';
import { applyTalkCompanion, applyTalkPatron, checkPeopleAppearances } from './relationships';
import { recordExploreSuccess } from './quests';
import { spawnThreat, tickThreat, applyPrep } from './threat';
import { REGIONS } from '@/data/explore';
import { THREAT_FROM_CRISIS } from '@/data/threat';
import { BUILDING_WEEKLY } from '@/data/buildings';
import {
  FOOD_PER_POP,
  WORLD_EVENT_CHANCE,
  FAMINE_GOLD_PER_DEFICIT,
  FAMINE_BUILDING_LOSS_CHANCE,
  SHRINE_FAMINE_MULT,
} from '@/data/economy';
import { COLLAPSE_FOOD_STREAK, COLLAPSE_POP_MAX, COLLAPSE_WARN_BEFORE } from '@/data/collapse';
import {
  FAMINE_TEXT,
  famineBuildingLossText,
  eraTransitionText,
  COLLAPSE_WARNING_TEXT,
} from '@/data/chronicle-system';

export type TurnAction =
  | { kind: 'rest' }
  | { kind: 'explore'; regionId: string; escortId?: string | null }
  | { kind: 'talk'; target: 'companion' | 'patron'; id: string }
  | { kind: 'prep' };

export interface TurnResult {
  state: GameState;
  entries: ChronicleEntry[];
  /** 이번 턴에 붕괴가 일어났는지 (원장 갱신·연출 트리거용) */
  collapsed: boolean;
}

interface Stamp {
  year: number;
  week: number;
  season: Season;
}

export function endTurn(prev: GameState, action: TurnAction, rng: Rng): TurnResult {
  const s: GameState = structuredClone(prev);
  if (s.counters.foodDeficitStreak == null) s.counters.foodDeficitStreak = 0; // 구 세이브 보정
  const entries: ChronicleEntry[] = [];
  const season = seasonOf(s.world.week);
  const stamp: Stamp = { year: s.world.year, week: s.world.week, season };

  // 1) 행동 결과 적용
  let lastExploreCrisis = false;
  if (action.kind === 'explore') {
    // 탐험 판정은 별도 시드(재현·연출 일치용). 세계 이벤트 rng 스트림과 분리한다.
    const exploreRng = createRng(`${s.createdAt}:turn:${s.world.turn}:explore`);
    const outcome = resolveExplore(s, action.regionId, exploreRng, action.escortId);
    entries.push(...applyExploreOutcome(s, outcome, stamp));
    // 퀘스트·통찰 대성공 진행 (§16.1)
    if (outcome.grade === 'success' || outcome.grade === 'triumph') recordExploreSuccess(s, action.regionId);
    if (outcome.triumph && REGIONS[action.regionId]?.stat === 'insight') s.counters.firsts['insightTriumph'] = true;
    lastExploreCrisis = outcome.grade === 'crisis';
  } else if (action.kind === 'talk') {
    if (action.target === 'companion') applyTalkCompanion(s, action.id);
    else applyTalkPatron(s, action.id);
  } else if (action.kind === 'prep') {
    applyPrep(s); // 방비: prepBonus 누적 (§8)
  }
  // rest: 한 주를 흘려보낸다. 즉시 효과 없음.

  // 탐험 위기 → 위협 발생 35% (§6). 이번 턴 강제 발생 여부 표시.
  const crisisThreat =
    action.kind === 'explore' && s.threat === null && lastExploreCrisis && rng.next() < THREAT_FROM_CRISIS;

  // 2) 자원 생산 − 식량 소비 (계절 보정) + 기근·적자 연속 판정
  const prod = computeProduction(s, season);
  addResource(s, 'wood', prod.wood);
  addResource(s, 'stone', prod.stone);
  addResource(s, 'gold', prod.gold);
  addResource(s, 'food', prod.food);
  s.resources.food -= population(s) * FOOD_PER_POP;
  updateFamineStreak(s, entries, stamp, rng);

  // 3) 주간 회복 (신전 HP, 훈련장 XP)
  applyWeeklyRecovery(s);

  // 4) 위협 카운트다운 / 해결 → 신규 발생 (§8)
  const tick = tickThreat(s, rng, season);
  entries.push(...tick.entries);
  const spawnEntry = spawnThreat(s, rng, season, crisisThreat);
  if (spawnEntry) entries.push(spawnEntry);

  // 5) 세계 이벤트 판정 (12%)
  if (rng.next() < WORLD_EVENT_CHANCE) {
    const ev = pickWorldEvent(s, rng);
    if (ev) {
      applyWorldEvent(s, ev);
      entries.push(entry('world', ev.text, stamp));
    }
  }

  // 6) 레벨업 → 붕괴 판정 → 시대 판정 → 지역 해금
  applyLevelUps(s);
  let collapsed = false;
  if (shouldCollapse(s) || tick.collapseByHall) {
    entries.push(applyCollapse(s, rng)); // 거점만 무너진다. 연대기·이미지·갤러리는 보존(§15.2)
    collapsed = true;
  } else {
    const power = population(s);
    const newEra = Math.max(s.world.eraIndex, eraFromPower(power, s.counters.collapses));
    const newTier = eraTierFromPower(power);
    if (newEra > s.world.eraIndex || newTier > s.world.eraTier) {
      s.world.eraIndex = newEra;
      s.world.eraTier = newTier;
      entries.push(entry('era', eraTransitionText(newEra, newTier), stamp));
    }
    entries.push(...checkRegionUnlocks(s, season));
    entries.push(...checkPeopleAppearances(s, season));
  }

  // 7) 주차 증가 + 연대기 기록
  advanceWeek(s);
  if (entries.length > 0) {
    s.chronicle.push(...entries);
    if (s.chronicle.length > CHRONICLE_MAX) {
      s.chronicle.splice(0, s.chronicle.length - CHRONICLE_MAX);
    }
  }

  return { state: s, entries, collapsed };
}

// ────────────────────────── 단계 헬퍼 ──────────────────────────

function applyWeeklyRecovery(s: GameState): void {
  let heal = 0;
  let xp = 0;
  for (const [id, level] of Object.entries(s.settlement.buildings)) {
    if (level <= 0) continue;
    const w = BUILDING_WEEKLY[id];
    if (!w) continue;
    if (w.heal) heal += w.heal * level;
    if (w.xp) xp += w.xp * level;
  }
  if (heal > 0) s.hero.hp = Math.min(s.hero.maxHp, s.hero.hp + heal);
  if (xp > 0) s.hero.xp += xp; // 레벨업은 M5
}

/** 식량 적자 연속 카운터 갱신 + 기근 처리 + 붕괴 임박 경고(§15.2). */
function updateFamineStreak(s: GameState, entries: ChronicleEntry[], stamp: Stamp, rng: Rng): void {
  if (s.resources.food < 0) {
    s.counters.foodDeficitStreak += 1;
    applyFamine(s, entries, stamp, rng);
    if (
      s.counters.foodDeficitStreak === COLLAPSE_FOOD_STREAK - COLLAPSE_WARN_BEFORE &&
      population(s) <= COLLAPSE_POP_MAX
    ) {
      entries.push(entry('world', COLLAPSE_WARNING_TEXT, stamp));
    }
  } else {
    s.counters.foodDeficitStreak = 0;
  }
}

function applyFamine(s: GameState, entries: ChronicleEntry[], stamp: Stamp, rng: Rng): void {
  const hasShrine = (s.settlement.buildings.shrine ?? 0) > 0;
  const mult = hasShrine ? SHRINE_FAMINE_MULT : 1;

  const deficit = -s.resources.food; // 0 미만인 만큼
  const goldLoss = Math.round(deficit * FAMINE_GOLD_PER_DEFICIT * mult);
  s.resources.gold = Math.max(0, s.resources.gold - goldLoss);
  entries.push(entry('world', FAMINE_TEXT, stamp));

  // 무작위 건물 1레벨 하락 (회관 제외 — 회관 0 은 붕괴 조건, §15.2 M4 에서만)
  if (rng.next() < FAMINE_BUILDING_LOSS_CHANCE * mult) {
    const targets = Object.keys(s.settlement.buildings).filter(
      (id) => id !== 'hall' && (s.settlement.buildings[id] ?? 0) > 0
    );
    if (targets.length > 0) {
      const pick = targets[rng.int(0, targets.length - 1)]!;
      s.settlement.buildings[pick] = (s.settlement.buildings[pick] ?? 0) - 1;
      entries.push(entry('world', famineBuildingLossText(pick), stamp));
    }
  }
  // 식량은 음수 상태로 남긴다 (연속 기근·붕괴 판정용, §15.2 M4).
}

function advanceWeek(s: GameState): void {
  s.world.turn += 1;
  s.world.week += 1;
  s.weeklyTradeUsed = 0; // 주간 교역 한도 초기화 (§16.4)
  if (s.world.week > WEEKS_PER_YEAR) {
    s.world.week = 1;
    s.world.year += 1;
  }
}

function entry(kind: ChronicleEntry['kind'], text: string, stamp: Stamp): ChronicleEntry {
  return { year: stamp.year, week: stamp.week, season: stamp.season, kind, text };
}

/** UI 표시용: 이번 주 순수지(생산 − 소비). 화면에 자원 수지를 보여줄 때 쓴다. */
export function weeklyBalance(state: GameState): Record<ResourceId, number> {
  const season = seasonOf(state.world.week);
  const prod = computeProduction(state, season);
  return {
    wood: prod.wood,
    stone: prod.stone,
    gold: prod.gold,
    food: prod.food - population(state) * FOOD_PER_POP,
  };
}
