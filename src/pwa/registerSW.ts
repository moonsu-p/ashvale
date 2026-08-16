/**
 * 서비스 워커 등록 (§14).
 *
 * 개발 중에는 등록하지 않는다. 낡은 캐시가 물려 있으면 고친 게 화면에 안 나와서
 * 없는 버그를 쫓게 된다.
 */

export function registerSW(): void {
  if (!import.meta.env.PROD) return;
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    // base 가 './' 라 배포 경로가 어디든 문서 기준으로 풀린다
    const url = new URL('sw.js', document.baseURI).href;
    void navigator.serviceWorker.register(url, { scope: './' }).catch(() => {
      // 등록 실패는 치명적이지 않다. 온라인에서는 그대로 돌아간다
    });
  });
}
