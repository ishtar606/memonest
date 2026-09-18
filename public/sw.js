// MemoNest Service Worker — 루트(/sw.js)에서 서빙되어 scope '/' 를 제어한다.
// (기존 /static/sw.js 는 scope 제약으로 등록 실패 → 루트로 이동)
// 전략: 정적 자산(CSS/폰트 등)만 캐시, HTML과 API는 항상 네트워크 우선

const CACHE_NAME = 'memonest-v2.5.0';

// 캐시할 정적 자산 (버전 변경 없는 외부 리소스만)
const STATIC_ASSETS = [
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
];

// ── Install: 외부 정적 자산만 선제 캐시 ──────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── Activate: 이전 버전 캐시 모두 삭제 ───────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: 요청 유형별 분기 ───────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // POST/PATCH/DELETE → 항상 네트워크 (SW 개입 없음)
  if (request.method !== 'GET') return;

  // 루트 HTML(/) → 항상 네트워크 (최신 앱 보장)
  if (url.pathname === '/' || url.pathname === '') return;

  // API 호출 → 항상 네트워크 (데이터 정합성 필수)
  if (url.pathname.startsWith('/api/')) return;

  // app.js / sw.js 자체 → 항상 네트워크 (최신 코드 보장)
  if (url.pathname.startsWith('/static/app.js') || url.pathname === '/sw.js') return;

  // 외부 CDN 정적 자산 → Cache First (네트워크 비용 절감)
  if (url.origin !== self.location.origin) {
    event.respondWith(cacheFirstExternalAsset(request));
    return;
  }

  // 내부 정적 자산(CSS 등) → Network First (업데이트 반영)
  event.respondWith(networkFirstStaticAsset(request));
});

// Cache First (외부 CDN 자산용)
async function cacheFirstExternalAsset(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('', { status: 503 });
  }
}

// Network First (내부 정적 자산용, 오프라인 폴백 있음)
async function networkFirstStaticAsset(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response('', { status: 503 });
  }
}

// ── Web Push: 알림 수신 ────────────────────────────────────────────────────
self.addEventListener('push', event => {
  let data = { title: 'MemoNest', body: '알림', url: '/' };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🪺%3C/text%3E%3C/svg%3E",
      badge: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E🔔%3C/text%3E%3C/svg%3E",
      tag: data.tag || undefined,
      data: { url: data.url || '/' },
      requireInteraction: false,
    })
  );
});

// ── Web Push: 알림 클릭 → 앱 열기/포커스 ──────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if ('focus' in client) { client.navigate(targetUrl); return client.focus(); }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
