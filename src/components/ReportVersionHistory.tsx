import React, { useState, useEffect } from 'react';
import {
  History,
  Clock,
  RotateCcw,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  FileText,
  Film,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Database,
  RefreshCw,
  Sparkles,
  X
} from 'lucide-react';
import { ActivityReport } from '../types';
import { formatSmartUpdateDate, toPersianDigits } from '../utils/persianDate';
import { useNotification } from '../context/NotificationContext';
import { FormattedText } from './FormattedText';

export interface ReportVersion {
  id: string;
  report_id: string;
  team_slug: string;
  version_number: number;
  title: string;
  summary: string;
  content: string;
  video_url: string;
  thumbnail_url: string;
  attachments: string;
  report_date: string;
  raw_data: string;
  change_summary: string;
  created_by: string;
  created_at: string;
}

interface ReportVersionHistoryProps {
  report: ActivityReport;
  teamName: string;
  isAdmin?: boolean;
  onVersionRestored?: (restoredReport: any) => void;
  onClose?: () => void;
}

export const ReportVersionHistory: React.FC<ReportVersionHistoryProps> = ({
  report,
  teamName,
  isAdmin = false,
  onVersionRestored,
  onClose
}) => {
  const { success: showSuccess, error: showError } = useNotification();
  const [versions, setVersions] = useState<ReportVersion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState<boolean>(true);
  const [restoring, setRestoring] = useState<boolean>(false);
  const [activeDiffField, setActiveDiffField] = useState<'all' | 'summary' | 'content' | 'video'>('all');

  const fetchVersions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mysql/reports/${report.id}/versions`);
      const data = await res.json();
      if (data && Array.isArray(data.versions)) {
        setVersions(data.versions);
        if (data.versions.length > 0 && !selectedVersionId) {
          // Default to the previous version or first available
          setSelectedVersionId(data.versions[0].id);
        }
      }
    } catch (err) {
      console.warn('Failed to load versions from MySQL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, [report.id]);

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) || versions[0] || null;

  const handleRestoreVersion = async (version: ReportVersion) => {
    if (!confirm(`آیا از بازگردانی اطلاعات گزارش به نسخه ${version.version_number} اطمینان دارید؟ نسخه جدیدی برای ثبت این بازگشت در MySQL ایجاد خواهد شد.`)) {
      return;
    }

    setRestoring(true);
    try {
      const res = await fetch(`/api/mysql/reports/${report.id}/restore-version`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId: version.id,
          versionNumber: version.version_number
        })
      });

      const data = await res.json();
      if (data.success) {
        showSuccess(
          'بازیابی موفق نسخه',
          `گزارش با موفقیت به نسخه شماره ${version.version_number} در پایگاه داده MySQL بازگردانی شد.`
        );
        if (data.versions) {
          setVersions(data.versions);
        }
        if (onVersionRestored && data.restoredReport) {
          onVersionRestored(data.restoredReport);
        }
      } else {
        throw new Error(data.error || 'خطا در بازگردانی نسخه');
      }
    } catch (err: any) {
      showError('خطا در بازگردانی نسخه', err?.message || 'عملیات با خطا مواجه شد.');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 border border-indigo-100 dark:border-indigo-950/60 rounded-3xl p-5 sm:p-7 shadow-lg space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 dark:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-200 dark:shadow-none">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                تاریخچه و نسخه‌های گزارش در دیتابیس MySQL
              </h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                {toPersianDigits(versions.length)} نسخه ثبت‌شده
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              بررسی تغییرات دائمی، مقایسه متن و ویدیو و امکان بازیابی آنی به نسخه‌های قبلی
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCompareMode(!compareMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              compareMode
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>{compareMode ? 'حالت مقایسه فعال' : 'نمایش تکی'}</span>
          </button>

          <button
            onClick={fetchVersions}
            disabled={loading}
            className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition cursor-pointer"
            title="بروزرسانی نسخه‌ها از MySQL"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-slate-100 hover:bg-rose-100 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950/60 dark:hover:text-rose-400 text-slate-400 rounded-xl transition cursor-pointer"
              title="بستن تاریخچه"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
          <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
          <span className="text-xs font-bold">در حال واکشی تاریخچه نسخه‌ها از جدول mahash_report_versions در MySQL...</span>
        </div>
      ) : versions.length === 0 ? (
        <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
          <Database className="w-8 h-8 mx-auto text-slate-400 mb-2" />
          <p className="text-xs text-slate-500 font-medium">
            هنوز نسخه‌ای در جدول تاریخچه MySQL برای این گزارش ثبت نشده است. با اولین ویرایش نسخه جدید ذخیره می‌گردد.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Version Selector Timeline */}
          <div className="lg:col-span-4 space-y-3">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>فهرست نسخه‌های ذخیره‌شده:</span>
              <span className="font-mono text-[10px] text-slate-400">MySQL InnoDB</span>
            </h4>

            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {versions.map((ver, idx) => {
                const isSelected = selectedVersion?.id === ver.id;
                const isLatest = idx === 0;

                return (
                  <div
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-right space-y-2 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                          isLatest
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}>
                          نسخه {toPersianDigits(ver.version_number)}
                        </span>
                        {isLatest && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            (آخرین نسخه)
                          </span>
                        )}
                      </div>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{ver.created_at ? new Date(ver.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {ver.title || 'بدون عنوان'}
                    </p>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span className="truncate max-w-[170px]">
                        {ver.change_summary || 'ویرایش محتوا'}
                      </span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {ver.created_at ? new Date(ver.created_at).toLocaleDateString('fa-IR') : ''}
                      </span>
                    </div>

                    {ver.video_url && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 dark:text-blue-400">
                        <Film className="w-3 h-3" />
                        <span>دارای ویدیوی پیوست</span>
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Comparison & Details */}
          <div className="lg:col-span-8 space-y-4">
            {selectedVersion && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-5">
                {/* Selected Version Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-white">
                        جزئیات نسخه شماره {toPersianDigits(selectedVersion.version_number)}
                      </h4>
                      <span className="text-xs text-slate-400 font-mono">
                        ID: {selectedVersion.id}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      توضیح ثبت: <span className="text-slate-700 dark:text-slate-300 font-medium">{selectedVersion.change_summary}</span>
                    </p>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleRestoreVersion(selectedVersion)}
                      disabled={restoring}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer"
                    >
                      <RotateCcw className={`w-3.5 h-3.5 ${restoring ? 'animate-spin' : ''}`} />
                      <span>{restoring ? 'در حال بازیابی...' : 'بازیابی به این نسخه'}</span>
                    </button>
                  )}
                </div>

                {/* Diff / Details View */}
                {compareMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Current Version Box */}
                      <div className="p-4 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>نسخه فعلی (زنده در سامانه)</span>
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block mb-1">عنوان فعلی:</span>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {report.title}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block mb-1">خلاصه فعلی:</span>
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                            {report.summary}
                          </p>
                        </div>

                        {report.videoSrc && (
                          <div className="pt-2 border-t border-emerald-100 dark:border-emerald-900/40">
                            <span className="text-[11px] text-slate-400 font-bold block mb-1">ویدیوی پیوست:</span>
                            <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate block">
                              {report.videoSrc}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Selected Past Version Box */}
                      <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5" />
                            <span>نسخه انتخابی ({toPersianDigits(selectedVersion.version_number)})</span>
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {selectedVersion.created_at ? new Date(selectedVersion.created_at).toLocaleDateString('fa-IR') : ''}
                          </span>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block mb-1">عنوان در این نسخه:</span>
                          <p className={`text-xs font-bold ${
                            selectedVersion.title !== report.title
                              ? 'text-indigo-900 dark:text-indigo-200 bg-indigo-100/70 dark:bg-indigo-900/50 px-2 py-1 rounded-lg'
                              : 'text-slate-800 dark:text-slate-100'
                          }`}>
                            {selectedVersion.title}
                          </p>
                        </div>

                        <div>
                          <span className="text-[11px] text-slate-400 font-bold block mb-1">خلاصه در این نسخه:</span>
                          <p className={`text-xs leading-relaxed ${
                            selectedVersion.summary !== report.summary
                              ? 'text-indigo-950 dark:text-indigo-200 bg-indigo-100/70 dark:bg-indigo-900/50 p-2 rounded-lg'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            {selectedVersion.summary}
                          </p>
                        </div>

                        {selectedVersion.video_url && (
                          <div className="pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                            <span className="text-[11px] text-slate-400 font-bold block mb-1">ویدیوی پیوست این نسخه:</span>
                            <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 truncate block">
                              {selectedVersion.video_url}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Single Detail View */
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-400">متن و محتوای نسخه:</span>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <FormattedText text={selectedVersion.content || selectedVersion.summary} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium" />
                      </div>
                    </div>

                    {selectedVersion.video_url && (
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900 text-xs flex items-center justify-between">
                        <span className="text-blue-700 dark:text-blue-300 font-bold">آدرس ویدیوی ثبت‌شده:</span>
                        <span className="font-mono text-blue-600 dark:text-blue-400 text-[11px] truncate max-w-[300px]">
                          {selectedVersion.video_url}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
