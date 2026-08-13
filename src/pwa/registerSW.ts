/**
 * 서비스 워커 등록 — 오프라인 실행용 (§12.3).
 * 개발 모드(Vite HMR)에서는 캐시 간섭을 피하려고 등록하지 않는다.
 * BASE_URL 을 붙여 서브경로 배포에서도 스코프가 맞게 한다.
 */

export function registerServiceWorker(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    const url = `${import.meta.env.BASE_URL}sw.js`;
    navigator.serviceWorker.register(url, { scope: import.meta.env.BASE_URL }).catch(() => {
      // 등록 실패는 앱 실행을 막지 않는다 (오프라인 기능만 비활성).
    });
  });
}
