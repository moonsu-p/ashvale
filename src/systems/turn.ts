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
import type { Rng } from './rng';
import { seasonOf, WEEKS_PER_YEAR } from './time';
import { addResource, computeProduction, population } from './economy';
import { pickWorldEvent, applyWorldEvent } from './worldEvents';
import { BUILDING_WEEKLY } from '@/data/buildings';
import {
  FOOD_PER_POP,
  WORLD_EVENT_CHANCE,
  FAMINE_GOLD_PER_DEFICIT,
  FAMINE_BUILDING_LOSS_CHANCE,
  SHRINE_FAMINE_MULT,
} from '@/data/economy';
import { FAMINE_TEXT, famineBuildingLossText } from '@/data/chronicle-system';

export type TurnAction = { kind: 'rest' };

export interface TurnResult {
  state: GameState;
  entries: ChronicleEntry[];
}

interface Stamp {
  year: number;
  week: number;
  season: Season;
}

export function endTurn(prev: GameState, action: TurnAction, rng: Rng): TurnResult {
  const s: GameState = structuredClone(prev);
  const entries: ChronicleEntry[] = [];
  const season = seasonOf(s.world.week);
  const stamp: Stamp = { year: s.world.year, week: s.world.week, season };

  // 1) 행동 결과 적용
  applyAction(s, action);

  // 2) 자원 생산 − 식량 소비 (계절 보정)
  const prod = computeProduction(s, season);
  addResource(s, 'wood', prod.wood);
  addResource(s, 'stone', prod.stone);
  addResource(s, 'gold', prod.gold);
  addResource(s, 'food', prod.food);
  s.resources.food -= population(s) * FOOD_PER_POP;
  if (s.resources.food < 0) applyFamine(s, entries, stamp, rng);

  // 3) 주간 회복 (신전 HP, 훈련장 XP)
  applyWeeklyRecovery(s);

  // 4) 위협 카운트다운 / 해결 — §8 (M8). 위협이 없으면 아무 일도 없다.
  //    (M2 에서는 threat 이 항상 null 이다.)

  // 5) 세계 이벤트 판정 (12%)
  if (rng.next() < WORLD_EVENT_CHANCE) {
    const ev = pickWorldEvent(s, rng);
    if (ev) {
      applyWorldEvent(s, ev);
      entries.push(entry('world', ev.text, stamp));
    }
  }

  // 6) 레벨업 → 시대 판정 → 신규 해금 — §4·§5 (M4·M5). 통과.

  // 7) 주차 증가 + 연대기 기록
  advanceWeek(s);
  if (entries.length > 0) {
    s.chronicle.push(...entries);
    if (s.chronicle.length > CHRONICLE_MAX) {
      s.chronicle.splice(0, s.chronicle.length - CHRONICLE_MAX);
    }
  }

  return { state: s, entries };
}

// ────────────────────────── 단계 헬퍼 ──────────────────────────

function applyAction(_s: GameState, action: TurnAction): void {
  switch (action.kind) {
    case 'rest':
      // 휴식은 한 주를 흘려보낸다. 즉시 효과 없음.
      break;
  }
}

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
