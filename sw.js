const CACHE_NAME = 'nichi-nichi-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './js/config.js',
  './js/api.js',
  './js/app.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
});
