/* Gironpoint (démo) — service worker : tout ce qu'il faut pour tourner sans réseau.
   La page : réseau d'abord (les mises à jour arrivent dès qu'il y a du réseau), copie en cache sinon.
   Polices, icônes, scènes publiées : cache d'abord. */
const CACHE = 'gironpoint-v2';
const BASE = ['./', './index.html', './manifest.json', './icones/gironpoint-192.png', './icones/gironpoint-512.png', './fonts/polices.css',
  './fonts/dm-sans-300-latin.woff2', './fonts/dm-sans-300-latin-ext.woff2', './fonts/fredoka-500-latin.woff2', './fonts/fredoka-500-latin-ext.woff2'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(u).catch(() => {}))))); self.skipWaiting();
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('gironpoint-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const page = req.mode === 'navigate' || /\/index\.html$/.test(url.pathname) || /\/scenes\//.test(url.pathname);
  if (page) {   // réseau d'abord, cache en secours (page et scènes publiées : toujours la dernière version quand il y a du réseau)
    e.respondWith(fetch(req, { cache: 'no-cache' }).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }).catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
  } else {      // le reste (polices, icônes) : cache d'abord
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((rep) => { if (rep.ok) caches.open(CACHE).then((c) => c.put(req, rep.clone())); return rep; })));
  }
});
