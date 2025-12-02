
const CACHE_NAME = 'test-trainer-v1';
const ASSETS = [
  '/',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evt) => {
  evt.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => { if(k !== CACHE_NAME) return caches.delete(k); })))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evt) => {
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(res => {
        return caches.open(CACHE_NAME).then(cache => { cache.put(evt.request, res.clone()); return res; });
      }).catch(() => {
        // fallback to index.html for navigation requests
        if (evt.request.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
