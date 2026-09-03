import React, { useEffect, useState, useRef } from 'react';
import { globalEventBus } from '../utils/eventBus';
import { RefreshCw, XCircle, Search } from 'lucide-react';
import { checkIndexedDBHealth } from '../utils/indexedDBHelper';

export const ProgressTracker: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');
  const [isStalled, setIsStalled] = useState(false);
  const [troubleshootResult, setTroubleshootResult] = useState('');
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleProgress = (data: { progress: number; message: string; visible: boolean }) => {
      setIsVisible(data.visible);
      if (data.visible) {
        setProgress(data.progress);
        
        let displayMessage = data.message;
        if (data.progress < 20 && !data.message.includes('بسته')) displayMessage = 'در حال آماده‌سازی و فشرده‌سازی اطلاعات...';
        else if (data.progress >= 40 && data.progress < 90 && !data.message.includes('پردازش')) displayMessage = 'در حال ارسال و آپلود به سرور... (' + data.message + ')';
        else if (data.progress >= 90) displayMessage = 'در حال پردازش نهایی و ذخیره‌سازی...';
        
        setMessage(displayMessage);
        setIsStalled(false);
        setTroubleshootResult('');
      }
    };
    globalEventBus.on('SYNC_PROGRESS', handleProgress);
    return () => {
      globalEventBus.off('SYNC_PROGRESS', handleProgress);
    };
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    if (isVisible && progress > 0 && progress < 100 && !isStalled) {
      timerRef.current = setTimeout(() => {
        setIsStalled(true);
        globalEventBus.emit('ABORT_SYNC_REQUEST');
      }, 10000);
    }
    
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [progress, isVisible, isStalled]);

  const handleRetry = () => {
    setIsStalled(false);
    setTroubleshootResult('');
    globalEventBus.emit('RETRY_SYNC_REQUEST', { progress });
  };

  const handleCancel = () => {
    setIsVisible(false);
    setProgress(0);
    setIsStalled(false);
  };

  const handleTroubleshoot = async () => {
    setTroubleshootResult('در حال بررسی شبکه و دیتابیس...');
    
    const dbHealthy = await checkIndexedDBHealth();
    
    setTimeout(() => {
       setTroubleshootResult(`اینترنت: ${navigator.onLine ? 'متصل' : 'قطع'} | دیتابیس محلی: ${dbHealthy ? 'سالم' : 'پر یا خطا'}`);
    }, 800);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 overflow-hidden relative">
        <div 
          className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/20 transition-all duration-300 origin-left z-0"
          style={{ width: `${progress}%` }}
        />
        
        <div className="relative z-10 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
              {isStalled ? 'عملیات متوقف شد' : 'همگام‌سازی ابری...'}
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
              {progress}%
            </span>
          </div>
          
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${isStalled ? 'bg-rose-500' : 'bg-emerald-500'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <p className="text-[10px] text-slate-600 dark:text-slate-300 font-medium text-center truncate">
            {isStalled ? 'خطا در ارتباط با سرور. زمان انتظار تمام شد.' : message}
          </p>

          {isStalled && (
             <div className="flex flex-col gap-2 mt-2 border-t border-slate-100 dark:border-slate-700 pt-2">
                <div className="flex justify-between gap-2">
                   <button onClick={handleRetry} className="flex-1 py-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-emerald-200 transition">
                     <RefreshCw className="w-3 h-3" /> تلاش مجدد
                   </button>
                   <button onClick={handleCancel} className="flex-1 py-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-rose-200 transition">
                     <XCircle className="w-3 h-3" /> لغو
                   </button>
                </div>
                {progress >= 40 && (
                   <button onClick={handleTroubleshoot} className="w-full py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 hover:bg-blue-100 transition">
                     <Search className="w-3 h-3" /> عیب‌یابی شبکه و حافظه
                   </button>
                )}
                {troubleshootResult && (
                   <div className="text-[10px] bg-slate-50 dark:bg-slate-700/50 p-2 rounded text-slate-600 dark:text-slate-300 mt-1 text-center font-bold">
                     {troubleshootResult}
                   </div>
                )}
             </div>
          )}
        </div>
      </div>
    </div>
  );
};
