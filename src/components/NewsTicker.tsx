import React, { useState, useEffect } from 'react';
import { PageId } from '../types';
import { getLiveTickerItems, getLatestReportUpdateDate, subscribeToStoreUpdates } from '../utils/reportsStore';
import { formatSmartUpdateDate, toPersianDigits } from '../utils/persianDate';
import { Clock, Radio, Pause, Play } from 'lucide-react';

interface NewsTickerProps {
  onNavigate: (page: PageId) => void;
}

export const NewsTicker: React.FC<NewsTickerProps> = ({ onNavigate }) => {
  const [tickerItems, setTickerItems] = useState(() => getLiveTickerItems());
  const [latestDate, setLatestDate] = useState(() => getLatestReportUpdateDate());
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleStoreChange = () => {
      setTickerItems(getLiveTickerItems());
      setLatestDate(getLatestReportUpdateDate());
    };

    const unsubscribe = subscribeToStoreUpdates(handleStoreChange);
    return () => unsubscribe();
  }, []);

  const updateText = formatSmartUpdateDate(latestDate, { persianDigits: true });

  return (
    <div 
      className="bg-[#f8fafc] dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 overflow-hidden transition-colors" 
      aria-label="گزارش‌های زنده تیم‌ها"
    >
      <div className="max-w-7xl mx-auto flex items-center h-10 px-3">
        {/* Badge Label */}
        <div className="flex-shrink-0 flex items-center gap-2 z-10">
          <div className="flex items-center gap-1.5 bg-[#c62828] text-white px-3 py-1 text-xs font-black rounded-full shadow-xs">
            <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
            <span>گزارش‌های زنده</span>
          </div>
          <span className="hidden md:inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 px-2.5 py-0.5 rounded-full">
            <Clock className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
            <span>{updateText}</span>
          </span>
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="hidden sm:inline-flex items-center p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
            title={isPaused ? 'ادامه حرکت نوار' : 'توقف موقت نوار'}
          >
            {isPaused ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
          </button>
        </div>

        {/* Marquee Track */}
        <div 
          className="flex-1 overflow-hidden relative mr-3 group cursor-pointer"
          title="برای مکث و مطالعه راحت، ماوس را روی متن نگه دارید یا کلیک کنید"
        >
          <div 
            className={`inline-flex items-center gap-12 whitespace-nowrap py-1 transition-all ${
              isPaused ? '' : 'animate-marquee'
            }`}
            style={isPaused ? { animationPlayState: 'paused' } : undefined}
          >
            {tickerItems.map((item, idx) => (
              <button
                key={`t1-${idx}-${item.reportId || idx}`}
                onClick={() => onNavigate(item.target)}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-[#c62828] dark:hover:text-red-400 transition flex items-center gap-2 cursor-pointer focus:outline-none"
              >
                <span className="w-2 h-2 rounded-full bg-[#c62828] dark:bg-red-400 shrink-0"></span>
                <span>{toPersianDigits(item.text)}</span>
              </button>
            ))}
            {/* Duplicated for smooth infinite loop */}
            {tickerItems.map((item, idx) => (
              <button
                key={`t2-${idx}-${item.reportId || idx}`}
                onClick={() => onNavigate(item.target)}
                className="text-xs font-bold text-slate-800 dark:text-slate-200 hover:text-[#c62828] dark:hover:text-red-400 transition flex items-center gap-2 cursor-pointer focus:outline-none"
              >
                <span className="w-2 h-2 rounded-full bg-[#c62828] dark:bg-red-400 shrink-0"></span>
                <span>{toPersianDigits(item.text)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

