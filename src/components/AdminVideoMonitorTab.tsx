import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  RefreshCw, 
  Trash2, 
  Smartphone, 
  Monitor, 
  Wifi, 
  Clock, 
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  Film
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

interface VideoErrorLog {
  id?: string;
  reportId?: string;
  teamSlug?: string;
  videoSrc?: string;
  type?: 'error' | 'stalled';
  code?: number;
  message?: string;
  mediaError?: string;
  networkState?: number;
  readyState?: number;
  userAgent?: string;
  isMobile?: boolean;
  screenWidth?: number;
  screenHeight?: number;
  timestamp?: number;
  receivedAt?: string;
}

interface AdminVideoMonitorTabProps {
  onNavigateToReport?: (reportId: string, teamSlug?: string) => void;
}

export const AdminVideoMonitorTab: React.FC<AdminVideoMonitorTabProps> = ({ onNavigateToReport }) => {
  const [logs, setLogs] = useState<VideoErrorLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'error' | 'stalled'>('all');
  const [filterDevice, setFilterDevice] = useState<'all' | 'mobile' | 'desktop'>('all');

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/video-monitor');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.logs)) {
          setLogs(data.logs);
        }
      }
    } catch (err) {
      console.warn('Could not fetch video monitor logs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearLogs = async () => {
    if (!window.confirm('آیا از پاک‌سازی تمام گزارش‌های خطای ویدیو اطمینان دارید؟')) return;
    setIsLoading(true);
    try {
      const res = await fetch('/api/video-monitor', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
      }
    } catch (err) {
      console.warn('Could not clear video monitor logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();

    const handleLocalLog = (e: any) => {
      const newLog = e.detail;
      if (newLog) {
        setLogs(prev => [newLog, ...prev.slice(0, 99)]);
      }
    };

    window.addEventListener('mahash_video_error_logged', handleLocalLog);
    return () => {
      window.removeEventListener('mahash_video_error_logged', handleLocalLog);
    };
  }, [fetchLogs]);

  const filteredLogs = logs.filter(log => {
    if (filterType !== 'all' && log.type !== filterType) return false;
    if (filterDevice === 'mobile' && !log.isMobile) return false;
    if (filterDevice === 'desktop' && log.isMobile) return false;
    return true;
  });

  const totalErrors = logs.filter(l => l.type === 'error').length;
  const totalStalls = logs.filter(l => l.type === 'stalled').length;
  const mobileCount = logs.filter(l => l.isMobile).length;
  const desktopCount = logs.length - mobileCount;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            <span>مانیتورینگ سلامت و خطاهای پخش ویدیو (Real-time Video Monitor)</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            ردیابی خطاهای MediaError و رویدادهای Stalled تگ‌های ویدیو در گوشی‌ها و مرورگرهای کاربران
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={isLoading}
            className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>بروزرسانی</span>
          </button>
          {logs.length > 0 && (
            <button
              onClick={clearLogs}
              disabled={isLoading}
              className="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-200 dark:border-rose-900/50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>پاک‌سازی لاگ‌ها</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span>کل رویدادهای ثبت‌شده</span>
            <Film className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1">
            {toPersianDigits(logs.length)}
          </div>
          <span className="text-[10px] text-slate-400">لاگ در حافظه سرور</span>
        </div>

        <div className="bg-rose-50 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200 dark:border-rose-900/40">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400">
            <span>خطای قطعی پخش (Error)</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-700 dark:text-rose-400 font-mono mt-1">
            {toPersianDigits(totalErrors)}
          </div>
          <span className="text-[10px] text-rose-500/80">MediaError یا کدک نامعتبر</span>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/40">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400">
            <span>توقف بافرینگ (Stalled)</span>
            <Wifi className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700 dark:text-amber-400 font-mono mt-1">
            {toPersianDigits(totalStalls)}
          </div>
          <span className="text-[10px] text-amber-500/80">کندی اینترنت یا تایم‌اوت شبکه</span>
        </div>

        <div className="bg-indigo-50 dark:bg-indigo-950/30 p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/40">
          <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400">
            <span>تفکیک دستگاه‌ها</span>
            <Smartphone className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-sm font-bold text-indigo-700 dark:text-indigo-300 mt-1 flex items-center gap-2">
            <span>موبایل: {toPersianDigits(mobileCount)}</span>
            <span>•</span>
            <span>دسکتاپ: {toPersianDigits(desktopCount)}</span>
          </div>
          <span className="text-[10px] text-indigo-500/80">بر اساس مشخصات مرورگر</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            همه نوع ({toPersianDigits(logs.length)})
          </button>
          <button
            onClick={() => setFilterType('error')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterType === 'error'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            خطاها ({toPersianDigits(totalErrors)})
          </button>
          <button
            onClick={() => setFilterType('stalled')}
            className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterType === 'stalled'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800'
            }`}
          >
            توقف‌ها ({toPersianDigits(totalStalls)})
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl text-xs">
          <button
            onClick={() => setFilterDevice('all')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
              filterDevice === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            همه دستگاه‌ها
          </button>
          <button
            onClick={() => setFilterDevice('mobile')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
              filterDevice === 'mobile'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Smartphone className="w-3 h-3" />
            <span>موبایل</span>
          </button>
          <button
            onClick={() => setFilterDevice('desktop')}
            className={`px-2.5 py-1.5 rounded-lg font-bold transition flex items-center gap-1 cursor-pointer ${
              filterDevice === 'desktop'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            <Monitor className="w-3 h-3" />
            <span>دسکتاپ</span>
          </button>
        </div>
      </div>

      {/* Logs Table / List */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            هیچ خطای پخشی در این بخش ثبت نشده است.
          </p>
          <p className="text-xs text-slate-400 mt-1">
            تمام ویدیوهای سامانه در دستگاه‌های کاربران با موفقیت و بدون وقفه پخش شده‌اند.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log, idx) => (
            <div
              key={log.id || idx}
              className={`p-4 rounded-2xl border transition ${
                log.type === 'error'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
                  : 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-black/5 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      log.type === 'error'
                        ? 'bg-rose-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}
                  >
                    {log.type === 'error' ? 'خطای پخش ویدیو (Error)' : 'توقف بافرینگ (Stalled)'}
                  </span>

                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 font-mono">
                    {log.reportId || 'بدون شناسه'}
                  </span>

                  {log.teamSlug && (
                    <span className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                      {log.teamSlug}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1 font-mono text-[11px]">
                    <Clock className="w-3 h-3" />
                    {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('fa-IR') : (log.receivedAt ? new Date(log.receivedAt).toLocaleTimeString('fa-IR') : 'نامشخص')}
                  </span>

                  <span className="flex items-center gap-1 text-[11px]">
                    {log.isMobile ? <Smartphone className="w-3 h-3 text-indigo-500" /> : <Monitor className="w-3 h-3 text-slate-400" />}
                    <span>{log.isMobile ? 'موبایل' : 'دسکتاپ'}</span>
                    {log.screenWidth && log.screenHeight && (
                      <span className="font-mono text-[10px]">({log.screenWidth}×{log.screenHeight})</span>
                    )}
                  </span>
                </div>
              </div>

              <div className="pt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-700 dark:text-slate-300 font-medium">
                    {log.message || log.mediaError || (log.type === 'stalled' ? 'پخش ویدیو به دلیل عدم دریافت داده‌های شبکه متوقف شد.' : 'خطای پخش نامشخص')}
                  </p>
                  {log.videoSrc && (
                    <p className="text-[11px] text-slate-400 font-mono truncate max-w-xl" title={log.videoSrc}>
                      منبع فایل: {log.videoSrc}
                    </p>
                  )}
                </div>

                {log.reportId && onNavigateToReport && (
                  <button
                    onClick={() => onNavigateToReport(log.reportId!, log.teamSlug)}
                    className="self-end sm:self-auto px-3 py-1 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold transition flex items-center gap-1 border border-slate-200 dark:border-slate-700 cursor-pointer"
                  >
                    <span>بررسی گزارش</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
