import React, { useState } from 'react';
import { PageId } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import { logReportToMySQL } from '../utils/mysqlLogger';

interface ContactPageProps {
  onNavigate: (page: PageId) => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [supportName, setSupportName] = useState('');
  const [supportPhone, setSupportPhone] = useState('');
  const [supportSubject, setSupportSubject] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supportName || !supportMessage) {
      alert('لطفاً نام و متن پیام را وارد فرمایید.');
      return;
    }

    logReportToMySQL({
      actionType: 'contact_message',
      title: `پیام تماس و پشتیبانی: ${supportSubject || 'پیام عمومی'}`,
      details: supportMessage,
      userName: supportName,
      userContact: supportPhone,
      metadata: {
        subject: supportSubject,
        message: supportMessage
      },
      status: 'success'
    });

    setIsSubmitted(true);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <Breadcrumb items={[{ label: 'ارتباط با ما' }]} onNavigate={onNavigate} />

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#173b82] text-xs font-bold">
          <Phone className="w-3.5 h-3.5" />
          <span>پل‌های ارتباطی موسسه</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          تماس با موسسه محاش
        </h1>
        <p className="text-sm text-slate-600 font-medium">
          اطلاعات رسمی تماس، موقعیت مکانی و فرم ارسال پیام و پشتیبانی متنی
        </p>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Address */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#173b82] flex items-center justify-center">
            <MapPin className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">نشانی موسسه</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            ایران، تهران، میدان ولیعصر، بلوار کشاورز، خیابان فلسطین، کوچه ذاکری، پلاک ۵
          </p>
        </div>

        {/* Phones */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <Phone className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">تلفن‌های تماس</h3>
          <div className="space-y-1 text-xs text-slate-600">
            <a href="tel:+982188892377" className="block hover:text-[#173b82] font-mono text-sm font-semibold" dir="ltr">
              +98 (21) 88892377
            </a>
            <a href="tel:+989919834720" className="block hover:text-[#173b82] font-mono text-sm font-semibold" dir="ltr">
              +98 991 983 4720
            </a>
          </div>
        </div>

        {/* Email & Postcode */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <Mail className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">ایمیل و کد پستی</h3>
          <p className="text-xs text-slate-600">
            ایمیل:{' '}
            <a href="mailto:isihi2001@gmail.com" className="font-mono hover:text-[#173b82]">
              isihi2001@gmail.com
            </a>
          </p>
          <p className="text-xs text-slate-600 font-mono">کد پستی: ۴۱۶۷۶۳۸۱۵</p>
        </div>

        {/* Working Hours */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-2">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">ساعت کاری</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            یکشنبه تا پنجشنبه<br />
            از ساعت ۱۰:۰۰ الی ۱۸:۰۰
          </p>
        </div>

        {/* Consultation Prompt */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 border border-teal-200 shadow-xs space-y-2 sm:col-span-2">
          <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold">
            💬
          </div>
          <h3 className="text-sm font-black text-teal-950">رزرو مشاوره تخصصی متنی</h3>
          <p className="text-xs text-teal-800 leading-relaxed">
            برای ارتباط مستقیم با مشاوران محاش (خانم دکتر عباسیان و آقای اورومی)، از سامانه رزرو مشاوره استفاده فرمایید.
          </p>
          <button
            onClick={() => onNavigate('consultation')}
            className="text-xs font-bold text-[#0f766e] hover:underline block pt-1"
          >
            ورود به بخش رزرو مشاوره ←
          </button>
        </div>
      </div>

      {/* Map Box */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-[#173b82]">محل و موقعیت جغرافیایی موسسه</h2>
            <p className="text-xs text-slate-500">
              میدان ولیعصر، بلوار کشاورز، خیابان فلسطین، کوچه ذاکری، پلاک ۵
            </p>
          </div>
          <a
            href="https://maps.app.goo.gl/xFew74otrVRVc2986"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#173b82] hover:bg-[#0f275a] text-white rounded-xl text-xs font-bold shrink-0 shadow-xs transition"
          >
            باز کردن در نقشه گوگل ↗
          </a>
        </div>

        <div className="w-full h-72 sm:h-80 rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100">
          <iframe
            title="نقشه موقعیت موسسه محاش"
            src="https://maps.google.com/maps?q=35.710021,51.405395&hl=fa&z=17&t=m&output=embed"
            className="w-full h-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>

      {/* Text Support Form */}
      <div id="support" className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm max-w-2xl mx-auto space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-[#173b82] flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-[#173b82]" />
            <span>پشتیبانی و ارسال پیام متنی</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            پیام شما مستقیماً برای کارشناسان موسسه محاش ارسال می‌شود.
          </p>
        </div>

        {isSubmitted ? (
          <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-emerald-950">پیام شما با موفقیت ثبت شد</h3>
            <p className="text-xs text-emerald-800">
              از پیام شما سپاسگزاریم. همکاران ما در کوتاه‌ترین زمان ممکن از طریق پیامک یا تماس پاسخگو خواهند بود.
            </p>
            <button
              onClick={() => setIsSubmitted(false)}
              className="px-4 py-2 bg-[#173b82] text-white rounded-xl text-xs font-bold"
            >
              ارسال پیام جدید
            </button>
          </div>
        ) : (
          <form onSubmit={handleSupportSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  placeholder="نام کامل"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شماره تماس همراه
                </label>
                <input
                  type="tel"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="0912xxxxxxx"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                موضوع پیام
              </label>
              <select
                value={supportSubject}
                onChange={(e) => setSupportSubject(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82] bg-white"
              >
                <option value="">انتخاب موضوع...</option>
                <option value="باشگاه جوانان">باشگاه جوانان و عضویت در تیم‌ها</option>
                <option value="مشاوره">مشاوره روانشناسی و خانواده</option>
                <option value="کلاس‌های آموزشی">کلاس‌ها و کارگاه‌های آموزشی</option>
                <option value="خدمات توانبخشی">خدمات توانبخشی و مددکاری</option>
                <option value="سایر">سایر موارد و پیشنهادات</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                متن پیام <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                placeholder="پیام یا سؤال خود را به تفصیل بنویسید..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:border-[#173b82]"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-[#173b82] hover:bg-[#102758] text-white rounded-full font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>ارسال پیام پشتیبانی</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
