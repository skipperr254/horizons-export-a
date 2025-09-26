/* eslint-disable */

const CACHE_NAME = 'hikayego-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  'https://storage.googleapis.com/hostinger-horizons-assets-prod/47ed419b-a823-468d-9e6e-80c8442792f0/a913a7b12227f181510600512731c15f.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
          return null;
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(event.request)
        .then(response => {
          const fetchPromise = fetch(event.request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          });
          return response || fetchPromise;
        }).catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
    })
  );
});