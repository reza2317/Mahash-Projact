import React, { useState } from 'react';
import { PageId } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { useAutoSaveForm } from '../hooks/useAutoSaveForm';
import { useNotification } from '../context/NotificationContext';
import { logReportToMySQL } from '../utils/mysqlLogger';
import { 
  UserPlus, 
  CheckCircle2, 
  AlertCircle, 
  Sparkles, 
  Send, 
  Edit3, 
  X, 
  FileText, 
  User, 
  Phone, 
  Activity, 
  HeartHandshake,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

interface MembershipPageProps {
  onNavigate: (page: PageId) => void;
}

const INITIAL_MEMBERSHIP_DATA = {
  fullName: '',
  nationalId: '',
  birthDate: '',
  fatherName: '',
  motherName: '',
  education: '',
  fieldOfStudy: '',
  job: '',
  maritalStatus: 'مجرد',
  fatherEducation: '',
  fatherJob: '',
  motherEducation: '',
  motherJob: '',
  childOrder: '',
  siblings: '',
  parentsRelation: '',
  familyHearing: '',
  phone: '',
  homePhone: '',
  fatherPhone: '',
  motherPhone: '',
  homeAddress: '',
  workAddress: '',
  otherDisability: '',
  hearingOnset: '',
  hearingLevel: '',
  hearingCause: '',
  aidType: '',
  aidAge: '',
  aidHours: '',
  communicationMethods: [] as string[],
  rehabClasses: [] as string[],
  schoolType: '',
  favoriteTeam: '',
  visitReason: '',
  howFound: '',
  requestedServices: [] as string[],
  message: ''
};

export const MembershipPage: React.FC<MembershipPageProps> = ({ onNavigate }) => {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const { success: showToastSuccess, error: showToastError } = useNotification();

  const [formData, setFormData, handleInputChange, clearSavedData, hasRestoredData] = useAutoSaveForm(
    'membership_v1',
    INITIAL_MEMBERSHIP_DATA
  );

  const handleCheckboxToggle = (category: 'communicationMethods' | 'rehabClasses' | 'requestedServices', item: string) => {
    setFormData((prev) => {
      const list = prev[category];
      if (list.includes(item)) {
        return { ...prev, [category]: list.filter((x) => x !== item) };
      } else {
        return { ...prev, [category]: [...list, item] };
      }
    });
  };

  const handlePreSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.phone.trim()) {
      setValidationError('لطفاً نام و نام خانوادگی و شماره تلفن همراه را وارد کنید.');
      showToastError('خطای اعتبارسنجی', 'لطفاً نام و نام خانوادگی و شماره تلفن را تکمیل کنید.');
      return;
    }
    setValidationError(null);
    setShowConfirmModal(true);
  };

  const handleFinalSubmit = () => {
    // Persist registration/membership to MySQL database in real-time
    logReportToMySQL({
      actionType: 'team_join',
      title: `ثبت فرم عضویت و درخواست حضور در تیم‌ها: ${formData.fullName}`,
      details: `رشته: ${formData.fieldOfStudy || '-'} | تحصیلات: ${formData.education || '-'} | تیم مورد علاقه: ${formData.favoriteTeam || '-'} | خدمات: ${
        (formData.requestedServices && formData.requestedServices.length > 0)
          ? formData.requestedServices.join('، ')
          : 'عمومی'
      }`,
      userName: formData.fullName,
      userContact: formData.phone,
      metadata: {
        nationalId: formData.nationalId,
        birthDate: formData.birthDate,
        education: formData.education,
        fieldOfStudy: formData.fieldOfStudy,
        job: formData.job,
        maritalStatus: formData.maritalStatus,
        homeAddress: formData.homeAddress,
        workAddress: formData.workAddress,
        requestedServices: formData.requestedServices,
        favoriteTeam: formData.favoriteTeam,
        communicationMethods: formData.communicationMethods,
        fatherPhone: formData.fatherPhone,
        motherPhone: formData.motherPhone,
        message: formData.message
      },
      status: 'success'
    });

    setShowConfirmModal(false);
    setIsSubmitted(true);
    clearSavedData();
    showToastSuccess('ثبت‌نام موفق', 'فرم عضویت شما با موفقیت در سامانه محاش و دیتابیس MySQL ثبت شد.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Auto-save restored banner */}
      {hasRestoredData && !isSubmitted && (
        <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-2xl p-3 flex items-center justify-between text-xs text-blue-800 dark:text-blue-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>اطلاعات پیشین شما به صورت خودکار از حافظه نشست (sessionStorage) بازیابی شد.</span>
          </div>
          <button
            type="button"
            onClick={clearSavedData}
            className="text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold underline cursor-pointer"
          >
            پاک‌سازی فرم
          </button>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[{ label: 'عضویت در محاش' }]}
        onNavigate={onNavigate}
      />

      {/* Hero Intro */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#173b82] text-xs font-bold">
          <UserPlus className="w-3.5 h-3.5" />
          <span>فرم رسمی عضویت و پذیرش</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">
          فرم جامع عضویت در موسسه محاش
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          پیوستن به برنامه‌های آموزشی، باشگاه جوانان، توانبخشی، مشاوره و خدمات حمایتی موسسه محاش
        </p>
      </div>

      {isSubmitted ? (
        /* Success State */
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-3xl p-8 text-center space-y-4 shadow-sm animate-in fade-in">
          <div className="w-16 h-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-emerald-950">
            درخواست عضویت شما با موفقیت ثبت شد!
          </h2>
          <p className="text-sm text-emerald-800 max-w-md mx-auto leading-relaxed">
            اطلاعات شما با موفقیت در سامانه موسسه محاش ذخیره گردید. کارشناسان ما به زودی از طریق پیامک یا تماس با شما ارتباط برقرار خواهند کرد.
          </p>
          <div className="pt-4 flex justify-center gap-3">
            <button
              onClick={() => onNavigate('home')}
              className="px-6 py-2.5 bg-[#173b82] hover:bg-[#102758] text-white font-bold rounded-xl text-sm shadow-sm transition cursor-pointer"
            >
              بازگشت به صفحه اصلی
            </button>
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-6 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-sm transition cursor-pointer"
            >
              ویرایش یا ثبت فرم جدید
            </button>
          </div>
        </div>
      ) : (
        /* Form Card */
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-8">
          {validationError && (
            <div className="flex items-center gap-2 p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          <form onSubmit={handlePreSubmit} className="space-y-8">
            {/* Section 1: اطلاعات فردی */}
            <fieldset className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/50 space-y-4">
              <legend className="px-3 text-sm font-black text-[#173b82] bg-white border border-slate-200 rounded-lg shadow-xs">
                ۱. اطلاعات فردی
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نام و نام خانوادگی <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={formData.fullName}
                    onChange={handleInputChange}
                    placeholder="مثال: علی رضایی"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    کد ملی
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleInputChange}
                    placeholder="۱۰ رقم کد ملی"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تاریخ تولد (شمسی)
                  </label>
                  <input
                    type="text"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleInputChange}
                    placeholder="مثال: ۱۳۸۰/۰۵/۱۵"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    نام پدر
                  </label>
                  <input
                    type="text"
                    name="fatherName"
                    value={formData.fatherName}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    میزان تحصیلات
                  </label>
                  <select
                    name="education"
                    value={formData.education}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="زیر دیپلم">زیر دیپلم</option>
                    <option value="دیپلم">دیپلم</option>
                    <option value="کاردانی">کاردانی</option>
                    <option value="کارشناسی">کارشناسی</option>
                    <option value="کارشناسی ارشد و بالاتر">کارشناسی ارشد و بالاتر</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شغل / وضعیت اشتغال
                  </label>
                  <input
                    type="text"
                    name="job"
                    value={formData.job}
                    onChange={handleInputChange}
                    placeholder="دانشجو، آزاد، کارمند و..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 2: اطلاعات تماس */}
            <fieldset className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/50 space-y-4">
              <legend className="px-3 text-sm font-black text-[#173b82] bg-white border border-slate-200 rounded-lg shadow-xs">
                ۲. اطلاعات تماس و ارتباط
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شماره تلفن همراه <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="0912xxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    شماره تلفن ثابت / پیام‌رسان
                  </label>
                  <input
                    type="tel"
                    name="homePhone"
                    value={formData.homePhone}
                    onChange={handleInputChange}
                    placeholder="تلفن یا شماره اضطراری"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    آدرس محل سکونت
                  </label>
                  <textarea
                    name="homeAddress"
                    rows={2}
                    value={formData.homeAddress}
                    onChange={handleInputChange}
                    placeholder="شهر، خیابان و مشخصات پستی"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  />
                </div>
              </div>
            </fieldset>

            {/* Section 3: وضعیت شنوایی و توانبخشی */}
            <fieldset className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/50 space-y-4">
              <legend className="px-3 text-sm font-black text-[#173b82] bg-white border border-slate-200 rounded-lg shadow-xs">
                ۳. وضعیت شنوایی و کمک‌شنوایی
              </legend>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    میزان افت شنوایی
                  </label>
                  <select
                    name="hearingLevel"
                    value={formData.hearingLevel}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="خفیف">خفیف</option>
                    <option value="متوسط">متوسط</option>
                    <option value="شدید">شدید</option>
                    <option value="عمیق">عمیق</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    وسیله کمک‌شنوایی
                  </label>
                  <select
                    name="aidType"
                    value={formData.aidType}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="سمعک">سمعک</option>
                    <option value="کاشت حلزون">کاشت حلزون</option>
                    <option value="هر دو">هر دو</option>
                    <option value="هیچ‌کدام">هیچ‌کدام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    سن شروع افت شنوایی
                  </label>
                  <select
                    name="hearingOnset"
                    value={formData.hearingOnset}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                  >
                    <option value="">انتخاب کنید</option>
                    <option value="بدو تولد">بدو تولد</option>
                    <option value="کودکی">کودکی</option>
                    <option value="نوجوانی">نوجوانی</option>
                    <option value="بزرگسالی">بزرگسالی</option>
                  </select>
                </div>
              </div>

              {/* Communication methods */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  روش‌های ارتباطی مورد استفاده:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {['شنیداری–کلامی', 'لب‌خوانی', 'زبان اشاره', 'ارتباط کلی (ترکیبی)'].map((method) => (
                    <label
                      key={method}
                      className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-blue-50/50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.communicationMethods.includes(method)}
                        onChange={() => handleCheckboxToggle('communicationMethods', method)}
                        className="rounded text-[#173b82]"
                      />
                      <span>{method}</span>
                    </label>
                  ))}
                </div>
              </div>
            </fieldset>

            {/* Section 4: علایق در باشگاه جوانان و خدمات */}
            <fieldset className="border border-slate-200 rounded-2xl p-5 sm:p-6 bg-slate-50/50 space-y-4">
              <legend className="px-3 text-sm font-black text-[#173b82] bg-white border border-slate-200 rounded-lg shadow-xs">
                ۴. عضویت در تیم‌ها و خدمات مورد تقاضا
              </legend>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تیم مورد علاقه در باشگاه جوانان (اختیاری):
                </label>
                <select
                  name="favoriteTeam"
                  value={formData.favoriteTeam}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                >
                  <option value="">انتخاب تیم...</option>
                  <option value="تیم مغز متفکر">تیم مغز متفکر (نوآوری، تحلیل و مهارت)</option>
                  <option value="تیم باشگاه فردا">تیم باشگاه فردا (خودمراقبتی و رشد فردی)</option>
                  <option value="تیم فرشتگان ناشنوایان">تیم فرشتگان ناشنوایان (همدلی و فرهنگ)</option>
                  <option value="تیم قربونی">تیم قربونی (پویایی و همکاری)</option>
                  <option value="تیم آوای سکوت">تیم آوای سکوت (هنر، بیان و ارتباط)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  علاقه‌مند به استفاده از کدام خدمات محاش هستید؟
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    'گفتاردرمانی و توانبخشی',
                    'مشاوره روانشناسی و فردی',
                    'کارگاه‌های مهارت زندگی',
                    'کلاس‌های کامپیوتر و فتوشاپ',
                    'عکاسی و هنر',
                    'خدمات اشتغال و مهارت‌آموزی',
                    'مشاوره ازدواج و خانواده',
                    'زبان اشاره و ارتباطات',
                    'رویدادها و برنامه‌های گروهی'
                  ].map((service) => (
                    <label
                      key={service}
                      className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-200 text-xs font-semibold cursor-pointer hover:bg-blue-50/50"
                    >
                      <input
                        type="checkbox"
                        checked={formData.requestedServices.includes(service)}
                        onChange={() => handleCheckboxToggle('requestedServices', service)}
                        className="rounded text-[#173b82]"
                      />
                      <span>{service}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  پیام یا توضیحات تکمیلی (اختیاری):
                </label>
                <textarea
                  name="message"
                  rows={3}
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="اگر نکته یا درخواستی دارید بنویسید..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
                />
              </div>
            </fieldset>

            {/* Submit Button */}
            <div className="pt-2 text-center">
              <button
                type="submit"
                className="w-full sm:w-auto px-10 py-3.5 bg-[#173b82] hover:bg-[#102758] text-white rounded-full font-black text-base shadow-md hover:shadow-xl transition-all transform active:scale-95 inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>بازبینی و ارسال فرم عضویت</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation & Review Modal */}
      {showConfirmModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowConfirmModal(false)}
        >
          <div 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-linear-to-r from-[#173b82] to-[#255bb5] text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-xs border border-white/20">
                  <ShieldCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black">بازبینی و تأیید نهایی اطلاعات عضویت</h3>
                  <p className="text-xs text-white/80">لطفاً پیش از ثبت نهایی، صحت اطلاعات وارد شده را بررسی فرمایید</p>
                </div>
              </div>
              <button
                onClick={() => setShowConfirmModal(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Review Details */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-700 dark:text-slate-200 divide-y divide-slate-100 dark:divide-slate-800">
              
              {/* Group 1: Individual Info */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2 font-black text-[#173b82] dark:text-blue-400 text-xs">
                  <User className="w-4 h-4" />
                  <span>۱. مشخصات فردی</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[11px] block">نام و نام خانوادگی:</span>
                    <span className="font-bold text-slate-900 dark:text-white">{formData.fullName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">کد ملی:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.nationalId ? toPersianDigits(formData.nationalId) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">تاریخ تولد:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.birthDate ? toPersianDigits(formData.birthDate) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">نام پدر:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.fatherName || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">میزان تحصیلات:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.education || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">شغل / اشتغال:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.job || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Group 2: Contact Info */}
              <div className="pt-3.5 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-[#173b82] dark:text-blue-400 text-xs">
                  <Phone className="w-4 h-4" />
                  <span>۲. اطلاعات تماس</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[11px] block">شماره تلفن همراه:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 direction-ltr text-right inline-block">
                      {formData.phone ? toPersianDigits(formData.phone) : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">تلفن ثابت / اضطراری:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {formData.homePhone ? toPersianDigits(formData.homePhone) : '—'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 text-[11px] block">آدرس محل سکونت:</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                      {formData.homeAddress || 'ثبت نشده'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Group 3: Hearing Info */}
              <div className="pt-3.5 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-[#173b82] dark:text-blue-400 text-xs">
                  <Activity className="w-4 h-4" />
                  <span>۳. وضعیت شنوایی و ارتباطی</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[11px] block">افت شنوایی:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.hearingLevel || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">وسیله کمک‌شنوایی:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.aidType || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block">سن شروع افت:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">{formData.hearingOnset || '—'}</span>
                  </div>
                  <div className="sm:col-span-3">
                    <span className="text-slate-400 text-[11px] block mb-1">روش‌های ارتباطی مورد استفاده:</span>
                    {formData.communicationMethods.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.communicationMethods.map((m, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950 text-[#173b82] dark:text-blue-300 text-xs font-bold">
                            {m}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">انتخاب نشده</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Group 4: Club Team & Services */}
              <div className="pt-3.5 space-y-2.5">
                <div className="flex items-center gap-2 font-black text-[#173b82] dark:text-blue-400 text-xs">
                  <HeartHandshake className="w-4 h-4" />
                  <span>۴. تیم باشگاه و خدمات درخواستی</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2.5">
                  <div>
                    <span className="text-slate-400 text-[11px] block">تیم انتخابی باشگاه جوانان:</span>
                    <span className="font-bold text-[#173b82] dark:text-blue-300">
                      {formData.favoriteTeam || 'تیمی مشخص نشده (عمومی)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[11px] block mb-1">خدمات مورد تقاضا:</span>
                    {formData.requestedServices.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {formData.requestedServices.map((s, idx) => (
                          <span key={idx} className="px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 italic">موردی انتخاب نشده است</span>
                    )}
                  </div>
                  {formData.message && (
                    <div className="pt-1">
                      <span className="text-slate-400 text-[11px] block">توضیحات و پیام کاربر:</span>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 mt-1">
                        {formData.message}
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 font-bold text-xs sm:text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-slate-500" />
                <span>ویرایش اطلاعات</span>
              </button>

              <button
                type="button"
                onClick={handleFinalSubmit}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تأیید نهایی و ثبت فرم</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

