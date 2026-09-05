/**
 * Mahash Portal PWA Service Worker
 * Version: 2.1.0
 * Strategy: Stale-While-Revalidate for core assets, documents, and API endpoints
 * Cache-First for static media assets with background refresh
 */

const STATIC_CACHE = 'mahash-static-v2.3';
const RUNTIME_CACHE = 'mahash-runtime-v2.3';
const MEDIA_CACHE = 'mahash-media-v2.3';
const VIDEO_CACHE = 'mahash-video-v2.3';
const API_CACHE = 'mahash-api-v2.3';

const CURRENT_CACHES = [STATIC_CACHE, RUNTIME_CACHE, MEDIA_CACHE, VIDEO_CACHE, API_CACHE];

// Core shell assets to pre-cache on installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/favicon.svg',
  '/sitemap.xml',
  '/robots.txt'
];

// Install event: Pre-cache core shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      try {
        await cache.addAll(PRECACHE_ASSETS);
      } catch (err) {
        console.warn('[SW] Pre-cache non-fatal failure:', err);
      }
      return self.skipWaiting();
    })
  );
});

// Activate event: Clean up legacy caches and claim clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(async (keys) => {
      await Promise.all(
        keys.map((key) => {
          if (!CURRENT_CACHES.includes(key)) {
            console.log('[SW] Deleting legacy cache:', key);
            return caches.delete(key);
          }
        })
      );
      return self.clients.claim();
    })
  );
});

// Stale-While-Revalidate Helper
async function staleWhileRevalidate(request, cacheName, fallbackUrl = null) {
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);

  // Background fetch to revalidate and update cache
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    })
    .catch((err) => {
      // Network failed or offline - return cached or fallback
      if (cachedResponse) return cachedResponse;
      if (fallbackUrl) {
        return caches.match(fallbackUrl);
      }
      throw err;
    });

  // Return cached response immediately if available, otherwise wait for network
  return cachedResponse || fetchPromise;
}

// Fetch event router
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only intercept GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Navigation requests (HTML pages) -> Stale-While-Revalidate with index.html fallback
  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const cachedIndex = await cache.match('/index.html') || await cache.match('/');
        
        const networkFetch = fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put('/index.html', networkResponse.clone());
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // If network failed and we have cached index.html, return it
          if (cachedIndex) return cachedIndex;
          // Fallback offline HTML response
          return new Response(
            `<!DOCTYPE html>
            <html lang="fa" dir="rtl">
              <head>
                <meta charset="utf-8" />
                <title>باشگاه جوانان مؤسسه محاش - حالت آفلاین</title>
                <meta name="viewport" content="width=device-width, initial-scale=1" />
                <style>
                  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0b0f19; color: #f1f5f9; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; text-align: center; padding: 1rem; }
                  .card { background: #111827; border: 1px solid #1e293b; padding: 2rem; border-radius: 1.5rem; max-width: 480px; }
                  h1 { color: #60a5fa; font-size: 1.25rem; margin-bottom: 0.5rem; }
                  p { color: #94a3b8; font-size: 0.875rem; line-height: 1.6; }
                  button { background: #2563eb; color: white; border: none; padding: 0.6rem 1.2rem; border-radius: 0.75rem; font-weight: bold; cursor: pointer; margin-top: 1rem; }
                </style>
              </head>
              <body>
                <div class="card">
                  <h1>سامانه باشگاه جوانان محاش</h1>
                  <p>ارتباط اینترنتی شما قطع یا ناپایدار است. اطلاعات قبلی در حافظه دستگاه شما ذخیره شده و به محض برقراری اینترنت همگام‌سازی خواهد شد.</p>
                  <button onclick="window.location.reload()">تلاش مجدد</button>
                </div>
              </body>
            </html>`,
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });

        return cachedIndex || networkFetch;
      })
    );
    return;
  }

  // 2. JavaScript, CSS, Fonts, and Web Modules -> Stale-While-Revalidate
  const isScriptOrStyle =
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.hostname.includes('jsdelivr.net') ||
    url.hostname.includes('gstatic.com') ||
    url.hostname.includes('googleapis.com');

  if (isScriptOrStyle) {
    event.respondWith(staleWhileRevalidate(request, STATIC_CACHE));
    return;
  }

  // 3. API Read-Only Data Endpoints (Exclude mutable store/sync endpoints so public site stays real-time)
  if (
    url.pathname.startsWith('/api/') && 
    !url.pathname.startsWith('/api/store') && 
    !url.pathname.startsWith('/api/admin/') && 
    !url.pathname.startsWith('/api/upload') &&
    !url.pathname.startsWith('/api/video-monitor') &&
    !url.pathname.startsWith('/api/reports/restore') &&
    !url.pathname.startsWith('/api/system/')
  ) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        const fetchPromise = fetch(request)
          .then((res) => {
            if (res && res.status === 200) {
              cache.put(request, res.clone());
            }
            return res;
          })
          .catch(() => {
            if (cachedResponse) return cachedResponse;
            return new Response(JSON.stringify({ ok: true, offline: true, cached: true }), {
              headers: { 'Content-Type': 'application/json; charset=utf-8' }
            });
          });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 4. Video Files -> Advanced Cache-First Strategy with Byte-Range Slicing
  const isVideo =
    request.destination === 'video' ||
    url.pathname.match(/\.(mp4|webm|ogg|m4v)$/i) ||
    url.pathname.startsWith('/uploads/video-') ||
    (url.pathname.includes('/uploads/') && url.pathname.match(/\.(mp4|webm)$/i));

  if (isVideo) {
    if (request.url.startsWith('data:') || request.url.startsWith('blob:')) return;

    event.respondWith(
      (async () => {
        const cache = await caches.open(VIDEO_CACHE);
        const cleanUrl = url.origin + url.pathname;
        let cachedResponse = await cache.match(cleanUrl);

        if (!cachedResponse) {
          try {
            // Pre-cache clean whole response
            const networkResponse = await fetch(cleanUrl);
            if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
              await cache.put(cleanUrl, networkResponse.clone());
              cachedResponse = networkResponse;
            }
          } catch (netErr) {
            // Direct request fallback
            return fetch(request);
          }
        }

        // Handle partial range requests if video is cached
        const rangeHeader = request.headers.get('range');
        if (rangeHeader && cachedResponse && cachedResponse.status === 200) {
          try {
            const arrayBuffer = await cachedResponse.clone().arrayBuffer();
            const bytesMatch = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (bytesMatch) {
              const total = arrayBuffer.byteLength;
              const start = parseInt(bytesMatch[1], 10);
              const end = bytesMatch[2] ? parseInt(bytesMatch[2], 10) : total - 1;
              const chunk = arrayBuffer.slice(start, end + 1);

              return new Response(chunk, {
                status: 206,
                statusText: 'Partial Content',
                headers: {
                  'Content-Range': `bytes ${start}-${end}/${total}`,
                  'Accept-Ranges': 'bytes',
                  'Content-Length': String(chunk.byteLength),
                  'Content-Type': cachedResponse.headers.get('Content-Type') || 'video/mp4'
                }
              });
            }
          } catch (rangeErr) {
            console.warn('[SW] Range slice fallback to direct fetch:', rangeErr);
            return fetch(request);
          }
        }

        return cachedResponse || fetch(request);
      })()
    );
    return;
  }

  // 5. Static Images, Icons, SVG, Posters -> Cache-First with Background Revalidation
  const isMediaAsset =
    request.destination === 'image' ||
    url.pathname.match(/\.(png|jpe?g|svg|webp|gif|ico|avif)$/i);

  if (isMediaAsset) {
    if (request.url.startsWith('data:') || request.url.startsWith('blob:')) return;
    if (request.headers.has('range')) return;

    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
          fetch(request).then((freshRes) => {
            if (freshRes && (freshRes.status === 200 || freshRes.type === 'opaque')) {
              cache.put(request, freshRes.clone());
            }
          }).catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && (networkResponse.status === 200 || networkResponse.type === 'opaque')) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch((err) => {
          console.warn('[SW] Media asset fetch failed:', request.url);
          return cachedResponse;
        });
      })
    );
    return;
  }
});
