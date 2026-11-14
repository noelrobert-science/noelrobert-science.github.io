/* Mr R Science offline cache. Bump VERSION on every publish so phones pick up the update. */
const VERSION = 'mrr-app-2026-11-14b';
const CORE = ['./', 'index.html', 'catalog.json', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/apple-touch-icon-180.png', 'gym/', 'gym/index.html', 'back.js', 'mrr-video.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('mrr-app-') && k !== VERSION).map(k => caches.delete(k))))); self.clients.claim(); });
self.addEventListener('message', e => { if (e.data === 'skip-waiting') self.skipWaiting(); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || !u.pathname.includes('/app/')) return;
  // catalogue: network first so new lessons appear; everything else: cache first
  if (u.pathname.endsWith('catalog.json')) {
    e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request)));
});
