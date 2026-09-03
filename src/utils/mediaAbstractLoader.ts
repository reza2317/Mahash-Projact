/**
 * Abstract Media Loader Layer
 * Checks CacheStorage first for media assets (images, videos), and if missing,
 * fetches, caches, and returns managed ObjectURLs with lazy loading support.
 */

const ABSTRACT_CACHE_NAME = 'mahash-abstract-media-v1';

export async function getOrLoadMediaResource(url: string): Promise<string> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (typeof window === 'undefined' || !('caches' in window)) {
    return url;
  }

  try {
    const cache = await caches.open(ABSTRACT_CACHE_NAME);
    const cachedResponse = await cache.match(url);
    if (cachedResponse) {
      const blob = await cachedResponse.blob();
      return URL.createObjectURL(blob);
    }

    const response = await fetch(url, { mode: 'no-cors' });
    if (response) {
      await cache.put(url, response.clone());
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }
  } catch (err) {
    console.warn('[MediaAbstractLoader] Abstract load fallback:', err);
  }

  return url;
}
