import React, { useState } from 'react';
import {
  Download,
  FileSpreadsheet,
  FileJson,
  CheckCircle2,
  Database,
  Archive,
  RefreshCw,
  Clock,
  HardDrive,
  Users,
  Award,
  Radio,
  FileText
} from 'lucide-react';
import {
  getAllReports,
  getAllScores,
  getAllTeamsList,
  getNewsAnnouncements,
  exportFullDatabaseJSON,
  exportReportsCSV,
  exportScoresCSV,
  exportNewsCSV,
  exportConsultantsCSV,
  exportMembershipsCSV,
  downloadTextFile
} from '../../utils/reportsStore';
import { toPersianDigits } from '../../utils/persianDate';

interface DatabaseBackupExportProps {
  onSuccessToast?: (msg: string) => void;
}

export const DatabaseBackupExport: React.FC<DatabaseBackupExportProps> = ({ onSuccessToast }) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportHistory, setExportHistory] = useState<string | null>(() => {
    return localStorage.getItem('mahash_last_export_date') || null;
  });

  const reports = getAllReports();
  const scores = getAllScores();
  const teams = getAllTeamsList();
  const announcements = getNewsAnnouncements();

  const handleJsonExport = async () => {
    try {
      setIsExporting(true);
      const jsonContent = exportFullDatabaseJSON();
      const today = new Date().toISOString().slice(0, 10);
      const filename = `mahash-database-backup-${today}.json`;
      downloadTextFile(jsonContent, filename, 'application/json;charset=utf-8;');
      
      const nowStr = new Date().toLocaleDateString('fa-IR');
      localStorage.setItem('mahash_last_export_date', nowStr);
      setExportHistory(nowStr);

      if (onSuccessToast) {
        onSuccessToast('فایل نسخه پشتیبان کامل پایگاه داده (JSON) با موفقیت دانلود شد.');
      }
    } catch (err: any) {
      console.error('JSON export error:', err);
      if (onSuccessToast) onSuccessToast('خطا در تهیه پشتیبان JSON: ' + (err?.message || 'نامشخص'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleCsvExport = (
    type: 'reports' | 'scores' | 'news' | 'consultants' | 'memberships'
  ) => {
    try {
      setIsExporting(true);
      const today = new Date().toISOString().slice(0, 10);
      let csvContent = '';
      let filename = '';
      let label = '';

      switch (type) {
        case 'reports':
          csvContent = exportReportsCSV();
          filename = `mahash-reports-${today}.csv`;
          label = 'گزارش‌های فعالیت';
          break;
        case 'scores':
          csvContent = exportScoresCSV();
          filename = `mahash-scores-${today}.csv`;
          label = 'جدول امتیازات و رتبه‌بندی تیم‌ها';
          break;
        case 'news':
          csvContent = exportNewsCSV();
          filename = `mahash-news-ticker-${today}.csv`;
          label = 'اخبار و اطلاعیه‌های تیکر';
          break;
        case 'consultants':
          csvContent = exportConsultantsCSV();
          filename = `mahash-consultants-${today}.csv`;
          label = 'مشاوران و اعضای هیئت علمی';
          break;
        case 'memberships':
          csvContent = exportMembershipsCSV();
          filename = `mahash-memberships-${today}.csv`;
          label = 'فرم‌های ثبت‌نام عضویت';
          break;
      }

      downloadTextFile(csvContent, filename, 'text/csv;charset=utf-8;');

      const nowStr = new Date().toLocaleDateString('fa-IR');
      localStorage.setItem('mahash_last_export_date', nowStr);
      setExportHistory(nowStr);

      if (onSuccessToast) {
        onSuccessToast(`خروجی اکسل و CSV «${label}» با موفقیت دانلود شد.`);
      }
    } catch (err: any) {
      console.error('CSV export error:', err);
      if (onSuccessToast) onSuccessToast('خطا در استخراج CSV: ' + (err?.message || 'نامشخص'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAllPackage = async () => {
    try {
      setIsExporting(true);
      // Download JSON first
      handleJsonExport();
      // Delay slightly and download main CSVs
      setTimeout(() => handleCsvExport('reports'), 350);
      setTimeout(() => handleCsvExport('scores'), 700);
      setTimeout(() => handleCsvExport('news'), 1050);
      
      if (onSuccessToast) {
        onSuccessToast('بسته جامع پشتیبان شامل فایل‌های JSON و اکسل (CSV) با موفقیت دریافت شد.');
      }
    } catch (err: any) {
      console.error('Export all error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              پشتیبان‌گیری و خروجی داده‌ها (JSON و CSV)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              دریافت نسخه پشتیبان کامل از دیتابیس با امکان باز شدن مستقیم در نرم‌افزار Excel بدون به‌هم‌ریختگی فارسی
            </p>
          </div>
        </div>

        {exportHistory && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span>آخرین خروجی: {toPersianDigits(exportHistory)}</span>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <FileText className="w-4 h-4" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">گزارش‌های فعالیت</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {toPersianDigits(reports.length)} <span className="text-[10px] font-normal text-slate-500">مورد</span>
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Award className="w-4 h-4" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">امتیازات و تیم‌ها</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {toPersianDigits(scores.length || teams.length)} <span className="text-[10px] font-normal text-slate-500">تیم</span>
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 mb-1">
            <Radio className="w-4 h-4" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">اخبار و تیکر</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {toPersianDigits(announcements.length)} <span className="text-[10px] font-normal text-slate-500">مورد</span>
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-1">
            <Users className="w-4 h-4" />
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">مشاوران و اعضا</span>
          </div>
          <p className="text-lg font-black text-slate-900 dark:text-white">
            {toPersianDigits(2)} <span className="text-[10px] font-normal text-slate-500">مشاور تخصصی</span>
          </p>
        </div>
      </div>

      {/* Main Download Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Full JSON Database Backup Card */}
        <div className="bg-gradient-to-br from-blue-50/70 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl p-5 border border-blue-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              خروجی نسخه پشتیبان کامل (JSON)
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            شامل تمامی جداول پایگاه داده: گزارش‌های ویدیویی، پیوست‌ها، نمرات تیم‌ها، مشاوران، اخبار و اطلاعیه‌های تیکر، فرم‌های عضویت و تنظیمات کلی سامانه.
          </p>
          <button
            onClick={handleJsonExport}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-[#173b82] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>دانلود فایل پشتیبان کامل دیتابیس (JSON)</span>
          </button>
        </div>

        {/* Full CSV Excel Export Card */}
        <div className="bg-gradient-to-br from-emerald-50/70 to-teal-50/50 dark:from-slate-800/80 dark:to-slate-800/40 rounded-2xl p-5 border border-emerald-200/80 dark:border-slate-700 space-y-3">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              خروجی‌های استاندارد اکسل (CSV)
            </h3>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            دارای انکودینگ استاندارد UTF-8 BOM که موجب باز شدن تمیز داده‌های فارسی در Excel بدون به هم ریختگی فونت و حروف می‌شود.
          </p>
          <button
            onClick={handleExportAllPackage}
            disabled={isExporting}
            className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Archive className="w-4 h-4" />
            <span>دانلود هم‌زمان تمامی فایل‌های پشتیبان و CSV</span>
          </button>
        </div>
      </div>

      {/* Individual CSV Export Buttons */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          دانلود خروجی CSV تفکیک‌شده جداول:
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          <button
            onClick={() => handleCsvExport('reports')}
            disabled={isExporting}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                خروجی CSV گزارش‌های فعالیت
              </span>
              <span className="text-[11px] text-slate-400">
                {toPersianDigits(reports.length)} ردیف گزارش ثبت شده
              </span>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </button>

          <button
            onClick={() => handleCsvExport('scores')}
            disabled={isExporting}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                خروجی CSV امتیازات و رتبه‌بندی
              </span>
              <span className="text-[11px] text-slate-400">
                {toPersianDigits(scores.length || 5)} تیم باشگاه جوانان
              </span>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400" />
          </button>

          <button
            onClick={() => handleCsvExport('news')}
            disabled={isExporting}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                خروجی CSV اخبار و اطلاعیه‌های تیکر
              </span>
              <span className="text-[11px] text-slate-400">
                {toPersianDigits(announcements.length)} اطلاعیه ذخیره شده
              </span>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-600 dark:group-hover:text-amber-400" />
          </button>

          <button
            onClick={() => handleCsvExport('consultants')}
            disabled={isExporting}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                خروجی CSV مشاوران و هیئت علمی
              </span>
              <span className="text-[11px] text-slate-400">
                اطلاعات تخصصی و روزهای حضور
              </span>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-purple-600 dark:group-hover:text-purple-400" />
          </button>

          <button
            onClick={() => handleCsvExport('memberships')}
            disabled={isExporting}
            className="p-3 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-right transition flex items-center justify-between cursor-pointer group"
          >
            <div>
              <span className="block text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                خروجی CSV درخواست‌های عضویت
              </span>
              <span className="text-[11px] text-slate-400">
                اطلاعات متقاضیان و مهارت‌ها
              </span>
            </div>
            <Download className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          </button>
        </div>
      </div>
    </div>
  );
};
