// Roots and Threads — service worker minimal
// Change CACHE_VERSION à chaque mise à jour du site pour forcer les téléphones à charger la nouvelle version.
const CACHE_VERSION = 'rt-v1';
const SHELL = ['./', './index.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then(cache => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // On ne touche qu'aux requêtes GET de notre propre site : la boutique (Supabase) reste toujours en direct.
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  if (req.mode === 'navigate') {
    // Page principale : on essaie internet d'abord, la version enregistrée sert de secours hors ligne.
    event.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Icônes et manifeste : servis depuis la mémoire si disponibles, sinon récupérés puis gardés.
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_VERSION).then(cache => cache.put(req, copy));
      return res;
    }).catch(() => cached))
  );
});
