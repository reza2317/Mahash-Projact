import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, CheckCircle2, RefreshCw } from 'lucide-react';

export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [showReconnected, setShowReconnected] = useState<boolean>(false);
  const [isTesting, setIsTesting] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      const timer = setTimeout(() => setShowReconnected(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      // Small lightweight ping check
      const onlineStatus = navigator.onLine;
      setIsOnline(onlineStatus);
      if (onlineStatus) {
        setShowReconnected(true);
        setTimeout(() => setShowReconnected(false), 3000);
      }
    } catch {
      setIsOnline(false);
    } finally {
      setIsTesting(false);
    }
  };

  // If online and not recently reconnected, don't show intrusive banner
  if (isOnline && !showReconnected) {
    return null;
  }

  return (
    <div
      dir="rtl"
      className="fixed bottom-4 left-4 z-50 max-w-sm sm:max-w-md animate-in fade-in slide-in-from-bottom-5 duration-300 pointer-events-auto"
    >
      {!isOnline ? (
        <div className="bg-slate-900/95 text-white border-2 border-rose-500/80 rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-2.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0 border border-rose-500/40">
              <WifiOff className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-rose-300">
                  وضعیت اتصال: اینترنت قطع است (آفلاین)
                </span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed mt-1">
                هشدار: عملیات ذخیره‌سازی فایل‌ها، تصاویر و امتیازات در وضعیت آفلاین در حافظه مرورگر نگهداری می‌شود و تا زمان اتصال مجدد ممکن است همگام‌سازی کامل انجام نشود.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400 flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>داده‌ها در LocalStorage موقت ثبت می‌شوند</span>
            </span>
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={isTesting}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1 transition cursor-pointer border border-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 ${isTesting ? 'animate-spin' : ''}`} />
              <span>{isTesting ? 'بررسی...' : 'بررسی اتصال'}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-emerald-950/90 text-white border border-emerald-500/60 rounded-2xl p-3.5 shadow-xl backdrop-blur-md flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/40">
            <Wifi className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-xs font-black text-emerald-300 block">
              اتصال اینترنت برقرار شد
            </span>
            <span className="text-[10px] text-emerald-200/80">
              سیستم به حالت آنلاین بازگشت و عملیات ذخیره‌سازی فعال است.
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
