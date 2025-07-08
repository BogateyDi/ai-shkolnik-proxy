const CACHE_NAME = 'ai-shkolnik-cache-v13'; // Incremented cache version
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://cdn.tailwindcss.com?plugins=forms,typography,aspect-ratio,line-clamp',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
  'https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js',
  'https://esm.sh/react@19.1.0',
  'https://esm.sh/react-dom@19.1.0/client',
  'https://esm.sh/@google/genai@1.8.0',
  'https://esm.sh/docx@9.5.1'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Force the new service worker to become active
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache and caching files');
      const cachePromises = urlsToCache.map(urlToCache => {
        const request = new Request(urlToCache, {cache: 'reload'});
        return fetch(request).then(response => {
          if (response.ok) {
            return cache.put(urlToCache, response);
          }
          console.warn(`Failed to fetch and cache ${urlToCache}`);
          return Promise.resolve();
        }).catch(err => {
            console.warn(`Failed to cache ${urlToCache}:`, err);
        });
      });
      return Promise.all(cachePromises);
    }).catch(err => {
      console.error('Failed to open cache: ', err);
    })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all clients
  );
});

self.addEventListener('fetch', (event) => {
  // We only handle GET requests for caching
  if (event.request.method !== 'GET') {
    return;
  }
  
  // For navigation requests, use network-first strategy to ensure users get the latest HTML
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // If fetch is successful, clone and cache the response
          if (response.ok) {
            const resClone = response.clone();
            caches.open(CACHE_NAME)
              .then(cache => cache.put(event.request, resClone));
          }
          return response;
        })
        .catch(() => caches.match(event.request)) // If network fails, try to serve from cache
    );
    return;
  }

  // For other requests (CSS, JS, images), use cache-first strategy
  event.respondWith(
    caches.match(event.request).then((response) => {
      // If found in cache, return it
      if (response) {
        return response;
      }
      
      // Otherwise, fetch from network, cache it, and return the response
      return fetch(event.request).then(
        (networkResponse) => {
          if(networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return networkResponse;
        }
      ).catch(error => {
        console.error('Fetch failed:', error);
        // You could return a placeholder image or similar fallback here if needed
      });
    })
  );
});