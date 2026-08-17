/**
 * 서비스 워커 — 오프라인 실행용.
 *
 * 절대 규칙:
 *  - `caches.delete()` 는 써도 된다. 낡은 캐시를 지우는 건 이 파일의 일이다.
 *  - **IndexedDB 와 localStorage 는 절대 건드리지 않는다.** 세이브와 인물 이미지가
 *    거기 있다. 캐시를 비우는 코드가 세이브를 지우는 사고가 가장 흔하다.
 *  - 외부 요청을 하지 않는다. 같은 출처가 아닌 요청은 그냥 통과시킨다 (§14 비통신).
 */

/**
 * 캐시 이름.
 *
 * 등록 주소의 `?v=` 에서 가져온다 (registerSW 가 붙인다). 빌드마다 달라지므로
 * 배포할 때마다 새 캐시가 생기고, activate 에서 옛 캐시를 지운다.
 *
 * **이걸 문자열로 박아 두면 안 된다.** 그러면 한 번 캐시된 번들이 영원히
 * 남아서, 새로 고쳐도 폰에는 옛 화면이 계속 뜬다.
 */
const BUILD = new URL(self.location.href).searchParams.get('v') ?? 'dev';
const CACHE_VERSION = `ashvale-${BUILD}`;

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
      (async () => {
        const cache = await caches.open(CACHE_VERSION);
        try {
          const response = await fetch(request);
          stash(event, cache, request, response);
          return response;
        } catch {
          return (await cache.match(request)) ?? (await cache.match('./index.html')) ?? Response.error();
        }
      })(),
    );
    return;
  }

  // 나머지는 캐시 우선. 번들·에셋은 이름에 해시가 붙어 낡을 일이 없다
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_VERSION);
      const hit = await cache.match(request);
      if (hit !== undefined) return hit;

      const response = await fetch(request);
      stash(event, cache, request, response);
      return response;
    })(),
  );
});

/**
 * 응답 사본을 캐시에 넣는다.
 *
 * 여기 순서가 중요하다. `clone()` 은 몸통 스트림을 둘로 가르는데, 갈라 놓고
 * 한쪽을 바로 읽지 않으면 버퍼가 차면서 **원본 쪽까지 멈춘다.**
 * 캐시를 미리 열어 두고, 사본을 만든 직후에 곧바로 넘기는 이유다.
 * 그리고 `waitUntil` 로 붙잡아야 쓰기가 끝나기 전에 워커가 잠들지 않는다.
 *
 * 캐시 쓰기가 실패해도 응답은 그대로 나간다. 저장이 안 되는 건 다음 실행에서
 * 다시 받으면 그만이지만, 여기서 실패를 흘리면 화면이 통째로 안 뜬다.
 */
function stash(event, cache, request, response) {
  if (!response.ok || response.type !== 'basic') return;
  const copy = response.clone();
  event.waitUntil(cache.put(request, copy).catch(() => {}));
}
