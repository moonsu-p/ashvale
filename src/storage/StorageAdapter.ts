/**
 * 저장 경계 (§14).
 *
 * 게임 코드는 `localStorage` / `indexedDB` 를 **직접 부르지 않는다.**
 * 전부 이 인터페이스 뒤에 있다. 나중에 Capacitor로 옮길 때 구현체만 갈아끼운다.
 *
 * 전부 비동기다. localStorage는 동기지만, 여기서 동기로 노출하면
 * 파일 기반 어댑터로 바꿀 때 호출부를 전부 고쳐야 한다.
 */

export interface StorageEstimateInfo {
  usage: number;
  quota: number;
}

/** 저장이 실패한 이유. UI는 이걸 보고 무엇을 하면 되는지 알려 준다 */
export type StorageFailure = 'quota' | 'unavailable' | 'corrupt' | 'unknown';

export class StorageError extends Error {
  readonly failure: StorageFailure;
  constructor(failure: StorageFailure, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageError';
    this.failure = failure;
  }
}

export interface StorageAdapter {
  // ── 상태: 문자열 (웹에서는 localStorage)
  getText(key: string): Promise<string | null>;
  setText(key: string, value: string): Promise<void>;
  removeText(key: string): Promise<void>;
  /** 접두로 거른 키 목록. 백업 키를 찾을 때 쓴다 */
  textKeys(prefix?: string): Promise<string[]>;

  // ── 이미지: 이진 (웹에서는 IndexedDB)
  //    관계 대상 초상은 기기 밖으로 나가지 않는다 (§9)
  getImage(key: string): Promise<Blob | null>;
  putImage(key: string, blob: Blob): Promise<void>;
  removeImage(key: string): Promise<void>;
  imageKeys(): Promise<string[]>;

  // ── 지속성 (§14 안드로이드)
  /** 사용자 승인이 필요할 수 있다. 승인되면 true */
  requestPersistence(): Promise<boolean>;
  isPersisted(): Promise<boolean>;
  estimate(): Promise<StorageEstimateInfo | null>;
}
