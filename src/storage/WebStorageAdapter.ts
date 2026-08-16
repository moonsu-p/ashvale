/**
 * 웹 구현 — 상태는 localStorage, 이미지는 IndexedDB (§0, §14).
 *
 * 이 파일이 브라우저 저장 API를 부르는 **유일한 자리**다.
 * 다른 데서 localStorage나 indexedDB를 직접 쓰지 마라.
 */

import { IMAGE_DB } from '@/data/save';
import {
  StorageError,
  type StorageAdapter,
  type StorageEstimateInfo,
} from './StorageAdapter';

function isQuotaError(err: unknown): boolean {
  if (!(err instanceof DOMException)) return false;
  // 브라우저마다 이름이 다르다. 파이어폭스는 코드 1014를 쓴다
  return (
    err.name === 'QuotaExceededError' ||
    err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    err.code === 22 ||
    err.code === 1014
  );
}

function mapTxError(err: unknown): StorageError {
  return isQuotaError(err)
    ? new StorageError(
        'quota',
        '이미지를 저장할 공간이 없다. 쓰지 않는 슬롯의 이미지를 지워라.',
        { cause: err },
      )
    : new StorageError('unknown', '이미지 저장에 실패했다.', { cause: err });
}

export class WebStorageAdapter implements StorageAdapter {
  #db: Promise<IDBDatabase> | null = null;

  // ── 상태 ────────────────────────────────────────────────

  async getText(key: string): Promise<string | null> {
    try {
      return window.localStorage.getItem(key);
    } catch (cause) {
      throw new StorageError(
        'unavailable',
        '저장소를 읽지 못했다. 브라우저의 사생활 보호 모드를 끄고 다시 열어라.',
        { cause },
      );
    }
  }

  async setText(key: string, value: string): Promise<void> {
    try {
      window.localStorage.setItem(key, value);
    } catch (cause) {
      if (isQuotaError(cause)) {
        throw new StorageError(
          'quota',
          '저장 공간이 찼다. 꾸러미로 내보낸 뒤 인물 이미지를 지우면 자리가 생긴다.',
          { cause },
        );
      }
      throw new StorageError('unknown', '저장하지 못했다. 잠시 뒤 다시 시도하라.', { cause });
    }
  }

  async removeText(key: string): Promise<void> {
    window.localStorage.removeItem(key);
  }

  async textKeys(prefix?: string): Promise<string[]> {
    const out: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (key === null) continue;
      if (prefix === undefined || key.startsWith(prefix)) out.push(key);
    }
    return out;
  }

  // ── 이미지 ──────────────────────────────────────────────

  #open(): Promise<IDBDatabase> {
    if (this.#db === null) {
      const opening = new Promise<IDBDatabase>((resolve, reject) => {
        const req = window.indexedDB.open(IMAGE_DB.name, IMAGE_DB.version);
        req.onupgradeneeded = () => {
          if (!req.result.objectStoreNames.contains(IMAGE_DB.store)) {
            req.result.createObjectStore(IMAGE_DB.store);
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () =>
          reject(
            new StorageError(
              'unavailable',
              '이미지 저장소를 열지 못했다. 브라우저를 다시 시작해 보라.',
              { cause: req.error },
            ),
          );
      });
      // 실패한 약속을 물고 있으면 다시 시도할 방법이 없어진다. 실패하면 비운다
      this.#db = opening.catch((err: unknown) => {
        this.#db = null;
        throw err;
      });
    }
    return this.#db;
  }

  async #tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
    const db = await this.#open();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction(IMAGE_DB.store, mode);
      const req = run(tx.objectStore(IMAGE_DB.store));
      // 트랜잭션이 완주해야 값을 넘긴다. 요청만 성공하고 커밋이 깨지는 경우를 거른다
      tx.oncomplete = () => resolve(req.result);
      tx.onabort = () => reject(mapTxError(tx.error));
      tx.onerror = () => reject(mapTxError(tx.error));
    });
  }

  async getImage(key: string): Promise<Blob | null> {
    const value = await this.#tx<unknown>('readonly', (s) => s.get(key));
    return value instanceof Blob ? value : null;
  }

  async putImage(key: string, blob: Blob): Promise<void> {
    await this.#tx('readwrite', (s) => s.put(blob, key));
  }

  async removeImage(key: string): Promise<void> {
    await this.#tx('readwrite', (s) => s.delete(key));
  }

  async imageKeys(): Promise<string[]> {
    const keys = await this.#tx<IDBValidKey[]>('readonly', (s) => s.getAllKeys());
    return keys.map(String);
  }

  // ── 지속성 ──────────────────────────────────────────────

  async requestPersistence(): Promise<boolean> {
    if (!navigator.storage?.persist) return false;
    try {
      return await navigator.storage.persist();
    } catch {
      return false;
    }
  }

  async isPersisted(): Promise<boolean> {
    if (!navigator.storage?.persisted) return false;
    try {
      return await navigator.storage.persisted();
    } catch {
      return false;
    }
  }

  async estimate(): Promise<StorageEstimateInfo | null> {
    if (!navigator.storage?.estimate) return null;
    try {
      const { usage, quota } = await navigator.storage.estimate();
      if (usage === undefined || quota === undefined) return null;
      return { usage, quota };
    } catch {
      return null;
    }
  }
}
