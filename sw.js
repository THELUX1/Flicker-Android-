// sw.js - Versión para GitHub Pages
const CACHE_NAME = 'flicker-v1';
const urlsToCache = [
  './',
  './index.html',
  './css/style.css',
  './css/details.css',
  './css/player.css',
  './assets/js/main.js',
  './assets/js/data.js',
  './assets/js/details.js',
  './assets/js/movie-links.js',
  './assets/js/player.js',
  './assets/js/series-links.js',
  './assets/js/api.js',
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

// Fetch events - Estrategia: Cache primero, luego red
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
          return caches.match('./index.html');
        }
      })
  );
});