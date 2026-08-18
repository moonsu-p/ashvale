/**
 * 지역 사건 (§11 사건 노드) — 순수 함수.
 *
 * 사건 노드는 전리품 노드와 **다르게 굴러야 한다.** 셋 다 같은 1d20 을
 * 굴리니 지역이 단조로웠다. §11 은 사건 노드를 "텍스트 사건, 세력 평판이나
 * 소량 XP" 로 정했다 — 주사위가 아니라 고르는 자리다.
 *
 * 규칙만 여기 있고 문장은 content/region-events.ts 에 있다.
 */

import type { GameState, ResourceId } from '@/types/game';
import type { RegionChoice, RegionEvent } from '@/data/content/region-events';
import { REGION_EVENTS } from '@/data/content/region-events';
import type { Rng } from './rng';
import { shiftFaction } from './factions';
import { withAffinity } from './relationships';
import { applyToken } from './korean';
import { escortOf } from './escort';
import { displayName } from './roster';

/**
 * 이 자리에서 벌어질 수 있는 사건.
 *
 * 지역이 맞아야 하고, 동행 전용 사건은 데려왔을 때만 나온다.
 * 하나도 없으면 null — 부르는 쪽이 조용히 넘긴다.
 */
export function pickRegionEvent(
  state: GameState,
  regionId: string,
  rng: Rng,
): RegionEvent | null {
  const escorted = escortOf(state) !== null;

  const pool = REGION_EVENTS.filter((event) => {
    if (event.needsEscort === true && !escorted) return false;
    if (event.regions !== undefined && !event.regions.includes(regionId)) return false;
    return true;
  });

  return rng.pick(pool) ?? null;
}

/** 이름과 마을 이름을 채운다. 동행이 없으면 {동료} 가 남지 않게 비운다 */
export function fillEventText(text: string, state: GameState): string {
  const who = escortOf(state);
  return applyToken(
    applyToken(text, '{거점}', state.town.name),
    '{동료}',
    who === null ? '' : displayName(who),
  );
}

export interface RegionEventResult {
  state: GameState;
  /** 화면에 잠깐 띄울 것들 — `세력 +4`, `기력 -2` */
  notes: string[];
  /** 유물을 굴려야 하는가. 실제 추첨은 부르는 쪽이 한다 */
  rollRelic: boolean;
  xp: number;
}

/**
 * 고른 것이 실제로 일어난다 (§8.4). 정답은 없다 —
 * 자원을 얻는 쪽은 평판이나 호감을 잃고, 그 반대도 있다.
 */
export function applyRegionChoice(
  state: GameState,
  choice: RegionChoice,
  factionLabel: (id: string) => string,
): RegionEventResult {
  let next = state;
  const notes: string[] = [];

  if (choice.resources !== undefined) {
    const resources = { ...next.resources };
    for (const [key, amount] of Object.entries(choice.resources)) {
      if (amount === undefined || amount === 0) continue;
      resources[key as ResourceId] += amount;
    }
    next = { ...next, resources };
  }

  if (choice.hp !== undefined && choice.hp !== 0) {
    // 기력은 0 아래로 내려가지 않는다. 쓰러짐 처리는 부르는 쪽이 본다
    const hp = Math.max(0, Math.min(next.hero.maxHp, next.hero.hp + choice.hp));
    next = { ...next, hero: { ...next.hero, hp } };
    notes.push(`기력 ${choice.hp > 0 ? '+' : ''}${choice.hp}`);
  }

  if (choice.faction !== undefined) {
    next = {
      ...next,
      factions: shiftFaction(next.factions, choice.faction.id, choice.faction.delta),
    };
    const sign = choice.faction.delta > 0 ? '+' : '';
    notes.push(`${factionLabel(choice.faction.id)} ${sign}${choice.faction.delta}`);
  }

  // 호감은 데려온 사람에게만 붙는다 (§7.3 — 함께 겪은 일에서 오른다)
  const who = escortOf(next);
  if (choice.affinity !== undefined && choice.affinity !== 0 && who !== null) {
    const moved = withAffinity(who, choice.affinity);
    next = { ...next, companions: { ...next.companions, [moved.id]: moved } };
    notes.push(`호감 ${choice.affinity > 0 ? '+' : ''}${choice.affinity}`);
  }

  return {
    state: next,
    notes,
    rollRelic: choice.relic === true,
    xp: choice.xp ?? 0,
  };
}
