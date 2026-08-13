/**
 * 저장소 키 — 한 곳에 모은다. 저장소 API 직접 호출은 StorageAdapter 안에서만 한다 (§12.4).
 */

export const SAVE_KEY = 'ashvale.save.v1'; // localStorage: GameState JSON
export const LEDGER_KEY = 'ashvale.ledger.v1'; // localStorage: Ledger JSON (별도 수명)
export const BACKUP_PREFIX = 'ashvale.save.backup.'; // 마이그레이션 실패·새 연대기 시작 시 원본 보관

export const IDB_NAME = 'ashvale'; // IndexedDB DB 이름
export const IDB_IMAGE_STORE = 'ashvale-images'; // 이미지 Blob 스토어 (§11.4, §12)
export const IDB_VERSION = 1;
