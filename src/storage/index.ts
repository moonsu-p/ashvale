/**
 * 저장 계층의 유일한 입구.
 * 게임 코드는 여기서만 가져다 쓴다. 구현체를 직접 import 하지 마라.
 */

import { WebStorageAdapter } from './WebStorageAdapter';
import type { StorageAdapter } from './StorageAdapter';

let adapter: StorageAdapter = new WebStorageAdapter();

export function getStorage(): StorageAdapter {
  return adapter;
}

/** Capacitor로 옮기거나 시험용 어댑터를 끼울 때 쓴다 */
export function setStorage(next: StorageAdapter): void {
  adapter = next;
}

export { StorageError } from './StorageAdapter';
export type { StorageAdapter, StorageEstimateInfo, StorageFailure } from './StorageAdapter';
export { loadGame, saveGame, saveAll, loadLedger, saveLedger } from './persist';
export type { LoadOutcome } from './persist';
export { migrate } from './migrate';
export type { MigrateResult } from './migrate';
