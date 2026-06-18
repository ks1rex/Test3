
const CACHE_NAME = 'test-trainer-v6';
const ASSETS = [
  './',
  'index.html',
  'style.css',
  'app.js',
  'auth.js',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'topics_index.json'
];

self.addEventListener('install', (evt) => {
  evt.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ASSETS);
      try {
        const resp = await fetch('topics_index.json');
        if (resp.ok) {
          const topics = await resp.json();
          const topicUrls = topics
            .filter(t => t.file)
            .map(t => 'topics/' + t.file);
          await cache.addAll(topicUrls);
        }
      } catch (e) {
        console.warn('SW: не удалось закэшировать топики', e);
      }
    })
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
  // Не перехватываем cross-origin запросы (Supabase API, CDN и т.д.)
  if (!evt.request.url.startsWith(self.location.origin)) return;

  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(res => {
        return caches.open(CACHE_NAME).then(cache => { cache.put(evt.request, res.clone()); return res; });
      }).catch(() => {
        if (evt.request.mode === 'navigate') return caches.match('index.html');
      });
    })
  );
});
