const CACHE_NAME = 'printHub-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './order/index.html',
  './checkout/index.html',
  './portal/index.html',
  './news/index.html',
  './partners/index.html',
  './privacy/index.html',
  './terms/index.html',
  './refund/index.html',
  './about/index.html',
  './assets/css/style.css',
  './assets/js/app.js',
  './assets/js/cloudinary.js',
  './assets/js/database.js',
  './manifest.json'
];

// Install Event
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // Take control of all pages immediately
    })
  );
});

// Fetch Event (Stale-While-Revalidate Strategy for better freshness)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for Firestore/Cloudinary API calls
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('cloudinary.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-While-Revalidate for other assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        // Update the cache with the new response
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to cache if network fails (offline mode)
        return cachedResponse;
      });

      // Return cached response immediately if available, otherwise wait for network
      return cachedResponse || fetchPromise;
    })
  );
});
