import React, { useState, useEffect, useMemo } from 'react';
import { PageId, ActivityReport } from '../../types';
import {
  runFullIntegrityAudit,
  AuditSummaryReport,
  AuditItemResult,
  repairVideoWithStableSample,
  removeBrokenAttachmentFromReport,
  repairBrokenAttachment,
  repairBrokenPoster,
  repairBrokenTeamLogo,
  repairSingleAuditItem,
  autoRepairAllIntegrityIssues,
  exportHealthAuditLogText,
  checkMediaLinkHealth,
  autoFixMediaLinkItem,
  autoFixAllBrokenMediaWithDict,
  SystemMediaHealthSummary,
  MediaHealthResult,
  IntegrityStatus,
  ResourceType
} from '../../utils/integrityAuditor';
import {
  runAutomatedSiteAudit,
  SiteAuditReport,
  printAuditReportToConsole
} from '../../utils/routeAndAssetTester';
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
  HardDrive,
  Terminal,
  Code2
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
  const [siteAutoTestReport, setSiteAutoTestReport] = useState<SiteAuditReport | null>(null);
  const [isAuditing, setIsAuditing] = useState<boolean>(false);
  const [isAutoTesting, setIsAutoTesting] = useState<boolean>(false);
  const [isAutoRepairing, setIsAutoRepairing] = useState<boolean>(false);
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

  // System Media Health State
  const [mediaHealthSummary, setMediaHealthSummary] = useState<SystemMediaHealthSummary | null>(null);
  const [isCheckingMediaHealth, setIsCheckingMediaHealth] = useState<boolean>(false);
  const [autoFixingItemKey, setAutoFixingItemKey] = useState<string | null>(null);
  const [fixedItemsStatus, setFixedItemsStatus] = useState<Record<string, { success: boolean; message: string }>>({});

  // Run initial scan when mounted
  useEffect(() => {
    handleRunAudit();
    handleRunAutoSiteTest(false);
    handleRunMediaHealthCheck(false);
  }, []);

  const handleRunMediaHealthCheck = async (notify: boolean = true) => {
    setIsCheckingMediaHealth(true);
    try {
      const summary = await checkMediaLinkHealth((pct, label) => {
        setAuditProgress(pct);
        setCurrentCheckingItem(`بررسی سلامت منبع: ${label}`);
      });
      setMediaHealthSummary(summary);
      if (notify) {
        if (summary.brokenCount > 0) {
          showToast(`بررسی سلامت رسانه‌ها: ${toPersianDigits(summary.brokenCount)} لینک نامعتبر شناسایی شد.`, 'error');
        } else {
          showToast(`سلامت کلیه لینک‌های رسانه تایید شد (${toPersianDigits(summary.healthPercentage)}٪).`);
        }
      }
    } catch (e: any) {
      console.warn('Error checking media health:', e);
      if (notify) showToast('خطا در پایش سلامت لینک‌های رسانه.', 'error');
    } finally {
      setIsCheckingMediaHealth(false);
    }
  };

  const handleAutoFixSingleItem = async (item: AuditItemResult | MediaHealthResult) => {
    const itemKey = (item as any).id || (item as any).url || (item as any).reportId;
    setAutoFixingItemKey(itemKey);
    try {
      const res = await autoFixMediaLinkItem(item);
      setFixedItemsStatus(prev => ({
        ...prev,
        [itemKey]: { success: res.success, message: res.message }
      }));

      if (res.success) {
        showToast(`اصلاح هوشمند: ${res.message}`);
        await handleRunAudit();
        await handleRunMediaHealthCheck(false);
      } else {
        showToast(`عدم موفقیت در اصلاح خودکار: ${res.message}`, 'error');
      }
    } catch (e: any) {
      showToast(`خطا در اجرای فرآیند اصلاح: ${e?.message || 'نامشخص'}`, 'error');
    } finally {
      setAutoFixingItemKey(null);
    }
  };

  const handleAutoFixAllWithDict = async () => {
    if (!auditReport) return;
    setIsAutoRepairing(true);
    try {
      const { fixedCount, failedCount } = await autoFixAllBrokenMediaWithDict(auditReport.items);
      showToast(`فرآیند اصلاح خودکار کامل شد: ${toPersianDigits(fixedCount)} منبع با موفقیت بازنگاشت و رفع شدند.`);
      await handleRunAudit();
      await handleRunMediaHealthCheck(false);
    } catch (e: any) {
      showToast('خطا در اجرای اصلاح دسته‌جمعی با دیکشنری منابع.', 'error');
    } finally {
      setIsAutoRepairing(false);
    }
  };

  const handleRunAutoSiteTest = async (notify: boolean = true) => {
    setIsAutoTesting(true);
    try {
      const res = await runAutomatedSiteAudit();
      setSiteAutoTestReport(res);
      if (notify) {
        if (res.notFound404Count > 0) {
          showToast(`تست خودکار اجرا شد: ${toPersianDigits(res.notFound404Count)} خطای ۴۰۴ در کنسول مرورگر چاپ شد.`, 'error');
        } else {
          showToast('تست خودکار مسیرها و منابع استاتیک با موفقیت اجرا و در کنسول چاپ شد.');
        }
      }
    } catch (e) {
      console.warn('Auto test notice:', e);
    } finally {
      setIsAutoTesting(false);
    }
  };

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

  // One-click repair all broken or missing resources
  const handleAutoRepairAll = async () => {
    if (!auditReport) return;
    setIsAutoRepairing(true);
    try {
      const repairResult = await autoRepairAllIntegrityIssues(auditReport, (pct, msg) => {
        setAuditProgress(pct);
        setCurrentCheckingItem(msg);
      });

      showToast(
        `عملیات اصلاح کامل شد: ${toPersianDigits(repairResult.totalRepaired)} مورد (ویدیوها: ${toPersianDigits(repairResult.videosRepaired)}، پوسترها: ${toPersianDigits(repairResult.postersRepaired)}، پیوست‌ها: ${toPersianDigits(repairResult.attachmentsRepaired)}، نشان‌ها: ${toPersianDigits(repairResult.logosRepaired)}) با موفقیت بازسازی و ذخیره گردید.`
      );
      // Re-run audit to reflect 100% verified state
      await handleRunAudit();
    } catch (err) {
      console.error('Auto repair error:', err);
      showToast('خطا در اجرای عملیات اصلاح خودکار.', 'error');
    } finally {
      setIsAutoRepairing(false);
    }
  };

  // One-click repair broken video
  const handleRepairVideo = async (reportId: string, teamSlug: string, parentTitle: string) => {
    const success = repairVideoWithStableSample(reportId, teamSlug);
    if (success) {
      showToast(`لینک ویدیوی «${parentTitle}» با نمونه ویدیوی پایدار و استاندارد محاش جایگزین شد.`);
      await handleRunAudit();
    } else {
      showToast('خطا در اصلاح لینک ویدیو.', 'error');
    }
  };

  // One-click repair broken poster
  const handleRepairPoster = async (reportId: string, teamSlug: string, parentTitle: string) => {
    const success = repairBrokenPoster(reportId, teamSlug);
    if (success) {
      showToast(`پوستر گزارش «${parentTitle}» با تصویر پایدار یا نشان تیم جایگزین و اصلاح شد.`);
      await handleRunAudit();
    } else {
      showToast('خطا در اصلاح پوستر گزارش.', 'error');
    }
  };

  // One-click repair attachment with sample document
  const handleRepairAttachment = async (reportId: string, attachmentId: string, attName: string, teamSlug?: string) => {
    const success = await repairBrokenAttachment(reportId, attachmentId, teamSlug);
    if (success) {
      showToast(`پیوست «${attName}» با سند معتبر نمونه بازسازی و در پایگاه داده ذخیره شد.`);
      await handleRunAudit();
    } else {
      showToast('خطا در بازسازی فایل پیوست.', 'error');
    }
  };

  // One-click remove missing attachment
  const handleRemoveAttachment = async (reportId: string, attachmentId: string, attName: string, teamSlug?: string) => {
    const success = await removeBrokenAttachmentFromReport(reportId, attachmentId, teamSlug);
    if (success) {
      showToast(`پیوست مفقود «${attName}» از فهرست گزارش حذف گردید.`);
      await handleRunAudit();
    } else {
      showToast('خطا در پاک‌سازی فایل پیوست.', 'error');
    }
  };

  // One-click reset broken team logo
  const handleRepairLogo = async (teamSlug: string, teamName: string) => {
    const success = repairBrokenTeamLogo(teamSlug);
    if (success) {
      showToast(`نشان وکتور اختصاصی تیم «${teamName}» با موفقیت بازیابی شد.`);
      await handleRunAudit();
    } else {
      showToast('خطا در بازنشانی لوگوی تیم.', 'error');
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
            {/* Dictionary Auto-Fix All Button */}
            <button
              onClick={handleAutoFixAllWithDict}
              disabled={isAutoRepairing || isAuditing}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
              title="اصلاح هوشمند و بازنگاشت خودکار تمامی پیوندها بر اساس دیکشنری محلی منابع سامانه"
            >
              <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${isAutoRepairing ? 'animate-spin' : ''}`} />
              <span>اصلاح خودکار با دیکشنری منابع (Auto-Fix All)</span>
            </button>

            {auditReport && (auditReport.missingCount > 0 || auditReport.errorCount > 0) && (
              <button
                onClick={handleAutoRepairAll}
                disabled={isAutoRepairing || isAuditing}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 animate-pulse"
                title="تعمیر و بازسازی خودکار تمام ویدیوها، لینک‌ها، پوسترها و پیوست‌های معیوب"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAutoRepairing ? 'animate-spin' : ''}`} />
                <span>{isAutoRepairing ? 'در حال رفع خودکار مشکلات...' : 'رفع خودکار تمام خطاها'}</span>
              </button>
            )}

            <button
              onClick={() => handleRunMediaHealthCheck(true)}
              disabled={isCheckingMediaHealth}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              title="پایش و پینگ پیوسته آدرس کلیه ویدیوها و فایل‌های آپلود شده در حافظه"
            >
              <Activity className={`w-3.5 h-3.5 ${isCheckingMediaHealth ? 'animate-spin' : ''}`} />
              <span>{isCheckingMediaHealth ? 'در حال پایش رسانه‌ها...' : '🔍 پایش سلامت رسانه‌ها (Ping Media)'}</span>
            </button>

            <button
              onClick={() => handleRunAutoSiteTest(true)}
              disabled={isAutoTesting}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              title="بررسی تمام مسیرهای داخلی و منابع استاتیک و چاپ جدول ۴۰۴ در کنسول"
            >
              <Terminal className={`w-3.5 h-3.5 ${isAutoTesting ? 'animate-spin' : ''}`} />
              <span>{isAutoTesting ? 'در حال اجرای تست خودکار...' : 'تست مسیرها و منابع استاتیک (چاپ در کنسول ۴۰۴)'}</span>
            </button>

            <button
              onClick={handleRunAudit}
              disabled={isAuditing || isAutoRepairing}
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

        {/* System Media Health Dashboard Section */}
        {mediaHealthSummary && (
          <div className="bg-gradient-to-br from-slate-900 via-[#0e1e38] to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-blue-900/50 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
                  <Activity className="w-4 h-4 text-teal-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-white flex items-center gap-2">
                    <span>داشبورد پایش سلامت رسانه‌ها و پیوندهای ذخیره‌سازی (System Health Dashboard)</span>
                    <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 text-[10px] font-mono border border-teal-500/30">
                      پایش آنلاین
                    </span>
                  </h3>
                  <span className="text-[11px] text-slate-300">
                    پایش مستمر پاسخ‌دهی سرور برای ویدیوها، فایل‌ها، نشان‌ها و اسناد در حافظه سامانه
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRunMediaHealthCheck(true)}
                  disabled={isCheckingMediaHealth}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingMediaHealth ? 'animate-spin' : ''}`} />
                  <span>پینگ و اعتبارسنجی مجدد</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-black/30 p-3 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[11px] block">کل رسانه‌های پایش‌شده</span>
                <span className="text-lg font-black text-white font-mono">
                  {toPersianDigits(mediaHealthSummary.totalChecked)}
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">ویدیو، پوستر، پیوست و نشان</span>
              </div>

              <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
                <div className="flex items-center justify-between text-emerald-300 text-[11px]">
                  <span>رسانه‌های سالم</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span className="text-lg font-black text-emerald-300 font-mono">
                  {toPersianDigits(mediaHealthSummary.healthyCount)}
                </span>
                <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                  نرخ سلامت: {toPersianDigits(mediaHealthSummary.healthPercentage)}٪
                </span>
              </div>

              <div className={`p-3 rounded-2xl border ${
                mediaHealthSummary.brokenCount > 0
                  ? 'bg-rose-950/50 border-rose-500/40 text-rose-300'
                  : 'bg-black/30 border-white/10 text-slate-400'
              }`}>
                <div className="flex items-center justify-between text-[11px]">
                  <span>لینک‌های نامعتبر یا قطع</span>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                </div>
                <span className={`text-lg font-black font-mono ${mediaHealthSummary.brokenCount > 0 ? 'text-rose-300' : 'text-slate-300'}`}>
                  {toPersianDigits(mediaHealthSummary.brokenCount)}
                </span>
                <span className="text-[10px] text-rose-300/80 block mt-0.5">
                  {mediaHealthSummary.brokenCount > 0 ? 'قابل ترمیم با دیکشنری منابع' : 'تمام لینک‌ها سالم'}
                </span>
              </div>

              <div className="bg-black/30 p-3 rounded-2xl border border-white/10">
                <span className="text-slate-400 text-[11px] block">میانگین زمان پاسخ پینگ</span>
                <span className="text-lg font-black text-sky-300 font-mono">
                  {toPersianDigits(mediaHealthSummary.averageLatencyMs)} ms
                </span>
                <span className="text-[10px] text-slate-400 block mt-0.5">پایداری شبکه محلی</span>
              </div>
            </div>
          </div>
        )}

        {/* Automated Route & Static Asset 404 Terminal Card */}
        {siteAutoTestReport && (
          <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-md space-y-3 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-400">
                  خروجی تست خودکار مسیرهای داخلی و منابع استاتیک (کنسول مرورگر)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-mono">
                  {siteAutoTestReport.timestamp}
                </span>
                <button
                  onClick={() => printAuditReportToConsole(siteAutoTestReport)}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[11px] font-mono rounded-lg transition cursor-pointer flex items-center gap-1"
                  title="چاپ مجدد داده‌ها در Console DevTools"
                >
                  <Code2 className="w-3 h-3" />
                  <span>چاپ مجدد در Console</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">مسیرهای داخلی تست‌شده</span>
                <span className="font-bold font-mono text-white text-sm">
                  {toPersianDigits(siteAutoTestReport.routesChecked)} مسیر
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">لوگوها و تصاویر استاتیک</span>
                <span className="font-bold font-mono text-white text-sm">
                  {toPersianDigits(siteAutoTestReport.assetsChecked)} منبع
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">خطاهای ۴۰۴ یا گمشده</span>
                <span className={`font-bold font-mono text-sm ${siteAutoTestReport.notFound404Count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {toPersianDigits(siteAutoTestReport.notFound404Count)} مورد
                </span>
              </div>
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
                <span className="text-slate-400 text-[10px] block">پایداری کل ساختار سایت</span>
                <span className="font-bold font-mono text-emerald-400 text-sm">
                  {toPersianDigits(siteAutoTestReport.healthPercentage)}٪
                </span>
              </div>
            </div>

            {siteAutoTestReport.notFound404Count > 0 ? (
              <div className="bg-rose-950/40 border border-rose-800/60 p-3 rounded-xl space-y-1.5 text-xs text-rose-200">
                <div className="flex items-center gap-1.5 font-bold text-rose-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>منابع با خطای ۴۰۴ شناسایی شدند (جزئیات در کنسول ثبت شد):</span>
                </div>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-rose-300/90 font-mono">
                  {siteAutoTestReport.brokenResources.map((b, i) => (
                    <li key={i}>
                      {b.name} ({b.urlOrPath}) - کد {b.httpStatus || 404}: {b.errorReason || b.details}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 pt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>تمامی مسیرهای داخلی، لوگوهای ذخیره شده و منابع استاتیک کاملاً سالم، پاسخ‌گو و پایدار هستند (هیچ خطای ۴۰۴ ثبت نشد).</span>
              </div>
            )}
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
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">همه انواع منابع</option>
                <option value="video" className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">🎬 ویدیوهای اصلی</option>
                <option value="attachment" className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">📎 فایل‌های پیوست (PDF, Word, Excel)</option>
                <option value="poster" className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">🖼️ پوسترهای گزارش</option>
                <option value="logo" className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">🎨 نشان‌ها و لوگوهای تیمی</option>
                <option value="link" className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">🔗 پیوندهای رویدادها</option>
              </select>
            </div>

            {/* Team Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-bold">تیم:</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">همه تیم‌ها</option>
                {allTeamsList.map((t) => (
                  <option key={t.id} value={t.slug} className="bg-white dark:bg-slate-850 text-slate-900 dark:text-slate-100">
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
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-start pt-1 sm:pt-0 flex-wrap">
                    {/* Primary Auto-Fix Button (Smart Dictionary Re-mapping) */}
                    {(isMissing || isError || isWarning) && (
                      <button
                        onClick={() => handleAutoFixSingleItem(item)}
                        disabled={autoFixingItemKey === item.id}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer disabled:opacity-50"
                        title="اصلاح هوشمند و بازنگاشت خودکار بر اساس دیکشنری محلی منابع سامانه"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-amber-300 ${autoFixingItemKey === item.id ? 'animate-spin' : ''}`} />
                        <span>{autoFixingItemKey === item.id ? 'در حال بازنگاشت...' : 'تعمیر هوشمند (Auto-Fix)'}</span>
                      </button>
                    )}

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

                    {/* Auto Fix Broken Poster */}
                    {item.resourceType === 'poster' && (isMissing || isError) && (
                      <button
                        onClick={() => handleRepairPoster(item.parentId, item.teamSlug || '', item.parentTitle)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="تعمیر و جایگزینی پوستر با تصویر استاندارد یا نشان تیم"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>تعمیر پوستر</span>
                      </button>
                    )}

                    {/* Repair Attachment with Sample Doc */}
                    {item.resourceType === 'attachment' && (isMissing || isError) && (
                      <button
                        onClick={() => {
                          const attIdMatch = item.id.replace(`audit-att-${item.parentId}-`, '');
                          handleRepairAttachment(item.parentId, attIdMatch, item.name, item.teamSlug);
                        }}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="بازسازی و تبدیل به فایل معتبر قابل دانلود در سیستم"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>تعمیر و بازسازی پیوست</span>
                      </button>
                    )}

                    {/* Clean Missing Attachment */}
                    {item.resourceType === 'attachment' && (isMissing || isError) && (
                      <button
                        onClick={() => {
                          const attIdMatch = item.id.replace(`audit-att-${item.parentId}-`, '');
                          handleRemoveAttachment(item.parentId, attIdMatch, item.name, item.teamSlug);
                        }}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="حذف این پیوست ناقص از فهرست گزارش"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>حذف پیوست ناقص</span>
                      </button>
                    )}

                    {/* Auto Fix Broken Team Logo */}
                    {item.resourceType === 'logo' && (isMissing || isError) && (
                      <button
                        onClick={() => handleRepairLogo(item.parentId, item.parentTitle)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        title="بازیابی نشان وکتور استاندارد تیم"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>بازیابی نشان تیم</span>
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
