/**
 * 관계 대상 명단이 자라는 길 (§7.1, §7.4) — 순수 함수.
 *
 * 새 인물은 스스로 오지 않는다. **의뢰인의 소개**나 **맹우의 소개 연쇄**로만 들어온다.
 * 소개 연쇄를 우애 트랙 전용으로 둔 게 §7.4 의 핵심이다 —
 * 전원을 연심으로 밀면 로스터 성장이 멈춘다. 벌이 아니라 기회비용이다.
 */

import type { CompanionOrigin, CompanionRecord, GameState } from '@/types/game';
import { ARCHETYPES, COMPANION_LIMIT, getArchetype } from '@/data/archetypes';
import { LODGE_SLOTS_PER_LEVEL } from '@/data/buildings';

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

/**
 * 숙소에 상주하는 인물 (§7.4, §10).
 *
 * 고백을 받아들이면 마을에 상주 위치가 생긴다 — 그게 숙소다.
 * 자리는 숙소 레벨당 둘. 자리가 없으면 아직 들어오지 못한다.
 */
export function residentsOf(state: GameState): CompanionRecord[] {
  const capacity = (state.town.buildings['lodge'] ?? 0) * LODGE_SLOTS_PER_LEVEL;
  if (capacity <= 0) return [];

  return Object.values(state.companions)
    .filter((c) => c.departedTurn === null && c.track === 'romance' && c.confessed === 'accepted')
    .sort((a, b) => b.affinity - a.affinity)
    .slice(0, capacity);
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
    pickedSlot: 0,
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

/**
 * 마을에 서 있는 인물 (§7.6, §10).
 *
 * 이게 없어서 명단에 있는 사람이 **마을 어디에도 없었다.** 마을 맵에는
 * 기사 하나가 좌표까지 박힌 채로 서 있었고, 나머지는 문턱을 넘어
 * 다가올 때만 잠깐 나타났다가 사라졌다. 말을 걸려면 다가와 주기를
 * 기다리는 수밖에 없었다 — 찾아갈 데가 없으니 관계가 자리를 못 얻는다.
 *
 * 빠지는 사람:
 *   - 숙소에 사는 연인은 숙소 안에 있다 (residentsOf)
 *   - 지금 동행 중인 사람은 함께 지역에 나가 있다
 *
 * 순서를 명단에 들어온 차례로 고정한다. 자리가 흔들리면 갔던 데를 또 못 찾는다.
 */
export function townFolk(state: GameState): CompanionRecord[] {
  const indoors = new Set(residentsOf(state).map((c) => c.id));

  return Object.values(state.companions)
    .filter(
      (c) => c.departedTurn === null && !indoors.has(c.id) && c.id !== state.escort,
    )
    .sort((a, b) => a.joinedTurn - b.joinedTurn || a.id.localeCompare(b.id));
}
