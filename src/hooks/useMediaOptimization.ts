import { useState, useEffect, useRef } from 'react';

interface UseMediaOptimizationOptions {
  src: string;
  fallbackSrc?: string;
  lazy?: boolean;
}

const CACHE_NAME = 'mahash-media-cache-v1';

/**
 * Monitors CacheStorage video health and fetches with AbortController and automatic retry.
 */
export async function monitorVideoHealthAndFetch(url: string, retries = 3, timeoutMs = 10000): Promise<string> {
  if (!url || url.startsWith('data:') || url.startsWith('blob:')) {
    return url;
  }

  if (typeof window === 'undefined' || !('caches' in window)) {
    return url;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    const cachedResponse = await cache.match(url);

    if (cachedResponse && cachedResponse.ok) {
      const blob = await cachedResponse.blob();
      if (blob.size > 0) {
        return URL.createObjectURL(blob);
      } else {
        console.warn(`[VideoHealthMonitor] Cached video ${url} is empty/corrupted. Re-fetching.`);
        await cache.delete(url);
      }
    }
  } catch (err) {
    console.warn('[VideoHealthMonitor] CacheStorage check warning:', err);
  }

  // Fetch with AbortController and retry
  let attempt = 0;
  while (attempt < retries) {
    attempt++;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        mode: 'no-cors'
      });
      clearTimeout(timeoutId);

      if (response) {
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(url, response.clone());
        } catch {}

        const blob = await response.blob();
        if (blob.size > 0) {
          return URL.createObjectURL(blob);
        }
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.warn(`[VideoHealthMonitor] Fetch attempt ${attempt} failed for ${url}:`, err?.message || err);
      if (attempt >= retries) {
        break;
      }
      await new Promise(res => setTimeout(res, 1000 * attempt));
    }
  }

  return url;
}

export function useMediaOptimization({ src, fallbackSrc = '', lazy = true }: UseMediaOptimizationOptions) {
  const [optimizedSrc, setOptimizedSrc] = useState<string>(lazy ? '' : src);
  const [isLoaded, setIsLoaded] = useState<boolean>(!lazy);
  const [hasError, setHasError] = useState<boolean>(false);
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!src) {
      setOptimizedSrc(fallbackSrc);
      return;
    }

    let isMounted = true;

    const checkAndCacheAsset = async () => {
      try {
        const isVideo = src.match(/\.(mp4|webm|ogg|mov)$/i) || src.includes('video');
        let processedUrl = src;

        if (isVideo) {
          processedUrl = await monitorVideoHealthAndFetch(src);
        } else {
          if ('caches' in window && !processedUrl.startsWith('data:')) {
            const cache = await caches.open(CACHE_NAME);
            const cachedResponse = await cache.match(processedUrl);
            if (cachedResponse && cachedResponse.ok) {
              const blob = await cachedResponse.blob();
              processedUrl = URL.createObjectURL(blob);
            } else {
              try {
                const netResponse = await fetch(processedUrl, { mode: 'no-cors' });
                if (netResponse) {
                  await cache.put(processedUrl, netResponse.clone());
                }
              } catch {}
            }
          }
        }

        if (isMounted) {
          setOptimizedSrc(processedUrl);
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn('Media optimization error:', err);
        if (isMounted) {
          setOptimizedSrc(src);
        }
      }
    };

    if (!lazy) {
      checkAndCacheAsset();
      return () => {
        isMounted = false;
      };
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            checkAndCacheAsset();
            setIsLoaded(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: '250px' }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      isMounted = false;
      observer.disconnect();
    };
  }, [src, fallbackSrc, lazy]);

  return {
    ref: elementRef,
    src: optimizedSrc || fallbackSrc,
    isLoaded,
    hasError,
    onError: () => {
      setHasError(true);
      if (fallbackSrc) setOptimizedSrc(fallbackSrc);
    },
    onLoad: () => setIsLoaded(true)
  };
}
