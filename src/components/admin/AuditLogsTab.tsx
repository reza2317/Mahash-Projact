import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Trash2,
  Filter,
  Search,
  Download,
  Clock,
  User,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Eye,
  X,
  FileSpreadsheet,
  FileCode,
  Sparkles,
  Info,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import {
  fetchAuditLogs,
  getAuditLogs,
  clearAuditLogs,
  exportAuditLogsCsv,
  exportAuditLogsJson,
  AuditLogEntry,
  AuditActionType
} from '../../utils/auditLogger';
import { toPersianDigits } from '../../utils/persianDate';

export interface AuditLogsTabProps {
  onNavigateTab?: (tab: string) => void;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuditLogsTab: React.FC<AuditLogsTabProps> = ({ onNavigateTab, showToast }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load audit logs
  const reloadLogs = async () => {
    setIsRefreshing(true);
    try {
      const currentLogs = await fetchAuditLogs();
      setLogs(currentLogs);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    reloadLogs();

    const handleAuditUpdate = () => {
      reloadLogs();
    };

    window.addEventListener('mahash_audit_logged', handleAuditUpdate);
    window.addEventListener('mahash_report_permanently_purged', handleAuditUpdate);

    return () => {
      window.removeEventListener('mahash_audit_logged', handleAuditUpdate);
      window.removeEventListener('mahash_report_permanently_purged', handleAuditUpdate);
    };
  }, []);

  // Filtered and searched logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Category filter
      if (selectedFilter === 'deletions') {
        if (
          log.actionType !== 'DELETE_REPORT' &&
          log.actionType !== 'PERMANENT_DELETE_REPORT' &&
          log.actionType !== 'EMPTY_TRASH' &&
          log.actionType !== 'DELETE_VIDEO' &&
          log.actionType !== 'DELETE_ATTACHMENT'
        ) {
          return false;
        }
      } else if (selectedFilter === 'reports') {
        if (
          log.actionType !== 'CREATE_REPORT' &&
          log.actionType !== 'UPDATE_REPORT' &&
          log.actionType !== 'DELETE_REPORT' &&
          log.actionType !== 'PERMANENT_DELETE_REPORT'
        ) {
          return false;
        }
      } else if (selectedFilter === 'security') {
        if (log.actionType !== 'AUTH_LOGIN' && log.actionType !== 'AUTH_LOGOUT' && log.actionType !== 'RESET_SYSTEM') {
          return false;
        }
      } else if (selectedFilter === 'scores') {
        if (log.actionType !== 'UPDATE_SCORE' && log.actionType !== 'UPDATE_LOGO' && log.actionType !== 'CREATE_EVENT') {
          return false;
        }
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (log.title || '').toLowerCase().includes(q);
        const matchDesc = (log.description || '').toLowerCase().includes(q);
        const matchActor = (log.actor || '').toLowerCase().includes(q);
        const matchTeam = (log.teamSlug || '').toLowerCase().includes(q);
        const matchDate = (log.persianDate || '').includes(q);
        if (!matchTitle && !matchDesc && !matchActor && !matchTeam && !matchDate) {
          return false;
        }
      }

      return true;
    });
  }, [logs, selectedFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const totalCount = logs.length;
    const deletionCount = logs.filter(
      (l) => l.actionType === 'DELETE_REPORT' || l.actionType === 'PERMANENT_DELETE_REPORT' || l.actionType === 'EMPTY_TRASH'
    ).length;
    const actorsSet = new Set(logs.map((l) => l.actor));
    const uniqueActors = actorsSet.size;

    return { totalCount, deletionCount, uniqueActors };
  }, [logs]);

  // Export handlers
  const handleExportCsv = () => {
    try {
      const csvContent = exportAuditLogsCsv();
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `mahash_audit_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.('خروجی فایل اکسل (CSV) لاگ‌های نظارتی با موفقیت دانلود شد.', 'success');
    } catch {
      showToast?.('خطا در دانلود فایل CSV', 'error');
    }
  };

  const handleExportJson = () => {
    try {
      const jsonContent = exportAuditLogsJson();
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `mahash_audit_logs_${Date.now()}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast?.('خروجی JSON لاگ‌های نظارتی با موفقیت دریافت شد.', 'success');
    } catch {
      showToast?.('خطا در دانلود فایل JSON', 'error');
    }
  };

  const getActionBadge = (actionType: AuditActionType) => {
    switch (actionType) {
      case 'PERMANENT_DELETE_REPORT':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-black flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            حذف قطعی و پاکسازی
          </span>
        );
      case 'DELETE_REPORT':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-[11px] font-bold flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            حذف گزارش
          </span>
        );
      case 'EMPTY_TRASH':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1">
            <Trash2 className="w-3 h-3" />
            تخلیه سطل بازیافت
          </span>
        );
      case 'CREATE_REPORT':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            ثبت گزارش جدید
          </span>
        );
      case 'UPDATE_REPORT':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[11px] font-bold flex items-center gap-1">
            <FileText className="w-3 h-3" />
            ویرایش گزارش
          </span>
        );
      case 'AUTH_LOGIN':
      case 'AUTH_LOGOUT':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-[11px] font-bold flex items-center gap-1">
            <Shield className="w-3 h-3" />
            ورود / خروج
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-lg bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[11px] font-bold">
            {actionType}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <Shield className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
              سامانه پایش نظارتی و ردگیری حذفیات (Audit Logging System)
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-300 text-xs font-mono">
                شفافیت و امنیت
              </span>
            </h2>
            <p className="text-xs text-slate-300 mt-1 leading-relaxed">
              ثبت دقیق تمامی عملیات مدیریتی، ردگیری شخص حذف‌کننده گزارش، زمان دقیق، دلایل و پاکسازی ردپاهای پایگاه داده
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-center">
          <button
            onClick={reloadLogs}
            disabled={isRefreshing}
            className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>به‌روزرسانی لاگ‌ها</span>
          </button>
          <button
            onClick={handleExportCsv}
            className="px-3.5 py-2 bg-emerald-600/80 hover:bg-emerald-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>خروجی CSV</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-3.5 py-2 bg-indigo-600/80 hover:bg-indigo-600 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>خروجی JSON</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">کل رویدادهای ثبت‌شده</span>
            <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
              {toPersianDigits(stats.totalCount)} <span className="text-xs font-normal text-slate-400">رکورد</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-blue-600">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">حذفیات و پاکسازی‌های نهایی</span>
            <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-1">
              {toPersianDigits(stats.deletionCount)} <span className="text-xs font-normal text-slate-400">مورد</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 flex items-center justify-center text-rose-600">
            <Trash2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">اپراتورها و مدیران ثبت‌شده</span>
            <div className="text-xl font-black text-indigo-600 dark:text-indigo-400 mt-1">
              {toPersianDigits(stats.uniqueActors)} <span className="text-xs font-normal text-slate-400">نفر</span>
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 text-xs font-bold">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              selectedFilter === 'all'
                ? 'bg-[#173b82] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            همه رویدادها ({toPersianDigits(logs.length)})
          </button>
          <button
            onClick={() => setSelectedFilter('deletions')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 flex items-center gap-1 ${
              selectedFilter === 'deletions'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            ردگیری حذفیات ({toPersianDigits(stats.deletionCount)})
          </button>
          <button
            onClick={() => setSelectedFilter('reports')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              selectedFilter === 'reports'
                ? 'bg-[#173b82] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            گزارشات
          </button>
          <button
            onClick={() => setSelectedFilter('security')}
            className={`px-3 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${
              selectedFilter === 'security'
                ? 'bg-[#173b82] text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ورود و امنیت
          </button>
        </div>

        {/* Search Field */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، نام اپراتور، تیم..."
            className="w-full pl-3 pr-9 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-hidden focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto" />
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
              هیچ لاگ نظارتی مطابق با فیلترها و جستجوی شما یافت نشد.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-bold">
                <tr>
                  <th className="py-3.5 px-4">نوع عملیات</th>
                  <th className="py-3.5 px-4">عنوان و موضوع</th>
                  <th className="py-3.5 px-4">شخص اقدام‌کننده (Actor)</th>
                  <th className="py-3.5 px-4">تاریخ و زمان</th>
                  <th className="py-3.5 px-4">تیم</th>
                  <th className="py-3.5 px-4 text-center">جزئیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredLogs.map((log) => {
                  const isPurge = log.actionType === 'PERMANENT_DELETE_REPORT' || log.actionType === 'DELETE_REPORT';
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition ${
                        isPurge ? 'bg-rose-50/30 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      <td className="py-3 px-4">{getActionBadge(log.actionType)}</td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-bold text-slate-900 dark:text-white truncate">{log.title}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{log.description}</div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 font-bold text-indigo-700 dark:text-indigo-400">
                          <User className="w-3.5 h-3.5 shrink-0" />
                          <span>{log.actor || 'نامشخص'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{log.persianDate}</span>
                          <span className="text-slate-400">•</span>
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{log.persianTime}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        {log.teamSlug ? (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                            {log.teamSlug}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 dark:bg-slate-800 dark:hover:bg-indigo-950 text-slate-700 hover:text-indigo-600 dark:text-slate-300 dark:hover:text-indigo-400 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مشاهده</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white">جزئیات رکورد نظارتی (Audit Log)</h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                <span className="text-slate-500">نوع اقدام:</span>
                <div>{getActionBadge(selectedLog.actionType)}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                <div className="text-slate-500">عنوان:</div>
                <div className="font-bold text-slate-900 dark:text-white text-sm">{selectedLog.title}</div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700 space-y-1">
                <div className="text-slate-500">توضیحات و شرح رویداد:</div>
                <div className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedLog.description}</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="text-slate-500 text-[11px]">شخص اقدام‌کننده:</div>
                  <div className="font-bold text-indigo-600 dark:text-indigo-400 mt-1">{selectedLog.actor}</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                  <div className="text-slate-500 text-[11px]">زمان ثبت:</div>
                  <div className="font-mono text-[11px] text-slate-700 dark:text-slate-300 mt-1">
                    {selectedLog.persianDate} - {selectedLog.persianTime}
                  </div>
                </div>
              </div>

              {selectedLog.details && (
                <div className="bg-slate-900 text-slate-200 p-3.5 rounded-xl border border-slate-800 font-mono text-[11px] overflow-x-auto max-h-48">
                  <div className="text-slate-400 text-[10px] pb-1 border-b border-slate-800 mb-2 font-sans font-bold">
                    متادیتای خام و مؤلفه‌های پاکسازی‌شده:
                  </div>
                  <pre>{JSON.stringify(selectedLog.details, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
