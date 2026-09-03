import React from 'react';
import { Loader2, CheckCircle2, AlertCircle, CloudCheck, CloudUpload } from 'lucide-react';

export interface SyncStatusBadgeProps {
  status: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt?: Date | null;
  compact?: boolean;
  className?: string;
  errorMessage?: string | null;
}

export const SyncStatusBadge: React.FC<SyncStatusBadgeProps> = ({
  status,
  lastSyncedAt,
  compact = false,
  className = '',
  errorMessage
}) => {
  if (status === 'idle' && !lastSyncedAt) {
    return null;
  }

  if (status === 'syncing') {
    return (
      <div
        id="sync-status-syncing"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 animate-pulse transition-all ${className}`}
        title="در حال همگام‌سازی مستقیم با پایگاه داده فایربیس..."
      >
        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600 dark:text-blue-400 shrink-0" />
        {!compact && <span>در حال ذخیره در دیتابیس...</span>}
      </div>
    );
  }

  if (status === 'synced') {
    return (
      <div
        id="sync-status-synced"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shadow-xs transition-all animate-in fade-in zoom-in-95 duration-200 ${className}`}
        title="اطلاعات با موفقیت در پایگاه داده ابری فایربیس ثبت شد"
      >
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        {!compact && <span>همگام با پایگاه داده</span>}
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        id="sync-status-error"
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 transition-all ${className}`}
        title={errorMessage || 'عدم دسترسی به سرور دیتابیس'}
      >
        <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
        {!compact && <span>{errorMessage || 'خطا در همگام‌سازی'}</span>}
      </div>
    );
  }

  if (lastSyncedAt && !compact) {
    return (
      <div
        id="sync-status-saved"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-500 dark:text-slate-400 ${className}`}
      >
        <CloudCheck className="w-3 h-3 text-slate-400" />
        <span>ذخیره دائمی</span>
      </div>
    );
  }

  return null;
};
