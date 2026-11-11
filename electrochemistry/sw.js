/* Electrochemistry Studio: works offline. After the first visit every page, lab and question opens without the internet.
   Narrated lessons are large, so each is kept only when the learner taps "Save for offline".
   Updates: when online, the browser fetches this file again; a new VERSION means a new studio is downloaded in the
   background and the page offers "New version ready: refresh". Nothing about the learner is stored or sent. */
const VERSION = '35a23d47c7d2';
const APP = 'ec-app-' + VERSION, AUDIO = 'ec-audio-v1';
const FILES = [ "./", "./index.html", "./manifest.webmanifest", "../assets/fonts/Lexend-400.woff2", "../assets/fonts/Outfit-800.woff2", "./css/studio.css", "./js/app.js", "./js/bookchecks.js", "./js/content.js", "./js/engine.js", "./js/ieb.js", "./js/labmodes.js", "./js/learn.js", "./js/lessons-data.js", "./js/lessons.js", "./js/minipaper.js", "./js/museum.js", "./js/nowyou.js", "./js/practice.js", "./js/tools-cells.js", "./js/tools-electro.js", "./js/tools-redox.js", "./js/tools-t4.js", "./icons/icon-192.png", "./icons/icon-512.png" ];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ec-app-') && k !== APP).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('message', e => { if (e.data && e.data.type === 'skip-waiting') self.skipWaiting(); });

// a seek in an audio lesson asks for part of the file (a Range request): answer it from the saved copy
async function ranged(req, res) {
  const range = req.headers.get('range');
  if (!range) return res;
  const buf = await res.arrayBuffer(), m = /bytes=(\d*)-(\d*)/.exec(range);
  let start = m && m[1] ? +m[1] : 0, end = m && m[2] ? +m[2] : buf.byteLength - 1;
  if (m && !m[1] && m[2]) { start = buf.byteLength - +m[2]; end = buf.byteLength - 1; }
  end = Math.min(end, buf.byteLength - 1);
  return new Response(buf.slice(start, end + 1), { status: 206, statusText: 'Partial Content',
    headers: { 'Content-Type': res.headers.get('Content-Type') || 'audio/mpeg', 'Content-Range': `bytes ${start}-${end}/${buf.byteLength}`, 'Content-Length': String(end - start + 1), 'Accept-Ranges': 'bytes' } });
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  if (/\/audio\/.+\.(mp3|vtt|mp4)$/.test(url.pathname)) {
    e.respondWith(caches.open(AUDIO).then(c => c.match(url.pathname)).then(hit => hit ? ranged(req, hit) : fetch(req)));
    return;
  }
  if (req.mode === 'navigate' && url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) {
    e.respondWith(caches.open(APP).then(c => c.match('./index.html')).then(hit => hit || fetch(req)));
    return;
  }
  e.respondWith(caches.open(APP).then(c => c.match(req, { ignoreSearch: true })).then(hit => hit || fetch(req)));
});
