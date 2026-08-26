import React, { useState } from 'react';
import { PageId } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import {
  Calendar,
  Sparkles,
  CheckCircle2,
  FileText,
  Award,
  Users,
  Compass,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

interface EventsPageProps {
  onNavigate: (page: PageId) => void;
}

export const EventsPage: React.FC<EventsPageProps> = ({ onNavigate }) => {
  const documentedSessions = [
    {
      num: 'جلسه ۱',
      title: 'آغاز مسیر تیم‌سازی',
      desc: 'برگزاری اولین جلسه و شکل‌گیری تیم‌های اولیه باشگاه جوانان با حضور پرشور اعضا',
      tag: 'تیم‌سازی'
    },
    {
      num: 'جلسه ۲',
      title: 'ساختن هویت و ارزش‌های تیمی',
      desc: 'تعیین نقش‌ها، اهداف و تقویت روحیه کار تیمی در کانون جوانان محاش',
      tag: 'هویت تیمی'
    },
    {
      num: 'جلسه ۳',
      title: 'محک زدن توانایی‌ها در میدان رقابت',
      desc: 'رقابت‌های سازنده، بازی‌های ذهنی و مهارت تفکر سریع و حل مسئله',
      tag: 'چالش فکری'
    },
    {
      num: 'جلسه ۴',
      title: 'هنر خودمراقبتی در قالب تئاتر',
      desc: 'اجرای نمایش خلاقانه با محوریت سلامت روان، همدلی و ارتقای اعتمادبه‌نفس',
      tag: 'خودمراقبتی'
    },
    {
      num: 'جلسه ۵',
      title: 'رویا، امید و تلاش؛ سفری به سوی آینده',
      desc: 'برنامه‌ریزی شغلی و فردی، اشتراک‌گذاری رؤیاها و انگیزه برای موفقیت',
      tag: 'آینده‌سازی'
    },
    {
      num: 'جلسه ۶',
      title: 'مرور مسیر طی‌شده و تثبیت آموخته‌ها',
      desc: 'ارزیابی دستاوردها، امتیازدهی تیمی و دریافت بازخورد سازنده اعضا',
      tag: 'جمع‌بندی'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-10">
      <Breadcrumb items={[{ label: 'رویدادها و تقویم برنامه‌ها' }]} onNavigate={onNavigate} />

      {/* Hero Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800 shadow-xs">
          <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
          <span>تقویم و رویدادهای رسمی موسسه محاش</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100 leading-tight">
          تقویم برنامه‌ها، همایش‌ها و کارگاه‌های آموزشی
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
          مشاهده برنامه‌های پیش‌رو، رزرو رایگان صندلی، دانلود تقویم جلسات و مرور مسیر دوره‌های برگزارشده باشگاه جوانان موسسه محاش
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-1">
          <span className="block text-2xl font-black text-[#173b82] dark:text-blue-400">
            {toPersianDigits(9)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">برنامه فعال تقویم</span>
        </div>
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-1">
          <span className="block text-2xl font-black text-[#0f766e] dark:text-teal-400">
            {toPersianDigits(6)}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">جلسه مستند شده</span>
        </div>
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-1">
          <span className="block text-2xl font-black text-purple-600 dark:text-purple-400">۱۰۰٪</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">همراه با مترجم زبان اشاره</span>
        </div>
        <div className="bg-white dark:bg-slate-850 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs text-center space-y-1">
          <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">رایگان</span>
          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">برای اعضای محاش</span>
        </div>
      </div>

      {/* Main Interactive Calendar Section */}
      <section className="space-y-4">
        <InteractiveCalendar onNavigate={onNavigate} />
      </section>

      {/* Historical 6 Sessions Documentation Section */}
      <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/70 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
              آرشیو جلسات برگزارشده
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
              مسیر ۶ جلسه مستند باشگاه جوانان محاش
            </h2>
          </div>
          <button
            onClick={() => onNavigate('education')}
            className="text-xs font-bold text-[#173b82] dark:text-blue-400 hover:underline self-start sm:self-auto"
          >
            مشاهده سرفصل‌های آموزشی این جلسات ←
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {documentedSessions.map((ev, i) => (
            <div
              key={i}
              className="bg-white dark:bg-slate-850 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:shadow-md transition"
            >
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-950/80 text-[#173b82] dark:text-blue-300 text-xs font-black rounded-full border border-blue-100 dark:border-blue-800">
                  {ev.num}
                </span>
                <span className="text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {ev.tag}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{ev.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{ev.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Report PDF Callout */}
      <div className="bg-gradient-to-r from-blue-50 via-teal-50/50 to-indigo-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200/80 dark:border-blue-800/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
        <div className="space-y-1.5 text-right">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#173b82] dark:text-blue-400" />
            <h3 className="text-lg font-black text-[#173b82] dark:text-blue-400">
              گزارش کامل فعالیت‌های باشگاه جوانان (نسخه PDF)
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
            مستندات کامل، عکس‌های باکیفیت جلسات و نتایج رقابت‌های تیم‌های ۵‌گانه در قالب سند رسمی پی‌دی‌اف منتشر شده است.
          </p>
        </div>
        <button
          onClick={() => onNavigate('team-tomorrow')}
          className="px-6 py-3 bg-[#173b82] hover:bg-[#0f275a] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shrink-0 shadow-md transition cursor-pointer"
        >
          مشاهده مستندات و دانلود گزارش ←
        </button>
      </div>
    </div>
  );
};
