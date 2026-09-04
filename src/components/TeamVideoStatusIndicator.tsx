import React from 'react';
import { 
  Database, 
  RefreshCw, 
  AlertTriangle
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';
import { isAdminAuthenticated } from '../utils/reportsStore';

interface TeamVideoStatusIndicatorProps {
  status: 'idle' | 'loading' | 'ready' | 'error';
  isFromCache: boolean;
  resourceSizeBytes?: number;
  errorMessage?: string | null;
  onRetry?: () => void;
  reportTitle?: string;
}

export const TeamVideoStatusIndicator: React.FC<TeamVideoStatusIndicatorProps> = ({
  status,
  isFromCache,
  resourceSizeBytes,
  errorMessage,
  onRetry
}) => {
  const isAdmin = isAdminAuthenticated();

  const formatBytes = (bytes?: number) => {
    if (!bytes) return null;
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${toPersianDigits(mb.toFixed(1))} مگابایت`;
    const kb = bytes / 1024;
    return `${toPersianDigits(kb.toFixed(0))} کیلوبایت`;
  };

  const formattedSize = formatBytes(resourceSizeBytes);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-between gap-2 px-3.5 py-2 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-2xl text-xs text-sky-800 dark:text-sky-200 shadow-2xs animate-pulse">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
          <span className="font-bold">در حال آماده‌سازی ویدیوی گزارش...</span>
        </div>
        <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">لطفاً شکیبا باشید</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-between flex-wrap gap-2 px-3.5 py-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-xs text-rose-800 dark:text-rose-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="font-bold">
            {errorMessage || 'خطا در بارگذاری فایل ویدیو. ممکن است فایل در دسترس نباشد.'}
          </span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
          >
            <RefreshCw className="w-3 h-3" />
            <span>تلاش مجدد</span>
          </button>
        )}
      </div>
    );
  }

  // Only display technical cache diagnostics banner for Admin panel
  if (isAdmin && status === 'ready' && isFromCache) {
    return (
      <div className="flex items-center justify-between gap-2 px-3.5 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl text-xs text-emerald-800 dark:text-emerald-300 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-bold">ویدیو با موفقیت بارگذاری شد</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
          {formattedSize && (
            <span className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-md">
              حجم: {formattedSize}
            </span>
          )}
          <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-md text-[10px] font-bold">
            کش بدون مصرف حجم
          </span>
        </div>
      </div>
    );
  }

  return null;
};
