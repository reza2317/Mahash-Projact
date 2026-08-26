import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon, Laptop, Eye, ZoomIn, ZoomOut, Check, Sliders } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'header' | 'mobile-bar' | 'expanded' | 'floating';
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ variant = 'header', className = '' }) => {
  const {
    theme,
    resolvedTheme,
    highContrast,
    textSize,
    setTheme,
    toggleTheme,
    setHighContrast,
    toggleHighContrast,
    setTextSize,
  } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Quick toggle tooltip & title
  const getModeLabel = () => {
    if (theme === 'system') return `سیستم (${resolvedTheme === 'dark' ? 'تاریک' : 'روشن'})`;
    return theme === 'dark' ? 'حالت شب / تاریک' : 'حالت روز / روشن';
  };

  if (variant === 'expanded') {
    return (
      <div className={`p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 text-right ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#173b82] dark:text-blue-400" />
            <h3 className="font-bold text-sm text-slate-800 dark:text-slate-100">تنظیمات تم و دسترسی‌پذیری</h3>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">مناسب برای راحتی چشم و افت شنوایی</span>
        </div>

        {/* Theme mode buttons */}
        <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
              theme === 'light'
                ? 'bg-white dark:bg-slate-700 text-[#173b82] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            aria-pressed={theme === 'light'}
          >
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>روشن</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
              theme === 'dark'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            aria-pressed={theme === 'dark'}
          >
            <Moon className="w-3.5 h-3.5 text-blue-400" />
            <span>تاریک</span>
          </button>
          <button
            onClick={() => setTheme('system')}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition ${
              theme === 'system'
                ? 'bg-white dark:bg-slate-700 text-[#173b82] dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            aria-pressed={theme === 'system'}
          >
            <Laptop className="w-3.5 h-3.5 text-slate-500 dark:text-slate-300" />
            <span>سیستم</span>
          </button>
        </div>

        {/* Accessibility Toggles */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* High Contrast */}
          <button
            onClick={toggleHighContrast}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition ${
              highContrast
                ? 'bg-amber-500 text-slate-950 font-bold border-amber-600'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-400'
            }`}
            aria-label="تغییر کنتراست بالا"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>کنتراست بالا: {highContrast ? 'فعال' : 'عادی'}</span>
          </button>

          {/* Text Size Scale */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 px-1 font-medium">اندازه متن:</span>
            <button
              onClick={() => setTextSize('normal')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition ${textSize === 'normal' ? 'bg-[#173b82] text-white' : 'text-slate-600 dark:text-slate-300'}`}
              title="اندازه عادی"
            >
              عادی
            </button>
            <button
              onClick={() => setTextSize('large')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition ${textSize === 'large' ? 'bg-[#173b82] text-white' : 'text-slate-600 dark:text-slate-300'}`}
              title="اندازه بزرگ (+۲۰٪)"
            >
              بزرگ
            </button>
            <button
              onClick={() => setTextSize('xlarge')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition ${textSize === 'xlarge' ? 'bg-[#173b82] text-white' : 'text-slate-600 dark:text-slate-300'}`}
              title="اندازه خیلی بزرگ (+۴۰٪)"
            >
              خیلی بزرگ
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Header / Standard Dropdown variant
  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <div className="flex items-center gap-1">
        {/* Quick Click Switcher Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className="relative flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white/80 dark:bg-slate-800/90 text-slate-700 dark:text-amber-300 hover:bg-slate-100 dark:hover:bg-slate-700 shadow-2xs hover:shadow-xs transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#173b82] dark:focus:ring-blue-400"
          aria-label={`تغییر حالت تم. وضعیت فعلی: ${getModeLabel()}`}
          title={`تغییر به حالت ${resolvedTheme === 'dark' ? 'روشن' : 'تاریک'}`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="w-5 h-5 text-amber-400 animate-in fade-in zoom-in duration-200" />
          ) : (
            <Moon className="w-5 h-5 text-slate-700 animate-in fade-in zoom-in duration-200" />
          )}
          {highContrast && (
            <span
              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white dark:ring-slate-900"
              title="کنتراست بالا فعال است"
            />
          )}
        </button>

        {/* Options Dropdown Trigger */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="hidden sm:flex items-center justify-center w-6 h-10 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-xs font-bold"
          aria-label="منوی تنظیمات پیشرفته نمایش و دسترسی‌پذیری"
          aria-expanded={isOpen}
          title="تنظیمات دسترسی‌پذیری و تم"
        >
          <span className="text-[10px]">▼</span>
        </button>
      </div>

      {/* Popover Menu */}
      {isOpen && (
        <div
          className="absolute left-0 sm:left-auto right-auto sm:right-0 mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-3.5 z-50 text-right animate-in fade-in slide-in-from-top-2 duration-150"
          role="menu"
          aria-orientation="vertical"
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5 text-[#173b82] dark:text-blue-400" />
              حالت نمایش و خوانایی
            </span>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full font-bold">
              استاندارد دسترس‌پذیری
            </span>
          </div>

          {/* Theme Modes */}
          <div className="space-y-1 mb-3">
            <button
              onClick={() => {
                setTheme('light');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                theme === 'light'
                  ? 'bg-blue-50 dark:bg-slate-800 text-[#173b82] dark:text-blue-300 font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Sun className="w-3.5 h-3.5" />
                </div>
                <span>حالت روز (روشن)</span>
              </div>
              {theme === 'light' && <Check className="w-4 h-4 text-[#173b82] dark:text-blue-300" />}
            </button>

            <button
              onClick={() => {
                setTheme('dark');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                theme === 'dark'
                  ? 'bg-blue-50 dark:bg-slate-800 text-[#173b82] dark:text-blue-300 font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-800 text-blue-300 flex items-center justify-center">
                  <Moon className="w-3.5 h-3.5" />
                </div>
                <span>حالت شب (تاریک - کاهش خستگی چشم)</span>
              </div>
              {theme === 'dark' && <Check className="w-4 h-4 text-[#173b82] dark:text-blue-300" />}
            </button>

            <button
              onClick={() => {
                setTheme('system');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition ${
                theme === 'system'
                  ? 'bg-blue-50 dark:bg-slate-800 text-[#173b82] dark:text-blue-300 font-black'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center">
                  <Laptop className="w-3.5 h-3.5" />
                </div>
                <span>هماهنگ با تنظیمات دستگاه</span>
              </div>
              {theme === 'system' && <Check className="w-4 h-4 text-[#173b82] dark:text-blue-300" />}
            </button>
          </div>

          {/* High Contrast & Font Sizing Section */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
            <button
              onClick={toggleHighContrast}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold border transition ${
                highContrast
                  ? 'bg-amber-400 text-slate-950 border-amber-500 font-black'
                  : 'bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>کنتراست فوق‌العاده بالا</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-black/10 dark:bg-white/10 font-bold">
                {highContrast ? 'فعال' : 'غیرفعال'}
              </span>
            </button>

            {/* Scale buttons */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium pr-1">درشت‌نمایی متن:</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setTextSize('normal')}
                  className={`px-2 py-1 rounded text-xs font-bold transition ${
                    textSize === 'normal' ? 'bg-[#173b82] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  عادی
                </button>
                <button
                  onClick={() => setTextSize('large')}
                  className={`px-2 py-1 rounded text-xs font-bold transition ${
                    textSize === 'large' ? 'bg-[#173b82] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  بزرگ
                </button>
                <button
                  onClick={() => setTextSize('xlarge')}
                  className={`px-2 py-1 rounded text-xs font-bold transition ${
                    textSize === 'xlarge' ? 'bg-[#173b82] dark:bg-blue-600 text-white' : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  خیلی بزرگ
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
