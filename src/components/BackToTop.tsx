import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

export const BackToTop: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;

      // Show button when scrolled more than 300px
      if (scrollTop > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }

      // Calculate scroll percentage for the circular progress ring
      if (docHeight > 0) {
        const progress = Math.min(100, Math.max(0, Math.round((scrollTop / docHeight) * 100)));
        setScrollProgress(progress);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  // Circular progress calculation (circle radius: 20, circumference = 2 * PI * 20 ≈ 125.66)
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <div
      className={`fixed bottom-20 lg:bottom-8 left-4 sm:left-7 z-40 transition-all duration-300 ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-8 scale-90 pointer-events-none'
      }`}
    >
      <button
        id="btn-back-to-top"
        type="button"
        onClick={scrollToTop}
        aria-label={`بازگشت به بالای صفحه (میزان اسکرول ${scrollProgress} درصد)`}
        title="بازگشت به بالا"
        className="group relative flex items-center justify-center w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-[#173b82] dark:text-sky-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/25 border border-slate-200/80 dark:border-slate-700/80 transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer"
      >
        {/* Circular Progress Ring */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none p-0.5"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          {/* Background track */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="text-slate-200/60 dark:text-slate-800/80"
            strokeWidth="2.5"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Active progress track */}
          <circle
            cx="24"
            cy="24"
            r={radius}
            className="text-blue-600 dark:text-sky-400 transition-all duration-150 ease-out"
            strokeWidth="2.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        {/* Center Arrow Icon */}
        <ArrowUp className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 text-[#173b82] dark:text-sky-300" aria-hidden="true" />

        {/* Hover Tooltip (Left or Top) */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-10 opacity-0 group-hover:opacity-100 group-hover:-top-11 transition-all duration-200 pointer-events-none whitespace-nowrap bg-slate-900/95 dark:bg-slate-800/95 text-white text-xs font-bold px-2.5 py-1 rounded-lg shadow-md border border-slate-700/50" aria-hidden="true">
          بازگشت به بالا ({scrollProgress}٪)
          {/* Tooltip arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900/95 dark:border-t-slate-800/95" />
        </div>
      </button>
    </div>
  );
};
