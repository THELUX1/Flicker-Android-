const CACHE_NAME = 'flicker-v1';
// Ruta base para GitHub Pages
const BASE_PATH = '/Flicker-Android-';

const urlsToCache = [
  BASE_PATH + '/',
  BASE_PATH + '/index.html',
  BASE_PATH + '/css/style.css',
  BASE_PATH + '/css/details.css',
  BASE_PATH + '/css/player.css',
  BASE_PATH + '/assets/js/main.js',
  BASE_PATH + '/assets/js/data.js',
  BASE_PATH + '/assets/js/details.js',
  BASE_PATH + '/assets/js/movie-links.js',
  BASE_PATH + '/assets/js/player.js',
  BASE_PATH + '/assets/js/series-links.js',
  BASE_PATH + '/assets/js/api.js',
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
  // Ajustar la ruta de la solicitud para GitHub Pages
  const url = new URL(event.request.url);
  if (url.pathname.startsWith(BASE_PATH)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Devuelve la respuesta cacheadá o realiza la petición
          return response || fetch(event.request);
        })
    );
  }
});