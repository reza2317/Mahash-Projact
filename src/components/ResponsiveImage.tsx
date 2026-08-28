import React, { useRef } from 'react';
import { useResponsiveImage } from '../hooks/useResponsiveImage';

export interface ResponsiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  srcSet?: string;
  sizes?: string;
  fallbackSrc?: string;
  alt: string;
  teamSlugOrId?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'auto';
  showSkeleton?: boolean;
  priority?: boolean;
  onImageLoad?: () => void;
  onImageError?: () => void;
}

/**
 * ResponsiveImage Component
 * Powered by `useResponsiveImage` hook. Utilizes `srcset`, `sizes`, and `IntersectionObserver`
 * for optimal performance and prevents reverting to fallback logos on refresh.
 */
export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  src,
  srcSet,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  fallbackSrc,
  alt,
  teamSlugOrId,
  className = 'w-full h-full object-contain',
  containerClassName = '',
  aspectRatio = 'square',
  showSkeleton = true,
  priority = false,
  onImageLoad,
  onImageError,
  ...restProps
}) => {
  const { currentSrc, srcSet: computedSrcSet, isLoaded, elementRef, imageProps } = useResponsiveImage({
    src,
    fallbackSrc,
    teamSlugOrId,
    srcSet,
    sizes,
    priority,
    lazy: !priority,
    onLoaded: onImageLoad,
    onError: onImageError,
  });

  const aspectClass =
    aspectRatio === 'square'
      ? 'aspect-square'
      : aspectRatio === 'video'
      ? 'aspect-video'
      : aspectRatio === 'portrait'
      ? 'aspect-[3/4]'
      : '';

  return (
    <div
      ref={elementRef}
      className={`relative overflow-hidden flex items-center justify-center ${aspectClass} ${containerClassName}`}
    >
      {showSkeleton && !isLoaded && (
        <div className="absolute inset-0 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-inherit" />
      )}

      {currentSrc && (
        <img
          {...imageProps}
          alt={alt}
          className={`transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          {...restProps}
        />
      )}
    </div>
  );
};
