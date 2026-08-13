/**
 * 저장 계층 진입점 — 앱 전체가 이 단일 어댑터 인스턴스만 사용한다.
 * 나중에 TauriAdapter / SyncAdapter 로 교체할 때 이 한 줄만 바꾼다 (§12.4).
 */

import { WebStorageAdapter } from './WebStorageAdapter';
import type { StorageAdapter } from './StorageAdapter';

export const storage: StorageAdapter = new WebStorageAdapter();

export type { StorageAdapter } from './StorageAdapter';
export { StorageError } from './StorageAdapter';
