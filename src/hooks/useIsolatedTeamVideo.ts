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
  retryLoad: () => void;
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

  // Load and resolve video resource with caching
  const loadResource = useCallback(async () => {
    setIsLoadingResource(true);
    setStatus('loading');
    setErrorMessage(null);

    try {
      const result = await getOrLoadCachedVideoUrl(report.id, report.videoSrc);
      if (result.url) {
        setResolvedVideoUrl(result.url);
        setIsFromCache(result.isFromCache);
        setResourceSizeBytes(result.sizeBytes);
        setStatus('ready');
      } else {
        setResolvedVideoUrl('');
        setIsFromCache(false);
        setStatus('error');
        setErrorMessage('منبع فایل ویدیویی مشخص نشده است');
      }
    } catch (err: any) {
      console.warn(`[useIsolatedTeamVideo] Resource error for ${uniqueKey}:`, err);
      setStatus('error');
      setErrorMessage(err?.message || 'خطا در دسترسی به فایل ویدیو');
    } finally {
      setIsLoadingResource(false);
    }
  }, [report.id, report.videoSrc, uniqueKey]);

  useEffect(() => {
    loadResource();
  }, [loadResource]);

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

    const onError = () => {
      if (video && video.error) {
        setStatus('error');
        setErrorMessage('خطا در پخش فایل ویدیویی');
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('error', onError);

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

    if (nextFs && window.innerWidth < 768) {
      setVideoFit('cover');
    }

    if (containerRef.current) {
      const el = containerRef.current as any;
      if (nextFs) {
        try {
          if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
          else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        } catch {}
      } else {
        try {
          if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
          else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
        } catch {}
      }
    }
  }, [isFullscreen]);

  const retryLoad = useCallback(() => {
    loadResource();
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
    retryLoad
  };
}
