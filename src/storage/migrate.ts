/**
 * schemaVersion 마이그레이션 체인 골격 — §12.
 *
 * 지금은 스키마 1 하나뿐이라 실제 변환은 없다. 미래에 스키마를 올릴 때
 * migrations[1] = (s) => { ... return s2 } 형태로 한 단계씩 추가한다.
 *
 * 실패 정책 (CLAUDE.md): 마이그레이션이 실패하면 원본을 덮어쓰지 않는다.
 * 이 모듈은 예외를 던지기만 하고, 백업 보존은 호출부(WebStorageAdapter)가 맡는다.
 */

import { CURRENT_SCHEMA, type GameState } from '@/types/game';

export class MigrationError extends Error {
  constructor(
    message: string,
    readonly fromVersion: unknown
  ) {
    super(message);
    this.name = 'MigrationError';
  }
}

/** from 버전 → from+1 버전으로 올리는 함수들. 키가 곧 "그 버전에서 다음으로" 를 뜻한다. */
type MigrationStep = (raw: Record<string, unknown>) => Record<string, unknown>;

const migrations: Record<number, MigrationStep> = {
  // 예) 1: (s) => ({ ...s, schemaVersion: 2, /* 새 필드 기본값 */ }),
};

/**
 * 원시 파싱 객체를 현재 스키마까지 끌어올린다.
 * 실패하면 MigrationError 를 던진다 (호출부가 백업 후 사용자에게 알린다).
 */
export function migrateToCurrent(raw: unknown): GameState {
  if (raw === null || typeof raw !== 'object') {
    throw new MigrationError('세이브 데이터가 객체가 아닙니다.', raw);
  }
  let obj = raw as Record<string, unknown>;
  const initial = obj.schemaVersion;

  if (typeof initial !== 'number') {
    throw new MigrationError('schemaVersion 이 없습니다.', initial);
  }
  let version: number = initial;
  if (version > CURRENT_SCHEMA) {
    throw new MigrationError(
      `더 최신 버전의 세이브입니다 (v${version}). 앱을 업데이트하세요.`,
      version
    );
  }

  while (version < CURRENT_SCHEMA) {
    const step = migrations[version];
    if (!step) {
      throw new MigrationError(`v${version} → v${version + 1} 마이그레이션이 없습니다.`, version);
    }
    obj = step(obj);
    const nextVersion = obj.schemaVersion;
    if (typeof nextVersion !== 'number' || nextVersion <= version) {
      throw new MigrationError('마이그레이션이 버전을 올리지 못했습니다.', version);
    }
    version = nextVersion;
  }

  return obj as unknown as GameState;
}
