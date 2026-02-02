/// <reference lib="webworker" />

const CACHE_NAME = 'text-extractor-v4';
const STATIC_CACHE = 'text-extractor-static-v4';
const DYNAMIC_CACHE = 'text-extractor-dynamic-v4';

// Assets that should be cached on install (app shell + external workers for document support)
const urlsToCache = [
  '/',
  '/index.html'
];

// External resources that are cached for document support (auto-enabled)
const EXTERNAL_RESOURCES = [
  'https://unpkg.com/pdfjs-dist@',
  'https://cdn.jsdelivr.net/npm/tesseract.js@'
];

// OCR resources (only cached when user explicitly enables offline mode for images)
const OCR_RESOURCES = [
  '/tessdata/eng.traineddata'
];

let ocrOfflineEnabled = false;

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
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            // Cache external resources (PDF.js and Tesseract workers) for document support
            // This happens automatically for offline document functionality
            if (isExternalResource(url.href)) {
              const responseToCache = networkResponse.clone();
              caches.open(DYNAMIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            } else if (!isOcrResource(url.href)) {
              // Always cache app shell resources (but not OCR data unless explicitly enabled)
              const responseToCache = networkResponse.clone();
              caches.open(STATIC_CACHE).then((cache) => {
                cache.put(request, responseToCache);
              });
            }
          }
          return networkResponse;
        })
        .catch((error) => {
          console.error('Fetch failed:', error);
          // If network fails and we have no cache, throw error
          if (!cachedResponse) {
            throw error;
          }
        });

      // Return cached version immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    }).catch(() => {
      // Return offline fallback for navigation requests
      if (request.mode === 'navigate') {
        return caches.match('/index.html');
      }
      
      // For external resources, return a more helpful error
      if (isExternalResource(url.href)) {
        return new Response(
          JSON.stringify({ 
            error: 'Offline', 
            message: 'This resource is not available offline. Please connect to the internet and try again.' 
          }), {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'application/json'
            })
          }
        );
      }
      
      // For other requests, return a generic error
      return new Response('Offline - Resource not available', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain'
        })
      });
    })
  );
});

// Check if URL is an external resource we need to cache
function isExternalResource(url) {
  return EXTERNAL_RESOURCES.some(resource => url.includes(resource));
}

// Check if URL is an OCR resource
function isOcrResource(url) {
  return OCR_RESOURCES.some(resource => url.includes(resource));
}

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data.type === 'ENABLE_OCR_OFFLINE') {
    ocrOfflineEnabled = true;
    
    // Cache OCR resources for offline image processing
    event.waitUntil(
      caches.open(STATIC_CACHE)
        .then((cache) => {
          return cache.addAll(OCR_RESOURCES);
        })
        .then(() => {
          console.log('OCR offline mode enabled - language data cached');
          // Notify all clients
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => {
              client.postMessage({ type: 'OCR_OFFLINE_ENABLED' });
            });
          });
        })
        .catch((err) => {
          console.error('Failed to cache OCR resources:', err);
        })
    );
  }
});

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
