import React, { useState, useEffect } from 'react';
import {
  Radio,
  FileText,
  Plus,
  Save,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Database,
  Tag,
  Layers,
  ArrowRight,
  Bookmark
} from 'lucide-react';
import { NewsAnnouncementItem, NewsAnnouncementType, PageId } from '../../types';
import {
  getNewsAnnouncements,
  saveNewsAnnouncement,
  deleteNewsAnnouncement,
  toggleNewsAnnouncementActive,
  subscribeToStoreUpdates
} from '../../utils/reportsStore';
import { toPersianDigits } from '../../utils/persianDate';

interface ContentManagerProps {
  onSuccessToast?: (msg: string) => void;
  onNavigate?: (page: PageId) => void;
}

const BADGE_PRESETS = [
  'خبر فوری',
  'اطلاعیه رسمی',
  'رویداد ویژه',
  'گزارش زنده',
  'یادآوری',
  'افتخار تیمی',
  'آموزش و مهارت',
  'خدمات مشاوره'
];

const CATEGORY_PRESETS = [
  'باشگاه جوانان',
  'آموزش و توانبخشی',
  'فرهنگی و هنری',
  'مسابقات و چالش‌ها',
  'مشاوره و روان‌شناسی',
  'اشتغال و کارآفرینی',
  'روابط عمومی محاش'
];

const TARGET_PAGE_OPTIONS: { id: string; label: string }[] = [
  { id: 'home', label: 'صفحه اصلی' },
  { id: 'scores', label: 'جدول امتیازات و رده‌بندی تیم‌ها' },
  { id: 'consultation', label: 'کانون مشاوره و روان‌شناسی' },
  { id: 'teams-hub', label: 'مرکز تیم‌های پنج‌گانه' },
  { id: 'team-thinker', label: 'تیم مغز متفکر' },
  { id: 'team-tomorrow', label: 'تیم باشگاه فردا' },
  { id: 'team-angels', label: 'تیم فرشتگان ناشنوایان' },
  { id: 'team-ghorbani', label: 'تیم قربانی' },
  { id: 'team-silence', label: 'تیم سکوت خلاق' },
  { id: 'membership', label: 'فرم ثبت‌نام و عضویت' },
  { id: 'events', label: 'تقویم و رویدادها' },
  { id: 'about', label: 'درباره مؤسسه محاش' }
];

export const ContentManager: React.FC<ContentManagerProps> = ({ onSuccessToast, onNavigate }) => {
  const [items, setItems] = useState<NewsAnnouncementItem[]>(() => getNewsAnnouncements());
  const [activeFilter, setActiveFilter] = useState<'all' | 'ticker' | 'news'>('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [mySqlSavedNotice, setMySqlSavedNotice] = useState<string | null>(null);

  // Form states
  const [type, setType] = useState<NewsAnnouncementType>('ticker');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [badge, setBadge] = useState('اطلاعیه رسمی');
  const [category, setCategory] = useState('باشگاه جوانان');
  const [targetUrl, setTargetUrl] = useState('home');
  const [priority, setPriority] = useState<number>(5);
  const [isActive, setIsActive] = useState(true);
  const [imageUrl, setImageUrl] = useState('');

  // Refresh on store updates
  useEffect(() => {
    const refresh = () => setItems(getNewsAnnouncements());
    const unsub = subscribeToStoreUpdates(refresh);
    return () => unsub();
  }, []);

  const resetForm = () => {
    setEditingId(null);
    setType('ticker');
    setTitle('');
    setSummary('');
    setContent('');
    setBadge('اطلاعیه رسمی');
    setCategory('باشگاه جوانان');
    setTargetUrl('home');
    setPriority(5);
    setIsActive(true);
    setImageUrl('');
    setIsFormOpen(false);
  };

  const handleEditClick = (item: NewsAnnouncementItem) => {
    setEditingId(item.id);
    setType(item.type);
    setTitle(item.title);
    setSummary(item.summary || '');
    setContent(item.content || '');
    setBadge(item.badge || 'اطلاعیه رسمی');
    setCategory(item.category || 'باشگاه جوانان');
    setTargetUrl(item.targetUrl || 'home');
    setPriority(item.priority ?? 5);
    setIsActive(item.isActive);
    setImageUrl(item.imageUrl || '');
    setIsFormOpen(true);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('لطفاً عنوان خبر یا اطلاعیه را وارد نمایید.');
      return;
    }

    try {
      setIsSaving(true);
      const todayFa = new Date().toLocaleDateString('fa-IR');

      const payload: Partial<NewsAnnouncementItem> = {
        id: editingId || `ann-${type}-${Date.now()}`,
        type,
        title: title.trim(),
        summary: summary.trim(),
        content: content.trim(),
        badge,
        category,
        targetUrl,
        priority: Number(priority),
        isActive,
        imageUrl: imageUrl.trim() || undefined,
        date: todayFa,
        updatedAt: new Date().toISOString()
      };

      await saveNewsAnnouncement(payload);

      setMySqlSavedNotice('تغییرات با موفقیت در جدول mahash_news_announcements پایگاه داده MySQL ذخیره شد.');
      setTimeout(() => setMySqlSavedNotice(null), 5000);

      if (onSuccessToast) {
        onSuccessToast(
          editingId
            ? 'محتوا با موفقیت ویرایش و در دیتابیس MySQL ذخیره شد.'
            : 'محتوای جدید با موفقیت ایجاد و مستقیماً در دیتابیس MySQL منتشر شد.'
        );
      }

      resetForm();
    } catch (err: any) {
      console.error('Error saving content:', err);
      alert('خطا در ذخیره‌سازی محتوا: ' + (err?.message || 'نامشخص'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, itemTitle: string) => {
    if (!window.confirm(`آیا از حذف «${itemTitle}» از پایگاه داده اطمینان دارید؟`)) return;
    try {
      await deleteNewsAnnouncement(id);
      if (onSuccessToast) {
        onSuccessToast('محتوا با موفقیت از پایگاه داده MySQL حذف شد.');
      }
    } catch (err: any) {
      console.error('Error deleting content:', err);
      alert('خطا در حذف: ' + (err?.message || ''));
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleNewsAnnouncementActive(id);
      if (onSuccessToast) {
        onSuccessToast('وضعیت نمایش محتوا بروزرسانی شد.');
      }
    } catch (err) {
      console.error('Toggle error:', err);
    }
  };

  const filteredItems = items.filter((item) => {
    if (activeFilter === 'all') return true;
    return item.type === activeFilter;
  });

  const tickerCount = items.filter((i) => i.type === 'ticker').length;
  const newsCount = items.filter((i) => i.type === 'news').length;
  const activeCount = items.filter((i) => i.isActive).length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Quick Add Button */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-200 text-xs font-bold rounded-full border border-blue-400/30">
              <Database className="w-3.5 h-3.5 text-blue-300" />
              <span>مدیریت مستقیم اخبار و اطلاعیه‌های MySQL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">
              فرم مدیریت محتوا و اطلاعیه‌های Ticker
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              افزودن و ویرایش اخبار صفحه اصلی و نوار متحرک گزارش‌های زنده باشگاه با ذخیره‌سازی دائمی در جدول اختصاصی دیتابیس MySQL.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setType('ticker');
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن اطلاعیه تیکر</span>
            </button>

            <button
              onClick={() => {
                resetForm();
                setType('news');
                setIsFormOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>افزودن خبر صفحه اصلی</span>
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-white/10">
          <div>
            <span className="text-[11px] text-slate-300 block">اطلاعیه‌های تیکر</span>
            <span className="text-lg font-black text-white">{toPersianDigits(tickerCount)} مورد</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-300 block">اخبار صفحه اصلی</span>
            <span className="text-lg font-black text-white">{toPersianDigits(newsCount)} مورد</span>
          </div>
          <div>
            <span className="text-[11px] text-slate-300 block">موارد فعال در سایت</span>
            <span className="text-lg font-black text-emerald-400">{toPersianDigits(activeCount)} مورد</span>
          </div>
        </div>
      </div>

      {/* MySQL Save Confirmation Flash */}
      {mySqlSavedNotice && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-2xl text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>{mySqlSavedNotice}</span>
        </div>
      )}

      {/* Management Form (Accordion / Modal-like) */}
      {isFormOpen && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-blue-400 dark:border-blue-600 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-base font-black text-slate-900 dark:text-white">
                {editingId ? 'ویرایش اطلاعیه / خبر' : 'افزودن خبر یا اطلاعیه جدید'}
              </h3>
            </div>
            <button
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700"
            >
              انصراف
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* Type Selector Tabs */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                نوع محتوا:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('ticker')}
                  className={`p-3 rounded-2xl border text-right transition flex items-center gap-3 cursor-pointer ${
                    type === 'ticker'
                      ? 'bg-red-50 dark:bg-red-950/40 border-red-400 text-red-700 dark:text-red-300 font-black shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <Radio className="w-5 h-5 text-red-600 shrink-0" />
                  <div>
                    <span className="block text-xs">اطلاعیه نوار متحرک (Ticker)</span>
                    <span className="text-[10px] text-slate-400 font-normal">نمایش در نوار قرمز رنگ بالای تمامی صفحات</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setType('news')}
                  className={`p-3 rounded-2xl border text-right transition flex items-center gap-3 cursor-pointer ${
                    type === 'news'
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-700 dark:text-blue-300 font-black shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <span className="block text-xs">خبر و اطلاعیه صفحه اصلی</span>
                    <span className="text-[10px] text-slate-400 font-normal">نمایش در بخش اخبار برگزیده صفحه نخست سامانه</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                <span>عنوان {type === 'ticker' ? 'اطلاعیه تیکر' : 'خبر'}:</span>
                <span className="text-[11px] text-slate-400 font-normal">{toPersianDigits(title.length)} کاراکتر</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  type === 'ticker'
                    ? 'مثال: «آغاز فرایند داوری و ارزیابی نهایی گزارش‌های تیمی باشگاه جوانان محاش»'
                    : 'مثال: «برگزاری مجمع سالانه و تجلیل از تیم‌های برگزیده باشگاه جوانان»'
                }
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Summary (for news) or Short Details */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                خلاصه متن / توضیحات کوتاه:
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                placeholder="خلاصه‌ای کوتاه جهت نمایش در پیش‌نمایش کارت خبر یا در ادامه متن تیکر..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
              />
            </div>

            {/* Full Content (Visible when type === 'news') */}
            {type === 'news' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  متن کامل خبر و جزئیات تکمیلی:
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  placeholder="متن مشروح و کامل خبر، مصوبات، اسامی و دستورالعمل‌ها..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Badge & Category Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Badge Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  برچسب / نشان (Badge):
                </label>
                <div className="flex gap-2">
                  <select
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {BADGE_PRESETS.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  دسته‌بندی موضوعی:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {CATEGORY_PRESETS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target Page & Priority */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Target Page */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  صفحه مقصد پس از کلیک کاربر:
                </label>
                <select
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  {TARGET_PAGE_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Priority */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex justify-between">
                  <span>اولویت نمایش (Priority):</span>
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{toPersianDigits(priority)} از ۱۰</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
              </div>
            </div>

            {/* Optional Image URL (for News) */}
            {type === 'news' && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  آدرس تصویر شاخص خبر (اختیاری):
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="مثال: /uploads/news-sample.webp یا آدرس اینترنتی تصویر..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none ltr"
                />
              </div>
            )}

            {/* Status Switch */}
            <div className="flex items-center gap-3 pt-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isActive ? 'فعال و در حال انتشار در سایت' : 'غیرفعال (پیش‌نویس، عدم نمایش به مخاطبان)'}
              </span>
            </div>

            {/* Live Preview Box */}
            <div className="bg-slate-50 dark:bg-slate-800/80 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                پیش‌نمایش زنده در سامانه:
              </span>
              {type === 'ticker' ? (
                <div className="flex items-center gap-2 bg-[#f8fafc] dark:bg-slate-950 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
                  <span className="bg-[#c62828] text-white px-2 py-0.5 text-[10px] font-black rounded-full">
                    {badge}
                  </span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                    {title || 'عنوان اطلاعیه در اینجا نمایش داده خواهد شد...'}
                  </span>
                  {summary && (
                    <span className="text-slate-500 text-[11px] truncate">({summary})</span>
                  )}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 dark:bg-blue-950 text-[#173b82] dark:text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {category}
                    </span>
                    <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {badge}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white">
                    {title || 'عنوان خبر در اینجا قرار می‌گیرد...'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {summary || 'خلاصه متن خبر در این بخش نمایش داده خواهد شد...'}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-[#173b82] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'در حال ثبت در MySQL...' : 'ذخیره مستقیم در دیتابیس MySQL'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter Tabs & Content List Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">
              لیست اخبار و اطلاعیه‌های ثبت‌شده
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              مجموع {toPersianDigits(items.length)} اطلاعیه ذخیره‌شده در پایگاه داده MySQL
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              همه ({toPersianDigits(items.length)})
            </button>
            <button
              onClick={() => setActiveFilter('ticker')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'ticker'
                  ? 'bg-white dark:bg-slate-900 text-red-600 dark:text-red-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              نوار متحرک ({toPersianDigits(tickerCount)})
            </button>
            <button
              onClick={() => setActiveFilter('news')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeFilter === 'news'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              اخبار اصلی ({toPersianDigits(newsCount)})
            </button>
          </div>
        </div>

        {/* List Table / Cards */}
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 space-y-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              هیچ محتوایی با فیلتر انتخابی یافت نشد.
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsFormOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>ایجاد نخستین اطلاعیه</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.isActive
                    ? 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-60'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          item.type === 'ticker'
                            ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                        }`}
                      >
                        {item.type === 'ticker' ? 'نوار متحرک (Ticker)' : 'خبر صفحه اصلی'}
                      </span>

                      {item.badge && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {item.badge}
                        </span>
                      )}

                      {item.category && (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                          {item.category}
                        </span>
                      )}

                      <span className="text-[11px] text-slate-400 font-normal">
                        اولویت: {toPersianDigits(item.priority ?? 5)}
                      </span>

                      {item.date && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          {toPersianDigits(item.date)}
                        </span>
                      )}
                    </div>

                    <h4 className="text-sm font-black text-slate-900 dark:text-white truncate">
                      {item.title}
                    </h4>

                    {item.summary && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {item.summary}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() => handleToggle(item.id)}
                      className={`p-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                        item.isActive
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300'
                          : 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-500'
                      }`}
                      title={item.isActive ? 'کلیک برای غیرفعال‌سازی' : 'کلیک برای فعال‌سازی'}
                    >
                      {item.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleEditClick(item)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition cursor-pointer"
                      title="ویرایش محتوا"
                    >
                      <Edit2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(item.id, item.title)}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/80 text-red-600 dark:text-red-400 transition cursor-pointer"
                      title="حذف از دیتابیس"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
