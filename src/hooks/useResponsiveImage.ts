import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { normalizeImageSrc, MAHASH_YOUTH_CLUB_FALLBACK_LOGO_SVG, getTeamLogoPlaceholder } from '../utils/assets';
import { getTeamLogo } from '../utils/reportsStore';
import { getOrLoadMediaResource } from '../utils/mediaAbstractLoader';

// In-memory cache to guarantee instant resolution across component re-renders & page navigation
const globalImageMemoryCache = new Set<string>();

export interface UseResponsiveImageOptions {
  src: string;
  fallbackSrc?: string;
  teamSlugOrId?: string;
  srcSet?: string;
  sizes?: string;
  priority?: boolean;
  lazy?: boolean;
  rootMargin?: string;
  threshold?: number;
  onLoaded?: () => void;
  onError?: () => void;
}

export interface UseResponsiveImageResult {
  currentSrc: string;
  srcSet: string | undefined;
  sizes: string;
  isLoaded: boolean;
  hasError: boolean;
  isInView: boolean;
  elementRef: (node: HTMLElement | null) => void;
  imageProps: {
    src: string;
    srcSet: string | undefined;
    sizes: string;
    loading: 'eager' | 'lazy';
    decoding: 'async' | 'sync' | 'auto';
    referrerPolicy: React.HTMLAttributeReferrerPolicy;
    onError: () => void;
    onLoad: () => void;
  };
}

/**
 * Custom Hook: useResponsiveImage
 * Handles smart viewport and DPR aware image resolution using `srcset` and `sizes`.
 * Enhances lazy loading via `IntersectionObserver` while preserving persisted logos
 * from LocalStorage/memory cache to strictly prevent reverting to defaults on page refresh.
 */
export function useResponsiveImage({
  src,
  fallbackSrc,
  teamSlugOrId,
  srcSet,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  priority = false,
  lazy = true,
  rootMargin = '100px',
  threshold = 0.01,
  onLoaded,
  onError,
}: UseResponsiveImageOptions): UseResponsiveImageResult {
  // Resolve effective source from persistent storage (if team identifier provided) or props
  const getInitialSource = useCallback((): string => {
    if (teamSlugOrId) {
      const persisted = getTeamLogo(teamSlugOrId);
      if (persisted) return normalizeImageSrc(persisted);
    }
    const candidate = normalizeImageSrc(src || fallbackSrc || '');
    if (candidate) return candidate;
    return teamSlugOrId ? getTeamLogoPlaceholder(teamSlugOrId) : MAHASH_YOUTH_CLUB_FALLBACK_LOGO_SVG;
  }, [teamSlugOrId, src, fallbackSrc]);

  const [currentSrc, setCurrentSrc] = useState<string>(getInitialSource);
  const [isInView, setIsInView] = useState<boolean>(() => priority || !lazy);
  const [hasError, setHasError] = useState<boolean>(false);

  const initialSrc = getInitialSource();
  const isDataOrBlob = Boolean(
    initialSrc && (initialSrc.startsWith('data:') || initialSrc.startsWith('blob:') || initialSrc.startsWith('<svg'))
  );

  const [isLoaded, setIsLoaded] = useState<boolean>(() => {
    return Boolean(
      initialSrc &&
        (globalImageMemoryCache.has(initialSrc) || isDataOrBlob || priority)
    );
  });

  const domNodeRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isMountedRef = useRef(true);

  // Ref callback to attach to image or container element
  const elementRef = useCallback(
    (node: HTMLElement | null) => {
      domNodeRef.current = node;

      if (priority || !lazy || typeof window === 'undefined' || !('IntersectionObserver' in window)) {
        setIsInView(true);
        return;
      }

      if (observerRef.current) {
        observerRef.current.disconnect();
      }

      if (node) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            const entry = entries[0];
            if (entry && (entry.isIntersecting || entry.intersectionRatio > 0)) {
              setIsInView(true);
              if (observerRef.current) {
                observerRef.current.disconnect();
              }
            }
          },
          { rootMargin, threshold }
        );
        observerRef.current.observe(node);
      }
    },
    [priority, lazy, rootMargin, threshold]
  );

  // Synchronize on prop change or persistent storage updates
  useEffect(() => {
    isMountedRef.current = true;
    const resolved = getInitialSource();

    if (resolved) {
      setCurrentSrc(resolved);
      setHasError(false);
      if (globalImageMemoryCache.has(resolved) || resolved.startsWith('data:') || resolved.startsWith('blob:')) {
        setIsLoaded(true);
      }
    }

    return () => {
      isMountedRef.current = false;
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [getInitialSource]);

  // Compute adaptive srcset for high pixel density (Retina/DPR) displays
  const computedSrcSet = useMemo(() => {
    if (srcSet) return srcSet;
    if (!currentSrc || currentSrc.startsWith('data:') || currentSrc.startsWith('blob:') || currentSrc.startsWith('<svg')) {
      return undefined;
    }
    return `${currentSrc} 1x, ${currentSrc} 2x`;
  }, [currentSrc, srcSet]);

  // Preload and verify image when in view via CacheStorage / abstract layer
  useEffect(() => {
    if (!isInView || !currentSrc) return;

    if (currentSrc.startsWith('data:') || currentSrc.startsWith('blob:') || currentSrc.startsWith('<svg')) {
      setIsLoaded(true);
      return;
    }

    if (globalImageMemoryCache.has(currentSrc)) {
      setIsLoaded(true);
      return;
    }

    let active = true;
    const processImageLoading = async () => {
      const resolvedUrl = await getOrLoadMediaResource(currentSrc);
      if (!active || !isMountedRef.current) return;

      const img = new Image();
      img.decoding = 'async';
      img.src = resolvedUrl;

      img.onload = () => {
        if (!active || !isMountedRef.current) return;
        globalImageMemoryCache.add(currentSrc);
        setIsLoaded(true);
        setHasError(false);
        onLoaded?.();
      };

      img.onerror = () => {
        if (!active || !isMountedRef.current) return;
        const fb = normalizeImageSrc(fallbackSrc || '') || (teamSlugOrId ? getTeamLogoPlaceholder(teamSlugOrId) : MAHASH_YOUTH_CLUB_FALLBACK_LOGO_SVG);
        if (fb && fb !== currentSrc) {
          setCurrentSrc(fb);
          setHasError(false);
          setIsLoaded(true);
        } else {
          setHasError(true);
        }
        onError?.();
      };
    };

    processImageLoading();

    return () => {
      active = false;
    };
  }, [isInView, currentSrc, fallbackSrc, teamSlugOrId, onLoaded, onError]);

  const handleImageError = useCallback(() => {
    if (!hasError) {
      setHasError(true);
      const fb = normalizeImageSrc(fallbackSrc || '') || (teamSlugOrId ? getTeamLogoPlaceholder(teamSlugOrId) : MAHASH_YOUTH_CLUB_FALLBACK_LOGO_SVG);
      if (fb) {
        setCurrentSrc(fb);
      }
      onError?.();
    }
  }, [hasError, fallbackSrc, teamSlugOrId, onError]);

  const handleImageLoad = useCallback(() => {
    if (currentSrc) {
      globalImageMemoryCache.add(currentSrc);
    }
    setIsLoaded(true);
    setHasError(false);
    onLoaded?.();
  }, [currentSrc, onLoaded]);

  return {
    currentSrc,
    srcSet: computedSrcSet,
    sizes,
    isLoaded,
    hasError,
    isInView,
    elementRef,
    imageProps: {
      src: currentSrc,
      srcSet: computedSrcSet,
      sizes,
      loading: priority ? 'eager' : 'lazy',
      decoding: 'async',
      referrerPolicy: 'no-referrer',
      onError: handleImageError,
      onLoad: handleImageLoad,
    },
  };
}
