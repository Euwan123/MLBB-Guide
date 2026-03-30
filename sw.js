const CACHE_NAME = 'mlbb-guide-v1';
const STATIC_ASSETS = [
  '/',
  '/Index.html',
  '/css/base.css',
  '/css/layout.css',
  '/css/components.css',
  '/js/app.js',
  '/js/api.js',
  '/js/logic.js',
  '/js/ui.js',
  '/config/supabase.js',
  '/config/env.js',
  '/config.json',
  '/manifest.json',
  '/assest/videos/Fight With You! A Bond Reunited   Mlbb × Naruto   Mobile Legends Bang Bang.mp4'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        
        return fetch(event.request).then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
          
          return response;
        });
      })
  );
});
