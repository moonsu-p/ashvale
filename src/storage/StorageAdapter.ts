/**
 * 저장 계층 추상화 — §12.4.
 * 게임 코드는 이 인터페이스만 호출한다. localStorage / IndexedDB 를 직접 부르지 않는다.
 */

import type { GameState, Ledger } from '@/types/game';

export interface StorageAdapter {
  loadState(): Promise<GameState | null>;
  saveState(s: GameState): Promise<void>;

  loadLedger(): Promise<Ledger | null>;
  /** 원장은 max 방향으로만 병합된다 (§12.7a). 반환값은 병합 후 최종 원장. */
  mergeLedger(next: Partial<Ledger>): Promise<Ledger>;
  /** '새 연대기 시작' 전용: 원장을 0으로 초기화한다 (§12.7a 규칙 4). */
  resetLedger(): Promise<void>;

  /** '새 연대기 시작' 시 기존 세이브를 백업 키로 보존한다 (§12). */
  backupCurrentSave(): Promise<void>;

  getImage(key: string): Promise<Blob | null>;
  putImage(key: string, blob: Blob): Promise<void>;
  deleteImage(key: string): Promise<void>;

  exportBundle(): Promise<Blob>; // 이미지 포함 꾸러미(zip) — 완전 구현은 M7b
  importBundle(file: File): Promise<void>;
}

/** 저장 실패를 조용히 넘기지 않기 위한 신호 (§12) — 호출부가 배너로 노출한다. */
export class StorageError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = 'StorageError';
  }
}
