/**
 * 주 종료 처리 (§3) — 순수 함수.
 *
 * **8단계 순서는 고정이다.** 순서를 바꾸면 결과가 달라진다 —
 * 예를 들어 시대 판정(6)이 자원 생산(2)보다 앞서면, 그 주에 올린 건물의
 * 산출이 한 주 늦게 반영된다. 단계를 끼워 넣을 때는 번호 자리를 지킨다.
 *
 * 마을 활동(대화·건설·선물)은 시간을 쓰지 않는다. 이 함수는 지역 탐사로만 불린다.
 */

import type { ChronicleEntry, GameState } from '@/types/game';
import type { Rng } from './rng';
import { WEEKS_PER_YEAR, seasonOf } from '@/data/seasons';
import { eraName, extentFor } from '@/data/eras';
import { CHRONICLE_TEXT } from '@/data/chronicle';
import { applyProduction, computeHeal, computeProduction } from './economy';
import { eraFor, townPower } from './eras';
import { appendEntries, makeEntry } from './chronicle';
import { queueApproaches } from './relationships';

export interface WeekInput {
  /**
   * 1단계에 적용할 탐사 결과.
   * 탐사 판정이 붙기 전에는 비어 있다.
   */
  expedition?: {
    resources?: Partial<Record<'wood' | 'stone' | 'food' | 'gold', number>>;
    xp?: number;
  };
}

export interface WeekResult {
  state: GameState;
  entries: ChronicleEntry[];
}

export function endWeek(state: GameState, input: WeekInput, _rng: Rng): WeekResult {
  let next = state;
  const lines: string[] = [];

  const season = seasonOf(next.world.week);

  // ── 1. 탐사 결과 적용 ────────────────────────────────
  if (input.expedition?.resources !== undefined) {
    const gained = input.expedition.resources;
    const resources = { ...next.resources };
    for (const [key, amount] of Object.entries(gained)) {
      const r = key as keyof typeof resources;
      resources[r] += amount;
    }
    next = { ...next, resources };
  }
  if (input.expedition?.xp !== undefined) {
    next = { ...next, hero: { ...next.hero, xp: next.hero.xp + input.expedition.xp } };
  }

  // ── 2. 자원 생산 − 식량 소비 (계절 보정) ──────────────
  const production = computeProduction(next.town.buildings, season);
  next = { ...next, resources: applyProduction(next.resources, production) };

  const foodIn = production.gross.food + production.season.food;
  if (foodIn > 0 || production.foodConsumed > 0) {
    lines.push(CHRONICLE_TEXT.harvest(foodIn, production.foodConsumed));
  }
  if (next.resources.food < 0) {
    lines.push(CHRONICLE_TEXT.famine(-next.resources.food));
  }

  // ── 3. 회복 (신전 등) ────────────────────────────────
  const healed = computeHeal(next);
  if (healed > 0) {
    next = { ...next, hero: { ...next.hero, hp: next.hero.hp + healed } };
    lines.push(CHRONICLE_TEXT.heal(healed));
  }

  // ── 4. 관계 갱신 — 호감 반영, 다가옴 판정 (§7.3) ──────
  // 문턱을 넘고 아직 소화하지 않은 사건이 있는 인물을 대기열에 세운다.
  // 실제로 다가오는 건 다음에 마을에 들어설 때다.
  next = { ...next, pendingApproach: queueApproaches(next) };

  // ── 5. 세계 이벤트 판정 (12%) ────────────────────────
  //    world-content.ts 의 WORLD_EVENTS 를 쓴다. 이 자리에 들어온다.

  // ── 6. 시대 판정 → 해금 판정 ─────────────────────────
  const power = townPower(next.town.buildings);
  const standing = eraFor(power);
  if (standing.eraIndex !== next.world.eraIndex || standing.eraTier !== next.world.eraTier) {
    const before = eraName(next.world.eraIndex, next.world.eraTier);
    const after = eraName(standing.eraIndex, standing.eraTier);

    const wasExtent = extentFor(next.world.eraIndex);
    const nowExtent = extentFor(standing.eraIndex);

    next = {
      ...next,
      world: { ...next.world, eraIndex: standing.eraIndex, eraTier: standing.eraTier },
    };
    lines.push(CHRONICLE_TEXT.era(before, after));

    if (nowExtent.width !== wasExtent.width || nowExtent.height !== wasExtent.height) {
      lines.push(CHRONICLE_TEXT.expand(nowExtent.width, nowExtent.height));
    }
  }

  // ── 7. 주차 증가, 연대기 기록 ────────────────────────
  let year = next.world.year;
  let week = next.world.week + 1;
  if (week > WEEKS_PER_YEAR) {
    week = 1;
    year += 1;
  }
  const turn = next.world.turn + 1;

  lines.unshift(CHRONICLE_TEXT.week(year, week, seasonOf(week)));

  const entries = lines.map((text, i) => makeEntry(turn, i, text));
  next = {
    ...next,
    world: { ...next.world, year, week, turn },
    chronicle: appendEntries(next.chronicle, entries),
  };

  // ── 8. 자동 저장 ─────────────────────────────────────
  //    부작용이라 여기서 하지 않는다. 부르는 쪽(스토어)이 저장한다.

  return { state: next, entries };
}
