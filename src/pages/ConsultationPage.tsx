import React, { useState, useEffect, useRef } from 'react';
import { PageId } from '../types';
import { CONSULTANTS } from '../data/mahashData';
import { NAZI_AVATAR_SVG, RADIN_AVATAR_SVG } from '../utils/assets';
import { Breadcrumb } from '../components/Breadcrumb';
import { useAutoSaveForm } from '../hooks/useAutoSaveForm';
import { useNotification } from '../context/NotificationContext';
import {
  MessageSquare,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  Send,
  Sparkles,
  Camera,
  Upload,
  RotateCcw
} from 'lucide-react';

interface ConsultationPageProps {
  onNavigate: (page: PageId) => void;
}

const INITIAL_CONSULTATION_DATA = {
  selectedConsultant: CONSULTANTS[0].name,
  consultationType: 'text' as 'text' | 'online' | 'in-person',
  name: '',
  phone: '',
  topic: '',
  preferredTime: '',
};

const PHOTOS_STORAGE_KEY = 'mahash_consultant_custom_photos_v1';

export const ConsultationPage: React.FC<ConsultationPageProps> = ({ onNavigate }) => {
  const [isBooked, setIsBooked] = useState(false);
  const { success: showToastSuccess, error: showToastError } = useNotification();

  // Custom consultant photos state stored in localStorage
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem(PHOTOS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<string | null>(null);

  const [formData, setFormData, handleInputChange, clearSavedData, hasRestoredData] = useAutoSaveForm(
    'consultation_v1',
    INITIAL_CONSULTATION_DATA
  );

  const handlePhotoUpload = (consultantName: string, file: File) => {
    if (!file.type.startsWith('image/')) {
      showToastError('خطای فرمت', 'لطفاً یک فایل تصویری (JPG یا PNG) انتخاب نمایید.');
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      showToastError('حجم زیاد تصویر', 'حجم عکس نباید بیشتر از ۳ مگابایت باشد.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        const nextPhotos = { ...customPhotos, [consultantName]: result };
        setCustomPhotos(nextPhotos);
        try {
          localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(nextPhotos));
        } catch (err) {
          console.error(err);
        }
        showToastSuccess('عکس بروزرسانی شد', `تصویر مشاور «${consultantName}» با موفقیت ذخیره گردید.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetPhoto = (consultantName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const nextPhotos = { ...customPhotos };
    delete nextPhotos[consultantName];
    setCustomPhotos(nextPhotos);
    try {
      localStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(nextPhotos));
    } catch (err) {}
    showToastSuccess('بازنشانی تصویر', `عکس مشاور «${consultantName}» به حالت پیش‌فرض برگشت.`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.topic) {
      showToastError('خطای اعتبارسنجی', 'لطفاً نام، شماره تماس و موضوع مشاوره را وارد فرمایید.');
      return;
    }
    setIsBooked(true);
    clearSavedData();
    showToastSuccess('درخواست مشاوره ثبت شد', 'کارشناسان ما به زودی با شما هماهنگ خواهند شد.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Hidden file input for consultant photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0] && activeUploadTarget) {
            handlePhotoUpload(activeUploadTarget, e.target.files[0]);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
        }}
      />

      {/* Auto-save restored banner */}
      {hasRestoredData && !isBooked && (
        <div className="bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-2xl p-3 flex items-center justify-between text-xs text-teal-800 dark:text-teal-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>اطلاعات پیش‌نویس مشاوره به طور خودکار از حافظه مرورگر بازیابی گردید.</span>
          </div>
          <button
            type="button"
            onClick={clearSavedData}
            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold underline cursor-pointer"
          >
            پاک‌سازی
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'رزرو مشاوره' }]}
        onNavigate={onNavigate}
      />

      {/* Hero Header */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/70 text-[#0f766e] dark:text-teal-300 text-xs font-bold border border-teal-200 dark:border-teal-800">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>مرکز مشاوره و روانشناسی محاش</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
          رزرو نوبت مشاوره
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
          مشاوره تخصصی، متنی و صمیمانه ویژه افراد دارای افت شنوایی و خانواده‌ها
        </p>
      </div>

      {/* Consultants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CONSULTANTS.map((c, idx) => {
          const isSelected = formData.selectedConsultant === c.name;
          const defaultAvatar = idx === 0 ? NAZI_AVATAR_SVG : RADIN_AVATAR_SVG;
          const currentPhoto = customPhotos[c.name] || defaultAvatar;
          const hasCustomPhoto = Boolean(customPhotos[c.name]);

          return (
            <div
              key={c.name}
              onClick={() => setFormData((prev) => ({ ...prev, selectedConsultant: c.name }))}
              className={`bg-white dark:bg-slate-900 rounded-3xl p-6 border-2 transition-all cursor-pointer shadow-xs relative overflow-hidden flex flex-col sm:flex-row items-center gap-5 text-right ${
                isSelected
                  ? 'border-[#0f766e] ring-4 ring-teal-100/70 dark:ring-teal-900/50 shadow-lg'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Photo Box with Upload Button Overlay */}
              <div className="relative group/avatar w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border border-slate-200 dark:border-slate-700 shadow-2xs flex items-center justify-center">
                <img
                  src={currentPhoto}
                  alt={c.name}
                  className="w-full h-full object-cover"
                />

                {/* Upload action button */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveUploadTarget(c.name);
                      fileInputRef.current?.click();
                    }}
                    className="p-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shadow cursor-pointer"
                    title="تغییر یا آپلود عکس مشاور"
                  >
                    <Camera className="w-3 h-3" />
                    <span>آپلود عکس</span>
                  </button>

                  {hasCustomPhoto && (
                    <button
                      type="button"
                      onClick={(e) => handleResetPhoto(c.name, e)}
                      className="p-1 bg-rose-600/80 hover:bg-rose-600 text-white rounded-md text-[9px] font-bold flex items-center gap-0.5 shadow cursor-pointer"
                      title="بازنشانی به آواتار اولیه"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>حذف</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 flex-1 w-full">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">{c.name}</h3>
                  {isSelected && (
                    <span className="text-xs bg-[#0f766e] text-white px-2.5 py-0.5 rounded-full font-bold">
                      انتخاب شده
                    </span>
                  )}
                </div>
                <p className="text-xs font-bold text-[#0f766e] dark:text-teal-400">{c.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
                  {c.specialty}
                </p>

                {/* Small Upload Trigger for Mobile */}
                <div className="pt-2 flex items-center gap-2 sm:hidden">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveUploadTarget(c.name);
                      fileInputRef.current?.click();
                    }}
                    className="text-[11px] text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1"
                  >
                    <Upload className="w-3 h-3" />
                    <span>انتخاب/آپلود عکس مشاور</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Form Card */}
      {isBooked ? (
        <div className="bg-teal-50 dark:bg-teal-950/40 border-2 border-teal-300 dark:border-teal-800 rounded-3xl p-8 text-center space-y-4 shadow-xs animate-in fade-in">
          <div className="w-16 h-16 bg-[#0f766e] text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-teal-950 dark:text-teal-200">
            درخواست مشاوره شما با موفقیت ثبت شد
          </h2>
          <p className="text-sm text-teal-900 dark:text-teal-300 max-w-md mx-auto leading-relaxed">
            مشاور انتخابی شما: <strong>{formData.selectedConsultant}</strong>. کارشناس هماهنگی به زودی از طریق پیامک برای تعیین زمان قطعی با شماره <strong>{formData.phone}</strong> تماس خواهد گرفت.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setIsBooked(false)}
              className="px-6 py-2.5 bg-[#0f766e] text-white font-bold rounded-xl text-sm cursor-pointer"
            >
              ثبت درخواست جدید
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs max-w-2xl mx-auto space-y-6">
          <h2 className="text-xl font-black text-[#173b82] dark:text-blue-400 border-b border-slate-100 dark:border-slate-800 pb-3">
            فرم ثبت درخواست مشاوره متنی
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نام و نام خانوادگی <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="نام کامل خود را وارد کنید"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f766e]/30"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  شماره تماس همراه <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="0912xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f766e]/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  مشاور مورد نظر
                </label>
                <select
                  name="selectedConsultant"
                  value={formData.selectedConsultant}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f766e]/30"
                >
                  {CONSULTANTS.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                نوع ارتباط پیشنهادی
              </label>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, consultationType: 'text' }))}
                  className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                    formData.consultationType === 'text'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-[#0f766e] text-[#0f766e] dark:text-teal-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  💬 متنی (چت و پیام)
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, consultationType: 'online' }))}
                  className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                    formData.consultationType === 'online'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-[#0f766e] text-[#0f766e] dark:text-teal-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  💻 تصویری با اشاره
                </button>
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, consultationType: 'in-person' }))}
                  className={`p-2.5 rounded-xl border text-center font-bold transition cursor-pointer ${
                    formData.consultationType === 'in-person'
                      ? 'bg-teal-50 dark:bg-teal-950/60 border-[#0f766e] text-[#0f766e] dark:text-teal-400'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  🏢 حضوری در موسسه
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                موضوع و شرح کوتاه درخواست مشاوره <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={3}
                name="topic"
                required
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="موضوع را به‌صورت متنی توضیح دهید (مثلاً: مشاوره تحصیلی، مهارت‌های ارتباطی، پذیرش کم‌شنوایی...)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0f766e]/30"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#0f766e] hover:bg-[#115e59] text-white rounded-full font-black text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>ثبت درخواست مشاوره</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
