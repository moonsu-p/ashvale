/**
 * 세이브·원장 입출력 (§14).
 * 규칙은 systems/ledger.ts 에 있다. 여기는 읽고 쓰는 일만 한다.
 */

import type { GameState, Ledger } from '@/types/game';
import { KEYS, LEDGER_VERSION } from '@/data/save';
import { newLedger } from '@/systems/newGame';
import { advanceLedger, mergeLedger } from '@/systems/ledger';
import { migrate } from './migrate';
import type { StorageAdapter } from './StorageAdapter';

export type LoadOutcome =
  /** 정상 복원 */
  | { kind: 'loaded'; state: GameState; ledger: Ledger; migratedFrom: number }
  /** 세이브가 없다. 새 게임을 시작하면 된다 */
  | { kind: 'empty'; ledger: Ledger }
  /** 읽었지만 쓸 수 없다. 원본은 backupKey 에 보존했다 */
  | { kind: 'failed'; message: string; backupKey: string | null; ledger: Ledger };

export async function saveGame(adapter: StorageAdapter, state: GameState): Promise<void> {
  await adapter.setText(KEYS.save, JSON.stringify(state));
}

export async function saveLedger(adapter: StorageAdapter, ledger: Ledger): Promise<void> {
  await adapter.setText(KEYS.ledger, JSON.stringify(ledger));
}

/**
 * 상태와 원장을 함께 쓴다.
 * 원장은 항상 **합쳐서** 쓴다. 덮어쓰면 값이 내려갈 수 있다.
 */
export async function saveAll(adapter: StorageAdapter, state: GameState): Promise<Ledger> {
  const stored = await loadLedger(adapter);
  const next = advanceLedger(stored, state);
  await saveGame(adapter, state);
  await saveLedger(adapter, next);
  return next;
}

/** 원장 읽기. 없거나 깨졌으면 새 원장. 원장은 절대 불러오기를 막지 않는다 */
export async function loadLedger(adapter: StorageAdapter): Promise<Ledger> {
  let text: string | null = null;
  try {
    text = await adapter.getText(KEYS.ledger);
  } catch {
    return newLedger();
  }
  if (text === null) return newLedger();

  try {
    const raw: unknown = JSON.parse(text);
    if (typeof raw !== 'object' || raw === null) return newLedger();
    const r = raw as Partial<Ledger>;
    const parsed: Ledger = {
      ledgerVersion: LEDGER_VERSION,
      maxTurnReached: typeof r.maxTurnReached === 'number' ? r.maxTurnReached : 0,
      collapses: typeof r.collapses === 'number' ? r.collapses : 0,
      lastCollapseTurn: typeof r.lastCollapseTurn === 'number' ? r.lastCollapseTurn : null,
    };
    // 깨진 원장이 값을 낮추지 못하게 한 번 더 거른다
    return mergeLedger(newLedger(), parsed);
  } catch {
    return newLedger();
  }
}

/**
 * 세이브 불러오기.
 *
 * 마이그레이션이 실패하면 **덮어쓰지 않는다.** 원본을 백업 키로 옮기고
 * 실패를 돌려준다. 원본이 사라지면 손으로 복구할 길도 사라진다.
 */
export async function loadGame(adapter: StorageAdapter, now: number): Promise<LoadOutcome> {
  const ledger = await loadLedger(adapter);

  let text: string | null;
  try {
    text = await adapter.getText(KEYS.save);
  } catch (err) {
    return {
      kind: 'failed',
      message: err instanceof Error ? err.message : '세이브를 읽지 못했다.',
      backupKey: null,
      ledger,
    };
  }

  if (text === null) return { kind: 'empty', ledger };

  const result = migrate(text);

  if (!result.ok) {
    const backupKey = await backupRaw(adapter, text, now);
    return {
      kind: 'failed',
      message: result.message,
      backupKey,
      ledger,
    };
  }

  // 불러오기가 원장을 낮추지 못한다 (§14)
  const merged = advanceLedger(ledger, result.state);
  if (
    merged.maxTurnReached !== ledger.maxTurnReached ||
    merged.collapses !== ledger.collapses
  ) {
    await saveLedger(adapter, merged);
  }

  return { kind: 'loaded', state: result.state, ledger: merged, migratedFrom: result.from };
}

/** 원본을 백업 키로 보존. 백업까지 실패하면 null — 그래도 원본은 제자리에 그대로 있다 */
async function backupRaw(
  adapter: StorageAdapter,
  text: string,
  now: number,
): Promise<string | null> {
  const key = `${KEYS.backupPrefix}:${now}`;
  try {
    await adapter.setText(key, text);
    return key;
  } catch {
    return null;
  }
}
