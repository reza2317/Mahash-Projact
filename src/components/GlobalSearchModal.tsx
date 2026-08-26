import React, { useState, useEffect, useRef, useMemo } from 'react';
import { PageId } from '../types';
import { getAllTeamsList, getAllReports, getAllEvents } from '../utils/reportsStore';
import { Search, X, Users, Calendar, FileText, ArrowLeft, Sparkles, Building2, ChevronRight, Phone, Award } from 'lucide-react';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (page: PageId) => void;
}

interface SearchResultItem {
  id: string;
  title: string;
  subtitle?: string;
  category: 'team' | 'service' | 'report' | 'event' | 'page';
  pageId: PageId;
  badge: string;
  icon: React.ReactNode;
}

const STATIC_SERVICES: SearchResultItem[] = [
  {
    id: 'srv-education',
    title: 'آموزش و توان‌افزایی',
    subtitle: 'دوره‌های آموزشی زبان اشاره، مهارت‌های تخصصی و کارگاه‌های ارتقای فردی',
    category: 'service',
    pageId: 'education',
    badge: 'خدمت آموزشی',
    icon: <span className="text-base">🎓</span>
  },
  {
    id: 'srv-rehab',
    title: 'توانبخشی و گفتاردرمانی',
    subtitle: 'خدمات تخصصی گفتاردرمانی، تربیت شنیداری و ارزیابی شنوایی',
    category: 'service',
    pageId: 'rehab',
    badge: 'خدمت توانبخشی',
    icon: <span className="text-base">🦻</span>
  },
  {
    id: 'srv-employment',
    title: 'اشتغال و کارآفرینی',
    subtitle: 'کاریابی، آموزش مهارت‌های فنی، کارآفرینی و اتصال به بازار کار',
    category: 'service',
    pageId: 'employment',
    badge: 'خدمت اشتغال',
    icon: <span className="text-base">💼</span>
  },
  {
    id: 'srv-marriage',
    title: 'ازدواج و پیوند مهر',
    subtitle: 'مشاوره پیش از ازدواج، تسهیل همسان‌گزینی و کارگاه‌های مهارت‌های زندگی',
    category: 'service',
    pageId: 'marriage',
    badge: 'خدمت ازدواج',
    icon: <span className="text-base">💍</span>
  },
  {
    id: 'srv-social-work',
    title: 'مددکاری و حمایت اجتماعی',
    subtitle: 'حمایت‌های معیشتی، مشاوره مددکاری، تسهیلات و پشتیبانی فردی و خانوادگی',
    category: 'service',
    pageId: 'social-work',
    badge: 'خدمت اجتماعی',
    icon: <span className="text-base">🤝</span>
  },
  {
    id: 'srv-consultation',
    title: 'مشاوره و روانشناسی تخصصی',
    subtitle: 'جلسات مشاوره آنلاین و حضوری با حضور روانشناسان مسلط به زبان اشاره',
    category: 'service',
    pageId: 'consultation',
    badge: 'مشاوره روانشناسی',
    icon: <span className="text-base">🧠</span>
  }
];

const STATIC_PAGES: SearchResultItem[] = [
  {
    id: 'page-scores',
    title: 'جدول امتیازات و رتبه‌بندی تیم‌ها',
    subtitle: 'مشاهده امتیازات تیمی، فعالیت‌های ثبت‌شده و رتبه‌های ۵ گانه',
    category: 'page',
    pageId: 'scores',
    badge: 'رتبه‌بندی',
    icon: <Award className="w-4 h-4 text-amber-500" />
  },
  {
    id: 'page-membership',
    title: 'فرم ثبت‌نام و عضویت در محاش',
    subtitle: 'پیوستن به خانواده بزرگ اعضای موسسه و تیم‌های جوانان',
    category: 'page',
    pageId: 'membership',
    badge: 'ثبت‌نام',
    icon: <Users className="w-4 h-4 text-blue-500" />
  },
  {
    id: 'page-about',
    title: 'معرفی و درباره موسسه محاش',
    subtitle: 'آشنایی با تاریخچه، ارکان، ماموریت و اهداف کلان موسسه',
    category: 'page',
    pageId: 'about',
    badge: 'درباره ما',
    icon: <Building2 className="w-4 h-4 text-slate-500" />
  },
  {
    id: 'page-statute',
    title: 'اساسنامه رسمی موسسه محاش',
    subtitle: 'متن کامل اساسنامه، اهداف حقوقی و ساختار سازمانی موسسه',
    category: 'page',
    pageId: 'statute',
    badge: 'اسناد رسمی',
    icon: <FileText className="w-4 h-4 text-indigo-500" />
  },
  {
    id: 'page-contact',
    title: 'تماس با ما و راه‌های ارتباطی',
    subtitle: 'آدرس، شماره تماس، پیامک و فرم تماس مستقیم با موسسه',
    category: 'page',
    pageId: 'contact',
    badge: 'ارتباطات',
    icon: <Phone className="w-4 h-4 text-emerald-500" />
  }
];

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    } else {
      setQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable items
  const allItems = useMemo(() => {
    const items: SearchResultItem[] = [];

    // 1. Teams
    const teams = getAllTeamsList();
    teams.forEach((t) => {
      items.push({
        id: `team-${t.id}`,
        title: t.name,
        subtitle: `مدیر تیم: ${t.manager} — اعضا: ${t.members.join('، ')} ${t.slogan ? `— «${t.slogan}»` : ''}`,
        category: 'team',
        pageId: (t.slug || `team-${t.id}`) as PageId,
        badge: 'تیم باشگاه',
        icon: <span className="text-base">{t.icon || '👥'}</span>
      });
    });

    // 2. Services
    items.push(...STATIC_SERVICES);

    // 3. Reports
    const reports = getAllReports();
    reports.forEach((r) => {
      items.push({
        id: `report-${r.id}`,
        title: `${r.reportNum ? `${r.reportNum}: ` : ''}${r.title}`,
        subtitle: `${r.teamName ? `[${r.teamName}] ` : ''}${r.summary || ''}`,
        category: 'report',
        pageId: (r.teamSlug || 'teams-hub') as PageId,
        badge: r.teamName || 'گزارش فعالیت',
        icon: <FileText className="w-4 h-4 text-blue-500" />
      });
    });

    // 4. Events
    const events = getAllEvents();
    events.forEach((ev) => {
      items.push({
        id: `event-${ev.id}`,
        title: ev.title,
        subtitle: `تاریخ: ${ev.dateJalali} — مکان: ${ev.location} — ${ev.description}`,
        category: 'event',
        pageId: 'events',
        badge: ev.categoryLabel || 'رویداد',
        icon: <Calendar className="w-4 h-4 text-emerald-500" />
      });
    });

    // 5. Static Pages
    items.push(...STATIC_PAGES);

    return items;
  }, []);

  // Filter items
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allItems.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchCat) return false;

      if (!q) return true;

      const fullText = `${item.title} ${item.subtitle || ''} ${item.badge}`.toLowerCase();
      return fullText.includes(q);
    });
  }, [allItems, query, selectedCategory]);

  const handleSelect = (item: SearchResultItem) => {
    onNavigate(item.pageId);
    onClose();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-900/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-150 text-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Header Input */}
        <div className="relative flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جستجو در تیم‌ها، خدمات، گزارش‌ها، رویدادها..."
            className="w-full bg-transparent text-slate-900 dark:text-slate-100 placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-2.5 py-1 text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar">
          {[
            { id: 'all', label: 'همه بخش‌ها' },
            { id: 'team', label: 'تیم‌ها (۵ تیم)' },
            { id: 'service', label: 'خدمات محاش' },
            { id: 'report', label: 'گزارش‌های ویدیو و متنی' },
            { id: 'event', label: 'رویدادها' },
            { id: 'page', label: 'صفحات اصلی' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 text-xs font-bold rounded-full transition-all shrink-0 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-[#173b82] text-white shadow-xs'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1.5 divide-y divide-slate-100 dark:divide-slate-800">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Sparkles className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                نتیجه‌ای برای «{query}» یافت نشد.
              </p>
              <p className="text-xs text-slate-400">
                عبارت جستجوی دیگری را امتحان کنید (مثلاً: «مغز متفکر»، «مشاوره»، «ثبت‌نام»).
              </p>
            </div>
          ) : (
            filteredResults.map((item) => (
              <div
                key={item.id}
                onClick={() => handleSelect(item)}
                className="flex items-start gap-3 p-3 rounded-2xl hover:bg-blue-50/70 dark:hover:bg-slate-800/80 transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 border border-slate-200 dark:border-slate-700 group-hover:scale-105 transition-transform">
                  {item.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100 group-hover:text-[#173b82] dark:group-hover:text-blue-400 truncate">
                      {item.title}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700 shrink-0">
                      {item.badge}
                    </span>
                  </div>
                  {item.subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                      {item.subtitle}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 group-hover:-translate-x-1 transition-transform self-center shrink-0" />
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>{filteredResults.length} مورد یافت شد</span>
          <span className="hidden sm:inline">برای بستن روی ESC بزنید</span>
        </div>
      </div>
    </div>
  );
};
