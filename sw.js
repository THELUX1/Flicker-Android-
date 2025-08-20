const CACHE_NAME = 'flicker-v1';
const BASE_PATH = '/Flicker-Android-/';
const urlsToCache = [
  BASE_PATH,
  BASE_PATH + 'index.html',
  BASE_PATH + 'css/style.css',
  BASE_PATH + 'css/details.css',
  BASE_PATH + 'css/player.css',
  BASE_PATH + 'assets/js/main.js',
  BASE_PATH + 'assets/js/data.js',
  BASE_PATH + 'assets/js/details.js',
  BASE_PATH + 'assets/js/movie-links.js',
  BASE_PATH + 'assets/js/player.js',
  BASE_PATH + 'assets/js/series-links.js',
  BASE_PATH + 'assets/js/api.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Instalar el Service Worker
self.addEventListener('install', event => {
  self.skipWaiting(); // Forzar activación inmediata
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
  return self.clients.claim(); // Tomar control inmediato de todas las pestañas
});

// Fetch events
self.addEventListener('fetch', event => {
  // Solo manejar solicitudes GET
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Devuelve la respuesta cacheadá o realiza la petición
        return response || fetch(event.request)
          .then(fetchResponse => {
            // Si es una respuesta válida, la guardamos en cache
            if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
              return fetchResponse;
            }

            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return fetchResponse;
          });
      })
      .catch(() => {
        // Fallback para cuando no hay conexión y no está en cache
        if (event.request.destination === 'document') {
          return caches.match(BASE_PATH + 'index.html');
        }
      })
  );
});