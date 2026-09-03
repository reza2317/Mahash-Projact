import { useState, useEffect } from 'react';

interface UseVideoCacheOptions {
  src: string;
  autoPreload?: boolean;
}

const VIDEO_CACHE_NAME = 'mahash-video-cache-v1';

export function useVideoCache({ src, autoPreload = false }: UseVideoCacheOptions) {
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!src) {
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    let isMounted = true;

    const loadVideo = async () => {
      setIsLoading(true);
      setError(null);

      try {
        if ('caches' in window && !src.startsWith('data:')) {
          const cache = await caches.open(VIDEO_CACHE_NAME);
          const cachedResponse = await cache.match(src);

          if (cachedResponse) {
            const blob = await cachedResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            if (isMounted) {
              setVideoUrl(objectUrl);
              setIsLoading(false);
            }
            return;
          }

          // Fetch with AbortController to prevent redundant heavy requests
          const networkResponse = await fetch(src, { 
            signal: controller.signal,
            mode: 'no-cors' 
          });

          if (networkResponse && networkResponse.ok) {
            await cache.put(src, networkResponse.clone());
            const blob = await networkResponse.blob();
            const objectUrl = URL.createObjectURL(blob);
            if (isMounted) {
              setVideoUrl(objectUrl);
              setIsLoading(false);
            }
            return;
          }
        }

        // Fallback to direct source
        if (isMounted) {
          setVideoUrl(src);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.warn('Video cache / fetch warning:', err);
          if (isMounted) {
            setVideoUrl(src);
            setIsLoading(false);
          }
        }
      }
    };

    if (autoPreload) {
      loadVideo();
    } else {
      setVideoUrl(src);
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, [src, autoPreload]);

  return { videoUrl, isLoading, error };
}
