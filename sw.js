// Offline cache (borrowed from NAMI). Bump VERSION whenever the game files change so phones fetch the new ones.
const VERSION = 'le-word-v0.4';
const FILES = ['./', './index.html', './style.css', './manifest.webmanifest', './icon.svg',
  './src/main.js', './src/ui.js', './src/rules.js', './src/game.js', './src/save.js', './src/words.js', './src/messages.js',
  './src/stats.js', './src/share.js', './src/version.js'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(VERSION).then((c) => Promise.all(FILES.map((f) => c.add(f).catch(() => {})))).then(() => self.skipWaiting())); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  // network first: always ask for the newest file, fall back to the cached copy with no signal
  e.respondWith(fetch(e.request.url, { cache: 'no-cache' }).then((r) => { const copy = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, copy)); return r; }).catch(() => caches.match(e.request)));
});
