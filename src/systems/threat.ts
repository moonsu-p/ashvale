/**
 * 위협·방어 — 순수 함수 (§8). 준비 기간에 방어력과 강도를 숫자로 나란히 보여준다(못 이길 싸움을 알 수 있게).
 */

import type { ChronicleEntry, GameState, Season } from '@/types/game';
import type { Rng } from './rng';
import { THREATS } from '@/data/content/world-content';
import {
  THREAT_CYCLE, THREAT_MIN_ERA, THREAT_PREP_WEEKS, PREP_BONUS_PER_ACTION,
  THREAT_BASE, THREAT_PER_ERA, THREAT_TURN_DIV, WINTER_THREAT_MULT, TIER_THREAT_MULT,
  DEF_WALL, DEF_YARD, THREAT_MARGIN, LOSE_RESOURCE_PCT, LOSE_HP, LOSE_REP, WIN_REP, PATRON_HARL_DEFENSE,
} from '@/data/threat';
import { seasonOf } from './time';
import { skillDefense } from './skills';
import { relicDefense } from './relics';
import { companionBonus } from './relationships';
import { adjustFaction } from './factions';

const RESOURCE_IDS = ['wood', 'stone', 'food', 'gold'] as const;

export function threatStrength(state: GameState): number {
  const w = state.world;
  let s = THREAT_BASE + w.eraIndex * THREAT_PER_ERA + Math.floor(w.turn / THREAT_TURN_DIV);
  if (seasonOf(w.week) === 3) s *= WINTER_THREAT_MULT;
  s *= 1 + w.eraTier * TIER_THREAT_MULT;
  return Math.round(s);
}

export function defense(state: GameState): number {
  const b = state.settlement.buildings;
  let d = (b.wall ?? 0) * DEF_WALL + (b.yard ?? 0) * DEF_YARD + state.hero.stats.might;
  d += skillDefense(state); // 방벽×3 + 징병×4
  d += relicDefense(state);
  d += companionBonus(state, 'defense'); // 동료 최대값
  // 의뢰인 하를 거래처(20+) 방어
  if ((state.patrons.harl?.trust ?? 0) >= 20) d += PATRON_HARL_DEFENSE;
  if (state.threat) d += state.threat.prepBonus;
  return d;
}

function pickThreat(state: GameState, rng: Rng) {
  const pool = THREATS.filter((t) => state.world.eraIndex >= t.eraMin && state.world.eraIndex <= t.eraMax);
  const list = pool.length > 0 ? pool : THREATS;
  return list[rng.int(0, list.length - 1)]!;
}

function stamp(s: GameState, season: Season) {
  return { year: s.world.year, week: s.world.week, season };
}

/** 위협 발생(6주 주기 또는 강제). 이미 위협이 있으면 무시. */
export function spawnThreat(state: GameState, rng: Rng, season: Season, force = false): ChronicleEntry | null {
  if (state.threat) return null;
  if (!force) {
    if (state.world.eraIndex < THREAT_MIN_ERA) return null;
    if (state.world.turn === 0 || state.world.turn % THREAT_CYCLE !== 0) return null;
  }
  const t = pickThreat(state, rng);
  state.threat = { id: t.id, power: threatStrength(state), weeksLeft: THREAT_PREP_WEEKS, prepBonus: 0 };
  return { ...stamp(state, season), kind: 'threat', text: t.arrive };
}

/** 방비 행동(턴 소비): prepBonus 누적 (§8). */
export function applyPrep(state: GameState): void {
  if (state.threat) state.threat.prepBonus += PREP_BONUS_PER_ACTION;
}

/**
 * 위협 카운트다운/해결 (턴 종료 4단계). 접근 연출 또는 전투 판정.
 * 붕괴가 필요하면 collapseByHall 을 true 로 신호한다(회관 0).
 */
export function tickThreat(
  state: GameState,
  rng: Rng,
  season: Season
): { entries: ChronicleEntry[]; collapseByHall: boolean } {
  const entries: ChronicleEntry[] = [];
  const th = state.threat;
  if (!th) return { entries, collapseByHall: false };

  th.weeksLeft -= 1;
  const def = THREATS.find((t) => t.id === th.id);

  if (th.weeksLeft > 0) {
    // 접근 연출 단계
    if (def) entries.push({ ...stamp(state, season), kind: 'threat', text: def.approach });
    return { entries, collapseByHall: false };
  }

  // 해결: 방어력 + 1d20 vs 강도 + 10
  const roll = defense(state) + rng.int(1, 20);
  const target = th.power + THREAT_MARGIN;
  let collapseByHall = false;

  if (roll >= target) {
    state.counters.threatsWon += 1;
    state.hero.xp += th.power * 2;
    state.resources.gold += th.power;
    if (def) adjustFaction(state, def.faction, WIN_REP);
    entries.push({ ...stamp(state, season), kind: 'threat', text: def?.win ?? '위협을 물리쳤다.' });
  } else {
    state.counters.threatsLost += 1;
    for (const r of RESOURCE_IDS) state.resources[r] = Math.max(0, Math.round(state.resources[r] * (1 - LOSE_RESOURCE_PCT)));
    state.hero.hp = Math.max(1, state.hero.hp - LOSE_HP);
    if (def) adjustFaction(state, def.faction, -LOSE_REP);
    // 무작위 건물 −1 (회관 0 이면 붕괴 조건 2, §15.2)
    const owned = Object.keys(state.settlement.buildings).filter((id) => (state.settlement.buildings[id] ?? 0) > 0);
    if (owned.length > 0) {
      const pick = owned[rng.int(0, owned.length - 1)]!;
      state.settlement.buildings[pick] = (state.settlement.buildings[pick] ?? 0) - 1;
      if (pick === 'hall' && (state.settlement.buildings.hall ?? 0) <= 0) collapseByHall = true;
    }
    entries.push({ ...stamp(state, season), kind: 'threat', text: def?.lose ?? '위협에 당했다.' });
  }

  state.threat = null;
  return { entries, collapseByHall };
}
