import React, { useState, useEffect, useCallback } from 'react';
import {
  Film,
  Database,
  Globe,
  Lock,
  Eye,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ExternalLink,
  Play,
  HardDrive,
  Sliders,
  Code,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  Trash2
} from 'lucide-react';
import {
  fetchOptimizedVideos,
  updateVideoVisibility,
  syncAllVideosToMySQL,
  deleteVideoFromMySQL,
  MySQLVideoItem,
  MySQLVideoStats,
  MySQLVideoPagination
} from '../../utils/mysqlVideoService';
import { toPersianDigits } from '../../utils/persianDate';
import { formatBytes } from '../../utils/imageOptimizer';
import { useNotification } from '../../context/NotificationContext';
import { ModernResponsiveVideoPlayer } from '../ModernResponsiveVideoPlayer';

interface MySQLVideoManagerProps {
  id?: string;
  onNavigateToReport?: (reportId: string, teamSlug?: string) => void;
}

export const MySQLVideoManager: React.FC<MySQLVideoManagerProps> = ({
  id = 'mysql-video-manager',
  onNavigateToReport
}) => {
  const { success, error } = useNotification();

  // State
  const [videos, setVideos] = useState<MySQLVideoItem[]>([]);
  const [stats, setStats] = useState<MySQLVideoStats>({
    total: 0,
    publicCount: 0,
    privateCount: 0,
    totalSizeBytes: 0
  });
  const [pagination, setPagination] = useState<MySQLVideoPagination>({
    page: 1,
    limit: 15,
    total: 0,
    totalPages: 1
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [showQueryModal, setShowQueryModal] = useState<boolean>(false);
  const [previewVideo, setPreviewVideo] = useState<MySQLVideoItem | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Load videos
  const loadVideos = useCallback(async (pageToLoad = 1) => {
    setIsLoading(true);
    try {
      const publicOnly = visibilityFilter === 'public' ? true : undefined;
      const res = await fetchOptimizedVideos({
        page: pageToLoad,
        limit: pagination.limit,
        teamSlug: selectedTeam !== 'all' ? selectedTeam : undefined,
        search: searchQuery.trim() || undefined,
        publicOnly
      });

      if (res.success || res.videos) {
        let filteredVideos = res.videos;
        if (visibilityFilter === 'private') {
          filteredVideos = filteredVideos.filter(v => !v.is_public);
        }
        setVideos(filteredVideos);
        setStats(res.stats || { total: 0, publicCount: 0, privateCount: 0, totalSizeBytes: 0 });
        setPagination(res.pagination || { page: pageToLoad, limit: 15, total: 0, totalPages: 1 });
      }
    } catch (err) {
      console.error('Failed to load MySQL videos:', err);
      error('خطا در بارگذاری اطلاعات ویدیوها از MySQL');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.limit, selectedTeam, searchQuery, visibilityFilter, error]);

  useEffect(() => {
    loadVideos(1);
  }, [loadVideos]);

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!window.confirm(`آیا از حذف دائمی ویدیوی «${videoTitle}» از پایگاه داده و فضای ذخیره‌سازی سرور اطمینان دارید؟`)) {
      return;
    }
    try {
      setUpdatingId(videoId);
      
      const res = await deleteVideoFromMySQL(videoId);
      if (!res.success) {
        throw new Error(res.message || 'حذف ویدیو از دیتابیس با خطا مواجه شد');
      }

      success(`ویدیو «${videoTitle}» با موفقیت و به صورت دائمی از دیسک و دیتابیس حذف گردید.`);
      loadVideos(pagination.page);
    } catch (err: any) {
      error('خطا در حذف ویدیو: ' + (err?.message || ''));
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle Visibility Toggle
  const handleToggleVisibility = async (video: MySQLVideoItem) => {
    const currentStatus = Boolean(video.is_public);
    const newStatus = !currentStatus;
    setUpdatingId(video.id);

    try {
      const res = await updateVideoVisibility(video.id, newStatus);
      if (res.success) {
        // Optimistic UI update
        setVideos(prev =>
          prev.map(v => (v.id === video.id ? { ...v, is_public: newStatus ? 1 : 0 } : v))
        );
        setStats(prev => ({
          ...prev,
          publicCount: newStatus ? prev.publicCount + 1 : Math.max(0, prev.publicCount - 1),
          privateCount: newStatus ? Math.max(0, prev.privateCount - 1) : prev.privateCount + 1
        }));
        success(
          `وضعیت ویدیو «${video.title}» به ${newStatus ? 'عمومی (Public)' : 'خصوصی (Private)'} تغییر یافت.`
        );
      } else {
        error(res.message || 'خطا در تغییر وضعیت ویدیو');
      }
    } catch (err: any) {
      error(err?.message || 'خطا در ارتباط با سرور');
    } finally {
      setUpdatingId(null);
    }
  };

  // Sync all media to MySQL
  const handleSyncAll = async () => {
    setIsSyncing(true);
    try {
      const res = await syncAllVideosToMySQL();
      if (res.success) {
        success('تمام رسانه‌ها و ویدیوهای محلی با جدول MySQL mahash_videos همگام شدند.');
        await loadVideos(1);
      } else {
        error(res.message || 'خطا در همگام‌سازی ویدیوها');
      }
    } catch {
      error('خطا در فراخوانی سرویس همگام‌سازی');
    } finally {
      setIsSyncing(false);
    }
  };

  // Copy link
  const handleCopyLink = (url: string) => {
    const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedUrl(url);
    success('لینک مستقیم ویدیو کپی شد');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  return (
    <div id={id} className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white border border-indigo-900/50 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-bold">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>پایگاه داده MySQL • جدول اختصاصی mahash_videos</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black flex items-center gap-2">
              <Film className="w-6 h-6 text-indigo-400" />
              <span>داشبورد مدیریت محتوای چندرسانه‌ای و دسترسی ویدیوها</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              مدیریت سطح دسترسی عمومی (Public) یا خصوصی (Private) ویدیوهای بارگذاری‌شده همراه با
              کوئری‌های فوق‌سریع ایندکس‌شده برای حفظ نهایت سرعت در لود صفحات پربازدید.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowQueryModal(true)}
              aria-label="مشاهده کوئری بهینه MySQL"
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-2 border border-slate-700 cursor-pointer shadow-sm"
              title="مشاهده کوئری بهینه MySQL"
            >
              <Code className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>کوئری بهینه MySQL</span>
            </button>

            <button
              onClick={handleSyncAll}
              disabled={isSyncing}
              aria-label="همگام‌سازی مجدد ویدیوهای دیتابیس"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>همگام‌سازی مجدد دیتابیس</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Videos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">کل ویدیوهای ثبت‌شده</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
              <Film className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {toPersianDigits(stats.total)}
            <span className="text-xs font-normal text-slate-400 mr-1.5">ویدیو</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Database className="w-3 h-3 text-cyan-500" />
            <span>ثبت پایدار در جدول MySQL</span>
          </div>
        </div>

        {/* Public Videos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">نمایش عمومی (Public)</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {toPersianDigits(stats.publicCount)}
            <span className="text-xs font-normal text-slate-400 mr-1.5">ویدیو</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            <span>قابل مشاهده در صفحات و گزارشات عمومی</span>
          </div>
        </div>

        {/* Private Videos */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">محدود / خصوصی (Private)</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {toPersianDigits(stats.privateCount)}
            <span className="text-xs font-normal text-slate-400 mr-1.5">ویدیو</span>
          </div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-semibold">
            <ShieldCheck className="w-3 h-3" />
            <span>مخفی از دید عموم و مختص مدیریت</span>
          </div>
        </div>

        {/* Storage Size */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">حجم کل ذخیره‌سازی</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatBytes(stats.totalSizeBytes)}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span>استریم بهینه با پشتیبانی از Byte-Range</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، نام فایل یا گزارش..."
            className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Team Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedTeam}
            onChange={e => setSelectedTeam(e.target.value)}
            className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">همه تیم‌ها</option>
            <option value="team-thinker">تیم مغز متفکر</option>
            <option value="team-angels">تیم فرشتگان ناشنوایان</option>
            <option value="team-tomorrow">تیم باشگاه فردا</option>
            <option value="team-ghorbani">تیم قربونی</option>
            <option value="team-silence">تیم آوای سکوت</option>
            <option value="general">ویدیوهای عمومی</option>
          </select>

          {/* Visibility Filter Tabs */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl" role="tablist" aria-label="فیلتر وضعیت انتشار ویدیوها">
            <button
              role="tab"
              aria-selected={visibilityFilter === 'all'}
              aria-label={`نمایش همه ویدیوها (${toPersianDigits(stats.total)} مورد)`}
              onClick={() => setVisibilityFilter('all')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                visibilityFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              همه ({toPersianDigits(stats.total)})
            </button>
            <button
              role="tab"
              aria-selected={visibilityFilter === 'public'}
              aria-label={`نمایش ویدیوهای عمومی (${toPersianDigits(stats.publicCount)} مورد)`}
              onClick={() => setVisibilityFilter('public')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                visibilityFilter === 'public'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              عمومی ({toPersianDigits(stats.publicCount)})
            </button>
            <button
              role="tab"
              aria-selected={visibilityFilter === 'private'}
              aria-label={`نمایش ویدیوهای خصوصی (${toPersianDigits(stats.privateCount)} مورد)`}
              onClick={() => setVisibilityFilter('private')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                visibilityFilter === 'private'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              خصوصی ({toPersianDigits(stats.privateCount)})
            </button>
          </div>
        </div>
      </div>

      {/* Videos Table / Card Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" aria-hidden="true" />
            <span className="text-xs font-bold">در حال استعلام کوئری بهینه از MySQL...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <Film className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" aria-hidden="true" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              هیچ ویدیویی با معیارهای انتخابی یافت نشد.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTeam('all');
                setVisibilityFilter('all');
              }}
              aria-label="پاک کردن فیلترهای جستجو و نمایش همه ویدیوها"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              پاک کردن فیلترها
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <th className="p-4">ویدیو و عنوان</th>
                  <th className="p-4">تیم / گزارش</th>
                  <th className="p-4">مشخصات و فرمت</th>
                  <th className="p-4">وضعیت انتشار (MySQL)</th>
                  <th className="p-4">بازدید</th>
                  <th className="p-4 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {videos.map(video => {
                  const isPublic = Boolean(video.is_public);
                  const isUpdating = updatingId === video.id;

                  return (
                    <tr
                      key={video.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition"
                    >
                      {/* Video Title & Thumbnail */}
                      <td className="p-4">
                        <div className="flex items-center gap-3 min-w-[240px]">
                          <div
                            onClick={() => setPreviewVideo(video)}
                            className="relative w-16 h-10 rounded-lg bg-slate-800 overflow-hidden shrink-0 cursor-pointer group border border-slate-700"
                            title="کلیک برای پیش‌نمایش ویدیو"
                          >
                            {video.thumbnail_url ? (
                              <img
                                src={video.thumbnail_url}
                                alt={video.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-500">
                                <Film className="w-5 h-5" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                              <Play className="w-4 h-4 text-white fill-white" />
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span
                              onClick={() => setPreviewVideo(video)}
                              className="font-bold text-slate-900 dark:text-white line-clamp-1 cursor-pointer hover:text-indigo-600 transition"
                            >
                              {video.title}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block">
                              {video.file_name || video.video_url}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Team & Linked Report */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {video.team_slug === 'team-thinker'
                            ? 'مغز متفکر'
                            : video.team_slug === 'team-angels'
                            ? 'فرشتگان ناشنوایان'
                            : video.team_slug === 'team-tomorrow'
                            ? 'باشگاه فردا'
                            : video.team_slug === 'team-ghorbani'
                            ? 'قربونی'
                            : video.team_slug === 'team-silence'
                            ? 'آوای سکوت'
                            : 'عمومی'}
                        </span>
                      </td>

                      {/* Specs */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="space-y-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{formatBytes(video.file_size_bytes)}</span>
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 uppercase font-mono font-bold">
                              {video.mime_type?.replace('video/', '') || 'mp4'}
                            </span>
                          </div>
                          {video.duration_seconds > 0 && (
                            <div className="text-[10px] text-slate-400">
                              مدت: {toPersianDigits(video.duration_seconds)} ثانیه
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Visibility Switch (Public vs Private) */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            role="switch"
                            aria-checked={isPublic}
                            aria-label={isPublic ? `تغییر وضعیت ویدیو ${video.title} به خصوصی` : `تغییر وضعیت ویدیو ${video.title} به عمومی`}
                            onClick={() => handleToggleVisibility(video)}
                            disabled={isUpdating}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isPublic ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                            } ${isUpdating ? 'opacity-50 cursor-wait' : ''}`}
                            title={isPublic ? 'کلیک جهت تبدیل به خصوصی' : 'کلیک جهت انتشار عمومی'}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                                isPublic ? '-translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          <span
                            className={`text-[11px] font-bold ${
                              isPublic ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'
                            }`}
                          >
                            {isUpdating
                              ? 'در حال تغییر...'
                              : isPublic
                              ? 'عمومی (Public)'
                              : 'خصوصی (Private)'}
                          </span>
                        </div>
                      </td>

                      {/* Views */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 dark:text-slate-300">
                          <Eye className="w-3.5 h-3.5 text-sky-500" aria-hidden="true" />
                          <span>{toPersianDigits(video.views_count || 0)}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="p-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Preview Player */}
                          <button
                            onClick={() => setPreviewVideo(video)}
                            aria-label={`پخش ویدیوی ${video.title} در پلیر مدرن`}
                            className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 dark:text-indigo-300 transition cursor-pointer"
                            title="پخش در پلیر مدرن"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                          </button>

                          {/* Copy URL */}
                          <button
                            onClick={() => handleCopyLink(video.video_url)}
                            aria-label={`کپی لینک مستقیم ویدیو ${video.title}`}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition cursor-pointer"
                            title="کپی لینک مستقیم ویدیو"
                          >
                            {copiedUrl === video.video_url ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            )}
                          </button>

                          {/* Jump to report if linked */}
                          {video.report_id && onNavigateToReport && (
                            <button
                              onClick={() => onNavigateToReport(video.report_id!, video.team_slug)}
                              aria-label={`مشاهده صفحه گزارش عمومی مربوط به ${video.title}`}
                              className="p-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-600 dark:bg-sky-950/50 dark:hover:bg-sky-900/50 dark:text-sky-300 transition cursor-pointer"
                              title="مشاهده صفحه گزارش عمومی"
                            >
                              <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          )}
                          
                          {/* Delete Video */}
                          <button
                            onClick={() => handleDeleteVideo(video.id, video.title)}
                            disabled={isUpdating}
                            aria-label={`حذف ویدیو ${video.title}`}
                            className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:hover:bg-rose-900/50 dark:text-rose-300 transition cursor-pointer disabled:opacity-50"
                            title="حذف کامل ویدیو از سرور و پایگاه داده"
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              صفحه {toPersianDigits(pagination.page)} از {toPersianDigits(pagination.totalPages)} (مجموع{' '}
              {toPersianDigits(pagination.total)} ویدیو)
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadVideos(pagination.page - 1)}
                disabled={pagination.page <= 1}
                aria-label="صفحه قبلی ویدیوها"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" aria-hidden="true" />
              </button>
              <button
                onClick={() => loadVideos(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                aria-label="صفحه بعدی ویدیوها"
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* SQL Query Modal */}
      {showQueryModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sql-query-modal-title"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl text-slate-200 text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-400" aria-hidden="true" />
                <h3 id="sql-query-modal-title" className="text-base font-bold text-white">
                  کوئری بهینه فراخوانی داده‌های سنگین ویدیوئی در MySQL
                </h3>
              </div>
              <button
                onClick={() => setShowQueryModal(false)}
                aria-label="بستن پنجره کوئری بهینه"
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                برای جلوگیری از کندی و قفل شدن سرور در صفحات عمومی حاوی تعداد زیادی ویدیو، این ساختار
                ایندکس‌شده و پروجکشن سبک استفاده می‌شود:
              </p>

              {/* Code Snippet */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-left text-emerald-300 text-[11px] overflow-x-auto select-all">
                {`-- 1. جدول با ایندکس‌های ترکیبی پوشش‌دهنده
CREATE TABLE mahash_videos (
  id VARCHAR(128) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  team_slug VARCHAR(64) NOT NULL DEFAULT 'general',
  report_id VARCHAR(128) DEFAULT NULL,
  video_url VARCHAR(512) NOT NULL,
  thumbnail_url VARCHAR(512) DEFAULT NULL,
  file_name VARCHAR(255) DEFAULT '',
  file_size_bytes BIGINT DEFAULT 0,
  mime_type VARCHAR(64) DEFAULT 'video/mp4',
  duration_seconds INT DEFAULT 0,
  is_public TINYINT(1) NOT NULL DEFAULT 1,
  views_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_video_public (is_public),
  INDEX idx_video_team (team_slug),
  INDEX idx_video_created (created_at)
) ENGINE=InnoDB;

-- 2. کوئری واکشی سریع، سبک و صفحه‌بندی‌شده برای صفحات عمومی
SELECT 
  id, title, team_slug, report_id, video_url, thumbnail_url,
  file_name, file_size_bytes, mime_type, duration_seconds,
  is_public, views_count, created_at
FROM mahash_videos
WHERE is_public = 1 AND (team_slug = ? OR ? = 'all')
ORDER BY created_at DESC
LIMIT ? OFFSET ?;`}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>پروجکشن گزینشی (حذف BLOB و متن‌های طویل)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>ایندکس ترکیبی روی `is_public` و `team_slug`</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>صفحه‌بندی با LIMIT و OFFSET جهت کاهش رم</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" aria-hidden="true" />
                  <span>پاسخ‌دهی با هدر Cache-Control عمومی</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowQueryModal(false)}
                aria-label="بستن پنجره"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideo && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="video-preview-modal-title"
        >
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Film className="w-5 h-5 text-indigo-400" aria-hidden="true" />
                <h3 id="video-preview-modal-title" className="text-base font-bold text-white truncate max-w-md">
                  پیش‌نمایش: {previewVideo.title}
                </h3>
              </div>
              <button
                onClick={() => setPreviewVideo(null)}
                aria-label="بستن پیش‌نمایش ویدیو"
                className="text-slate-400 hover:text-white p-1.5 bg-slate-800 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Video Player */}
            <div className="rounded-2xl overflow-hidden shadow-xl bg-black">
              <ModernResponsiveVideoPlayer
                src={previewVideo.video_url}
                title={previewVideo.title}
                poster={previewVideo.thumbnail_url || undefined}
                autoPlay={true}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-2">
              <span>فرمت: {previewVideo.mime_type} • حجم: {formatBytes(previewVideo.file_size_bytes)}</span>
              <span
                className={`font-bold px-2.5 py-0.5 rounded-full ${
                  previewVideo.is_public
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-amber-950 text-amber-400 border border-amber-800'
                }`}
              >
                {previewVideo.is_public ? 'عمومی (Public)' : 'خصوصی (Private)'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
