// MemoNest Service Worker — v2.1.0
// Cache Strategy:
//   - App Shell (HTML/CSS/JS/fonts): Cache First (오프라인 즉시 응답)
//   - API routes (/api/*): Network First with timeout fallback
//   - Notion/AI calls: Network Only (데이터 정합성 필수)

const CACHE_NAME = 'memonest-v2.1.0';
const OFFLINE_URL = '/';

// 앱 Shell: 오프라인에서도 UI를 표시할 수 있는 정적 자산
const APP_SHELL = [
  '/',
  '/static/app.js',
  '/static/style.css',
  '/static/manifest.json',
  'https://cdn.tailwindcss.com',
  'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css',
];

// ── Install: App Shell 선제 캐시 ──────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // 외부 CDN은 실패해도 설치 중단 안 함 (개별 시도)
      const localShell = ['/', '/static/app.js', '/static/style.css', '/static/manifest.json', '/static/sw.js'];
      return cache.addAll(localShell).catch(() => {});
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: 이전 캐시 정리 ──────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: 요청 유형별 캐시 전략 ──────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // 1) POST/PATCH/DELETE → 항상 네트워크 (캐시 불가)
  if (request.method !== 'GET') return;

  // 2) API routes → Network First (오프라인 시 캐시 폴백)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstWithFallback(request));
    return;
  }

  // 3) App Shell 및 정적 자산 → Cache First
  event.respondWith(cacheFirstWithNetworkFallback(request));
});

// Cache First: 캐시 → 없으면 네트워크 후 캐시 저장
async function cacheFirstWithNetworkFallback(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // 오프라인 + 캐시 없음: 루트("/") 캐시 반환
    const fallback = await caches.match(OFFLINE_URL);
    if (fallback) return fallback;
    return new Response('<h2 style="font-family:sans-serif;text-align:center;margin-top:40px">📵 오프라인 상태입니다</h2>', {
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
}

// Network First: 네트워크 3초 타임아웃 → 캐시 폴백
async function networkFirstWithFallback(request) {
  const timeoutMs = 3000;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const response = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: '오프라인 상태입니다', offline: true }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8' }
    });
  }
}

// ── 백그라운드 Sync (향후 확장용 플레이스홀더) ────────────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending') {
    // TODO: 오프라인 중 저장된 큐를 온라인 복귀 시 일괄 처리
  }
});
