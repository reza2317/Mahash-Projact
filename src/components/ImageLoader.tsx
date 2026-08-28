import React, { useState, useEffect, useRef } from 'react';
import { normalizeImageSrc } from '../utils/assets';

// In-memory cache for fast instant rendering across component remounts
const memoryImageCache = new Map<string, string>();

interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  showSkeleton?: boolean;
  priority?: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

/**
 * ImageLoader component with browser caching, smooth fallback,
 * responsive scaling and zero distortion for logos and profile images.
 */
export const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  fallbackSrc,
  alt,
  className = 'w-full h-full object-contain',
  containerClassName = '',
  aspectRatio = 'square',
  showSkeleton = true,
  priority = false,
  onImageLoad,
  onImageError,
  ...imgProps
}) => {
  const normalizedSrc = normalizeImageSrc(src);
  const normalizedFallback = normalizeImageSrc(fallbackSrc);

  const isDataOrBlob = Boolean(
    normalizedSrc && (normalizedSrc.startsWith('data:') || normalizedSrc.startsWith('blob:') || normalizedSrc.startsWith('/'))
  );

  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    if (!normalizedSrc) return normalizedFallback || '';
    return memoryImageCache.get(normalizedSrc) || normalizedSrc;
  });

  const isInitiallyCached = Boolean(normalizedSrc && (memoryImageCache.has(normalizedSrc) || isDataOrBlob));

  const [isLoaded, setIsLoaded] = useState<boolean>(isInitiallyCached || priority);
  const [hasError, setHasError] = useState<boolean>(false);
  const [isInView, setIsInView] = useState<boolean>(priority || isInitiallyCached);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Sync when src or fallback changes
  useEffect(() => {
    if (!normalizedSrc) {
      if (normalizedFallback) {
        setCurrentSrc(normalizedFallback);
        setIsLoaded(true);
      }
      return;
    }

    const cached = memoryImageCache.get(normalizedSrc);
    if (cached) {
      setCurrentSrc(cached);
      setIsLoaded(true);
      setHasError(false);
      return;
    }

    setCurrentSrc(normalizedSrc);
    setHasError(false);

    if (isDataOrBlob) {
      memoryImageCache.set(normalizedSrc, normalizedSrc);
      setIsLoaded(true);
    } else if (!priority) {
      setIsLoaded(false);
    }
  }, [normalizedSrc, normalizedFallback, priority, isDataOrBlob]);

  // IntersectionObserver for lazy-loading
  useEffect(() => {
    if (priority || isInView || isDataOrBlob) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '150px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView, isDataOrBlob]);

  // Preload and verify image
  useEffect(() => {
    if (!isInView || !normalizedSrc) return;

    if (memoryImageCache.has(normalizedSrc) || isDataOrBlob) {
      setIsLoaded(true);
      return;
    }

    let isMounted = true;
    const img = new Image();
    if (normalizedSrc.startsWith('http://') || normalizedSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.decoding = 'async';
    img.src = normalizedSrc;

    img.onload = () => {
      if (!isMounted) return;
      memoryImageCache.set(normalizedSrc, normalizedSrc);
      setCurrentSrc(normalizedSrc);
      setIsLoaded(true);
      setHasError(false);
      onImageLoad?.();
    };

    img.onerror = () => {
      if (!isMounted) return;
      setHasError(true);
      if (normalizedFallback) {
        setCurrentSrc(normalizedFallback);
        setIsLoaded(true);
      }
      onImageError?.();
    };

    return () => {
      isMounted = false;
    };
  }, [isInView, normalizedSrc, normalizedFallback, isDataOrBlob, onImageLoad, onImageError]);


  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : '';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden flex items-center justify-center ${aspectClass} ${containerClassName}`}
    >
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-inherit" />
      )}

      {currentSrc && (
        <img
          src={currentSrc}
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          referrerPolicy="no-referrer"
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...imgProps}
        />
      )}
    </div>
  );
};
