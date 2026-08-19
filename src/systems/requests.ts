/**
 * 주간 부탁 (§7.3, §11) — 순수 함수.
 *
 * 한 주에 한 번만 나갈 수 있다(§3). 그러니 **둘이 다른 지역을 부탁하면
 * 하나만 들어줄 수 있다** — 그 주의 답이 하나가 아니게 된다.
 *
 * **세이브에 칸을 늘리지 않는다.** 누가 어디를 부탁했는지는 주차와 시드에서
 * 뽑는다. 같은 주에는 늘 같은 부탁이고, 주가 넘어가면 사라진다.
 * 나들이(outing.ts)와 같은 방식이다.
 */

import type { CompanionRecord, GameState } from '@/types/game';
import { REQUESTS, REQUEST_CHANCE, type RequestLine } from '@/data/content/requests';
import { REGIONS, regionName } from '@/data/regions';
import { createRng } from './rng';
import { seedOf } from './newGame';
import { applyToken } from './korean';
import { displayName } from './relationships';
import { ESCORT_MIN_AFFINITY } from '@/data/relationships';

export interface Request {
  companionId: string;
  regionId: string;
  line: RequestLine;
}

/**
 * 부탁할 만한 사이인가.
 *
 * 낯선 사람은 부탁하지 않는다 — 동행을 부탁할 수 있는 사이(40)부터.
 * 다친 사람도 하지 않는다.
 */
function canAsk(who: CompanionRecord, turn: number): boolean {
  return (
    who.departedTurn === null &&
    who.affinity >= ESCORT_MIN_AFFINITY &&
    who.injuredUntilTurn <= turn
  );
}

/**
 * 이번 주의 부탁들.
 *
 * 최대 둘까지 나온다. 셋이면 고르는 게 아니라 포기하는 일이 된다.
 * **서로 다른 지역을 부탁한다** — 같은 데를 부탁하면 갈등이 아니다.
 */
export function requestsOf(state: GameState): Request[] {
  const open = REGIONS.filter((r) => state.world.eraIndex >= r.unlockEra);
  if (open.length < 2) return [];

  const askers = Object.values(state.companions)
    .filter((c) => canAsk(c, state.world.turn))
    .sort((a, b) => a.id.localeCompare(b.id));
  if (askers.length === 0) return [];

  const rng = createRng(`${seedOf(state)}:request:${state.world.turn}`);
  if (!rng.chance(REQUEST_CHANCE)) return [];

  const out: Request[] = [];
  const usedRegion = new Set<string>();
  const usedWho = new Set<string>();

  // 둘까지. 둘째는 절반 확률로만 — 매주 갈등이면 그것도 일과가 된다
  const count = askers.length >= 2 && open.length >= 2 && rng.chance(0.5) ? 2 : 1;

  for (let i = 0; i < count; i++) {
    const who = rng.pick(askers.filter((c) => !usedWho.has(c.id)));
    const region = rng.pick(open.filter((r) => !usedRegion.has(r.id)));
    const line = rng.pick(REQUESTS);
    if (who === undefined || region === undefined || line === undefined) break;
    usedWho.add(who.id);
    usedRegion.add(region.id);
    out.push({ companionId: who.id, regionId: region.id, line });
  }

  return out;
}

/** 그 지역에 걸린 부탁. 없으면 null */
export function requestFor(state: GameState, regionId: string): Request | null {
  return requestsOf(state).find((r) => r.regionId === regionId) ?? null;
}

/** 화면에 그대로 쓸 문장 */
export function fillRequest(state: GameState, req: Request, which: keyof RequestLine): string {
  const who = state.companions[req.companionId];
  return applyToken(
    applyToken(req.line[which], '{지역}', regionName(req.regionId)),
    '{거점}',
    state.town.name,
  ).concat(who === undefined ? '' : '');
}

/** 부탁한 사람 이름 */
export function askerName(state: GameState, req: Request): string {
  const who = state.companions[req.companionId];
  return who === undefined ? '' : displayName(who);
}
