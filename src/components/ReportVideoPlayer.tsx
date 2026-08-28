import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Settings,
  Subtitles,
  Sliders,
  SkipForward,
  SkipBack,
  Scaling,
  CheckCircle2,
  Film,
  Sparkles,
  Radio,
  Eye,
  Lock,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { ActivityReport } from '../types';
import { useIsolatedTeamVideo } from '../hooks/useIsolatedTeamVideo';
import { TeamVideoStatusIndicator } from './TeamVideoStatusIndicator';
import { toPersianDigits } from '../utils/persianDate';
import { isAdminAuthenticated } from '../utils/reportsStore';

interface ReportVideoPlayerProps {
  report: ActivityReport;
  teamName: string;
  teamSlug?: string;
  onNavigateToAdmin?: () => void;
}

export const ReportVideoPlayer: React.FC<ReportVideoPlayerProps> = ({
  report,
  teamName,
  teamSlug = 'default',
  onNavigateToAdmin
}) => {
  const isAdmin = isAdminAuthenticated();

  // Removed hardcoded restriction so Report 2 in Team Thinker is open and playable for all public users
  const isRestrictedToAdmin = false;

  // Use our dedicated isolated video hook per team and report
  const {
    domId,
    videoRef,
    containerRef,
    effectiveVideoSrc,
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
  } = useIsolatedTeamVideo({
    teamSlug,
    teamName,
    report
  });

  const [quality, setQuality] = useState<'1080p' | '720p' | '480p'>('1080p');
  const [showSettingsMenu, setShowSettingsMenu] = useState<boolean>(false);
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const hoverTimeoutRef = useRef<any>(null);

  // Close settings popup on outside click
  useEffect(() => {
    if (!showSettingsMenu) return;
    const handleOutsideClick = () => setShowSettingsMenu(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, [showSettingsMenu]);

  // Keyboard shortcuts (Escape, F, Space, Arrow keys)
  useEffect(() => {
    if (isRestrictedToAdmin) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        toggleFullscreen();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const next = Math.min(1, parseFloat((volume + 0.1).toFixed(2)));
        changeVolume(next);
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = Math.max(0, parseFloat((volume - 0.1).toFixed(2)));
        changeVolume(next);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen, toggleFullscreen, togglePlay, volume, changeVolume, isRestrictedToAdmin]);

  // Lock body scroll during fullscreen
  useEffect(() => {
    if (isFullscreen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [isFullscreen]);

  // Format seconds to mm:ss
  const formatTime = (timeInSec: number) => {
    if (isNaN(timeInSec)) return '00:00';
    const mins = Math.floor(timeInSec / 60);
    const secs = Math.floor(timeInSec % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Mouse hover control visibility timeout
  const handleMouseMove = () => {
    setIsHovered(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setIsHovered(false);
    }, 3500);
  };

  const scenes = report.transcript || [];

  // If this is Team Thinker Report 2 and user is NOT an admin, display the admin restriction box
  if (isRestrictedToAdmin) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 mx-auto flex items-center justify-center shadow-inner">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2 max-w-md mx-auto">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 text-amber-300 border border-amber-400/20 rounded-full text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            ویژه پنل مدیریت باشگاه
          </span>
          <h3 className="text-lg font-black text-white">
            پخش رسمی ویدیوی {report.reportNum} ({teamName})
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            کادر پخش رسمی ویدیوی گزارش ۲ (تیم مغز متفکر) برای عموم غیرفعال است و دسترسی به آن تنها پس از ورود به پنل مدیریت امکان‌پذیر می‌باشد.
          </p>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={() => {
              if (onNavigateToAdmin) {
                onNavigateToAdmin();
              } else {
                window.location.hash = '#admin';
                window.dispatchEvent(new HashChangeEvent('hashchange'));
              }
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-lg transition cursor-pointer"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>ورود به پنل مدیریت برای مشاهده ویدیو</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 1. Precise Loading / Cache / Error Status Indicator on Top of Video */}
      <TeamVideoStatusIndicator
        status={status}
        isFromCache={isFromCache}
        resourceSizeBytes={resourceSizeBytes}
        errorMessage={errorMessage}
        onRetry={retryLoad}
        reportTitle={report.title}
      />

      {/* 2. Main Cinematic Video Player */}
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => isPlaying && setIsHovered(false)}
        className={`relative bg-slate-950 overflow-hidden shadow-2xl border border-slate-800 group select-none transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-[99999] w-screen h-[100dvh] rounded-none flex flex-col items-center justify-center bg-black'
            : 'rounded-3xl'
        }`}
      >
        {/* Top Floating Info Bar */}
        <div
          className={`absolute top-0 inset-x-0 z-30 p-2.5 sm:p-3.5 bg-gradient-to-b from-black/95 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            isHovered || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 drop-shadow truncate">
              <Film className="w-3.5 h-3.5 text-sky-400 shrink-0 hidden xs:inline" />
              <span className="truncate">{report.title}</span>
            </span>
            {isAdmin && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <span>دسترسی ادمین</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Aspect / Full Screen Zoom Toggle Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setVideoFit((prev) => (prev === 'contain' ? 'cover' : 'contain'));
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 transition shadow-lg cursor-pointer border ${
                videoFit === 'cover'
                  ? 'bg-blue-600 border-blue-400 text-white'
                  : 'bg-black/60 border-white/20 text-slate-300 hover:text-white'
              }`}
              title="تغییر نحوه نمایش و کادربندی ویدیو"
            >
              <Scaling className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{videoFit === 'cover' ? 'تمام‌صفحه' : 'تناسب ۱۶:۹'}</span>
            </button>

            {/* Direct Fullscreen Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-1 sm:p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg border border-white/20 transition cursor-pointer"
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه (F)'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>

            {isFullscreen && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition shadow-lg cursor-pointer"
              >
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">خروج</span>
              </button>
            )}

            <span className="text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>{quality}</span>
            </span>

            {/* View Count Badge */}
            <span
              className="text-[9px] sm:text-[10px] text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30 font-bold flex items-center gap-1 shadow-sm"
              title="تعداد بازدیدهای این گزارش و ویدیو"
            >
              <Eye className="w-3 h-3 text-sky-400" />
              <span>{toPersianDigits(viewCount)} بازدید</span>
            </span>
          </div>
        </div>

        {/* Pure HTML5 Video Player Screen with Unique ID per team & report */}
        <div
          onClick={togglePlay}
          onDoubleClick={(e) => {
            e.stopPropagation();
            setVideoFit((prev) => (prev === 'contain' ? 'cover' : 'contain'));
          }}
          className={`relative w-full bg-black flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
            isFullscreen ? 'absolute inset-0 w-full h-full' : 'aspect-video max-h-[540px]'
          }`}
        >
          {effectiveVideoSrc ? (
            <video
              ref={videoRef}
              id={domId}
              key={effectiveVideoSrc}
              src={effectiveVideoSrc}
              poster={report.posterSrc}
              className={`w-full h-full min-w-full min-h-full block select-none ${
                videoFit === 'cover' ? 'object-cover' : 'object-contain'
              }`}
              playsInline
              preload="metadata"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-2 p-6 text-center">
              {isLoadingResource ? (
                <>
                  <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs font-bold text-slate-300">در حال فراخوانی ویدیو...</span>
                </>
              ) : (
                <>
                  <Film className="w-12 h-12 text-slate-600 mb-1" />
                  <span className="text-xs font-bold text-slate-400">فایل ویدیویی برای پخش یافت نشد</span>
                </>
              )}
            </div>
          )}

          {/* Loading Cache Overlay */}
          {isLoadingResource && effectiveVideoSrc && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs text-white z-20 gap-2">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-bold text-slate-200">در حال بارگذاری ویدیو...</span>
            </div>
          )}

          {/* Playback Error Overlay */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white z-25 p-4 text-center gap-3">
              <Film className="w-10 h-10 text-rose-500 animate-pulse" />
              <div className="text-xs font-bold text-rose-300">
                {errorMessage || 'خطا در بارگذاری یا پخش فایل ویدیو'}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  retryLoad();
                }}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تلاش مجدد</span>
              </button>
            </div>
          )}

          {/* Center Play/Pause Large Floating Button */}
          {!isPlaying && !isLoadingResource && status !== 'error' && effectiveVideoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all z-20">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-blue-600/95 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110 cursor-pointer ring-4 ring-white/30"
              >
                <Play className="w-7 h-7 sm:w-10 sm:h-10 ml-0.5 sm:ml-1 fill-current" />
              </button>
            </div>
          )}

          {/* Dynamic Synchronized Subtitles Overlay */}
          {showSubtitles && activeScene && (
            <div className={`absolute ${isFullscreen ? 'bottom-16 sm:bottom-20' : 'bottom-12 sm:bottom-16'} inset-x-2 sm:inset-x-4 pointer-events-none text-center z-20`}>
              <div className="inline-block bg-black/85 text-white text-[11px] sm:text-sm md:text-base font-bold px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl leading-snug sm:leading-relaxed max-w-xl animate-fadeIn">
                «{activeScene.text}»
              </div>
            </div>
          )}
        </div>

        {/* Custom Dedicated Controls Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 z-30 p-2 sm:p-3 bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-1.5 sm:space-y-2 transition-opacity duration-300 ${
            isHovered || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Progress Timeline Slider */}
          <div className="flex items-center gap-2 group/timeline">
            <input
              type="range"
              min="0"
              max={duration || 20}
              step="0.05"
              value={currentTime}
              onChange={(e) => seek(parseFloat(e.target.value))}
              className="w-full h-1.5 sm:h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:h-2.5 transition-all"
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white text-xs">
            {/* Left Controls: Play, Skip, Volume, Time */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                onClick={togglePlay}
                className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition cursor-pointer text-white"
                title={isPlaying ? 'توقف' : 'پخش'}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>

              <button
                onClick={() => skipSeconds(-5)}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white hidden xs:flex"
                title="۵ ثانیه قبل"
              >
                <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => skipSeconds(5)}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white hidden xs:flex"
                title="۵ ثانیه بعد"
              >
                <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              <button
                onClick={() => seek(0)}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-400 hover:text-white hidden md:flex"
                title="شروع مجدد از ابتدا"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              {/* Volume Control */}
              <div className="hidden sm:flex items-center gap-1.5 group/vol">
                <button
                  onClick={toggleMute}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-12 sm:w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                />
              </div>

              {/* Time display */}
              <div className="text-[10px] sm:text-[11px] text-slate-300 font-mono pr-0.5">
                <span>{formatTime(currentTime)}</span>
                <span className="mx-0.5 sm:mx-1 text-slate-500">/</span>
                <span>{formatTime(duration || 20)}</span>
              </div>
            </div>

            {/* Right Controls: Subtitles, Settings, Quality, Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Subtitles Toggle */}
              {scenes.length > 0 && (
                <button
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    showSubtitles
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                  title={showSubtitles ? 'خاموش کردن زیرنویس فارسی' : 'فعال‌سازی زیرنویس فارسی'}
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">{showSubtitles ? 'زیرنویس: روشن' : 'زیرنویس: خاموش'}</span>
                </button>
              )}

              {/* Settings Dropdown (Speed & Quality) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowSettingsMenu(!showSettingsMenu);
                  }}
                  className={`p-1 sm:p-1.5 rounded-lg transition cursor-pointer ${
                    showSettingsMenu
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-white/10 text-slate-300 hover:text-white'
                  }`}
                  title="تنظیمات سرعت و کیفیت"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>

                {showSettingsMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-full mb-2 left-0 rtl:left-0 rtl:right-auto ltr:right-0 ltr:left-auto w-44 sm:w-48 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl text-xs space-y-2 z-50 backdrop-blur-2xl animate-fadeIn"
                  >
                    <div className="font-bold text-slate-200 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" />
                        <span>سرعت پخش</span>
                      </div>
                      <span className="text-[10px] text-blue-400 font-mono font-bold">{playbackRate}x</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.75, 1, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          onClick={() => changePlaybackRate(rate)}
                          className={`py-1 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                            playbackRate === rate
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    <div className="font-bold text-slate-200 pt-1 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Scaling className="w-3.5 h-3.5 text-emerald-400" />
                        <span>پوشش صفحه</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {videoFit === 'cover' ? 'پوشش ۱۰۰٪' : 'تناسب ۱۶:۹'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        onClick={() => {
                          setVideoFit('contain');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1 px-1.5 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                          videoFit === 'contain'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        تناسب استاندارد
                      </button>
                      <button
                        onClick={() => {
                          setVideoFit('cover');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1 px-1.5 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                          videoFit === 'cover'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        تمام‌صفحه
                      </button>
                    </div>

                    <div className="font-bold text-slate-200 pt-1 pb-1 border-b border-slate-800 flex items-center justify-between">
                      <span>کیفیت پخش</span>
                      <span className="text-[10px] text-emerald-400 font-bold">{quality}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['1080p', '720p', '480p'] as const).map((q) => (
                        <button
                          key={q}
                          onClick={() => {
                            setQuality(q);
                            setShowSettingsMenu(false);
                          }}
                          className={`py-1 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                            quality === q
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white"
                title="تمام‌صفحه (F)"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Official Video Publication Status Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Publication Status Info */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>پخش رسمی ویدیوی {report.reportNum} ({teamName})</span>
            </div>
            <span className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              نسخه معتبر و نهایی
            </span>
          </div>

          {/* Broadcast Metadata Badges */}
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 text-sky-500" />
              <span>پخش با کیفیت 1080p Full HD</span>
            </span>
            <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1 rounded-lg font-medium">
              زیرنویس همگام فارسی
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
