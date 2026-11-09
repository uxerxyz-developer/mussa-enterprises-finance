/* Mussa Ledger — Service Worker
 * Strategy:
 *  - App shell (navigations): Network-first, offline fallback to cached shell
 *  - Hashed assets (/assets/*), icons, manifest: Stale-While-Revalidate
 *  - Google Fonts: Cache-first
 *  - /api/*, /_serverFn*, /_server/*, WebSockets, Supabase, Gemini: Network-ONLY (bypass)
 */

const VERSION    = 'v1.0.1'; // ⬅️ har deploy pe bump karo
const PRECACHE   = `mussa-precache-${VERSION}`;
const RUNTIME    = `mussa-runtime-${VERSION}`;
const FONTS      = `mussa-fonts-${VERSION}`;
const SHELL_KEY  = '/';

const PRECACHE_URLS = [
  '/',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/icon-maskable-512.png',
  '/apple-touch-icon.png',
];

/* ---------------- install ---------------- */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(PRECACHE);
    await Promise.all(
      PRECACHE_URLS.map(async (url) => {
        try {
          const res = await fetch(new Request(url, { cache: 'reload' }));
          if (res && res.ok) await cache.put(url, res);
        } catch (_) {
          /* ek file fail ho to install fail na ho */
        }
      })
    );
    await self.skipWaiting();
  })());
});

/* ---------------- activate ---------------- */
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keep = new Set([PRECACHE, RUNTIME, FONTS]);
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => !keep.has(k)).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

/* ---------------- message (update flow) ---------------- */
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

/* ---------------- fetch ---------------- */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // sirf GET, http(s), non-range
  if (req.method !== 'GET') return;
  if (req.headers.has('range')) return;

  let url;
  try { url = new URL(req.url); } catch { return; }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  // Network-only zones — SW bilkul chhoo na kare
  if (isNetworkOnly(url)) return;

  // Google Fonts → cache-first
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(cacheFirst(req, FONTS));
    return;
  }

  // Navigations (HTML) → network-first + offline shell fallback
  if (req.mode === 'navigate') {
    event.respondWith(handleNavigation(req));
    return;
  }

  // Vite hashed bundles
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }

  // Manifest
  if (url.pathname === '/manifest.webmanifest') {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }

  // Icons / images / fonts local
  if (/\.(?:png|jpe?g|svg|gif|webp|avif|ico|woff2?)$/i.test(url.pathname)) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
    return;
  }

  // Baqi same-origin GET: SWR (safe default)
  if (url.origin === self.location.origin) {
    event.respondWith(staleWhileRevalidate(req, RUNTIME));
  }
});

/* ---------------- helpers ---------------- */
function isNetworkOnly(url) {
  const p = url.pathname;
  const h = url.hostname;

  // TanStack Start server functions + custom API
  if (p.startsWith('/api/')) return true;
  if (p.startsWith('/_serverFn')) return true;   // TanStack Start default
  if (p.startsWith('/_server/')) return true;    // server routes
  if (p.startsWith('/ws') || p.startsWith('/socket')) return true;

  // Gemini Live / audio streaming
  if (h.includes('generativelanguage.googleapis.com')) return true;
  if (h.includes('gemini') && h.includes('google')) return true;

  // Supabase / cloud
  if (h.endsWith('supabase.co') || h.includes('supabase')) return true;

  // Baqi googleapis (fonts ke ilawa) bhi bypass
  if (h.endsWith('googleapis.com') && !h.startsWith('fonts.')) return true;

  return false;
}

async function handleNavigation(request) {
  const runtime = await caches.open(RUNTIME);
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      runtime.put(request, res.clone());
      // App shell bhi update karo — deep-link offline fallback ke liye
      if (request.url === new URL('/', self.location.origin).href) {
        runtime.put(SHELL_KEY, res.clone());
      }
    }
    return res;
  } catch {
    return (
      (await runtime.match(request)) ||
      (await runtime.match(SHELL_KEY)) ||
      (await caches.match(SHELL_KEY)) ||
      offlineResponse()
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const network = fetch(request)
    .then((res) => {
      if (res && (res.ok || res.type === 'opaque')) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);

  return cached || (await network) || Response.error();
}

function offlineResponse() {
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline — Mussa Ledger</title>
<style>
  html,body{margin:0;height:100%;background:#D8DBE8;color:#1f2a3d;
    font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .wrap{min-height:100%;display:grid;place-items:center;padding:24px;text-align:center}
  h1{margin:0 0 8px;font-size:1.35rem}
  p{margin:0 0 16px;opacity:.75;font-size:.95rem}
  button{padding:10px 18px;border:0;border-radius:10px;background:#1f2a3d;color:#fff;
    font-weight:600;cursor:pointer}
</style></head><body><div class="wrap"><div>
  <h1>You're offline</h1>
  <p>App cache nahi mila. Pehli dafa online kholein, phir offline chalega.</p>
  <button onclick="location.reload()">Retry</button>
</div></div></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}