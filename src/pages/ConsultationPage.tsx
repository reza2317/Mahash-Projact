import React, { useState, useEffect } from 'react';
import { PageId, Consultant } from '../types';
import { 
  getAllConsultants, 
  getConsultantPhotos,
  getConsultantPhoto,
  saveConsultantPhoto,
  isCustomImageDataUrlOrUrl,
  subscribeToStoreUpdates 
} from '../utils/reportsStore';
import { getConsultantPhotoFromFirestore } from '../utils/firestorePersistence';
import { NAZI_AVATAR_SVG, RADIN_AVATAR_SVG } from '../utils/assets';
import { Breadcrumb } from '../components/Breadcrumb';
import { useAutoSaveForm } from '../hooks/useAutoSaveForm';
import { useNotification } from '../context/NotificationContext';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { ImageLoader } from '../components/ImageLoader';
import { logReportToMySQL } from '../utils/mysqlLogger';
import {
  MessageSquare,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Phone,
  Send,
  Sparkles,
  Award
} from 'lucide-react';

interface ConsultationPageProps {
  onNavigate: (page: PageId) => void;
}

const INITIAL_CONSULTATION_DATA = {
  selectedConsultant: 'خانم دکتر نازی عباسیان',
  consultationType: 'text' as 'text' | 'online' | 'in-person',
  name: '',
  phone: '',
  topic: '',
  preferredTime: '',
};

export const ConsultationPage: React.FC<ConsultationPageProps> = ({ onNavigate }) => {
  const [isBooked, setIsBooked] = useState(false);
  const { success: showToastSuccess, error: showToastError } = useNotification();

  // Consultants list and photos state
  const [consultants, setConsultants] = useState<Consultant[]>(() => getAllConsultants());
  const [customPhotos, setCustomPhotos] = useState<Record<string, string>>(() => getConsultantPhotos());

  useEffect(() => {
    const syncData = () => {
      setConsultants(getAllConsultants());
      setCustomPhotos(getConsultantPhotos());
    };
    syncData();

    // Background Firestore hydration for consultants
    const currentPhotos = getConsultantPhotos();
    const naziPhotoExists = !!currentPhotos['خانم دکتر نازی عباسیان'] || !!currentPhotos['consultant_nazi_abbasian'] || !!currentPhotos['nazi_abbasian'];
    const radinPhotoExists = !!currentPhotos['آقای رادین اورومی'] || !!currentPhotos['consultant_radin_oroumi'] || !!currentPhotos['radin_oroumi'];

    if (!naziPhotoExists || !radinPhotoExists) {
      Promise.all([
        !naziPhotoExists ? getConsultantPhotoFromFirestore('خانم دکتر نازی عباسیان') : Promise.resolve(null),
        !radinPhotoExists ? getConsultantPhotoFromFirestore('آقای رادین اورومی') : Promise.resolve(null)
      ]).then(([naziPhoto, radinPhoto]) => {
        let updated = false;
        if (naziPhoto && isCustomImageDataUrlOrUrl(naziPhoto)) {
          saveConsultantPhoto('خانم دکتر نازی عباسیان', naziPhoto);
          updated = true;
        }
        if (radinPhoto && isCustomImageDataUrlOrUrl(radinPhoto)) {
          saveConsultantPhoto('آقای رادین اورومی', radinPhoto);
          updated = true;
        }
        if (updated) {
          syncData();
        }
      }).catch(() => {});
    }

    const unsub = subscribeToStoreUpdates(syncData);
    return () => unsub();
  }, []);

  const [formData, setFormData, handleInputChange, clearSavedData, hasRestoredData] = useAutoSaveForm(
    'consultation_v1',
    INITIAL_CONSULTATION_DATA
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.topic) {
      showToastError('خطای اعتبارسنجی', 'لطفاً نام، شماره تماس و موضوع مشاوره را وارد فرمایید.');
      return;
    }

    // Persist consultation request to MySQL database in real-time
    logReportToMySQL({
      actionType: 'consultation_request',
      title: `درخواست رزرو مشاوره: ${formData.topic}`,
      details: `مشاوره با ${formData.selectedConsultant || 'کارشناس'} به صورت ${
        formData.consultationType === 'text'
          ? 'متنی'
          : formData.consultationType === 'online'
          ? 'آنلاین تصویری'
          : 'حضوری'
      } - زمان انتخابی: ${formData.preferredTime || 'توافقی'}`,
      userName: formData.name,
      userContact: formData.phone,
      metadata: {
        selectedConsultant: formData.selectedConsultant,
        consultationType: formData.consultationType,
        topic: formData.topic,
        preferredTime: formData.preferredTime
      },
      status: 'success'
    });

    setIsBooked(true);
    clearSavedData();
    showToastSuccess('درخواست مشاوره ثبت شد', 'کارشناسان ما به زودی با شما هماهنگ خواهند شد.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
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
        {consultants.map((c, idx) => {
          const isSelected = formData.selectedConsultant === c.name;
          const defaultAvatar = idx === 0 ? NAZI_AVATAR_SVG : (c.image || RADIN_AVATAR_SVG);
          const currentPhoto = getConsultantPhoto(c.name, c.image || defaultAvatar) || c.image || defaultAvatar;

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
              {/* Photo Box */}
              <div className="w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shrink-0 border-2 border-teal-500/20 shadow-xs flex items-center justify-center p-0.5">
                <ImageLoader
                  src={currentPhoto}
                  fallbackSrc={defaultAvatar}
                  alt={c.name}
                  type="consultant"
                  rounded="xl"
                  aspectRatio="square"
                  showFormatBadge={true}
                  className="w-full h-full object-cover rounded-xl"
                  containerClassName="w-full h-full rounded-xl"
                  priority={true}
                  showSkeleton={true}
                />
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
                  {consultants.map((c) => (
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
