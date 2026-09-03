import React, { useState, useEffect } from 'react';
import { WifiOff, RefreshCw, X } from 'lucide-react';

export const OfflineBanner: React.FC = () => {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOnline = () => { setIsOffline(false); setDismissed(false); };
    const handleOffline = () => { setIsOffline(true); setDismissed(false); };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (dismissed || !isOffline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] bg-slate-800 text-white px-4 py-2.5 flex items-center justify-between shadow-md animate-in slide-in-from-top-full duration-300">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-white/20 rounded-full">
          <WifiOff className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold leading-tight">
          ارتباط با اینترنت قطع شده است. در حال کار به صورت آفلاین.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={() => window.location.reload()}
          className="flex items-center gap-1.5 bg-white text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm cursor-pointer"
        >
          <RefreshCw className="w-3 h-3" />
          تلاش مجدد
        </button>
        <button onClick={() => setDismissed(true)} className="p-1.5 hover:bg-white/20 rounded-lg transition cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
