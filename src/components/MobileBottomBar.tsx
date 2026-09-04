import React from 'react';
import { PageId } from '../types';
import { useTheme } from '../context/ThemeContext';
import { Home, Users, MessageSquare, UserPlus, Sun, Moon } from 'lucide-react';

interface MobileBottomBarProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({ currentPage, onNavigate }) => {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 z-40 px-2 py-1 shadow-lg grid grid-cols-5 items-center transition-colors duration-200"
      aria-label="منوی دسترسی سریع موبایل"
    >
      <button
        type="button"
        onClick={() => { onNavigate('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
          currentPage === 'home'
            ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 font-bold scale-105'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
        }`}
        aria-label="صفحه اصلی باشگاه جوانان محاش"
        aria-current={currentPage === 'home' ? 'page' : undefined}
      >
        <Home className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span className="text-[10px] leading-tight font-medium">خانه</span>
      </button>

      <button
        type="button"
        onClick={() => { onNavigate('teams-hub'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
          currentPage === 'teams-hub'
            ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 font-bold scale-105'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
        }`}
        aria-label="تیم‌های پنج‌گانه باشگاه"
        aria-current={currentPage === 'teams-hub' ? 'page' : undefined}
      >
        <Users className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span className="text-[10px] leading-tight font-medium">تیم‌ها</span>
      </button>

      <button
        type="button"
        onClick={() => { onNavigate('consultation'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
          currentPage === 'consultation'
            ? 'text-[#0f766e] dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 font-bold scale-105'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#0f766e] dark:hover:text-teal-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
        }`}
        aria-label="بخش مشاوره روانشناسی"
        aria-current={currentPage === 'consultation' ? 'page' : undefined}
      >
        <MessageSquare className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span className="text-[10px] leading-tight font-medium">مشاوره</span>
      </button>

      <button
        type="button"
        onClick={() => { onNavigate('membership'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
        className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl transition-all duration-200 cursor-pointer ${
          currentPage === 'membership'
            ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/60 font-bold scale-105'
            : 'text-slate-600 dark:text-slate-400 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
        }`}
        aria-label="ثبت‌نام و عضویت در باشگاه"
        aria-current={currentPage === 'membership' ? 'page' : undefined}
      >
        <UserPlus className="w-5 h-5 mb-0.5" aria-hidden="true" />
        <span className="text-[10px] leading-tight font-medium">عضویت</span>
      </button>

      <button
        type="button"
        onClick={toggleTheme}
        className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-slate-600 dark:text-amber-300 hover:text-amber-600 dark:hover:text-amber-200 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 transition-all duration-200 active:scale-95 cursor-pointer"
        aria-label={`تغییر حالت تم. در حال حاضر ${resolvedTheme === 'dark' ? 'حالت شب' : 'حالت روز'} فعال است`}
      >
        {resolvedTheme === 'dark' ? (
          <Sun className="w-5 h-5 mb-0.5 text-amber-400 animate-spin-slow" aria-hidden="true" />
        ) : (
          <Moon className="w-5 h-5 mb-0.5 text-slate-700" aria-hidden="true" />
        )}
        <span className="text-[10px] leading-tight font-medium">
          {resolvedTheme === 'dark' ? 'روز' : 'شب'}
        </span>
      </button>
    </nav>
  );
};
