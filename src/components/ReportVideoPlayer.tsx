import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  RotateCcw,
  AlertTriangle,
  RefreshCw,
  Loader2,
  FileText,
  Share2,
  Copy,
  Check,
  Wand2,
  Bot,
  Ear,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { ActivityReport, TranscriptScene } from '../types';
import { useIsolatedTeamVideo } from '../hooks/useIsolatedTeamVideo';
import { TeamVideoStatusIndicator } from './TeamVideoStatusIndicator';
import { toPersianDigits } from '../utils/persianDate';
import { isAdminAuthenticated, saveReport } from '../utils/reportsStore';
import {
  generateGeminiSubtitles,
  generateWebVttFromScenes,
  downloadVttFile,
  createVttBlobUrl
} from '../services/geminiSubtitleService';

interface ReportVideoPlayerProps {
  report: ActivityReport;
  teamName: string;
  teamSlug?: string;
  onNavigateToAdmin?: () => void;
}

export const ReportVideoPlayer: React.FC<ReportVideoPlayerProps> = ({
  report,
  teamName,
  teamSlug = 'default'
}) => {
  const isAdmin = isAdminAuthenticated();

  // Local state for transcript / subtitles to allow real-time AI updates
  const [currentTranscript, setCurrentTranscript] = useState(report.transcript || []);
  const [isGeneratingSubtitles, setIsGeneratingSubtitles] = useState<boolean>(false);
  const [aiSubtitleSuccessMessage, setAiSubtitleSuccessMessage] = useState<string | null>(null);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [showTranscriptDrawer, setShowTranscriptDrawer] = useState<boolean>(false);
  const [vttBlobUrl, setVttBlobUrl] = useState<string>(() => {
    if (report.vttContent) return createVttBlobUrl(report.vttContent);
    if (report.transcript && report.transcript.length > 0) {
      return createVttBlobUrl(generateWebVttFromScenes(report.transcript, report.title));
    }
    return '';
  });

  // Sync with report props
  useEffect(() => {
    setCurrentTranscript(report.transcript || []);
    if (report.vttContent) {
      setVttBlobUrl(createVttBlobUrl(report.vttContent));
    } else if (report.transcript && report.transcript.length > 0) {
      setVttBlobUrl(createVttBlobUrl(generateWebVttFromScenes(report.transcript, report.title)));
    }
  }, [report.transcript, report.vttContent, report.title]);

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
    retryLoad,
    retryWithProxy,
    restoreStableVideo
  } = useIsolatedTeamVideo({
    teamSlug,
    teamName,
    report: { ...report, transcript: currentTranscript }
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
  }, [isFullscreen, toggleFullscreen, togglePlay, volume, changeVolume]);

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

  // Mouse & Touch control visibility timeout
  const resetControlsTimeout = (durationMs = 4000) => {
    setIsHovered(true);
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    hoverTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setIsHovered(false);
    }, durationMs);
  };

  const handleMouseMove = () => {
    resetControlsTimeout(3500);
  };

  const handleTouchInteraction = () => {
    resetControlsTimeout(4500);
  };

  const handleScreenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // If controls are hidden (especially on mobile), tap reveals controls first
    if (isPlaying && !isHovered) {
      resetControlsTimeout(4000);
      return;
    }
    togglePlay();
  };

  // Direct video report share handler (Native OS share or Clipboard copy)
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullscreen]);

  const handleDirectShare = async () => {
    const reportUrl = `${window.location.origin}${window.location.pathname}#report-${report.id}`;
    const shareTitle = `ویدیوی گزارش ${report.reportNum || ''}: ${report.title} (${teamName})`;
    const shareText = `مشاهده ویدیوی گزارش رسمی تیم «${teamName}» در باشگاه جوانان محاش:\n«${report.title}»`;

    if (navigator.share && /mobile|android|iphone|ipad/i.test(navigator.userAgent)) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: reportUrl
        });
        return;
      } catch (err) {
        // User cancelled or share unsupported, proceed to copy
      }
    }

    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = reportUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 3000);
    }
  };

  // AI-Powered Persian Speech Recognition, Audio Analysis & WebVTT Subtitle Generator (Admin-only feature)
  const handleGenerateAiSubtitles = async () => {
    if (!isAdmin) {
      console.warn('AI Subtitle generation is disabled for public users and restricted to administrators.');
      return;
    }

    setIsGeneratingSubtitles(true);
    setAiSubtitleSuccessMessage(null);

    try {
      const result = await generateGeminiSubtitles(
        report,
        teamName,
        Math.round(duration || 25)
      );

      if (result.success && result.scenes.length > 0) {
        setCurrentTranscript(result.scenes);
        setShowSubtitles(true);
        setShowTranscriptDrawer(true);
        if (result.blobUrl) {
          setVttBlobUrl(result.blobUrl);
        }

        // Persist generated subtitles & VTT metadata into report store
        const updatedReport: ActivityReport = {
          ...report,
          transcript: result.scenes,
          vttUrl: result.vttUrl || report.vttUrl,
          vttContent: result.vttContent
        };
        saveReport(updatedReport, teamSlug);

        setAiSubtitleSuccessMessage(
          result.isFallback
            ? 'زیرنویس همگام و توصیفی با موفقیت تدوین و بر روی ویدیو فعال گردید.'
            : 'زیرنویس هوشمند با هوش مصنوعی (Gemini) با دقت بالا استخراج، همگام و فایل VTT ساخته شد.'
        );
        setTimeout(() => setAiSubtitleSuccessMessage(null), 5000);
      }
    } catch (err) {
      console.error('Error generating subtitles:', err);
    } finally {
      setIsGeneratingSubtitles(false);
    }
  };

  const scenes = currentTranscript;

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
        onTouchStart={handleTouchInteraction}
        onMouseLeave={() => isPlaying && setIsHovered(false)}
        className={`relative bg-slate-950 overflow-hidden shadow-2xl border border-slate-800 group select-none transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-[99999999] w-screen h-[100dvh] max-h-[100dvh] rounded-none flex flex-col items-center justify-between bg-black'
            : 'rounded-2xl sm:rounded-3xl aspect-video max-h-[540px] w-full'
        }`}
      >
        {/* Top Floating Info Bar */}
        <div
          className={`absolute top-0 inset-x-0 z-30 p-2 sm:p-3.5 ${
            isFullscreen ? 'pt-[max(0.75rem,env(safe-area-inset-top))]' : ''
          } bg-gradient-to-b from-black/95 via-black/60 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            isHovered || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {isFullscreen ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="px-2.5 py-1 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-lg cursor-pointer"
                title="خروج از حالت تمام‌صفحه"
                aria-label="خروج از حالت تمام‌صفحه ویدیو"
              >
                <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" />
                <span>خروج از تمام‌صفحه</span>
              </button>
            ) : (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" aria-hidden="true" />
            )}
            <span className="text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 drop-shadow truncate">
              <Film className="w-3.5 h-3.5 text-sky-400 shrink-0 hidden xs:inline" aria-hidden="true" />
              <span className="truncate">{report.title}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Direct Share Button in Top Bar */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleDirectShare();
              }}
              className={`px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold flex items-center gap-1 transition shadow-lg cursor-pointer border ${
                copiedShareLink
                  ? 'bg-emerald-600 border-emerald-400 text-white'
                  : 'bg-black/60 border-white/20 text-slate-300 hover:text-white hover:bg-black/80'
              }`}
              title="اشتراک‌گذاری مستقیم لینک ویدیو"
              aria-label="اشتراک‌گذاری مستقیم پیوند ویدیو"
            >
              {copiedShareLink ? <Check className="w-3 h-3 text-white" aria-hidden="true" /> : <Share2 className="w-3 h-3" aria-hidden="true" />}
              <span>{copiedShareLink ? 'لینک کپی شد' : 'اشتراک'}</span>
            </button>

            {/* Aspect / Full Screen Zoom Toggle Button */}
            <button
              type="button"
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
              aria-label={`تغییر کادربندی ویدیو (حالت فعلی: ${videoFit === 'cover' ? 'پوشش کامل' : 'تناسب استاندارد'})`}
            >
              <Scaling className="w-3 h-3" aria-hidden="true" />
              <span className="hidden sm:inline">{videoFit === 'cover' ? 'پوشش ۱۰۰٪' : 'تناسب استاندارد'}</span>
            </button>

            {/* Direct Fullscreen Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="p-1 sm:p-1.5 bg-black/60 hover:bg-black/90 text-white rounded-lg border border-white/20 transition cursor-pointer"
              title={isFullscreen ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه (F)'}
              aria-label={isFullscreen ? 'خروج از حالت تمام‌صفحه ویدیو' : 'نمایش تمام‌صفحه ویدیو'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5" aria-hidden="true" />}
            </button>

            <span className="text-[9px] sm:text-[10px] text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30 font-bold hidden xs:flex items-center gap-1" aria-label={`کیفیت ویدیو ${quality}`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <span>{quality}</span>
            </span>

            {/* View Count Badge */}
            <span
              className="text-[9px] sm:text-[10px] text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30 font-bold hidden sm:flex items-center gap-1 shadow-sm"
              title="تعداد بازدیدهای این گزارش و ویدیو"
              aria-label={`تعداد ${toPersianDigits(viewCount)} بازدید ثبت شده`}
            >
              <Eye className="w-3 h-3 text-sky-400" aria-hidden="true" />
              <span>{toPersianDigits(viewCount)} بازدید</span>
            </span>
          </div>
        </div>

        {/* Pure HTML5 Video Player Screen with Unique ID per team & report */}
        <div
          onClick={handleScreenClick}
          className={`relative w-full bg-black flex flex-col items-center justify-center cursor-pointer overflow-hidden ${
            isFullscreen ? 'flex-1 h-full w-full min-h-0' : 'aspect-video max-h-[540px]'
          }`}
        >
          {effectiveVideoSrc ? (
            <video
              ref={videoRef}
              id={domId}
              key={effectiveVideoSrc}
              poster={report.posterSrc}
              className={`block select-none pointer-events-none transition-all ${
                isFullscreen
                  ? videoFit === 'cover'
                    ? 'w-full h-full object-cover'
                    : 'max-w-full max-h-full w-auto h-auto object-contain'
                  : videoFit === 'cover'
                    ? 'w-full h-full object-cover'
                    : 'w-full h-full object-contain'
              }`}
              playsInline
              preload="metadata"
              crossOrigin="anonymous"
            >
              {/* Primary format source */}
              <source
                src={effectiveVideoSrc}
                type={effectiveVideoSrc.endsWith('.webm') ? 'video/webm' : 'video/mp4'}
              />
              {/* Fallback format source (WebM / MP4) */}
              {effectiveVideoSrc.endsWith('.mp4') && (
                <source src={effectiveVideoSrc.replace(/\.mp4$/i, '.webm')} type="video/webm" />
              )}
              {effectiveVideoSrc.endsWith('.webm') && (
                <source src={effectiveVideoSrc.replace(/\.webm$/i, '.mp4')} type="video/mp4" />
              )}
              {/* Fail-safe high-availability stable video */}
              <source src="/uploads/mahash-stable-video.mp4" type="video/mp4" />
              {(vttBlobUrl || report.vttUrl) && (
                <track
                  kind="subtitles"
                  src={vttBlobUrl || report.vttUrl}
                  srcLang="fa"
                  label="زیرنویس فارسی (هوش مصنوعی)"
                  default={showSubtitles}
                />
              )}
            </video>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 gap-3 p-6 text-center">
              {isLoadingResource ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="relative flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border-3 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <Film className="w-5 h-5 text-blue-400 absolute" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-200 block">در حال آماده‌سازی و واکشی فایل ویدیویی...</span>
                    <span className="text-[10px] text-slate-400 font-medium block">بررسی منابع سرور مرکزی و حافظه محلی</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 max-w-sm">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                    <FileText className="w-6 h-6 text-amber-400" />
                  </div>
                  <span className="text-xs font-bold text-slate-300">گزارش مستند و متنی</span>
                  <span className="text-[11px] text-slate-400 leading-relaxed">
                    این گزارش فاقد پیوست ویدیویی است یا به صورت مستند و فایل‌های پیوست ارائه شده است.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Skeleton Loader Overlay during initial load */}
          {isLoadingResource && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-xs text-white z-20 gap-3">
              <div className="relative flex items-center justify-center">
                <div className="w-14 h-14 rounded-full border-3 border-blue-500/30 border-t-blue-400 animate-spin" />
                <Loader2 className="w-6 h-6 text-blue-400 animate-spin absolute" />
              </div>
              <div className="text-center space-y-1">
                <span className="text-xs font-bold text-slate-100 block">در حال بارگذاری و استریم ویدیو...</span>
                <span className="text-[10px] text-slate-400 font-mono block">Buffering Video Stream & Audio Tracks</span>
              </div>
            </div>
          )}

          {/* Playback Error Overlay with clear diagnostic & recovery UI */}
          {status === 'error' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 text-white z-25 p-5 text-center gap-3.5 backdrop-blur-sm">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-500 shadow-lg">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1 max-w-md">
                <h4 className="text-xs sm:text-sm font-black text-rose-400">
                  عدم امکان پخش فایل ویدیویی
                </h4>
                <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
                  {errorMessage || 'فایل ویدیویی روی هاست موقت منقضی شده یا دسترسی به سرور با اختلال مواجه شده است.'}
                </p>
              </div>
              
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-lg">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    retryLoad(true);
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>تلاش مجدد اتصال</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    retryWithProxy();
                  }}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  aria-label="تلاش برای پخش از طریق پروکسی استریم سرور"
                >
                  <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>پخش از پروکسی استریم سرور</span>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    restoreStableVideo();
                  }}
                  className="px-3.5 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105 active:scale-95"
                  aria-label="بازیابی و بارگذاری فایل ویدیوی پایدار رسمی"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>بازیابی ویدیوی پایدار</span>
                </button>
              </div>
            </div>
          )}

          {/* Center Play/Pause Large Floating Button */}
          {!isPlaying && !isLoadingResource && status !== 'error' && effectiveVideoSrc && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all z-20">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlay();
                }}
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-full bg-blue-600/95 hover:bg-blue-500 text-white flex items-center justify-center shadow-2xl transition transform hover:scale-110 cursor-pointer ring-4 ring-white/30"
                aria-label="شروع پخش ویدیو"
              >
                <Play className="w-7 h-7 sm:w-10 sm:h-10 ml-0.5 sm:ml-1 fill-current" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Dynamic Synchronized Subtitles Overlay */}
          {showSubtitles && activeScene && (
            <div className={`absolute ${isFullscreen ? 'bottom-16 sm:bottom-20' : 'bottom-12 sm:bottom-16'} inset-x-2 sm:inset-x-4 pointer-events-none text-center z-20`}>
              <div className="inline-block bg-black/85 text-white text-[11px] sm:text-sm md:text-base font-bold px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-xl sm:rounded-2xl border border-white/20 backdrop-blur-md shadow-2xl leading-snug sm:leading-relaxed max-w-xl animate-fadeIn" role="status" aria-live="polite">
                «{activeScene.text}»
              </div>
            </div>
          )}
        </div>

        {/* Custom Dedicated Controls Bar */}
        <div
          className={`absolute bottom-0 inset-x-0 z-30 p-2 sm:p-3 ${
            isFullscreen ? 'pb-[max(0.75rem,env(safe-area-inset-bottom))]' : ''
          } bg-gradient-to-t from-black/95 via-black/80 to-transparent space-y-1.5 sm:space-y-2 transition-opacity duration-300 ${
            isHovered || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          role="region"
          aria-label="کنترل‌های پخش ویدیو"
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
              aria-label="نوار پیشرفت زمان پخش ویدیو"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration || 20)}
              aria-valuenow={Math.round(currentTime)}
              aria-valuetext={`${formatTime(currentTime)} از ${formatTime(duration || 20)}`}
            />
          </div>

          {/* Controls Row */}
          <div className="flex items-center justify-between text-white text-xs">
            {/* Left Controls: Play, Skip, Volume, Time */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <button
                type="button"
                onClick={togglePlay}
                className="p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 rounded-lg sm:rounded-xl transition cursor-pointer text-white"
                title={isPlaying ? 'توقف' : 'پخش'}
                aria-label={isPlaying ? 'توقف پخش ویدیو' : 'پخش ویدیو'}
                aria-pressed={isPlaying}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" /> : <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-current" aria-hidden="true" />}
              </button>

              <button
                type="button"
                onClick={() => skipSeconds(-5)}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white hidden xs:flex"
                title="۵ ثانیه قبل"
                aria-label="۵ ثانیه عقب رفتن در ویدیو"
              >
                <SkipBack className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => skipSeconds(5)}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white hidden xs:flex"
                title="۵ ثانیه بعد"
                aria-label="۵ ثانیه جلو رفتن در ویدیو"
              >
                <SkipForward className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => seek(0)}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-400 hover:text-white hidden md:flex"
                title="شروع مجدد از ابتدا"
                aria-label="شروع مجدد ویدیو از ابتدا"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              </button>

              {/* Volume Control */}
              <div className="hidden sm:flex items-center gap-1.5 group/vol">
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white"
                  aria-label={isMuted || volume === 0 ? 'فعال کردن صدای ویدیو' : 'بی‌صدا کردن ویدیو'}
                  title={isMuted ? 'فعال کردن صدا' : 'بی‌صدا'}
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
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  className="w-12 sm:w-16 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-400"
                  aria-label="میزان بلندی صدای ویدیو"
                  aria-valuenow={Math.round((isMuted ? 0 : volume) * 100)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuetext={`${Math.round((isMuted ? 0 : volume) * 100)} درصد`}
                />
              </div>

              {/* Time display */}
              <div className="text-[10px] sm:text-[11px] text-slate-300 font-mono pr-0.5" aria-label={`زمان سپری‌شده: ${formatTime(currentTime)} از ${formatTime(duration || 20)}`}>
                <span>{formatTime(currentTime)}</span>
                <span className="mx-0.5 sm:mx-1 text-slate-500" aria-hidden="true">/</span>
                <span>{formatTime(duration || 20)}</span>
              </div>
            </div>

            {/* Right Controls: Subtitles, Settings, Quality, Fullscreen */}
            <div className="flex items-center gap-1 sm:gap-1.5">
              {/* Subtitles Toggle */}
              {scenes.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowSubtitles(!showSubtitles)}
                  className={`px-1.5 sm:px-2 py-1 rounded-lg text-[10px] sm:text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                    showSubtitles
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white bg-white/5'
                  }`}
                  title={showSubtitles ? 'خاموش کردن زیرنویس فارسی' : 'فعال‌سازی زیرنویس فارسی'}
                  aria-label={showSubtitles ? 'خاموش کردن زیرنویس هماهنگ برای ناشنوایان' : 'فعال‌سازی زیرنویس هماهنگ برای ناشنوایان'}
                  aria-pressed={showSubtitles}
                >
                  <Subtitles className="w-3.5 h-3.5" aria-hidden="true" />
                  <span className="hidden md:inline">{showSubtitles ? 'زیرنویس: روشن' : 'زیرنویس: خاموش'}</span>
                </button>
              )}

              {/* Settings Dropdown (Speed & Quality) */}
              <div className="relative">
                <button
                  type="button"
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
                  aria-label="تنظیمات سرعت پخش و کیفیت ویدیو"
                  aria-expanded={showSettingsMenu}
                  aria-haspopup="menu"
                >
                  <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
                </button>

                {showSettingsMenu && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-full mb-2 left-0 rtl:left-0 rtl:right-auto ltr:right-0 ltr:left-auto w-44 sm:w-48 bg-slate-900/95 border border-slate-700/80 rounded-2xl p-2.5 sm:p-3 shadow-2xl text-xs space-y-2 z-50 backdrop-blur-2xl animate-fadeIn"
                    role="menu"
                    aria-label="منوی تنظیمات ویدیو"
                  >
                    <div className="font-bold text-slate-200 pb-1 border-b border-slate-800 flex items-center justify-between" role="presentation">
                      <div className="flex items-center gap-1.5">
                        <Sliders className="w-3.5 h-3.5 text-blue-400" aria-hidden="true" />
                        <span>سرعت پخش</span>
                      </div>
                      <span className="text-[10px] text-blue-400 font-mono font-bold">{playbackRate}x</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0.75, 1, 1.25, 1.5].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          role="menuitem"
                          onClick={() => changePlaybackRate(rate)}
                          className={`py-1 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                            playbackRate === rate
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                          }`}
                          aria-label={`تنظیم سرعت پخش روی ${rate} برابر`}
                          aria-checked={playbackRate === rate}
                        >
                          {rate}x
                        </button>
                      ))}
                    </div>

                    <div className="font-bold text-slate-200 pt-1 pb-1 border-b border-slate-800 flex items-center justify-between" role="presentation">
                      <div className="flex items-center gap-1.5">
                        <Scaling className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                        <span>پوشش صفحه</span>
                      </div>
                      <span className="text-[10px] text-emerald-400 font-bold">
                        {videoFit === 'cover' ? 'پوشش ۱۰۰٪' : 'تناسب ۱۶:۹'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-1">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setVideoFit('contain');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1 px-1.5 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                          videoFit === 'contain'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                        }`}
                        aria-label="انتخاب تناسب استاندارد کادر ویدیو"
                        aria-checked={videoFit === 'contain'}
                      >
                        تناسب استاندارد
                      </button>
                      <button
                        type="button"
                        role="menuitem"
                        onClick={() => {
                          setVideoFit('cover');
                          setShowSettingsMenu(false);
                        }}
                        className={`py-1 px-1.5 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                          videoFit === 'cover'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                        }`}
                        aria-label="انتخاب پوشش کامل کادر ویدیو"
                        aria-checked={videoFit === 'cover'}
                      >
                        تمام‌صفحه
                      </button>
                    </div>

                    <div className="font-bold text-slate-200 pt-1 pb-1 border-b border-slate-800 flex items-center justify-between" role="presentation">
                      <span>کیفیت پخش</span>
                      <span className="text-[10px] text-emerald-400 font-bold">{quality}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {(['1080p', '720p', '480p'] as const).map((q) => (
                        <button
                          key={q}
                          type="button"
                          role="menuitem"
                          onClick={() => {
                            setQuality(q);
                            setShowSettingsMenu(false);
                          }}
                          className={`py-1 rounded-lg text-center font-bold transition cursor-pointer text-[10px] sm:text-[11px] ${
                            quality === q
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-800/90 text-slate-300 hover:bg-slate-700'
                          }`}
                          aria-label={`تغییر کیفیت ویدیو به ${q}`}
                          aria-checked={quality === q}
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
                type="button"
                onClick={toggleFullscreen}
                className="p-1 sm:p-1.5 hover:bg-white/10 rounded-lg transition cursor-pointer text-slate-300 hover:text-white"
                title="تمام‌صفحه (F)"
                aria-label={isFullscreen ? 'خروج از تمام‌صفحه' : 'نمایش تمام‌صفحه ویدیو'}
                aria-pressed={isFullscreen}
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" /> : <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Subtitle Success Banner */}
      {aiSubtitleSuccessMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 text-xs text-emerald-900 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-bounce" />
            <span className="font-bold">{aiSubtitleSuccessMessage}</span>
          </div>
          <span className="text-[11px] font-mono bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md font-bold">
            Gemini AI Speech-to-Text
          </span>
        </div>
      )}

      {/* Official Video Publication Status & Accessibility Actions Bar */}
      <div className="bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
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

          {/* Action Buttons: Direct Share, AI Subtitle Generator, Transcript Toggle */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Direct Share Button */}
            <button
              type="button"
              onClick={handleDirectShare}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border shadow-sm ${
                copiedShareLink
                  ? 'bg-emerald-600 border-emerald-500 text-white'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title="اشتراک‌گذاری مستقیم گزارش ویدیویی یا کپی لینک"
              aria-label="اشتراک‌گذاری یا کپی پیوند گزارش ویدیویی"
            >
              {copiedShareLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" aria-hidden="true" />
                  <span>لینک ویدیوی گزارش کپی شد</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                  <span>اشتراک‌گذاری ویدیو</span>
                </>
              )}
            </button>

            {/* AI Speech-to-Text Subtitle Generator Button (Admin Only) */}
            {isAdmin && (
              <button
                type="button"
                onClick={handleGenerateAiSubtitles}
                disabled={isGeneratingSubtitles}
                className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                title="تولید خودکار و همگام‌سازی زیرنویس با هوش مصنوعی برای کاربران دارای افت شنوایی (ویژه مدیران)"
                aria-label="تولید خودکار و همگام‌سازی زیرنویس با هوش مصنوعی برای کاربران دارای افت شنوایی"
                aria-busy={isGeneratingSubtitles}
              >
                {isGeneratingSubtitles ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                    <span>در حال استخراج گفتار با AI...</span>
                  </>
                ) : (
                  <>
                    <Ear className="w-3.5 h-3.5 text-purple-200" aria-hidden="true" />
                    <Wand2 className="w-3.5 h-3.5 text-amber-300" aria-hidden="true" />
                    <span>تولید زیرنویس هوش مصنوعی</span>
                  </>
                )}
              </button>
            )}

            {/* Transcript Drawer Toggle */}
            {scenes.length > 0 && (
              <button
                type="button"
                onClick={() => setShowTranscriptDrawer(!showTranscriptDrawer)}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="نمایش فهرست کامل متن گفتار و سکانس‌های زمانی"
                aria-label="نمایش یا پنهان‌سازی فهرست کامل متن گفتار و زیرنویس‌های سکانس‌ها"
                aria-expanded={showTranscriptDrawer}
              >
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                <span>متن گفتار ({toPersianDigits(scenes.length)} فراز)</span>
                {showTranscriptDrawer ? <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />}
              </button>
            )}
          </div>
        </div>

        {/* Broadcast Quality Badges */}
        <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-lg font-medium flex items-center gap-1">
              <Radio className="w-3 h-3 text-sky-500" aria-hidden="true" />
              <span>پخش پایدار 1080p Full HD</span>
            </span>
            <span className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-0.5 rounded-lg font-medium flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Ear className="w-3 h-3" aria-hidden="true" />
              <span>سازگار با استانداردهای دسترس‌پذیری ناشنوایان</span>
            </span>
          </div>

          <div className="flex items-center gap-1 font-mono text-[10px] text-slate-400">
            <span>کد شناسایی:</span>
            <span>{report.id}</span>
          </div>
        </div>
      </div>

      {/* Interactive Speech & Subtitles Transcript Drawer */}
      {showTranscriptDrawer && scenes.length > 0 && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-lg space-y-3 animate-in fade-in" role="region" aria-label="بخش متن کامل گفتار و زیرنویس‌ها">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/80 text-purple-600 flex items-center justify-center" aria-hidden="true">
                <Ear className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                  متن کامل گفتار و زیرنویس‌های همگام (دسترس‌پذیری ویژه ناشنوایان)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  برای پرش مستقیم به هر لحظه از ویدیو، روی زمان‌بندی مربوطه کلیک کنید.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const vtt = report.vttContent || generateWebVttFromScenes(scenes, report.title);
                  downloadVttFile(`subtitles-${report.reportNum || report.id}`, vtt);
                }}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-blue-200 dark:border-blue-800"
                title="دانلود فایل زیرنویس استاندارد VTT برای استفاده در سایر پلیرها"
                aria-label="دانلود فایل زیرنویس استاندارد VTT"
              >
                <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
                <span>دانلود VTT</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const fullText = scenes.map((s) => `[${s.time || formatTime(s.seconds)}] ${s.speaker ? s.speaker + ': ' : ''}${s.text}`).join('\n\n');
                  navigator.clipboard.writeText(fullText);
                  setCopiedShareLink(true);
                  setTimeout(() => setCopiedShareLink(false), 2500);
                }}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                title="کپی متن کامل گفتار در کلیپ‌بورد"
                aria-label="کپی متن کامل گفتار و گفتگوها در کلیپ‌بورد"
              >
                <Copy className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                <span>کپی متن</span>
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1" role="feed" aria-label="فهرست فرازهای گفتار ویدیو">
            {scenes.map((scene, idx) => {
              const isCurrent = currentTime >= scene.seconds && (!scene.endSeconds || currentTime <= scene.endSeconds);
              return (
                <div
                  key={idx}
                  onClick={() => seek(scene.seconds)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                    isCurrent
                      ? 'bg-blue-50/90 dark:bg-blue-950/50 border-blue-300 dark:border-blue-700 ring-2 ring-blue-500/20'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:bg-slate-100/80 dark:hover:bg-slate-800'
                  }`}
                >
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      seek(scene.seconds);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold shrink-0 transition flex items-center gap-1 ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600'
                    }`}
                    aria-label={`پرش به زمان ${scene.time || formatTime(scene.seconds)}${scene.speaker ? ` - گفتگوی ${scene.speaker}` : ''}`}
                  >
                    <Play className="w-2.5 h-2.5 fill-current" aria-hidden="true" />
                    <span>{scene.time || formatTime(scene.seconds)}</span>
                  </button>

                  <div className="space-y-1 min-w-0 flex-1">
                    {scene.speaker && (
                      <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 px-2 py-0.5 rounded-md inline-block">
                        {scene.speaker} {scene.role ? `(${scene.role})` : ''}
                      </span>
                    )}
                    <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                      {scene.text}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
