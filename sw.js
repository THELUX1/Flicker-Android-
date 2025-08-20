const CACHE_NAME = 'flicker-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/details.css',
  '/css/player.css',
  '/assets/js/main.js',
  '/assets/js/data.js',
  '/assets/js/details.js',
  '/assets/js/movie-links.js',
  '/assets/js/player.js',
  '/assets/js/series-links.js',
  '/assets/js/api.js',
  // Añade aquí otros recursos que quieras cachear
];

// Instalar el Service Worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Activar el Service Worker
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// Fetch events
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve la respuesta cacheadá o realiza la petición
        return response || fetch(event.request);
      })
  );
});