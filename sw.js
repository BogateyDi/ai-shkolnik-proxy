const CACHE_NAME = 'ai-shkolnik-cache-v10'; // Incremented cache version
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './index.tsx',
  './App.tsx',
  './types.ts',
  './components/ContentCreatorView.tsx',
  './components/HomeworkHelperView.tsx',
  './components/CodeManagementView.tsx',
  './components/Icon.tsx',
  './components/OptionButton.tsx',
  './components/SectionHeading.tsx',
  './components/TextInputGroup.tsx',
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
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Opened cache');
      const cachePromises = urlsToCache.map(urlToCache => {
        return cache.add(urlToCache).catch(err => {
            console.warn(`Failed to cache ${urlToCache}:`, err);
        });
      });
      return Promise.all(cachePromises);
    }).catch(err => {
      console.error('Failed to open cache: ', err);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      return fetch(event.request).then(
        (networkResponse) => {
          if(networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });
          }
          return networkResponse;
        }
      ).catch(error => {
        console.error('Fetch failed; returning offline page instead.', error);
        // You can return a fallback page here if you have one cached
        // return caches.match('/offline.html');
      });
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
    })
  );
});