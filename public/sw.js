/**
 * 서비스 워커 — 오프라인 실행용.
 *
 * 절대 규칙:
 *  - `caches.delete()` 는 써도 된다. 낡은 캐시를 지우는 건 이 파일의 일이다.
 *  - **IndexedDB 와 localStorage 는 절대 건드리지 않는다.** 세이브와 인물 이미지가
 *    거기 있다. 캐시를 비우는 코드가 세이브를 지우는 사고가 가장 흔하다.
 *  - 외부 요청을 하지 않는다. 같은 출처가 아닌 요청은 그냥 통과시킨다 (§14 비통신).
 */

const CACHE_VERSION = 'ashvale-v1';

/** 설치할 때 미리 담아 둘 것. 해시가 붙는 번들 파일은 실행 중에 담는다 */
const SHELL = ['./', './index.html', './manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // 하나가 실패해도 설치를 통째로 실패시키지 않는다
      .then((cache) => Promise.allSettled(SHELL.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter((name) => name.startsWith('ashvale-') && name !== CACHE_VERSION)
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // 다른 출처로는 아무것도 하지 않는다. 애초에 그런 요청이 없어야 한다
  if (url.origin !== self.location.origin) return;

  // 화면 이동: 네트워크를 먼저 보고, 안 되면 캐시에 담아 둔 껍데기를 내준다.
  // 오프라인에서 앱이 뜨는 건 이 갈래 덕이다
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((hit) => hit ?? caches.match('./index.html'))
            .then((hit) => hit ?? Response.error()),
        ),
    );
    return;
  }

  // 나머지는 캐시 우선. 번들·에셋은 이름에 해시가 붙어 낡을 일이 없다
  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit !== undefined) return hit;
      return fetch(request).then((response) => {
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
