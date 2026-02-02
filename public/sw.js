/// <reference lib="webworker" />

const CACHE_NAME = 'text-extractor-v5';
const STATIC_CACHE = 'text-extractor-static-v5';

// Assets that should be cached on install (everything needed for full offline support)
const urlsToCache = [
  '/',
  '/index.html',
  '/tessdata/eng.traineddata'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching app shell and OCR data...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached for offline use');
      })
      .catch((err) => {
        console.error('Cache installation failed:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Cache-first strategy for all resources
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached version immediately if available
      if (cachedResponse) {
        return cachedResponse;
      }

      // Otherwise fetch from network and cache
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache successful responses
          const responseToCache = networkResponse.clone();
          caches.open(STATIC_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch((error) => {
          console.error('Fetch failed:', error);
          
          // Return offline fallback for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // For other requests, return error
          return new Response('Offline - Resource not available', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'text/plain'
            })
          });
        });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('text-extractor-') && 
                   cacheName !== STATIC_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});
