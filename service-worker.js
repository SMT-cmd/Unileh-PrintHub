const CACHE_NAME = 'printHub-v4-bust';
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
  './assets/js/storageService.js?v=20240324',
  './assets/js/database.js',
  './manifest.json'
];

// 1. Install Event: Force immediate installation
self.addEventListener('install', (event) => {
  self.skipWaiting(); // IMMEDIATELY force the new service worker to activate
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Service Worker: Caching assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 2. Activate Event: aggressively clear ALL old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      return self.clients.claim(); // IMMEDIATELY take control of all open pages
    })
  );
});

// 3. Fetch Event: Network-First for HTML/CSS/JS, Fallback to Cache
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-only for APIs
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('cloudinary.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Network-First strategy for everything else (Ensures latest files are always fetched if online)
  event.respondWith(
    fetch(event.request).then((networkResponse) => {
      // Update cache with the latest version
      if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
      }
      return networkResponse;
    }).catch(() => {
      // If offline or network fails, fallback to cache
      return caches.match(event.request);
    })
  );
});
