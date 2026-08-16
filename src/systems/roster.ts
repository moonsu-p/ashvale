/**
 * 관계 대상 명단이 자라는 길 (§7.1, §7.4) — 순수 함수.
 *
 * 새 인물은 스스로 오지 않는다. **의뢰인의 소개**나 **맹우의 소개 연쇄**로만 들어온다.
 * 소개 연쇄를 우애 트랙 전용으로 둔 게 §7.4 의 핵심이다 —
 * 전원을 연심으로 밀면 로스터 성장이 멈춘다. 벌이 아니라 기회비용이다.
 */

import type { CompanionOrigin, CompanionRecord, GameState } from '@/types/game';
import { ARCHETYPES, COMPANION_LIMIT, getArchetype } from '@/data/archetypes';

/** 지금 명단에 있는(떠나지 않은) 인원 */
export function rosterSize(state: GameState): number {
  return Object.values(state.companions).filter((c) => c.departedTurn === null).length;
}

export function rosterFull(state: GameState): boolean {
  return rosterSize(state) >= COMPANION_LIMIT;
}

/**
 * 다음에 들어올 원형을 고른다.
 * 아직 없는 원형을 먼저 채우고, 여섯이 다 차면 중복을 허용한다 (§12 예비 자리 2개).
 */
function nextArchetype(state: GameState): string {
  const used = new Set(
    Object.values(state.companions)
      .filter((c) => c.departedTurn === null)
      .map((c) => c.archetypeId),
  );
  const fresh = ARCHETYPES.find((a) => !used.has(a.id));
  return fresh?.id ?? ARCHETYPES[0]?.id ?? 'knight';
}

export interface RosterGrowth {
  state: GameState;
  companion: CompanionRecord;
}

/**
 * 새 인물을 명단에 올린다. 상한 8명 (§7.1).
 * **이름은 비워 둔다** — 이름은 플레이어가 붙인다.
 */
export function addCompanion(state: GameState, origin: CompanionOrigin): RosterGrowth | null {
  if (rosterFull(state)) return null;

  const archetypeId = nextArchetype(state);
  // id 는 세이브 안에서만 유일하면 된다. 시계를 읽지 않는다
  let n = Object.keys(state.companions).length + 1;
  while (state.companions[`c${n}`] !== undefined) n += 1;

  const companion: CompanionRecord = {
    id: `c${n}`,
    archetypeId,
    name: '',
    affinity: 0,
    track: null,
    confessed: 'none',
    clearedEvents: [],
    lastApproachTurn: 0,
    injuredUntilTurn: 0,
    images: {},
    unlockedSlots: [0],
    homeRegion: getArchetype(archetypeId)?.homeRegion ?? '',
    origin,
    joinedTurn: state.world.turn,
    departedTurn: null,
  };

  return {
    state: { ...state, companions: { ...state.companions, [companion.id]: companion } },
    companion,
  };
}
