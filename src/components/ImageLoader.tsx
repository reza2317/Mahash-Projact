import React, { useState, useEffect, useRef } from 'react';
import { normalizeImageSrc } from '../utils/assets';
import { User, Shield, AlertCircle } from 'lucide-react';
import { isWebPFormat } from '../utils/imageOptimizer';

// In-memory cache for fast instant rendering across component remounts
const memoryImageCache = new Map<string, string>();

export interface ImageLoaderProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  webpSrc?: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'full';
  showSkeleton?: boolean;
  priority?: boolean;
  rootMargin?: string;
  type?: 'consultant' | 'team' | 'general';
  showFormatBadge?: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

/**
 * ImageLoader component with:
 * - Proactive Lazy Loading using IntersectionObserver (rootMargin: 150px-200px)
 * - Compressed WebP picture element support
 * - Zero Cumulative Layout Shift (CLS) with fixed aspect containers
 * - Shimmer skeleton loading effect matching light and dark modes
 * - Tailored fallback avatars for consultants and teams
 */
export const ImageLoader: React.FC<ImageLoaderProps> = ({
  src,
  webpSrc,
  fallbackSrc,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
  aspectRatio = 'square',
  rounded = '2xl',
  showSkeleton = true,
  priority = false,
  rootMargin = '200px',
  type = 'general',
  showFormatBadge = false,
  onImageLoad,
  onImageError,
  ...imgProps
}) => {
  const normalizedSrc = normalizeImageSrc(src);
  const normalizedFallback = normalizeImageSrc(fallbackSrc);
  const normalizedWebp = normalizeImageSrc(webpSrc);

  const isDataOrBlob = Boolean(
    normalizedSrc &&
      (normalizedSrc.startsWith('data:') ||
        normalizedSrc.startsWith('blob:') ||
        normalizedSrc.startsWith('/'))
  );

  const [currentSrc, setCurrentSrc] = useState<string>(() => {
    if (!normalizedSrc) return normalizedFallback || '';
    return memoryImageCache.get(normalizedSrc) || normalizedSrc;
  });

  const isInitiallyCached = Boolean(
    normalizedSrc && (memoryImageCache.has(normalizedSrc) || isDataOrBlob)
  );

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

  // IntersectionObserver for lazy-loading before element hits viewport
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
      { rootMargin }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [priority, isInView, isDataOrBlob, rootMargin]);

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
    img.src = normalizedWebp || normalizedSrc;

    img.onload = () => {
      if (!isMounted) return;
      memoryImageCache.set(normalizedSrc, normalizedWebp || normalizedSrc);
      setCurrentSrc(normalizedWebp || normalizedSrc);
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
  }, [isInView, normalizedSrc, normalizedWebp, normalizedFallback, isDataOrBlob, onImageLoad, onImageError]);

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : '';

  const roundedClass =
    rounded === 'none'
      ? 'rounded-none'
      : rounded === 'sm'
      ? 'rounded-sm'
      : rounded === 'md'
      ? 'rounded-md'
      : rounded === 'lg'
      ? 'rounded-lg'
      : rounded === 'xl'
      ? 'rounded-xl'
      : rounded === '2xl'
      ? 'rounded-2xl'
      : rounded === '3xl'
      ? 'rounded-3xl'
      : 'rounded-full';

  const isWebp = isWebPFormat(currentSrc) || Boolean(normalizedWebp);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 ${aspectClass} ${roundedClass} ${containerClassName}`}
    >
      {/* Skeleton Loading State with accessible shimmer */}
      {showSkeleton && !isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-pulse" />
      )}

      {/* Fallback Display on Error or Missing Image */}
      {hasError && !currentSrc && (
        <div className="flex flex-col items-center justify-center p-3 text-center text-slate-400 dark:text-slate-500">
          {type === 'consultant' ? (
            <User className="w-8 h-8 opacity-60 mb-1" />
          ) : type === 'team' ? (
            <Shield className="w-8 h-8 opacity-60 mb-1" />
          ) : (
            <AlertCircle className="w-7 h-7 opacity-60 mb-1" />
          )}
          <span className="text-[10px] font-bold line-clamp-1">{alt || 'تصویر'}</span>
        </div>
      )}

      {/* Actual Rendered Image using Picture tag for WebP negotiation */}
      {currentSrc && (
        <picture className="w-full h-full flex items-center justify-center">
          {normalizedWebp && <source type="image/webp" srcSet={normalizedWebp} />}
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
        </picture>
      )}

      {/* Optional WebP format badge indicator */}
      {showFormatBadge && isWebp && isLoaded && (
        <span
          title="فرمت فشرده WebP برای حداکثر سرعت بارگذاری"
          className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded bg-black/60 text-white backdrop-blur-xs pointer-events-none"
        >
          WebP
        </span>
      )}
    </div>
  );
};
