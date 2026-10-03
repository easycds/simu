/* Simulateur Easy — service worker : mode hors-ligne.
   - La page (index.html) : réseau d'abord, copie en cache si pas de connexion
     → les mises à jour arrivent dès qu'il y a du réseau.
   - La police Google (Fredoka) : cache d'abord. */
const CACHE = 'simu-easy-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', './index.html'])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((cles) => Promise.all(cles.filter((k) => k.indexOf('simu-easy-') === 0 && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Polices Google : cache d'abord
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.open(CACHE).then((c) => c.match(req).then((r) => r || fetch(req).then((rep) => {
        c.put(req, rep.clone());
        return rep;
      })))
    );
    return;
  }

  // Fichiers du site : réseau d'abord, cache en secours
  if (url.origin === self.location.origin) {
    e.respondWith(
      fetch(req).then((rep) => {
        if (rep.ok) { const copie = rep.clone(); caches.open(CACHE).then((c) => c.put(req, copie)); }
        return rep;
      }).catch(() => caches.match(req).then((r) => r || caches.match('./index.html')))
    );
  }
});
