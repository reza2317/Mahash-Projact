import React, { useState, useEffect, useMemo } from 'react';
import { PageId, TeamData, ActivityReport } from '../types';
import {
  getAllTeamsList,
  getAllReports,
  getLatestReportUpdateDate,
  getMahashLogo,
  subscribeToStoreUpdates
} from '../utils/reportsStore';
import { getTeamLogoPlaceholder } from '../utils/assets';
import { formatSmartUpdateDate, toPersianDigits, formatReportNumberDisplay } from '../utils/persianDate';
import { InteractiveCalendar } from '../components/InteractiveCalendar';
import { FormattedText } from '../components/FormattedText';
import {
  Users,
  UserPlus,
  MessageSquare,
  Award,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Calendar,
  Info,
  Play,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Heart,
  Tv,
  Paperclip,
  FileText,
  Video,
  Layers,
  Clock
} from 'lucide-react';

interface HomePageProps {
  onNavigate: (page: PageId) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate }) => {
  const [teamsList, setTeamsList] = useState<TeamData[]>(() => getAllTeamsList());
  const [rawReportsList, setRawReportsList] = useState<ActivityReport[]>(() => getAllReports());
  const [mahashLogoSrc, setMahashLogoSrc] = useState<string>(() => getMahashLogo());
  
  // Team carousel state
  const [activeTeamIndex, setActiveTeamIndex] = useState(0);
  const [isCarouselPaused, setIsCarouselPaused] = useState(false);

  // Latest activities accordion state - default to first team
  const [openActivityTeam, setOpenActivityTeam] = useState<string | null>(() => {
    const list = getAllTeamsList();
    return list.length > 0 ? list[0].id : 'tomorrow';
  });

  // Subscribe to updates from store
  useEffect(() => {
    const refresh = () => {
      setTeamsList(getAllTeamsList());
      setRawReportsList(getAllReports());
      setMahashLogoSrc(getMahashLogo());
    };
    const unsub = subscribeToStoreUpdates(refresh);
    return () => unsub();
  }, []);

  // 5-second carousel timer
  useEffect(() => {
    if (isCarouselPaused || teamsList.length === 0) return;
    const interval = setInterval(() => {
      setActiveTeamIndex((prev) => (prev + 1) % teamsList.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [isCarouselPaused, teamsList.length]);

  // Guaranteed Deduplication of Reports
  const deduplicatedReports = useMemo<ActivityReport[]>(() => {
    const seen = new Set<string>();
    const uniqueList: ActivityReport[] = [];
    for (const r of rawReportsList) {
      const key = `${r.teamSlug || ''}_${r.id}_${r.title}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueList.push(r);
      }
    }
    return uniqueList;
  }, [rawReportsList]);

  // Video reports list (Deduplicated)
  const videoReports = useMemo(() => {
    const seen = new Set<string>();
    return deduplicatedReports
      .filter((r) => Boolean(r.videoSrc && r.videoSrc !== '#'))
      .filter((r) => {
        const key = `${r.teamSlug}_${r.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [deduplicatedReports]);

  const featuredVideos = videoReports.length > 0 ? videoReports.slice(0, 2) : [];

  const currentTeam = teamsList[activeTeamIndex] || teamsList[0];

  const getTeamPageId = (slugOrId: string): PageId => {
    const clean = slugOrId.replace(/^team-/, '');
    return `team-${clean}` as PageId;
  };

  return (
    <div className="space-y-12 pb-16">
      {/* 1. Hero Section with Value Orbit */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/70 via-slate-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 pt-10 pb-16 border-b border-slate-200 dark:border-slate-800 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Copy */}
            <div className="lg:col-span-7 space-y-6 text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-[#173b82] dark:text-blue-300 text-xs font-black shadow-xs border border-blue-200 dark:border-blue-800">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>باشگاه جوانان موسسه محاش</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-slate-100 leading-tight">
                جایی برای <span className="text-[#173b82] dark:text-blue-400">رشد</span>، دوستی و{' '}
                <span className="text-[#0f766e] dark:text-teal-400">آینده‌ای درخشان</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl font-medium">
                فضایی پویا و الهام‌بخش برای جوانان دارای افت شنوایی؛ جایی برای یادگیری، ارتباطات صمیمانه، شکوفایی خلاقیت و مشارکت در تیم‌های تخصصی.
              </p>

              {/* Stats Counters */}
              <div className="flex flex-wrap gap-4 pt-2">
                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-5 py-3 shadow-xs">
                  <span className="block text-2xl font-black text-[#173b82] dark:text-blue-400">
                    {toPersianDigits(teamsList.length)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">تیم فعال باشگاه</span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-5 py-3 shadow-xs">
                  <span className="block text-2xl font-black text-[#0f766e] dark:text-teal-400">
                    {toPersianDigits(deduplicatedReports.length)}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">گزارش ثبت‌شده</span>
                </div>
                <div className="bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-2xl px-5 py-3 shadow-xs">
                  <span className="block text-2xl font-black text-amber-600 dark:text-amber-400">۱۰۰٪</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">دسترسی‌پذیر و متنی</span>
                </div>
              </div>
            </div>

            {/* Orbit Graphic */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
                {/* Rings */}
                <div className="absolute inset-0 rounded-full border border-blue-200/60 dark:border-blue-800/60 animate-pulse"></div>
                <div className="absolute inset-6 rounded-full border border-teal-200/50 dark:border-teal-800/50"></div>

                {/* Central Logo */}
                <div className="w-32 h-32 rounded-full bg-white dark:bg-slate-800 shadow-xl border-4 border-white dark:border-slate-700 p-2 z-10 flex items-center justify-center">
                  <img
                    src={mahashLogoSrc}
                    alt="لوگوی رسمی محاش"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>

                {/* Orbit Card: جوانان */}
                <div className="absolute top-2 right-2 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs border border-slate-200 dark:border-slate-700 shadow-md rounded-2xl px-3.5 py-2 z-20 text-center animate-float">
                  <strong className="block text-sm font-black text-[#173b82] dark:text-blue-400">جوانان</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">یادگیری و مشارکت</span>
                </div>

                {/* Orbit Card: ارتباط */}
                <div className="absolute top-10 left-0 bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs border border-slate-200 dark:border-slate-700 shadow-md rounded-2xl px-3.5 py-2 z-20 text-center animate-float" style={{ animationDelay: '1.2s' }}>
                  <strong className="block text-sm font-black text-[#0f766e] dark:text-teal-400">ارتباط</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">جامعه و دوستی</span>
                </div>

                {/* Orbit Card: مهارت */}
                <div className="absolute bottom-2 inset-x-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur-xs border border-slate-200 dark:border-slate-700 shadow-md rounded-2xl px-4 py-2 z-20 text-center animate-float" style={{ animationDelay: '2.4s' }}>
                  <strong className="block text-sm font-black text-amber-700 dark:text-amber-400">مهارت و آینده</strong>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold">آمادگی شغلی و فردی</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Primary Pathway Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pathway: تیم‌ها */}
          <button
            onClick={() => onNavigate('teams-hub')}
            className="flex flex-col text-right bg-gradient-to-b from-white to-blue-50/50 dark:from-slate-800 dark:to-slate-800/95 p-6 rounded-3xl border border-blue-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-[#173b82] dark:text-blue-300 border border-blue-200/50 dark:border-blue-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[#173b82] dark:text-blue-300 mb-2">تیم‌های باشگاه</h2>
            <p className="text-sm text-slate-600 dark:text-slate-200 flex-1 leading-relaxed font-medium">
              با ۵ تیم فعال، مدیران، اعضا، شعارها و فعالیت‌های مستند باشگاه آشنا شوید.
            </p>
            <span className="text-sm font-bold text-[#173b82] dark:text-blue-400 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span>ورود به تیم‌ها</span>
              <span>←</span>
            </span>
          </button>

          {/* Pathway: عضویت */}
          <button
            onClick={() => onNavigate('membership')}
            className="flex flex-col text-right bg-gradient-to-b from-white to-teal-50/50 dark:from-slate-800 dark:to-slate-800/95 p-6 rounded-3xl border border-teal-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-100 dark:bg-teal-950/80 text-[#0f766e] dark:text-teal-300 border border-teal-200/50 dark:border-teal-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserPlus className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[#0f766e] dark:text-teal-300 mb-2">عضویت در محاش</h2>
            <p className="text-sm text-slate-600 dark:text-slate-200 flex-1 leading-relaxed font-medium">
              ثبت‌نام آنلاین و پیوستن به خانواده بزرگ اعضای موسسه و تیم‌های جوانان.
            </p>
            <span className="text-sm font-bold text-[#0f766e] dark:text-teal-400 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span>تکمیل فرم عضویت</span>
              <span>←</span>
            </span>
          </button>

          {/* Pathway: مشاوره */}
          <button
            onClick={() => onNavigate('consultation')}
            className="flex flex-col text-right bg-gradient-to-b from-white to-indigo-50/50 dark:from-slate-800 dark:to-slate-800/95 p-6 rounded-3xl border border-indigo-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
          >
            <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-950/80 text-[#4338ca] dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-800 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-black text-[#4338ca] dark:text-indigo-300 mb-2">رزرو مشاوره</h2>
            <p className="text-sm text-slate-600 dark:text-slate-200 flex-1 leading-relaxed font-medium">
              رزرو نوبت مشاوره متنی و روانشناسی با مشاوران رسمی موسسه محاش.
            </p>
            <span className="text-sm font-bold text-[#4338ca] dark:text-indigo-400 mt-4 flex items-center gap-1 group-hover:gap-2 transition-all">
              <span>درخواست مشاوره</span>
              <span>←</span>
            </span>
          </button>
        </div>

        {/* Accessibility Notice */}
        <div className="mt-6 bg-[#eef6f8] dark:bg-slate-800 border border-[#cfe3ea] dark:border-teal-800/80 rounded-2xl p-4 flex items-center gap-3 text-slate-800 dark:text-slate-200 text-sm">
          <div className="w-9 h-9 rounded-xl bg-[#147d70] dark:bg-teal-600 text-white flex items-center justify-center shrink-0 font-bold">
            ♿
          </div>
          <div>
            <strong className="text-slate-900 dark:text-white">ویژه ناشنوایان و کم‌شنوایان:</strong> تمامی مسیرها، رزروها و آموزش‌ها به‌صورت متنی و تصویری با زیرنویس فارسی طراحی شده‌اند.
          </div>
        </div>
      </section>

      {/* 3. Five-Team Interactive Poster Carousel - LIGHT, HIGH CONTRAST THEME */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-b from-sky-50/80 via-white to-blue-50/60 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 rounded-3xl p-6 sm:p-10 text-slate-900 dark:text-slate-100 shadow-md border border-blue-100 dark:border-slate-800 overflow-hidden relative">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <span className="inline-block px-3 py-1 bg-blue-100 dark:bg-blue-950/80 text-[#173b82] dark:text-blue-300 text-xs font-bold rounded-full mb-2 border border-blue-200 dark:border-blue-800">
              باشگاه جوانان محاش
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-[#173b82] dark:text-blue-400">
              پنج تیم فعال، پنج مسیر برای درخشیدن
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
              هر تیم یک خانواده پویا برای یادگیری، دوستی، خلاقیت و اثرگذاری است.
            </p>
          </div>

          {/* Carousel Stage Card - High Contrast Light Surface */}
          <div
            className="max-w-xl mx-auto bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 shadow-xl relative transition-all duration-500 border-2 border-blue-100 dark:border-slate-700"
            onMouseEnter={() => setIsCarouselPaused(true)}
            onMouseLeave={() => setIsCarouselPaused(false)}
          >
            {/* Team Counter */}
            <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
              <span className="font-bold text-[#173b82] dark:text-blue-400">تیم {toPersianDigits(activeTeamIndex + 1)} از ۵</span>
              <span className="bg-blue-50 dark:bg-slate-700 text-[#173b82] dark:text-blue-300 border border-blue-200 dark:border-slate-600 px-2.5 py-1 rounded-full font-bold">
                {currentTeam.name}
              </span>
            </div>

            {/* Team Logo & Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-700 shadow-md p-1 bg-white dark:bg-slate-700">
                <img
                  src={currentTeam.logo || getTeamLogoPlaceholder(currentTeam.id, currentTeam.name)}
                  alt={currentTeam.name}
                  className="w-full h-full object-contain rounded-full"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(currentTeam.id, currentTeam.name);
                  }}
                />
              </div>
            </div>

            {/* Team Info */}
            <div className="text-center space-y-3">
              <h3 className="text-2xl font-black text-[#173b82] dark:text-blue-400">{currentTeam.name}</h3>

              <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-700/80 border border-slate-200/70 dark:border-slate-600 px-3.5 py-1.5 rounded-full text-xs">
                <span className="text-slate-500 dark:text-slate-400 font-medium">مدیر تیم:</span>
                <strong className="text-slate-800 dark:text-slate-100 font-bold">{currentTeam.manager}</strong>
              </div>

              {currentTeam.slogan && (
                <div className="bg-gradient-to-r from-[#173b82] to-[#2563eb] text-white py-2.5 px-4 rounded-xl text-sm font-bold shadow-xs">
                  «{currentTeam.slogan}»
                </div>
              )}

              {/* Members */}
              <div className="pt-2">
                <span className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2">اعضای تیم:</span>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {currentTeam.members.map((m, i) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200 px-2.5 py-1 rounded-full font-medium"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Action link */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-center">
              <button
                onClick={() => onNavigate(getTeamPageId(currentTeam.id))}
                className="w-full py-2.5 px-4 bg-[#0f766e] hover:bg-[#115e59] dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <span>مشاهده صفحه اختصاصی {currentTeam.name}</span>
                <span>←</span>
              </button>
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <button
              onClick={() => setActiveTeamIndex((prev) => (prev - 1 + teamsList.length) % teamsList.length)}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
              aria-label="تیم قبلی"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              {teamsList.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveTeamIndex(i)}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    i === activeTeamIndex ? 'w-8 bg-[#173b82] dark:bg-blue-400' : 'w-2.5 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400'
                  }`}
                  aria-label={`نمایش تیم ${i + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setActiveTeamIndex((prev) => (prev + 1) % teamsList.length)}
              className="p-2.5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition cursor-pointer shadow-xs"
              aria-label="تیم بعدی"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 3.5. Featured Video Broadcasts / Public Video Reports - HIGH CONTRAST & CLEAR TEXT */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 text-slate-900 dark:text-slate-100 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/70 text-[#173b82] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800 mb-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <Tv className="w-3.5 h-3.5" />
                <span>پخش و انتشار سراسری برای عموم</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                ویدیوهای رسمی و گزارش‌های تصویری باشگاه
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-medium">
                ویدیوهای منتشرشده با کیفیت Full HD، زیرنویس فارسی و مستندسازی فعالیت تیم‌ها
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('teams-hub')}
                className="px-4 py-2.5 bg-[#173b82] hover:bg-[#0f2f6b] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <span>مشاهده تمام تیم‌ها و گزارش‌ها</span>
                <span>←</span>
              </button>
            </div>
          </div>

          {/* Dynamic Video Cards with Clean Light Styling */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featuredVideos.length > 0 ? (
              featuredVideos.map((video, idx) => {
                const targetTeamPage = getTeamPageId(video.teamSlug || 'thinker');
                const cleanTeamName = video.teamName?.startsWith('تیم ')
                  ? video.teamName
                  : `تیم ${video.teamName || 'باشگاه'}`;

                return (
                  <div
                    key={video.id || idx}
                    className="bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/60 border-2 border-slate-200/90 dark:border-slate-700 rounded-2xl p-5 sm:p-6 transition flex flex-col justify-between group shadow-sm hover:shadow-md"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`px-2.5 py-1 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 ${
                          idx === 0 ? 'bg-[#173b82]' : 'bg-[#0f766e]'
                        }`}>
                          <Play className="w-3 h-3 fill-current" />
                          <span>{formatReportNumberDisplay(video.reportNum) || `گزارش ${toPersianDigits(idx + 1)}`} ({cleanTeamName})</span>
                        </span>
                        <span className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 dark:border-slate-600 font-bold">
                          {video.videoDuration ? `مدت: ${toPersianDigits(video.videoDuration)}` : 'ویدیوی رسمی با کیفیت بالا'}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 group-hover:text-[#173b82] dark:group-hover:text-blue-300 transition line-clamp-2">
                        {video.title}
                      </h3>

                      {video.summary && (
                        <FormattedText
                          text={video.summary}
                          className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3 font-medium"
                        />
                      )}

                      {video.keyPoints && video.keyPoints.length > 0 && (
                        <div className="bg-amber-50/90 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-slate-800 dark:text-slate-200 space-y-1">
                          <div className="text-[11px] text-amber-800 dark:text-amber-300 font-black">محور کلیدی:</div>
                          <p className="font-bold text-slate-800 dark:text-amber-100 line-clamp-2">
                            «{video.keyPoints[0]}»
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
                      <span className="text-xs text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{video.transcript && video.transcript.length > 0 ? 'زیرنویس فارسی هماهنگ' : 'مستند ویدیویی رسمی'}</span>
                      </span>
                      <button
                        onClick={() => onNavigate(targetTeamPage)}
                        className="px-4 py-2 bg-[#173b82] hover:bg-[#0f2f6b] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs hover:shadow-md cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>مشاهده در صفحه {cleanTeamName}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-2 text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
                در حال حاضر ویدیوی جدیدی منتشر نشده است. به زودی گزارش‌های تصویری تیم‌ها افزوده می‌شود.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Latest Activities Accordion - Fully Dynamic & Single Update Date */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="inline-block text-xs font-bold text-[#0f766e] dark:text-teal-300 bg-teal-50 dark:bg-teal-950/70 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
                  {toPersianDigits(deduplicatedReports.length)} گزارش ثبت‌شده
                </span>
                {/* Display strictly the single latest update date */}
                <span className="inline-block text-xs font-bold text-emerald-800 dark:text-emerald-200 bg-emerald-100 dark:bg-emerald-950/70 px-3 py-1 rounded-full border border-emerald-300 dark:border-emerald-800">
                  آخرین بروزرسانی: {formatSmartUpdateDate(getLatestReportUpdateDate(), { persianDigits: true })}
                </span>
              </div>
              <h2 className="text-2xl font-black text-[#173b82] dark:text-blue-400">آخرین فعالیت‌های تیم‌های باشگاه</h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onNavigate('scores')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/70 hover:bg-amber-200 dark:hover:bg-amber-900/80 px-3.5 py-2 rounded-xl transition border border-amber-200 dark:border-amber-800 cursor-pointer"
              >
                <Award className="w-4 h-4" />
                <span>مشاهده جدول امتیازات</span>
              </button>
            </div>
          </div>

          {/* Dynamic Accordion Items for Every Team */}
          <div className="space-y-3">
            {teamsList.map((team, idx) => {
              const isOpen = openActivityTeam === team.id;
              const reportsCount = team.reports?.length || 0;
              const hasReports = reportsCount > 0;
              const latestReport = hasReports ? team.reports[0] : null;
              const isFirstRow = idx === 0 && hasReports;

              return (
                <div
                  key={team.id}
                  className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                    isFirstRow
                      ? 'border-emerald-500/50 dark:border-emerald-500/40 ring-1 ring-emerald-500/20 shadow-sm'
                      : isOpen
                      ? 'border-[#173b82]/40 dark:border-blue-500/40 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <button
                    onClick={() => setOpenActivityTeam(isOpen ? null : team.id)}
                    className={`w-full text-right p-4 flex items-center justify-between transition cursor-pointer ${
                      isFirstRow
                        ? 'bg-gradient-to-r from-emerald-50/70 via-slate-50 to-blue-50/40 dark:from-emerald-950/20 dark:via-slate-800/80 dark:to-slate-800/80 hover:bg-emerald-100/50'
                        : 'bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50/50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Team Logo or Avatar */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 p-0.5 shrink-0 flex items-center justify-center shadow-xs">
                        <img
                          src={team.logo || getTeamLogoPlaceholder(team.id, team.name)}
                          alt={team.name}
                          className="w-full h-full object-contain rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(team.id, team.name);
                          }}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                            {team.name}
                          </h3>

                          {isFirstRow && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-xs animate-pulse">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>ردیف اول: تازه‌ترین فعالیت ثبت‌شده</span>
                            </span>
                          )}

                          <span className="inline-flex items-center text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100/70 dark:bg-blue-950/70 text-[#173b82] dark:text-blue-300">
                            {toPersianDigits(reportsCount)} گزارش ثبت‌شده
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            مدیر تیم: {team.manager}
                          </span>
                          {latestReport && (
                            <span className="text-[10px] text-teal-700 dark:text-teal-400 font-semibold bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md">
                              آخرین ثبت: {toPersianDigits(latestReport.date)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 dark:text-slate-300 transition-transform duration-200 shrink-0 ${
                        isOpen ? 'rotate-180 text-[#173b82] dark:text-blue-400' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="p-4 sm:p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-700 space-y-4">
                      {hasReports ? (
                        <div className="space-y-3">
                          {team.reports.map((rep, rIdx) => {
                            const attCount = rep.attachments?.length || 0;
                            const isLatestReportInTeam = rIdx === 0;
                            return (
                              <div
                                key={rep.id || rIdx}
                                className={`p-3.5 rounded-xl border transition ${
                                  isLatestReportInTeam
                                    ? 'bg-blue-50/40 dark:bg-slate-800/80 border-blue-200/80 dark:border-blue-800/80 shadow-2xs'
                                    : 'bg-slate-50/80 dark:bg-slate-800/60 border-slate-200/70 dark:border-slate-700/70 hover:border-blue-200'
                                }`}
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100">
                                      {rep.reportNum ? `${formatReportNumberDisplay(rep.reportNum)}: ` : ''}
                                      {rep.title}
                                    </h4>
                                    {isLatestReportInTeam && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-100 text-teal-800 dark:bg-teal-900/80 dark:text-teal-200 rounded">
                                        جدیدترین
                                      </span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600 shrink-0 self-start sm:self-auto">
                                    {toPersianDigits(rep.date)}
                                  </span>
                                </div>

                                {rep.summary && (
                                  <FormattedText
                                    text={rep.summary}
                                    className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pr-6 mb-2"
                                  />
                                )}

                                {/* Attachments & Video Badges */}
                                <div className="flex flex-wrap items-center gap-2 pr-6 pt-1">
                                  {rep.videoSrc && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800">
                                      <Video className="w-3 h-3" />
                                      <span>ویدیو رسمی</span>
                                    </span>
                                  )}
                                  {rep.pdfUrl && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md border border-rose-200 dark:border-rose-800">
                                      <FileText className="w-3 h-3" />
                                      <span>سند PDF</span>
                                    </span>
                                  )}
                                  {attCount > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800">
                                      <Paperclip className="w-3 h-3" />
                                      <span>{toPersianDigits(attCount)} فایل ضمیمه</span>
                                    </span>
                                  )}
                                  {rep.images && rep.images.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-800">
                                      <span>🖼️</span>
                                      <span>{toPersianDigits(rep.images.length)} تصویر</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                          هنوز گزارشی برای تیم «{team.name}» ثبت نشده است. گزارش‌ها به زودی پس از برگزاری جلسات باشگاه بارگذاری خواهند شد.
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => onNavigate(getTeamPageId(team.id))}
                          className="text-xs font-bold text-[#173b82] dark:text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>مشاهده تمام جزئیات، فایل‌ها و ویدیوهای {team.name}</span>
                          <span>←</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 5. Interactive Event Calendar Preview Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 text-xs font-bold border border-amber-200 dark:border-amber-800">
              <Calendar className="w-3.5 h-3.5 text-amber-700 dark:text-amber-400" />
              <span>تقویم و برنامه‌های پیش‌رو</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
              همایش‌ها، کارگاه‌ها و نشست‌های موسسه محاش
            </h2>
          </div>
          <button
            onClick={() => onNavigate('events')}
            className="text-xs font-bold text-[#173b82] dark:text-blue-400 hover:underline self-start sm:self-auto"
          >
            مشاهده صفحه اختصاصی رویدادها و آرشیو ←
          </button>
        </div>

        <InteractiveCalendar onNavigate={onNavigate} />
      </section>

      {/* 6. Feature Highlights (آموزش, رویدادها, درباره ما) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/70 text-[#173b82] dark:text-blue-400 flex items-center justify-center mb-4 text-2xl">
              🎓
            </div>
            <h3 className="text-lg font-black text-[#173b82] dark:text-blue-400 mb-2">آموزش و مهارت‌ها</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              موضوعات یادگیری از دل جلسات باشگاه: تیم‌سازی، تفکر و حل مسئله، خودمراقبتی و ارتباط مؤثر.
            </p>
            <button
              onClick={() => onNavigate('education')}
              className="text-xs font-bold text-[#173b82] dark:text-blue-400 hover:underline cursor-pointer"
            >
              مشاهده آموزش‌ها ←
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/70 text-amber-700 dark:text-amber-400 flex items-center justify-center mb-4 text-2xl">
              📅
            </div>
            <h3 className="text-lg font-black text-[#173b82] dark:text-blue-400 mb-2">رویدادها و جلسات</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              مرور مسیر ۶ جلسه برگزارشده باشگاه جوانان، کارگاه‌ها و برنامه‌های دوره‌ای مشترک.
            </p>
            <button
              onClick={() => onNavigate('events')}
              className="text-xs font-bold text-[#173b82] dark:text-blue-400 hover:underline cursor-pointer"
            >
              مشاهده رویدادها ←
            </button>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/70 text-[#0f766e] dark:text-teal-400 flex items-center justify-center mb-4 text-2xl">
              🏢
            </div>
            <h3 className="text-lg font-black text-[#173b82] dark:text-blue-400 mb-2">درباره موسسه محاش</h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
              تاریخچه از سال ۱۳۷۴ و ۱۳۸۰، چشم‌انداز، اساسنامه و اهداف راهبردی موسسه محاش.
            </p>
            <button
              onClick={() => onNavigate('about')}
              className="text-xs font-bold text-[#173b82] dark:text-blue-400 hover:underline cursor-pointer"
            >
              درباره ما بیشتر بدانید ←
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
