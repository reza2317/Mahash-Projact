import React, { useEffect, useState } from 'react';
import { globalEventBus } from '../utils/eventBus';

export const ProgressTracker: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleProgress = (data: { progress: number; message: string; visible: boolean }) => {
      setIsVisible(data.visible);
      if (data.visible) {
        setProgress(data.progress);
        setMessage(data.message);
      }
    };

    globalEventBus.on('SYNC_PROGRESS', handleProgress);
    return () => {
      globalEventBus.off('SYNC_PROGRESS', handleProgress);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] w-[90vw] max-w-sm">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-4 border border-emerald-100 dark:border-emerald-900/30 overflow-hidden relative">
        {/* Progress Background */}
        <div 
          className="absolute inset-0 bg-emerald-50 dark:bg-emerald-900/20 transition-all duration-300 origin-left z-0"
          style={{ width: \`\${progress}%\` }}
        />
        
        <div className="relative z-10 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
              همگام‌سازی ابری...
            </span>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500">
              {progress}%
            </span>
          </div>
          
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: \`\${progress}%\` }}
            />
          </div>
          
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium text-center truncate">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
