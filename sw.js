const CACHE_NAME = 'mlbb-guide-v3';
const STATIC_ASSETS = [
  '/',
  '/Index.html',
  '/index.html',
  '/manifest.json',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/css/style.css',
  '/js/app.js',
  '/js/api.js',
  '/js/logic.js',
  '/js/ui.js',
  '/config/supabase.js',
  '/config/env.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(cacheNames.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const isAsset = /\.(js|css|json|png|jpg|jpeg|svg|woff|woff2)$/i.test(event.request.url);
  const strategy = isAsset ? 'cache-first' : 'network-first';
  
  event.respondWith(
    strategy === 'cache-first' 
      ? caches.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((response) => {
            if (!response || response.status !== 200) return response;
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
            return response;
          }).catch(() => new Response('Offline - Asset not available', { status: 503 }));
        })
      : fetch(event.request).then((response) => {
          if (!response || response.status !== 200) return response;
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone)).catch(() => {});
          return response;
        }).catch(() => {
          return caches.match(event.request).then((cached) => {
            if (cached) return cached;
            return caches.match('/Index.html');
          });
        })
  );
});