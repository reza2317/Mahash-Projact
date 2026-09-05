/**
 * Abstract Media Loader Layer
 * Checks CacheStorage first for media assets (images, videos), and if missing,
 * fetches, caches, and returns managed ObjectURLs with lazy loading support.
 */

const ABSTRACT_CACHE_NAME = 'mahash-abstract-media-v2';

export async function getOrLoadMediaResource(url: string): Promise<string> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('<svg')) {
    return url;
  }

  if (typeof window === 'undefined' || !('caches' in window)) {
    return url;
  }

  try {
    const cache = await caches.open(ABSTRACT_CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      const cType = cachedResponse.headers.get('content-type') || '';
      if (!cType.includes('text/html')) {
        const blob = await cachedResponse.blob();
        if (blob.type.includes('image') || blob.type.includes('video') || blob.size > 0) {
          return URL.createObjectURL(blob);
        }
      }
      // Purge invalid HTML response
      try { await cache.delete(url); } catch {}
    }

    const response = await fetch(url);
    if (response && response.ok) {
      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) {
        try {
          await cache.put(url, response.clone());
        } catch {}
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    }
  } catch (err) {
    // Graceful fallback to direct URL
  }

  return url;
}
