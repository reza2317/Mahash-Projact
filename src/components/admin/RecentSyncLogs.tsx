import React from 'react';
import { Activity, CheckCircle2, XCircle, Clock, RefreshCw, AlertTriangle, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { SyncAttemptLog } from '../../utils/reportsStore';

interface RecentSyncLogsProps {
  logs: SyncAttemptLog[];
  lastSyncedTimestamp: string | null;
  onRefreshNow?: () => void;
  isRefreshing?: boolean;
}

export const RecentSyncLogs: React.FC<RecentSyncLogsProps> = ({
  logs,
  lastSyncedTimestamp,
  onRefreshNow,
  isRefreshing = false,
}) => {
  const recentLogs = logs.slice(0, 5);

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const formatDateLabel = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('fa-IR', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const getTypeBadge = (type: SyncAttemptLog['type']) => {
    switch (type) {
      case 'force_refresh':
        return (
          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 border border-sky-400/20 text-sky-400 text-[10px] font-bold flex items-center gap-1">
            <RefreshCw className="w-2.5 h-2.5" />
            نوسازی اجباری (Force)
          </span>
        );
      case 'push':
        return (
          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
            <ArrowUpCircle className="w-2.5 h-2.5" />
            انتشار سراسری (Push)
          </span>
        );
      case 'pull':
        return (
          <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-400/20 text-blue-400 text-[10px] font-bold flex items-center gap-1">
            <ArrowDownCircle className="w-2.5 h-2.5" />
            دریافت دستی (Pull)
          </span>
        );
      case 'auto_poll':
        return (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-400/20 text-purple-400 text-[10px] font-bold flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            همگام‌سازی خودکار
          </span>
        );
    }
  };

  return (
    <div className="bg-white dark:bg-[#11161d] rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/50 rounded-xl text-indigo-600 dark:text-indigo-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
              <span>گزارش ۵ تلاش اخیر همگام‌سازی پس‌زمینه</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              مشاهده سریع وضعیت درخواست‌ها و نتایج ارتباط با سرور بدون نیاز به کلیک مداوم
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {lastSyncedTimestamp && (
            <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] font-medium flex items-center gap-1.5 border border-slate-200/60 dark:border-slate-700/60">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>آخرین اتصال موفق:</span>
              <span className="font-bold text-slate-800 dark:text-slate-100" dir="ltr">
                {formatTimestamp(lastSyncedTimestamp)}
              </span>
            </div>
          )}

          {onRefreshNow && (
            <button
              onClick={onRefreshNow}
              disabled={isRefreshing}
              aria-label="بررسی مجدد و دریافت وضعیت همگام‌سازی از سرور"
              className="px-3 py-1.5 bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-sky-200 dark:border-sky-800/60 cursor-pointer disabled:opacity-50"
              title="نوسازی اطلاعات"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} aria-hidden="true" />
              <span>{isRefreshing ? 'در حال دریافت...' : 'بررسی مجدد'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Logs Table / Cards */}
      <div className="space-y-2">
        {recentLogs.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500 italic bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
            هنوز لاگی برای همگام‌سازی سرور ثبت نشده است. با کلیک روی «نوسازی اجباری» یا ذخیره اطلاعات اولین لاگ ثبت می‌گردد.
          </div>
        ) : (
          recentLogs.map((log) => (
            <div
              key={log.id}
              className={`p-3 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                log.success
                  ? 'bg-slate-50/70 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-800/80 hover:border-emerald-500/40'
                  : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40'
              }`}
            >
              <div className="flex items-start sm:items-center gap-2.5 min-w-0">
                <div className="mt-0.5 sm:mt-0 shrink-0">
                  {log.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-500" />
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getTypeBadge(log.type)}
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                      {log.message}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0 self-end sm:self-center text-[11px] text-slate-400 dark:text-slate-500">
                {log.durationMs !== undefined && (
                  <span className="font-mono text-[10px] bg-slate-200/60 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">
                    {log.durationMs}ms
                  </span>
                )}
                <span className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400" dir="ltr">
                  <Clock className="w-3 h-3" />
                  {formatTimestamp(log.timestamp)}
                  <span className="text-[10px] text-slate-400">({formatDateLabel(log.timestamp)})</span>
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
