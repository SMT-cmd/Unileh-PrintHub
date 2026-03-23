const CACHE_NAME = 'printHub-v1';
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
    })
  );
});

// Fetch Event
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for Firestore/Cloudinary API calls
  if (url.hostname.includes('firestore.googleapis.com') || url.hostname.includes('cloudinary.com')) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
