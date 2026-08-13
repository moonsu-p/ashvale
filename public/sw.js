/*
 * 서비스 워커 — 오프라인 실행 확보 (§12.3).
 *
 * 절대 규칙 (CLAUDE.md):
 *  - caches.delete() 는 써도 되지만 IndexedDB / localStorage 는 절대 건드리지 않는다.
 *  - 외부(원격) 자산을 캐시하거나 요청하지 않는다. 전부 같은 출처 자산만 다룬다.
 *
 * 전략:
 *  - 설치 시 앱 셸(문서·매니페스트·아이콘) 선캐시.
 *  - 문서 요청: 네트워크 우선 → 실패 시 캐시된 셸(오프라인).
 *  - 그 외 같은 출처 GET: 캐시 우선 → 없으면 네트워크 후 런타임 캐시(해시 파일이라 안전).
 */

const CACHE = 'ashvale-v1';

// base './' 기준. 등록 스코프 하위 상대 경로.
const APP_SHELL = ['./', './index.html', './manifest.webmanifest', './icons/icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => {
        /* 선캐시 실패가 설치를 막지 않게 한다 */
      })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 외부 요청은 관여하지 않는다

  // 문서(내비게이션): 네트워크 우선, 실패 시 앱 셸로 오프라인 동작
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() =>
        caches.match(req).then((r) => r || caches.match('./index.html').then((s) => s || Response.error()))
      )
    );
    return;
  }

  // 정적 자산: 캐시 우선, 없으면 네트워크 후 런타임 캐시
  event.respondWith(
    caches.match(req).then(
      (cached) =>
        cached ||
        fetch(req)
          .then((res) => {
            if (res && res.ok && res.type === 'basic') {
              const copy = res.clone();
              caches.open(CACHE).then((cache) => cache.put(req, copy));
            }
            return res;
          })
          .catch(() => cached || Response.error())
    )
  );
});
