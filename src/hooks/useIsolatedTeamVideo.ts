import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ActivityReport, TranscriptScene } from '../types';
import { 
  getTeamVideoElementId, 
  getOrLoadCachedVideoUrl 
} from '../utils/videoCache';
import { 
  getReportViews, 
  incrementReportViews, 
  subscribeToStoreUpdates 
} from '../utils/reportsStore';
import { safeGetLocalStorage, safeSetLocalStorage } from '../utils/storage';

export interface UseIsolatedTeamVideoOptions {
  teamSlug: string;
  teamName: string;
  report: ActivityReport;
}

export type VideoLoadingStatus = 'idle' | 'loading' | 'ready' | 'error';

export interface IsolatedTeamVideoState {
  domId: string;
  uniqueKey: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  containerRef: React.RefObject<HTMLDivElement | null>;
  effectiveVideoSrc: string;
  isPlaying: boolean;
  isLoadingResource: boolean;
  isFromCache: boolean;
  resourceSizeBytes?: number;
  status: VideoLoadingStatus;
  errorMessage: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  videoFit: 'contain' | 'cover';
  isFullscreen: boolean;
  showSubtitles: boolean;
  viewCount: number;
  activeScene: TranscriptScene | null;
  togglePlay: () => void;
  seek: (seconds: number) => void;
  skipSeconds: (seconds: number) => void;
  changeVolume: (vol: number) => void;
  toggleMute: () => void;
  changePlaybackRate: (rate: number) => void;
  setVideoFit: React.Dispatch<React.SetStateAction<'contain' | 'cover'>>;
  setShowSubtitles: (valueOrUpdater: boolean | ((prev: boolean) => boolean)) => void;
  toggleFullscreen: () => void;
  retryLoad: (isManual?: boolean) => void;
  retryWithProxy: () => void;
  restoreStableVideo: () => void;
}

// Global active video registry for playback isolation across all teams
const GLOBAL_VIDEO_PLAY_EVENT = 'mahash_team_video_playing';
const SUBTITLE_PREF_KEY = 'mahash_subtitles_enabled_v1';

export function useIsolatedTeamVideo({
  teamSlug,
  report
}: UseIsolatedTeamVideoOptions): IsolatedTeamVideoState {
  const domId = getTeamVideoElementId(teamSlug, report.id);
  const uniqueKey = `${teamSlug}_${report.id}`;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hasCountedViewRef = useRef<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(20);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [videoFit, setVideoFit] = useState<'contain' | 'cover'>('contain');

  // Subtitle preference persistent in localStorage (Default: OFF / false)
  const [showSubtitles, setShowSubtitlesState] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    try {
      const saved = safeGetLocalStorage(SUBTITLE_PREF_KEY);
      if (saved !== null) {
        return saved === 'true';
      }
    } catch {}
    return false; // Subtitles are OFF by default per user requirement
  });

  const setShowSubtitles = useCallback((valueOrUpdater: boolean | ((prev: boolean) => boolean)) => {
    setShowSubtitlesState((prev) => {
      const next = typeof valueOrUpdater === 'function' ? valueOrUpdater(prev) : valueOrUpdater;
      try {
        safeSetLocalStorage(SUBTITLE_PREF_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  // Loading & cache state
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string>('');
  const [isFromCache, setIsFromCache] = useState<boolean>(false);
  const [resourceSizeBytes, setResourceSizeBytes] = useState<number | undefined>(undefined);
  const [status, setStatus] = useState<VideoLoadingStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingResource, setIsLoadingResource] = useState<boolean>(true);

  // View count state
  const [viewCount, setViewCount] = useState<number>(() => getReportViews(report.id));

  // Sync view count from store
  useEffect(() => {
    const unsub = subscribeToStoreUpdates(() => {
      setViewCount(getReportViews(report.id));
    });
    return () => unsub();
  }, [report.id]);

  // Auto retry attempts tracking
  const autoRetryCountRef = useRef<number>(0);
  const maxAutoRetries = 2;

  // Load and resolve video resource with caching and multi-tier fallbacks
  const loadResource = useCallback(async (isManualRetry: boolean = false, forceProxy: boolean = false) => {
    if (isManualRetry) {
      autoRetryCountRef.current = 0;
    }
    setIsLoadingResource(true);
    setStatus('loading');
    setErrorMessage(null);

    try {
      let rawSrc = (report.videoSrc || (report as any).videoUrl || '').trim();

      if (!rawSrc || rawSrc === '#') {
        setResolvedVideoUrl('');
        setIsFromCache(false);
        setStatus('idle');
        setErrorMessage(null);
        return;
      }

      // Automatically replace broken 403 Google Storage sample videos with local verified sample video
      if (rawSrc.includes('commondatastorage.googleapis.com') && rawSrc.includes('ForBiggerBlazes.mp4')) {
        rawSrc = '/mahash-sample-video.mp4';
      }

      if (forceProxy && (rawSrc.startsWith('http://') || rawSrc.startsWith('https://'))) {
        rawSrc = `/api/video-stream?url=${encodeURIComponent(rawSrc)}`;
      }

      const result = await getOrLoadCachedVideoUrl(report.id, rawSrc);
      if (result.url) {
        setResolvedVideoUrl(result.url);
        setIsFromCache(result.isFromCache);
        setResourceSizeBytes(result.sizeBytes);
        setStatus('ready');
      } else {
        setResolvedVideoUrl('');
        setIsFromCache(false);
        setStatus('idle');
        setErrorMessage(null);
      }
    } catch (err: any) {
      console.warn(`[useIsolatedTeamVideo] Resource error for ${uniqueKey}:`, err);
      // Check auto retry
      if (autoRetryCountRef.current < maxAutoRetries) {
        autoRetryCountRef.current += 1;
        console.log(`[useIsolatedTeamVideo] Auto-retrying resource load (${autoRetryCountRef.current}/${maxAutoRetries})...`);
        setTimeout(() => {
          loadResource(false, true); // try via stream proxy on retry
        }, 1200);
        return;
      }
      setStatus('error');
      setErrorMessage(err?.message || 'خطا در دسترسی یا دریافت فایل ویدیو از سرور');
    } finally {
      setIsLoadingResource(false);
    }
  }, [report.id, report.videoSrc, uniqueKey]);

  useEffect(() => {
    loadResource();
  }, [loadResource]);

  const retryWithProxy = useCallback(() => {
    autoRetryCountRef.current = 0;
    loadResource(true, true);
  }, [loadResource]);

  const restoreStableVideo = useCallback(() => {
    autoRetryCountRef.current = 0;
    setResolvedVideoUrl('/mahash-sample-video.mp4');
    setIsFromCache(false);
    setStatus('ready');
    setErrorMessage(null);
  }, []);

  // Wire up video DOM events reliably for smooth time, duration, and playback updates
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video) {
        setCurrentTime(video.currentTime);
      }
    };

    const onLoadedMetadata = () => {
      if (video) {
        if (video.duration && !isNaN(video.duration) && video.duration > 0) {
          setDuration(video.duration);
        }
        setCurrentTime(video.currentTime);
        setStatus('ready');
        setErrorMessage(null);
        autoRetryCountRef.current = 0;
      }
    };

    const onDurationChange = () => {
      if (video && video.duration && !isNaN(video.duration) && video.duration > 0) {
        setDuration(video.duration);
      }
    };

    const onPlay = () => {
      setIsPlaying(true);
      if (!hasCountedViewRef.current) {
        hasCountedViewRef.current = true;
        const updated = incrementReportViews(report.id);
        setViewCount(updated);
      }
    };

    const onPause = () => {
      setIsPlaying(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
    };

    const onBeginFullscreen = () => {
      setIsFullscreen(true);
    };

    const onEndFullscreen = () => {
      setIsFullscreen(false);
    };

    const onError = () => {
      if (video && video.error) {
        const mediaErr = video.error;
        let detailedMsg = 'خطا در بارگذاری فایل ویدیویی';
        
        switch (mediaErr.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            detailedMsg = 'دریافت ویدیو توسط کاربر یا مرورگر متوقف شد.';
            break;
          case MediaError.MEDIA_ERR_NETWORK:
            detailedMsg = 'خطای شبکه در حین دانلود ویدیو رخ داد. اتصال اینترنت خود را بررسی نمایید.';
            break;
          case MediaError.MEDIA_ERR_DECODE:
            detailedMsg = 'فایل ویدیویی آسیب‌دیده (Corrupted) است یا کدک صوتی/تصویری آن توسط مرورگر پشتیبانی نمی‌شود.';
            break;
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            detailedMsg = 'فرمت ویدیویی پشتیبانی نمی‌شود یا فایل روی سرور یافت نشد.';
            break;
          default:
            detailedMsg = 'خطای نامشخص در رمزگشایی و پخش ویدیو رخ داد.';
        }

        // Automatic retry attempt once if decode/network error
        if (autoRetryCountRef.current < maxAutoRetries && (mediaErr.code === MediaError.MEDIA_ERR_NETWORK || mediaErr.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED)) {
          autoRetryCountRef.current += 1;
          console.log(`[useIsolatedTeamVideo] Auto-retrying video playback (${autoRetryCountRef.current}/${maxAutoRetries})...`);
          setTimeout(() => {
            if (videoRef.current) {
              videoRef.current.load();
            }
          }, 1500);
          return;
        }

        setStatus('error');
        setErrorMessage(detailedMsg);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);
    video.addEventListener('webkitbeginfullscreen', onBeginFullscreen as any);
    video.addEventListener('webkitendfullscreen', onEndFullscreen as any);

    // Initial check
    if (video.duration && !isNaN(video.duration) && video.duration > 0) {
      setDuration(video.duration);
    }

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('error', onError);
      video.removeEventListener('webkitbeginfullscreen', onBeginFullscreen as any);
      video.removeEventListener('webkitendfullscreen', onEndFullscreen as any);
    };
  }, [resolvedVideoUrl, report.id]);

  // Pause other videos when this one starts playing (Playback Isolation)
  useEffect(() => {
    const handleGlobalPlay = (e: CustomEvent<{ activeDomId: string }>) => {
      if (e.detail.activeDomId !== domId && videoRef.current && !videoRef.current.paused) {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    };

    window.addEventListener(GLOBAL_VIDEO_PLAY_EVENT as any, handleGlobalPlay);
    return () => {
      window.removeEventListener(GLOBAL_VIDEO_PLAY_EVENT as any, handleGlobalPlay);
    };
  }, [domId]);

  // Reset state when report ID changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    hasCountedViewRef.current = false;
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.pause();
    }
  }, [report.id]);

  // Fullscreen sync
  useEffect(() => {
    const handleFs = () => {
      const isFs = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      if (!isFs && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFs);
    document.addEventListener('webkitfullscreenchange', handleFs);
    return () => {
      document.removeEventListener('fullscreenchange', handleFs);
      document.removeEventListener('webkitfullscreenchange', handleFs);
    };
  }, [isFullscreen]);

  // Actions
  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      // Broadcast playing event so other video elements pause
      window.dispatchEvent(
        new CustomEvent(GLOBAL_VIDEO_PLAY_EVENT, {
          detail: { activeDomId: domId }
        })
      );
      videoRef.current
        .play()
        .then(() => {
          setIsPlaying(true);
          setStatus('ready');
          if (!hasCountedViewRef.current) {
            hasCountedViewRef.current = true;
            const updated = incrementReportViews(report.id);
            setViewCount(updated);
          }
        })
        .catch((e) => {
          console.warn('[useIsolatedTeamVideo] Playback auto-blocked or interrupted:', e);
          setIsPlaying(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, [domId, report.id]);

  const seek = useCallback((time: number) => {
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const skipSeconds = useCallback(
    (seconds: number) => {
      if (!videoRef.current) return;
      const total = duration || 20;
      const next = Math.max(0, Math.min(total, videoRef.current.currentTime + seconds));
      videoRef.current.currentTime = next;
      setCurrentTime(next);
    },
    [duration]
  );

  const changeVolume = useCallback((val: number) => {
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (videoRef.current) {
        videoRef.current.muted = next;
      }
      return next;
    });
  }, []);

  const changePlaybackRate = useCallback((rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const nextFs = !isFullscreen;
    setIsFullscreen(nextFs);

    const video = videoRef.current as any;
    const container = containerRef.current as any;

    if (nextFs) {
      // If iOS Safari or mobile device where video.webkitEnterFullscreen is supported
      const isIOS = typeof navigator !== 'undefined' && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1));
      if (isIOS && video && typeof video.webkitEnterFullscreen === 'function') {
        try {
          video.webkitEnterFullscreen();
          return;
        } catch (e) {
          console.warn('iOS webkitEnterFullscreen fallback to portal overlay:', e);
        }
      }

      if (container) {
        try {
          if (container.requestFullscreen) {
            container.requestFullscreen().catch(() => {});
          } else if (container.webkitRequestFullscreen) {
            container.webkitRequestFullscreen();
          }
        } catch {}
      }
    } else {
      try {
        if (document.fullscreenElement || (document as any).webkitFullscreenElement) {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
        } else if (video && typeof video.webkitExitFullscreen === 'function') {
          video.webkitExitFullscreen();
        }
      } catch {}
    }
  }, [isFullscreen]);

  const retryLoad = useCallback(() => {
    loadResource(true);
    if (videoRef.current) {
      try {
        videoRef.current.load();
      } catch {}
    }
  }, [loadResource]);

  // Subtitle calculation
  const scenes = report.transcript || [];
  const getActiveScene = (): TranscriptScene | null => {
    if (!scenes || scenes.length === 0) return null;

    // Check if scenes have explicit start/end seconds
    const exactScene = scenes.find((s) => {
      if (typeof s.seconds === 'number' && typeof s.endSeconds === 'number') {
        return currentTime >= s.seconds && currentTime <= s.endSeconds;
      }
      if (typeof s.seconds === 'number') {
        return currentTime >= s.seconds && currentTime <= s.seconds + 6;
      }
      return false;
    });

    if (exactScene) return exactScene;

    const isAnimeReport = report.id === 'thinker-02' || report.id === 'angels-01';

    if (!isAnimeReport) {
      if (currentTime < 4.0) return scenes[0];
      if (currentTime < 9.0) return scenes[1] || scenes[0];
      if (currentTime < 14.0) return scenes[2] || scenes[1];
      if (currentTime < 17.0) return scenes[3] || scenes[2];
      return scenes[4] || scenes[scenes.length - 1];
    } else {
      const idx = Math.min(Math.floor(currentTime / 9), scenes.length - 1);
      return scenes[idx];
    }
  };

  const activeScene = getActiveScene();

  return {
    domId,
    uniqueKey,
    videoRef,
    containerRef,
    effectiveVideoSrc: resolvedVideoUrl,
    isPlaying,
    isLoadingResource,
    isFromCache,
    resourceSizeBytes,
    status,
    errorMessage,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    videoFit,
    isFullscreen,
    showSubtitles,
    viewCount,
    activeScene,
    togglePlay,
    seek,
    skipSeconds,
    changeVolume,
    toggleMute,
    changePlaybackRate,
    setVideoFit,
    setShowSubtitles,
    toggleFullscreen,
    retryLoad,
    retryWithProxy,
    restoreStableVideo
  };
}
