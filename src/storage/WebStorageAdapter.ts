/**
 * WebStorageAdapter — 1차 구현 (§12.4).
 *  - 상태·원장: localStorage
 *  - 이미지: IndexedDB (별도 수명 주기, §12)
 *
 * 마이그레이션 실패 시 원본을 덮어쓰지 않고 백업 키로 보존한 뒤 오류를 던진다.
 * 원장은 max 방향으로만 병합된다 (불러오기가 진행도를 되돌리지 못한다, §12.7a).
 */

import type { GameState, Ledger } from '@/types/game';
import { migrateToCurrent, MigrationError } from './migrate';
import { StorageAdapter, StorageError } from './StorageAdapter';
import {
  SAVE_KEY,
  LEDGER_KEY,
  BACKUP_PREFIX,
  IDB_NAME,
  IDB_IMAGE_STORE,
  IDB_VERSION,
} from './keys';

const EMPTY_LEDGER: Ledger = { maxTurnReached: 0, collapses: 0, lastCollapseTurn: 0 };

export class WebStorageAdapter implements StorageAdapter {
  // ────────────────────────── 상태 ──────────────────────────

  async loadState(): Promise<GameState | null> {
    let raw: string | null;
    try {
      raw = localStorage.getItem(SAVE_KEY);
    } catch (e) {
      throw new StorageError('저장소를 읽을 수 없습니다. 시크릿 모드일 수 있습니다.', e);
    }
    if (!raw) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      this.backup(raw);
      throw new StorageError('세이브가 손상되었습니다. 원본을 백업했습니다. 새 연대기를 시작하거나 꾸러미를 불러오세요.', e);
    }

    try {
      return migrateToCurrent(parsed);
    } catch (e) {
      // 원본을 덮어쓰지 말고 백업 후 오류를 표시한다 (CLAUDE.md)
      this.backup(raw);
      if (e instanceof MigrationError) {
        throw new StorageError(`세이브를 불러오지 못했습니다: ${e.message} (원본은 백업했습니다.)`, e);
      }
      throw new StorageError('세이브 마이그레이션에 실패했습니다. 원본을 백업했습니다.', e);
    }
  }

  async saveState(s: GameState): Promise<void> {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch (e) {
      throw new StorageError('저장에 실패했습니다(용량 초과 또는 시크릿 모드). 꾸러미로 내보내기를 권합니다.', e);
    }
  }

  async backupCurrentSave(): Promise<void> {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) this.backup(raw);
    } catch {
      // 백업 실패는 새 게임 진행을 막지 않는다.
    }
  }

  private backup(raw: string): void {
    try {
      // 결정론적이지 않은 시각 대신 저장 자체의 길이+해시 회피: 단순 증가 키로 충돌만 피한다.
      const key = `${BACKUP_PREFIX}${localStorage.length}`;
      localStorage.setItem(key, raw);
    } catch {
      // 백업조차 실패하면(용량) 조용히 넘긴다 — 원본 localStorage 값은 그대로 남아 있다.
    }
  }

  // ────────────────────────── 원장 ──────────────────────────

  async loadLedger(): Promise<Ledger | null> {
    try {
      const raw = localStorage.getItem(LEDGER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<Ledger>;
      return { ...EMPTY_LEDGER, ...parsed };
    } catch {
      return null;
    }
  }

  async mergeLedger(next: Partial<Ledger>): Promise<Ledger> {
    const current = (await this.loadLedger()) ?? EMPTY_LEDGER;
    // 항상 max 방향으로만 갱신 (§12.7a 규칙 2)
    const merged: Ledger = {
      maxTurnReached: Math.max(current.maxTurnReached, next.maxTurnReached ?? 0),
      collapses: Math.max(current.collapses, next.collapses ?? 0),
      lastCollapseTurn: Math.max(current.lastCollapseTurn, next.lastCollapseTurn ?? 0),
    };
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(merged));
    } catch (e) {
      throw new StorageError('원장 저장에 실패했습니다.', e);
    }
    return merged;
  }

  async resetLedger(): Promise<void> {
    try {
      localStorage.setItem(LEDGER_KEY, JSON.stringify(EMPTY_LEDGER));
    } catch (e) {
      throw new StorageError('원장 초기화에 실패했습니다.', e);
    }
  }

  // ────────────────────────── 이미지 (IndexedDB) ──────────────────────────

  private dbPromise: Promise<IDBDatabase> | null = null;

  private openDb(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;
    this.dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
      const req = indexedDB.open(IDB_NAME, IDB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_IMAGE_STORE)) {
          db.createObjectStore(IDB_IMAGE_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new StorageError('이미지 저장소를 열 수 없습니다.', req.error));
    });
    return this.dbPromise;
  }

  private async tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.openDb();
    return new Promise<T>((resolve, reject) => {
      const t = db.transaction(IDB_IMAGE_STORE, mode);
      const store = t.objectStore(IDB_IMAGE_STORE);
      const req = fn(store);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(new StorageError('이미지 작업에 실패했습니다.', req.error));
    });
  }

  async getImage(key: string): Promise<Blob | null> {
    const v = await this.tx<Blob | undefined>('readonly', (s) => s.get(key) as IDBRequest<Blob | undefined>);
    return v ?? null;
  }

  async putImage(key: string, blob: Blob): Promise<void> {
    await this.tx('readwrite', (s) => s.put(blob, key) as IDBRequest<IDBValidKey>);
  }

  async deleteImage(key: string): Promise<void> {
    await this.tx('readwrite', (s) => s.delete(key) as IDBRequest<undefined>);
  }

  // ────────────────────────── 꾸러미 ──────────────────────────
  // M0: 상태+원장만 담는 JSON 꾸러미(골격). 이미지 포함 zip 파이프라인은 M7b 에서 완성한다.

  async exportBundle(): Promise<Blob> {
    const state = await this.loadState();
    const ledger = (await this.loadLedger()) ?? EMPTY_LEDGER;
    const payload = { kind: 'ashvale.bundle', schema: 1, save: state, ledger };
    return new Blob([JSON.stringify(payload)], { type: 'application/json' });
  }

  async importBundle(file: File): Promise<void> {
    let payload: { save?: unknown; ledger?: Partial<Ledger> };
    try {
      payload = JSON.parse(await file.text());
    } catch (e) {
      throw new StorageError('꾸러미를 읽을 수 없습니다. 올바른 파일인지 확인하세요.', e);
    }
    if (!payload.save) throw new StorageError('꾸러미에 세이브가 없습니다.');
    // 원장은 max 병합. (§12.7a 규칙 1의 붕괴 재적용은 M4 붕괴 로직에서 처리한다.)
    if (payload.ledger) await this.mergeLedger(payload.ledger);
    const migrated = migrateToCurrent(payload.save);
    await this.saveState(migrated);
  }
}
