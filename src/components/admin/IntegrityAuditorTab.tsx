import React, { useState, useEffect, useMemo } from 'react';
import { PageId, ActivityReport } from '../../types';
import {
  runFullIntegrityAudit,
  AuditSummaryReport,
  AuditItemResult,
  repairVideoWithStableSample,
  removeBrokenAttachmentFromReport,
  exportHealthAuditLogText,
  IntegrityStatus,
  ResourceType
} from '../../utils/integrityAuditor';
import { getAllReports, getAllTeams } from '../../utils/reportsStore';
import { toPersianDigits } from '../../utils/persianDate';
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  FileWarning,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Copy,
  ExternalLink,
  Edit3,
  Wrench,
  Trash2,
  Search,
  Filter,
  Film,
  Paperclip,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  Link as LinkIcon,
  Check,
  Sparkles,
  Info,
  Clock,
  HardDrive
} from 'lucide-react';

interface IntegrityAuditorTabProps {
  onNavigate: (page: PageId) => void;
  onEditReport: (report: ActivityReport, teamSlug: string) => void;
  showToast: (message: string, type?: 'success' | 'error') => void;
}

export const IntegrityAuditorTab: React.FC<IntegrityAuditorTabProps> = ({
  onNavigate,
  onEditReport,
  showToast
}) => {
  const [auditReport, setAuditReport] = useState<AuditSummaryReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [auditProgress, setAuditProgress] = useState<number>(0);
  const [currentCheckingItem, setCurrentCheckingItem] = useState<string>('');
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<'all' | 'issues' | 'missing' | 'error' | 'warning' | 'healthy'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | ResourceType>('all');
  const [teamFilter, setTeamFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Individual item re-testing state
  const [retestingId, setRetestingId] = useState<string | null>(null);
  const [copiedLog, setCopiedLog] = useState<boolean>(false);

  // Run initial scan when mounted
  useEffect(() => {
    handleRunAudit();
  }, []);

  const handleRunAudit = async () => {
    setIsAuditing(true);
    setAuditProgress(0);
    setCurrentCheckingItem('شروع آماده‌سازی فهرست منابع...');

    try {
      const result = await runFullIntegrityAudit((pct, label) => {
        setAuditProgress(pct);
        setCurrentCheckingItem(label);
      });
      setAuditReport(result);
      if (result.missingCount > 0 || result.errorCount > 0) {
        showToast(`اسکن سلامت انجام شد: ${toPersianDigits(result.missingCount + result.errorCount)} مورد نیازمند توجه شناسایی شد.`, 'error');
      } else {
        showToast('اسکن سلامت با موفقیت انجام شد: تمامی لینک‌ها و فایل‌ها در دسترس و سالم هستند.');
      }
    } catch (err) {
      console.error('Audit failed:', err);
      showToast('خطا در اجرای تست سلامت منابع.', 'error');
    } finally {
      setIsAuditing(false);
    }
  };

  // One-click repair broken video
  const handleRepairVideo = (reportId: string, teamSlug: string, parentTitle: string) => {
    const success = repairVideoWithStableSample(reportId, teamSlug);
    if (success) {
      showToast(`لینک ویدیوی «${parentTitle}» با نمونه ویدیوی پایدار و استاندارد محاش جایگزین شد.`);
      // Update local report item in audit list
      if (auditReport) {
        const updatedItems = auditReport.items.map((item) => {
          if (item.parentId === reportId && item.resourceType === 'video') {
            return {
              ...item,
              status: 'healthy' as IntegrityStatus,
              statusCode: '200 OK (REPAIRED)',
              details: 'لینک ویدیو با نمونه استاندارد پایدار جایگزین گردید و سالم است.',
              errorReason: undefined,
              remediationAction: undefined
            };
          }
          return item;
        });
        const healthyCount = updatedItems.filter((i) => i.status === 'healthy').length;
        const missingCount = updatedItems.filter((i) => i.status === 'missing').length;
        const errorCount = updatedItems.filter((i) => i.status === 'error').length;
        const warningCount = updatedItems.filter((i) => i.status === 'warning').length;
        const score = Math.round(((healthyCount + warningCount * 0.7) / updatedItems.length) * 100);
        setAuditReport({
          ...auditReport,
          healthyCount,
          missingCount,
          errorCount,
          healthScorePercentage: score,
          items: updatedItems
        });
      }
    } else {
      showToast('خطا در اصلاح لینک ویدیو.', 'error');
    }
  };

  // One-click remove missing attachment
  const handleRemoveAttachment = async (reportId: string, attachmentId: string, attName: string) => {
    const success = await removeBrokenAttachmentFromReport(reportId, attachmentId);
    if (success) {
      showToast(`پیوست مفقود «${attName}» از فهرست گزارش حذف گردید.`);
      // Remove or update from local audit list
      if (auditReport) {
        const updatedItems = auditReport.items.filter((item) => !item.id.includes(attachmentId));
        const healthyCount = updatedItems.filter((i) => i.status === 'healthy').length;
        const missingCount = updatedItems.filter((i) => i.status === 'missing').length;
        const errorCount = updatedItems.filter((i) => i.status === 'error').length;
        const warningCount = updatedItems.filter((i) => i.status === 'warning').length;
        const score = updatedItems.length > 0 ? Math.round(((healthyCount + warningCount * 0.7) / updatedItems.length) * 100) : 100;
        setAuditReport({
          ...auditReport,
          totalChecked: updatedItems.length,
          healthyCount,
          missingCount,
          errorCount,
          healthScorePercentage: score,
          items: updatedItems
        });
      }
    } else {
      showToast('خطا در پاک‌سازی فایل پیوست.', 'error');
    }
  };

  // Jump to edit report
  const handleJumpToEditReport = (reportId: string, teamSlug: string) => {
    const all = getAllReports();
    const rep = all.find((r) => r.id === reportId);
    if (rep) {
      onEditReport(rep, teamSlug || rep.teamSlug);
    }
  };

  // Download diagnostic text log
  const handleDownloadLog = () => {
    if (!auditReport) return;
    const textLog = exportHealthAuditLogText(auditReport);
    const blob = new Blob([textLog], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mahash-link-audit-report-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    showToast('فایل گزارش تشخیصی با موفقیت دانلود شد.');
  };

  // Copy diagnostic text log to clipboard
  const handleCopyLog = () => {
    if (!auditReport) return;
    const textLog = exportHealthAuditLogText(auditReport);
    navigator.clipboard.writeText(textLog);
    setCopiedLog(true);
    showToast('متن گزارش در حافظه کلیپ‌بورد کپی شد.');
    setTimeout(() => setCopiedLog(false), 3000);
  };

  // Filtered Audit Items
  const filteredItems = useMemo(() => {
    if (!auditReport) return [];

    return auditReport.items.filter((item) => {
      // Status Filter
      if (statusFilter === 'issues') {
        if (item.status === 'healthy') return false;
      } else if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }

      // Resource Type Filter
      if (typeFilter !== 'all' && item.resourceType !== typeFilter) {
        return false;
      }

      // Team Filter
      if (teamFilter !== 'all' && item.teamSlug !== teamFilter) {
        return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = item.name.toLowerCase().includes(q);
        const matchesParent = item.parentTitle.toLowerCase().includes(q);
        const matchesTeam = item.teamName ? item.teamName.toLowerCase().includes(q) : false;
        const matchesDetails = item.details.toLowerCase().includes(q);
        const matchesTarget = item.targetUrl.toLowerCase().includes(q);
        if (!matchesName && !matchesParent && !matchesTeam && !matchesDetails && !matchesTarget) {
          return false;
        }
      }

      return true;
    });
  }, [auditReport, statusFilter, typeFilter, teamFilter, searchQuery]);

  const allTeamsList = Object.values(getAllTeams());

  // Helper for resource icon
  const getResourceIcon = (type: ResourceType) => {
    switch (type) {
      case 'video':
        return <Film className="w-4 h-4 text-blue-500" />;
      case 'attachment':
        return <Paperclip className="w-4 h-4 text-amber-500" />;
      case 'poster':
      case 'logo':
        return <ImageIcon className="w-4 h-4 text-purple-500" />;
      case 'link':
        return <LinkIcon className="w-4 h-4 text-emerald-500" />;
      default:
        return <Activity className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
                <Activity className="w-5 h-5 animate-pulse text-blue-600" />
              </div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white">
                ابزار تست سریع سلامت لینک‌ها، ویدیوها و فایل‌های آپلود شده
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              بررسی پیوسته و هوشمند آدرس ویدیوها، اسناد پیوست، فایل‌های دیتابیس محلی (IndexedDB)، تصاویر و اتصالات ابری
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleRunAudit}
              disabled={isAuditing}
              className="px-4 py-2.5 bg-[#173b82] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
              <span>{isAuditing ? 'در حال اسکن زنده...' : 'اجرای تست کامل سلامت'}</span>
            </button>

            {auditReport && (
              <>
                <button
                  onClick={handleDownloadLog}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="دانلود گزارش متنی لاگ تشخیصی"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600" />
                  <span className="hidden sm:inline">دانلود لاگ</span>
                </button>

                <button
                  onClick={handleCopyLog}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-slate-700"
                  title="کپی متن گزارش در کلیپ‌بورد"
                >
                  {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  <span className="hidden sm:inline">{copiedLog ? 'کپی شد' : 'کپی گزارش'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Live Scanning Progress Bar */}
        {isAuditing && (
          <div className="bg-blue-50 dark:bg-blue-950/40 p-4 rounded-2xl border border-blue-200 dark:border-blue-800 space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span>{currentCheckingItem || 'در حال اعتبارسنجی منابع...'}</span>
              </span>
              <span className="font-mono font-black text-blue-700 dark:text-blue-300">
                {toPersianDigits(auditProgress)}٪
              </span>
            </div>
            <div className="w-full h-2.5 bg-blue-200/60 dark:bg-blue-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 to-sky-400 rounded-full transition-all duration-300"
                style={{ width: `${auditProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* KPI Dashboard Cards */}
        {auditReport && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Overall Health Score */}
            <div className="col-span-2 sm:col-span-3 lg:col-span-2 bg-gradient-to-br from-slate-50 to-blue-50/60 dark:from-slate-800 dark:to-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-mono font-black shadow-inner shrink-0 ${
                  auditReport.healthScorePercentage >= 90
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                    : auditReport.healthScorePercentage >= 70
                    ? 'bg-amber-500 text-white shadow-amber-500/20'
                    : 'bg-rose-500 text-white shadow-rose-500/20'
                }`}
              >
                {toPersianDigits(auditReport.healthScorePercentage)}٪
              </div>
              <div className="space-y-0.5 min-w-0">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">نمره کلی سلامت سامانه</span>
                <span className="font-black text-xs sm:text-sm text-slate-900 dark:text-white block truncate">
                  {auditReport.healthScorePercentage === 100
                    ? 'بسیار عالی و پایدار'
                    : auditReport.missingCount > 0 || auditReport.errorCount > 0
                    ? `${toPersianDigits(auditReport.missingCount + auditReport.errorCount)} خطای نیازمند بررسی`
                    : 'سالم همراه با هشدارهای بهینه‌سازی'}
                </span>
                <span className="text-[10px] text-slate-400 font-mono block">
                  زمان اسکن: {toPersianDigits(auditReport.durationMs)} میلی‌ثانیه
                </span>
              </div>
            </div>

            {/* Total Checked */}
            <div className="bg-slate-50 dark:bg-slate-800/70 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">کل منابع تست‌شده</span>
              <div className="text-xl font-black text-slate-900 dark:text-white font-mono">
                {toPersianDigits(auditReport.totalChecked)}
              </div>
              <span className="text-[10px] text-slate-400">ویدیو، پیوست و لوگو</span>
            </div>

            {/* Healthy Items */}
            <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">
                <span>منابع تاییدشده</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 font-mono">
                {toPersianDigits(auditReport.healthyCount)}
              </div>
              <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80">۱۰۰٪ آماده استفاده</span>
            </div>

            {/* Missing Files */}
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              auditReport.missingCount > 0
                ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800 ring-2 ring-rose-400/20'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-rose-800 dark:text-rose-300">
                <span>فایل‌های گمشده</span>
                <FileWarning className="w-3.5 h-3.5 text-rose-600" />
              </div>
              <div className={`text-xl font-black font-mono ${auditReport.missingCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-600'}`}>
                {toPersianDigits(auditReport.missingCount)}
              </div>
              <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80">نیاز به بارگذاری مجدد</span>
            </div>

            {/* Broken Links / Errors */}
            <div className={`p-3.5 rounded-2xl border space-y-1 ${
              auditReport.errorCount > 0
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800'
                : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex items-center justify-between text-[11px] font-bold text-amber-800 dark:text-amber-300">
                <span>لینک‌های خراب</span>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              </div>
              <div className={`text-xl font-black font-mono ${auditReport.errorCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-600'}`}>
                {toPersianDigits(auditReport.errorCount)}
              </div>
              <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80">عدم دسترسی به سرور</span>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Status Quick Filter Chips */}
          <div className="flex items-center gap-1.5 flex-wrap text-xs font-bold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-[#173b82] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              همه ({toPersianDigits(auditReport?.totalChecked || 0)})
            </button>

            <button
              onClick={() => setStatusFilter('issues')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'issues'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>تمام خطاها و مشکلات ({toPersianDigits((auditReport?.missingCount || 0) + (auditReport?.errorCount || 0))})</span>
            </button>

            <button
              onClick={() => setStatusFilter('missing')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'missing'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>❌ فایل‌های گمشده ({toPersianDigits(auditReport?.missingCount || 0)})</span>
            </button>

            <button
              onClick={() => setStatusFilter('error')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'error'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>⛔ لینک‌های خراب ({toPersianDigits(auditReport?.errorCount || 0)})</span>
            </button>

            <button
              onClick={() => setStatusFilter('healthy')}
              className={`px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 ${
                statusFilter === 'healthy'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <span>✅ کاملاً سالم ({toPersianDigits(auditReport?.healthyCount || 0)})</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام فایل، گزارش یا لینک..."
              className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Secondary Filters: Resource Type & Team */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            {/* Resource Type Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">نوع منبع:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">همه انواع منابع</option>
                <option value="video">🎬 ویدیوهای اصلی</option>
                <option value="attachment">📎 فایل‌های پیوست (PDF, Word, Excel)</option>
                <option value="poster">🖼️ پوسترهای گزارش</option>
                <option value="logo">🎨 نشان‌ها و لوگوهای تیمی</option>
                <option value="link">🔗 پیوندهای رویدادها</option>
              </select>
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">تیم:</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all">همه تیم‌ها</option>
                {allTeamsList.map((t) => (
                  <option key={t.id} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <span className="text-slate-500 font-bold text-[11px]">
            نمایش {toPersianDigits(filteredItems.length)} مورد از {toPersianDigits(auditReport?.totalChecked || 0)} منبع
          </span>
        </div>
      </div>

      {/* Audit Items List / Cards */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-12 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
            <h3 className="font-bold text-slate-800 dark:text-white text-sm">
              هیچ موردی مطابق با فیلترهای انتخابی یافت نشد
            </h3>
            <p className="text-xs text-slate-500">
              تمامی منابع و فایل‌های این دسته در وضعیت ایده‌آل و سالم قرار دارند.
            </p>
            <button
              onClick={() => {
                setStatusFilter('all');
                setTypeFilter('all');
                setTeamFilter('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              پاک کردن فیلترها
            </button>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isMissing = item.status === 'missing';
            const isError = item.status === 'error';
            const isWarning = item.status === 'warning';
            const isHealthy = item.status === 'healthy';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition space-y-3 ${
                  isMissing
                    ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800'
                    : isError
                    ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                    : isWarning
                    ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                      {getResourceIcon(item.resourceType)}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm">
                          {item.name}
                        </span>

                        {item.teamName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                            {item.teamName}
                          </span>
                        )}

                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                            isMissing
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200'
                              : isError
                              ? 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-200'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          }`}
                        >
                          {isMissing && <XCircle className="w-3 h-3" />}
                          {isError && <AlertTriangle className="w-3 h-3" />}
                          {isHealthy && <CheckCircle2 className="w-3 h-3" />}
                          <span>
                            {isMissing
                              ? '❌ فایل گمشده'
                              : isError
                              ? '⛔ لینک غیرقابل دسترس'
                              : isWarning
                              ? '⚠️ هشدار بهینه‌سازی'
                              : '✅ تایید و سالم'}
                          </span>
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {item.details}
                      </div>

                      {item.errorReason && (
                        <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          <span>علت خطا: {item.errorReason}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono flex-wrap pt-0.5">
                        {item.statusCode && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                            کد: {item.statusCode}
                          </span>
                        )}
                        {item.latencyMs !== undefined && item.latencyMs > 0 && (
                          <span>زمان پاسخ: {toPersianDigits(item.latencyMs)} ms</span>
                        )}
                        {item.fileSizeFormatted && (
                          <span>حجم: {item.fileSizeFormatted}</span>
                        )}
                        <span className="truncate max-w-xs text-slate-500 font-sans" title={item.targetUrl}>
                          منبع: {item.targetUrl}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Remediation & Quick Fix Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-1 sm:pt-0">
                    {/* Auto Fix Broken Video */}
                    {item.resourceType === 'video' && (isMissing || isError) && (
                      <button
                        onClick={() => handleRepairVideo(item.parentId, item.teamSlug || '', item.parentTitle)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="جایگزینی خودکار با ویدیوی پایدار نمونه محاش"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>تعمیر با نمونه پایدار</span>
                      </button>
                    )}

                    {/* Clean Missing Attachment */}
                    {item.resourceType === 'attachment' && isMissing && (
                      <button
                        onClick={() => {
                          const attIdMatch = item.id.replace(`audit-att-${item.parentId}-`, '');
                          handleRemoveAttachment(item.parentId, attIdMatch, item.name);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="حذف این پیوست ناقص از فهرست گزارش"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف پیوست ناقص</span>
                      </button>
                    )}

                    {/* Edit Report */}
                    {item.parentType === 'report' && (
                      <button
                        onClick={() => handleJumpToEditReport(item.parentId, item.teamSlug || '')}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        title="ویرایش مشخصات گزارش در فرم مدیریت"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span className="hidden xs:inline">ویرایش</span>
                      </button>
                    )}

                    {/* Navigate to team page */}
                    {item.teamSlug && (
                      <button
                        onClick={() => onNavigate(item.teamSlug as PageId)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-xl transition cursor-pointer"
                        title="مشاهده صفحه تیم در سایت"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
