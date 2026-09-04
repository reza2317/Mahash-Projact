import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Settings,
  Film,
  AlertCircle,
  RefreshCw,
  Sliders,
  ExternalLink,
  Tv
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

export interface VideoSourceOption {
  src: string;
  type: string;
}

export interface ModernResponsiveVideoPlayerProps {
  id?: string;
  src?: string;
  sources?: VideoSourceOption[];
  poster?: string;
  title?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  aspectRatio?: '16:9' | '4:3' | '1:1' | 'auto';
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
}

export const ModernResponsiveVideoPlayer: React.FC<ModernResponsiveVideoPlayerProps> = ({
  id,
  src,
  sources,
  poster,
  title,
  autoPlay = false,
  loop = false,
  muted = false,
  className = '',
  aspectRatio = '16:9',
  onPlay,
  onPause,
  onEnded
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [bufferedPercent, setBufferedPercent] = useState<number>(0);
  const [volume, setVolume] = useState<number>(1);
  const [isMuted, setIsMuted] = useState<boolean>(muted);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isPiPActive, setIsPiPActive] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // UI state
  const [showControls, setShowControls] = useState<boolean>(true);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPosition, setHoverPosition] = useState<number>(0);
  const [isInViewport, setIsInViewport] = useState<boolean>(false);
  const [activeSourceIndex, setActiveSourceIndex] = useState<number>(0);

  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Normalize sources list
  const resolvedSources: VideoSourceOption[] = React.useMemo(() => {
    if (sources && sources.length > 0) return sources;
    if (!src) return [{ src: '/uploads/mahash-stable-video.mp4', type: 'video/mp4' }];

    const list: VideoSourceOption[] = [];
    const lower = src.toLowerCase();

    // Primary source
    if (lower.endsWith('.webm')) {
      list.push({ src, type: 'video/webm' });
      list.push({ src: src.replace(/\.webm$/i, '.mp4'), type: 'video/mp4' });
    } else {
      list.push({ src, type: 'video/mp4' });
      list.push({ src: src.replace(/\.mp4$/i, '.webm'), type: 'video/webm' });
    }

    // Safety fallback
    list.push({ src: '/uploads/mahash-stable-video.mp4', type: 'video/mp4' });
    return list;
  }, [src, sources]);

  // Lazy loading optimization: Viewport Observer
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setIsInViewport(true);
        }
      },
      { rootMargin: '250px' } // Pre-warm 250px before entering viewport
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Format time (MM:SS) in Persian digits
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '۰۰:۰۰';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const mm = m < 10 ? `0${m}` : `${m}`;
    const ss = s < 10 ? `0${s}` : `${s}`;
    return toPersianDigits(`${mm}:${ss}`);
  };

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play()
        .then(() => {
          setIsPlaying(true);
          onPlay?.();
        })
        .catch(err => {
          console.warn('Playback error:', err);
        });
    } else {
      v.pause();
      setIsPlaying(false);
      onPause?.();
    }
  }, [onPlay, onPause]);

  // Skip time (+/- seconds)
  const skipTime = (seconds: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(Math.max(0, v.currentTime + seconds), duration);
  };

  // Seek on timeline click
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    const v = videoRef.current;
    if (!rect || !v || duration <= 0) return;

    // RTL-aware position calculation
    const clickX = rect.right - e.clientX;
    const fraction = Math.min(Math.max(0, clickX / rect.width), 1);
    v.currentTime = fraction * duration;
  };

  // Timeline hover preview
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = progressRef.current?.getBoundingClientRect();
    if (!rect || duration <= 0) return;

    const clickX = rect.right - e.clientX;
    const fraction = Math.min(Math.max(0, clickX / rect.width), 1);
    setHoverTime(fraction * duration);
    setHoverPosition(e.clientX - rect.left);
  };

  // Mute Toggle
  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsMuted(v.muted);
  };

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    const v = videoRef.current;
    if (!v) return;
    const clamped = Math.min(Math.max(0, newVol), 1);
    v.volume = clamped;
    v.muted = clamped === 0;
    setVolume(clamped);
    setIsMuted(clamped === 0);
  };

  // Playback Rate
  const handleSpeedChange = (rate: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSettings(false);
  };

  // Picture-in-Picture Toggle
  const togglePiP = async () => {
    const v = videoRef.current;
    if (!v) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiPActive(false);
      } else if (document.pictureInPictureEnabled) {
        await v.requestPictureInPicture();
        setIsPiPActive(true);
      }
    } catch (err) {
      console.warn('PiP error:', err);
    }
  };

  // Fullscreen Toggle
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(err => console.warn('Fullscreen failed:', err));
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false));
    }
  };

  // Controls Visibility Auto-hide
  const triggerShowControls = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
        setShowSettings(false);
      }, 3200);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in form inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      if (e.key === ' ' || e.key === 'k') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        skipTime(-5); // RTL forward/backward
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        skipTime(5);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        handleVolumeChange(volume + 0.1);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        handleVolumeChange(volume - 0.1);
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 'm') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, volume, isFullscreen]);

  // Video Event Handlers
  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);

    // Compute buffered range
    if (v.buffered.length > 0) {
      const bufferedEnd = v.buffered.end(v.buffered.length - 1);
      const percent = (bufferedEnd / (v.duration || 1)) * 100;
      setBufferedPercent(Math.min(100, Math.max(0, percent)));
    }
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setDuration(v.duration || 0);
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = () => {
    console.warn(`[VideoPlayer] Error loading source index ${activeSourceIndex}`);
    if (activeSourceIndex < resolvedSources.length - 1) {
      // Auto-fallback to next compatible format/source
      setActiveSourceIndex(prev => prev + 1);
      setIsLoading(true);
    } else {
      setHasError(true);
      setIsLoading(false);
      setErrorMessage('امکان بارگذاری منبع ویدیو وجود ندارد.');
    }
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setActiveSourceIndex(0);
    const v = videoRef.current;
    if (v) {
      v.load();
    }
  };

  const currentSource = resolvedSources[activeSourceIndex] || resolvedSources[0];

  return (
    <div
      ref={containerRef}
      id={id}
      onMouseMove={triggerShowControls}
      onTouchStart={triggerShowControls}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className={`relative w-full overflow-hidden rounded-2xl bg-black select-none group text-white font-sans ${
        aspectRatio === '16:9'
          ? 'aspect-video'
          : aspectRatio === '4:3'
          ? 'aspect-4/3'
          : aspectRatio === '1:1'
          ? 'aspect-square'
          : 'min-h-[260px]'
      } ${className}`}
      dir="rtl"
    >
      {/* HTML5 Video Element with High-Performance Multi-Source */}
      {isInViewport ? (
        <video
          ref={videoRef}
          src={currentSource?.src}
          poster={poster}
          autoPlay={autoPlay}
          loop={loop}
          muted={muted}
          playsInline
          preload="metadata"
          crossOrigin="anonymous"
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onWaiting={() => setIsLoading(true)}
          onPlaying={() => {
            setIsLoading(false);
            setIsPlaying(true);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            onEnded?.();
          }}
          onError={handleError}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />
      ) : (
        /* Poster Placeholder before Viewport Intersection */
        <div className="w-full h-full flex items-center justify-center bg-slate-950">
          {poster ? (
            <img src={poster} alt={title || 'ویدیو'} className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-500">
              <Film className="w-10 h-10" />
              <span className="text-xs">آماده بارگذاری در صورت پیمایش...</span>
            </div>
          )}
        </div>
      )}

      {/* Top Overlay Bar: Title & Quick Actions */}
      <div
        className={`absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent transition-opacity duration-300 pointer-events-auto flex items-center justify-between gap-3 z-20 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Film className="w-4 h-4 text-indigo-400 shrink-0" />
          <h4 className="text-xs sm:text-sm font-bold truncate text-white drop-shadow-sm">
            {title || 'پخش ویدیوی رسمی'}
          </h4>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Format Badge */}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-indigo-300 font-mono font-bold uppercase">
            {currentSource?.type?.replace('video/', '') || 'mp4'}
          </span>

          {/* PiP Button */}
          {document.pictureInPictureEnabled && (
            <button
              type="button"
              onClick={togglePiP}
              className="p-1.5 rounded-lg bg-black/40 hover:bg-black/80 text-white/80 hover:text-white transition cursor-pointer"
              title="تصویر در تصویر (PiP)"
              aria-label="پخش در حالت تصویر در تصویر (PiP)"
            >
              <Tv className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* Center Big Play / Loading / Error Overlay */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px] pointer-events-none z-10" aria-live="polite" aria-label="در حال بارگذاری ویدیو">
          <div className="relative flex items-center justify-center">
            <div className="w-14 h-14 rounded-full border-3 border-indigo-500/30 border-t-indigo-500 animate-spin" />
            <Film className="w-5 h-5 text-indigo-400 absolute" aria-hidden="true" />
          </div>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white p-6 text-center space-y-3 z-30" role="alert">
          <AlertCircle className="w-10 h-10 text-rose-500" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-bold text-slate-200">
            {errorMessage || 'خطا در پخش فایل ویدیو'}
          </p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-lg"
            aria-label="تلاش مجدد برای بارگذاری نسخه پایدار ویدیو"
          >
            <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>تلاش مجدد و بارگذاری نسخه پایدار</span>
          </button>
        </div>
      )}

      {/* Central Play/Pause Animation Cue on Pause */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          type="button"
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 bg-transparent border-0"
          aria-label="شروع پخش ویدیو"
        >
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600/90 hover:bg-indigo-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110 active:scale-95 group-hover:ring-8 group-hover:ring-indigo-500/20">
            <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-current translate-x-0.5" aria-hidden="true" />
          </div>
        </button>
      )}

      {/* Bottom Modern Control Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent transition-opacity duration-300 pointer-events-auto z-20 space-y-2 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        role="region"
        aria-label="کنترل‌های پخش ویدیو"
      >
        {/* Interactive Scrub Timeline */}
        <div
          ref={progressRef}
          onClick={handleSeek}
          onMouseMove={handleTimelineMouseMove}
          onMouseLeave={() => setHoverTime(null)}
          role="slider"
          tabIndex={0}
          aria-label="نوار زمان و پیشرفت پخش ویدیو"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
          aria-valuetext={`${formatTime(currentTime)} از ${formatTime(duration)}`}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              skipTime(5);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              skipTime(-5);
            }
          }}
          className="relative w-full h-2 group/timeline cursor-pointer py-1 flex items-center focus:outline-none focus:ring-1 focus:ring-indigo-400 rounded"
        >
          {/* Background Track */}
          <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden transition-all group-hover/timeline:h-2">
            {/* Buffered Progress */}
            <div
              className="h-full bg-white/30 transition-all duration-200"
              style={{ width: `${bufferedPercent}%` }}
            />
          </div>

          {/* Played Progress */}
          <div
            className="absolute top-1/2 -translate-y-1/2 right-0 h-1.5 bg-indigo-500 rounded-full pointer-events-none transition-all group-hover/timeline:h-2"
            style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
          >
            {/* Scrubber Knob */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-md scale-0 group-hover/timeline:scale-100 transition-transform" />
          </div>

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 transform -translate-x-1/2 px-2 py-0.5 bg-slate-900 text-white text-[10px] font-mono rounded shadow-md border border-slate-700 pointer-events-none"
              style={{ left: `${hoverPosition}px` }}
              aria-hidden="true"
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>

        {/* Action Controls Row */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 pt-1">
          {/* Right Section: Play/Pause, Rewind, Forward, Time */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Play/Pause */}
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={isPlaying ? 'توقف (Space)' : 'پخش (Space)'}
              aria-label={isPlaying ? 'توقف پخش ویدیو' : 'شروع پخش ویدیو'}
              aria-pressed={isPlaying}
            >
              {isPlaying ? <Pause className="w-4 h-4" aria-hidden="true" /> : <Play className="w-4 h-4 fill-current" aria-hidden="true" />}
            </button>

            {/* Skip -10s */}
            <button
              type="button"
              onClick={() => skipTime(-10)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white transition cursor-pointer hidden xs:flex items-center"
              title="۱۰ ثانیه عقب"
              aria-label="۱۰ ثانیه به عقب رفتن در ویدیو"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {/* Skip +10s */}
            <button
              type="button"
              onClick={() => skipTime(10)}
              className="p-1.5 rounded-lg text-white/80 hover:text-white transition cursor-pointer hidden xs:flex items-center"
              title="۱۰ ثانیه جلو"
              aria-label="۱۰ ثانیه به جلو رفتن در ویدیو"
            >
              <RotateCw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>

            {/* Time Indicator */}
            <div className="text-[11px] sm:text-xs font-mono text-slate-200" aria-label={`زمان پخش: ${formatTime(currentTime)} از ${formatTime(duration)}`}>
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-400 mx-1" aria-hidden="true">/</span>
              <span className="text-slate-400">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Left Section: Volume, Speed, Fullscreen */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Volume Control */}
            <div className="flex items-center gap-1 group/vol">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-white/80 hover:text-white transition cursor-pointer"
                title={isMuted ? 'صدا وصل (M)' : 'بی‌صدا (M)'}
                aria-label={isMuted || volume === 0 ? 'صدا قطع است. کلیک برای فعال‌سازی صدا' : 'صدا وصل است. کلیک برای بی‌صدا کردن'}
                aria-pressed={isMuted}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" aria-hidden="true" />
                ) : (
                  <Volume2 className="w-4 h-4" aria-hidden="true" />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={isMuted ? 0 : volume}
                onChange={e => handleVolumeChange(parseFloat(e.target.value))}
                className="w-14 sm:w-18 h-1 bg-white/30 accent-indigo-500 rounded-lg cursor-pointer hidden sm:block"
                title={`میزان صدا: ${Math.round(volume * 100)}%`}
                aria-label="میزان بلندی صدای ویدیو"
                aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)} درصد`}
              />
            </div>

            {/* Playback Speed Setting Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowSettings(prev => !prev)}
                className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-[11px] font-mono font-bold text-white transition cursor-pointer"
                title="سرعت پخش ویدیو"
                aria-label={`تنظیم سرعت پخش ویدیو، فعلی ${playbackRate} برابر`}
                aria-expanded={showSettings}
                aria-haspopup="menu"
              >
                {playbackRate}x
              </button>

              {showSettings && (
                <div 
                  className="absolute bottom-8 left-0 bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-2xl z-30 min-w-[90px] space-y-0.5"
                  role="menu"
                  aria-label="گزینه‌های سرعت پخش"
                >
                  <div className="text-[10px] text-slate-400 px-2 py-1 border-b border-slate-800 font-bold" role="presentation">
                    سرعت پخش
                  </div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      type="button"
                      role="menuitem"
                      onClick={() => handleSpeedChange(speed)}
                      className={`w-full text-right px-2.5 py-1 text-xs rounded-lg transition font-mono flex items-center justify-between cursor-pointer ${
                        playbackRate === speed
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'text-slate-300 hover:bg-slate-800'
                      }`}
                      aria-label={`سرعت پخش ${speed} برابر`}
                      aria-checked={playbackRate === speed}
                    >
                      <span>{speed}x</span>
                      {playbackRate === speed && <span aria-hidden="true">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Fullscreen Toggle */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-1.5 sm:p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title={isFullscreen ? 'خروج از تمام‌صفحه (F)' : 'تمام‌صفحه (F)'}
              aria-label={isFullscreen ? 'خروج از حالت تمام‌صفحه' : 'نمایش تمام‌صفحه ویدیو'}
              aria-pressed={isFullscreen}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" aria-hidden="true" /> : <Maximize className="w-4 h-4" aria-hidden="true" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
