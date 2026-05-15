'use strict';

const STATIC_CACHE = 'coilms-static-v1';
const API_CACHE    = 'coilms-api-v1';

const STATIC_ASSETS = [
  '/',
  '/static/manifest.json',
  '/static/styles.css',
  '/static/index.js',
  '/static/store.js',
  '/static/router.js',
  '/static/fetch_with_auth.js',
  '/static/js/config.js',
  '/static/js/localdb.js',
  '/static/js/sync.js',
  // Vendor — served locally so the app loads fully offline
  '/static/vendor/vue.min.js',
  '/static/vendor/vue-router.min.js',
  '/static/vendor/vuex.min.js',
  '/static/vendor/bootstrap.min.css',
  '/static/vendor/bootstrap.bundle.min.js',
  '/static/vendor/bootstrap-icons.min.css',
  '/static/vendor/fonts/bootstrap-icons.woff2',
  '/static/vendor/fonts/bootstrap-icons.woff',
  '/static/vendor/chart.min.js',
  // Icons
  '/static/icons/icon-192.png',
  '/static/icons/icon-512.png',
  // All components
  '/static/components/Login.js',
  '/static/components/Sidebar.js',
  '/static/components/TopBar.js',
  '/static/components/Toast.js',
  '/static/components/NotificationBell.js',
  '/static/components/OfflineBar.js',
  '/static/components/Navbar.js',
  '/static/components/dashboard.js',
  '/static/components/coil_info.js',
  '/static/components/product_info.js',
  '/static/components/create_sale.js',
  '/static/components/view_sale_order.js',
  '/static/components/customer.js',
  '/static/components/Reports.js',
  '/static/components/Analytics.js',
  '/static/components/Settings.js',
  '/static/components/productions.js',
  '/static/components/purchase.js',
  '/static/components/coilform.js',
  '/static/components/productform.js',
  '/static/components/updatecoilform.js',
  '/static/components/updateproductform.js',
  '/static/components/CreateCoilProducts.js',
  '/static/components/InvoicePrint.js',
  '/static/components/searchresults.js',
  '/static/components/adminhome.js',
  '/static/components/appinfo.js',
  '/static/components/AdminDashboard.js',
  '/static/components/images/coil_inventory.png',
  '/static/components/images/orders.png',
  '/static/components/images/reports.png',
  '/static/components/images/sheet_cutting.png',
];

// ── Install: pre-cache all static assets ─────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        // addAll fails if any request fails; use individual puts to be resilient
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            fetch(url).then(res => {
              if (res.ok) cache.put(url, res);
            }).catch(() => {})
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// ── Activate: remove stale caches ────────────────────────────────────────────
self.addEventListener('activate', event => {
  const keep = new Set([STATIC_CACHE, API_CACHE]);
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => !keep.has(k)).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch: strategy by request type ──────────────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept same-origin + known Render host
  const knownHost = url.hostname === location.hostname ||
                    url.hostname.endsWith('.onrender.com');
  if (!knownHost) return;

  // Never intercept non-GET (POST/PUT/DELETE handled by main thread queue)
  if (request.method !== 'GET') return;

  if (url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirst(request));
  } else if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstApi(request));
  } else {
    // HTML pages — network-first, fall back to cached shell
    event.respondWith(networkFirstShell(request));
  }
});

// Cache-first: serve from cache; fetch + update on miss
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return new Response('Asset unavailable offline', { status: 503 });
  }
}

// Network-first for HTML; fallback to cached shell so the SPA can load
async function networkFirstShell(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request) || await caches.match('/');
    return cached || new Response('Offline', { status: 503 });
  }
}

// Network-first for API GETs; serve stale data offline with X-Offline-Cache header
async function networkFirstApi(request) {
  const cache = await caches.open(API_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const headers = new Headers(cached.headers);
      headers.set('X-Offline-Cache', 'true');
      return new Response(cached.body, {
        status:     cached.status,
        statusText: cached.statusText,
        headers,
      });
    }
    return new Response(
      JSON.stringify({ error: 'offline', message: 'No cached data available' }),
      { status: 503, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// ── Message: allow main thread to trigger cache refresh ──────────────────────
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'CACHE_URLS') {
    caches.open(STATIC_CACHE).then(cache => cache.addAll(event.data.urls || []));
  }
});
