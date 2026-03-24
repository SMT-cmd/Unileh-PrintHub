const CACHE_NAME = 'printHub-v5-cache';
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
  './assets/js/storageService.js?v=20240324_v5',
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

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // COMPLETELY BYPASS SERVICE WORKER FOR API CALLS
  if (
    url.hostname.includes('googleapis.com') || 
    url.hostname.includes('appwrite.io') ||
    url.hostname.includes('cloudinary.com') ||
    event.request.method !== 'GET'
  ) {
    return; // Let the browser handle these requests natively
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
