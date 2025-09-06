const CACHE = 'recipe-extractor-v2';
const ASSETS = ['/', '/new', '/history', '/offline.html', '/icons/icon-192.png', '/icons/icon-512.png', '/favicon.ico'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  const req = event.request;
  // Network-first for HTML; cache-first for others
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/offline.html'))
    );
  } else {
    event.respondWith(
      caches.match(req).then(cached => cached || fetch(req))
    );
  }
});
