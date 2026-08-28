const CACHE_NAME = 'mahash-assets-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Target image requests and static assets (SVG, PNG, JPG, WEBP, etc.)
  const isImageRequest = request.destination === 'image' || request.url.match(/\.(png|jpe?g|svg|webp|gif)$/i);

  if (isImageRequest) {
    // Avoid intercepting data URIs or blob URIs
    if (request.url.startsWith('data:') || request.url.startsWith('blob:')) return;

    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Stale-while-revalidate: return from cache, update in background
          event.waitUntil(
            fetch(request).then((networkResponse) => {
              if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            }).catch((err) => console.warn('Background image fetch failed:', err))
          );
          return cachedResponse;
        }

        // Cache-first (or network fallback)
        return fetch(request).then((networkResponse) => {
          // Check if we received a valid response
          if (!networkResponse || (networkResponse.status !== 200 && networkResponse.type !== 'opaque')) {
            return networkResponse;
          }

          // Clone the response because it's a stream and can only be consumed once
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });

          return networkResponse;
        }).catch(() => {
          // Fallback logic could go here if offline
          console.warn('Fetch failed for image:', request.url);
        });
      })
    );
  }
});
