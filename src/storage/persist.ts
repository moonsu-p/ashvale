/**
 * navigator.storage.persist() — 안드로이드 지속성의 주력 수단 (§12.3).
 * 승인되면 사용자가 직접 지울 때만 삭제된다. Chromium 은 팝업 없이 이력으로 판단한다.
 * 첫 실행 시 1회 요청하고 결과를 설정 화면에 표시한다.
 */

export interface PersistStatus {
  supported: boolean;
  persisted: boolean;
}

export async function requestPersistentStorage(): Promise<PersistStatus> {
  if (!('storage' in navigator) || !navigator.storage?.persist) {
    return { supported: false, persisted: false };
  }
  try {
    const already = await navigator.storage.persisted();
    if (already) return { supported: true, persisted: true };
    const granted = await navigator.storage.persist();
    return { supported: true, persisted: granted };
  } catch {
    return { supported: true, persisted: false };
  }
}
