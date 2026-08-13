/**
 * 거점 붕괴 — 순수 함수 (§15.2). 거점은 무너질 수 있으나 연대기·갤러리·업로드 이미지는 보존된다.
 * 캐릭터는 죽지 않는다. 붕괴는 끝이 아니라 한 장(章)이다.
 */

import type { GameState, ChronicleEntry, Season } from '@/types/game';
import type { Rng } from './rng';
import { population } from './economy';
import { COLLAPSE_FOOD_STREAK, COLLAPSE_POP_MAX, COLLAPSE_WARN_BEFORE, COLLAPSE_REBUILD_RESOURCES } from '@/data/collapse';
import { collapseText } from '@/data/chronicle-system';

/** 붕괴 조건 1 (§15.2): 식량<0 연속 + 인구 이하. (조건 2 위협→hall 0 은 §8 M8) */
export function shouldCollapse(state: GameState): boolean {
  return (
    state.counters.foodDeficitStreak >= COLLAPSE_FOOD_STREAK &&
    population(state) <= COLLAPSE_POP_MAX
  );
}

/** 붕괴 임박 여부 — 화면·연대기 경고용. streak 이 (판정−경고) 이상이고 붕괴 궤도(인구 조건)일 때. */
export function isCollapseImminent(state: GameState): boolean {
  return (
    state.counters.foodDeficitStreak >= COLLAPSE_FOOD_STREAK - COLLAPSE_WARN_BEFORE &&
    population(state) <= COLLAPSE_POP_MAX &&
    !shouldCollapse(state)
  );
}

/** 현재 세대 번호 (제N대). 붕괴 횟수 + 1. */
export function generationOf(state: GameState): number {
  return state.counters.collapses + 1;
}

/**
 * 붕괴 처리 — 전달된 상태를 제자리에서 변이하고 붕괴 연대기 항목을 돌려준다.
 * images/갤러리/연대기 항목은 건드리지 않는다(100% 보존). ledger 갱신은 경계(store)가 맡는다.
 */
export function applyCollapse(s: GameState, rng: Rng): ChronicleEntry {
  const fallenGen = generationOf(s); // 증가 전 세대가 무너진다

  // 건물: 회관 Lv1만
  s.settlement.buildings = { hall: 1 };
  // 자원: 0 + 재건 지원
  s.resources = { ...COLLAPSE_REBUILD_RESOURCES };
  // 시대: 1단계만 하락 (0 밑으로 안 감), 티어 초기화
  s.world.eraIndex = Math.max(0, s.world.eraIndex - 1);
  s.world.eraTier = 0;

  // 캐릭터 레벨·능력치·XP: 유지
  // 스킬: 랭크 절반 회수 후 SP 환급
  let refunded = 0;
  for (const [id, rank] of Object.entries(s.hero.skills)) {
    const removed = Math.floor(rank / 2);
    if (removed > 0) {
      s.hero.skills[id] = rank - removed;
      refunded += removed;
    }
  }
  s.hero.skillPoints += refunded;

  // 유물: 절반 유실 (무작위)
  const loseCount = Math.floor(s.hero.relics.length / 2);
  for (let i = 0; i < loseCount; i++) {
    const idx = rng.int(0, s.hero.relics.length - 1);
    s.hero.relics.splice(idx, 1);
  }

  // 관계 대상: 호감 절반 하락, 벗(60) 미만은 떠난다(레코드 보존)
  for (const c of Object.values(s.companions)) {
    c.affinity = Math.floor(c.affinity / 2);
    if (c.affinity < 60 && c.departedTurn === null) {
      c.departedTurn = s.world.turn;
    }
  }
  // 의뢰인·업로드 이미지·갤러리·연대기: 보존 (건드리지 않음)

  // 붕괴 카운트·재기 보정
  s.counters.collapses += 1;
  s.counters.foodDeficitStreak = 0;
  s.threat = null;
  s.activeQuest = null; // 진행 중 퀘스트 초기화 (§16.1)

  const season: Season = (Math.floor((s.world.week - 1) / 12) % 4) as Season;
  return {
    year: s.world.year,
    week: s.world.week,
    season,
    kind: 'milestone',
    text: collapseText(fallenGen),
  };
}
