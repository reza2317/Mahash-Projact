import { useEffect, useState } from 'react';

export function useAutoVideoThumbnail(videoUrl: string, existingPoster?: string): string | undefined {
  const [thumbnail, setThumbnail] = useState<string | undefined>(existingPoster);

  useEffect(() => {
    // If we already have a poster, or no video URL, do nothing
    if (existingPoster || !videoUrl || videoUrl.startsWith('indexeddb:')) {
      setThumbnail(existingPoster);
      return;
    }

    // Check if we have a cached thumbnail in localStorage with safe key hashing
    let safeKeyPart = '';
    try {
      safeKeyPart = btoa(encodeURIComponent(videoUrl)).substring(0, 24);
    } catch {
      safeKeyPart = videoUrl.replace(/[^a-zA-Z0-9]/g, '').slice(-24);
    }
    const cacheKey = `mahash_thumb_${safeKeyPart}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      setThumbnail(cached);
      return;
    }

    let isMounted = true;
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.muted = true;
    video.playsInline = true;
    video.src = videoUrl;

    // We only need the first frame
    video.preload = 'metadata';

    const handleLoadedData = () => {
      // Seek to 1 second or 0.1 to avoid pure black frames at 0s
      video.currentTime = 1;
    };

    const handleSeeked = () => {
      if (!isMounted) return;
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          // Compress heavily for a lightweight thumbnail
          const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
          setThumbnail(dataUrl);
          
          // Cache it
          try {
            localStorage.setItem(cacheKey, dataUrl);
          } catch (e) {
            // LocalStorage might be full (QuotaExceededError)
            console.warn('Could not cache thumbnail, quota exceeded.');
          }
        }
      } catch (e) {
        console.warn('Error generating auto-thumbnail:', e);
      }
    };

    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('error', () => {
       // Silently fail if video can't be loaded for thumbnail
    });

    return () => {
      isMounted = false;
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('seeked', handleSeeked);
      video.src = '';
    };
  }, [videoUrl, existingPoster]);

  return thumbnail;
}
