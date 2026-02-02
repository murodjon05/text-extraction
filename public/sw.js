/// <reference lib="webworker" />

const CACHE_NAME = 'text-extractor-v2';
const STATIC_CACHE = 'text-extractor-static-v2';
const DYNAMIC_CACHE = 'text-extractor-dynamic-v2';

// Assets that should be cached on install
const urlsToCache = [
  '/',
  '/index.html'
];

// External resources that need to be cached for offline use
const EXTERNAL_RESOURCES = [
  'https://unpkg.com/pdfjs-dist@',
  'https://cdn.jsdelivr.net/npm/tesseract.js@',
  'https://tessdata.projectnaptha.com/'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        return cache.addAll(urlsToCache);
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

  // Handle different types of requests
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      // Return cached response if available
      if (cachedResponse) {
        // For external resources, refresh cache in background
        if (isExternalResource(url.href)) {
          fetchAndCache(request, DYNAMIC_CACHE);
        }
        return cachedResponse;
      }

      // Fetch from network
      return fetch(request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache successful responses
          const cacheName = isExternalResource(url.href) ? DYNAMIC_CACHE : STATIC_CACHE;
          const responseToCache = networkResponse.clone();
          
          caches.open(cacheName).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // Return offline fallback for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/index.html');
          }
          
          // For other requests, return a generic error
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

// Helper function to fetch and cache in background
function fetchAndCache(request, cacheName) {
  fetch(request).then((response) => {
    if (response && response.status === 200) {
      caches.open(cacheName).then((cache) => {
        cache.put(request, response);
      });
    }
  }).catch(() => {});
}

// Check if URL is an external resource we need to cache
function isExternalResource(url) {
  return EXTERNAL_RESOURCES.some(resource => url.includes(resource));
}

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            return cacheName.startsWith('text-extractor-') && 
                   cacheName !== STATIC_CACHE && 
                   cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => caches.delete(cacheName))
      );
    })
  );
  self.clients.claim();
});
