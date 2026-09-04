import React, { useState, useEffect } from 'react';
import { PageId } from '../types';
import { getMahashLogo, subscribeToStoreUpdates, isAdminAuthenticated } from '../utils/reportsStore';
import { Phone, Mail, MapPin, Clock, HeartHandshake } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: PageId) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [logoSrc, setLogoSrc] = useState<string>(getMahashLogo());
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminAuthenticated());

  useEffect(() => {
    const updateFooterState = () => {
      setLogoSrc(getMahashLogo());
      setIsAdmin(isAdminAuthenticated());
    };
    updateFooterState();
    const unsub = subscribeToStoreUpdates(updateFooterState);
    return () => unsub();
  }, []);

  return (
    <footer className="bg-[#102f68] text-white border-t-4 border-[#4bb7ad] mt-20" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {/* Brand & Slogan */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-16 h-16 bg-white rounded-2xl p-1.5 shadow-md flex-shrink-0">
                <img
                  src={logoSrc}
                  alt="لوگوی رسمی موسسه محاش"
                  className="w-full h-full object-contain rounded-xl"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <div>
                <h3 className="text-xl font-black text-white m-0">موسسه محاش</h3>
                <p className="text-sm text-slate-200 m-0">حمایت از افراد با افت شنوایی</p>
                <p className="text-xs text-[#bde9e4] font-bold mt-1">«همراه شما برای زندگی بهتر»</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              موسسه حمایت از افراد با افت شنوایی (محاش)، تشکلی غیردولتی، غیرانتفاعی و خانواده‌محور برای توانمندسازی جوانان و خانواده‌های دارای افت شنوایی.
            </p>
          </div>

          {/* دسترسی سریع */}
          <div>
            <h4 className="text-base font-bold text-white mb-4 border-b border-white/15 pb-2">
              دسترسی سریع
            </h4>
            <div className="flex flex-col gap-2.5 text-sm text-slate-200">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="صفحه اصلی باشگاه جوانان محاش"
              >
                باشگاه جوانان محاش
              </button>
              <button
                type="button"
                onClick={() => onNavigate('membership')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all font-bold text-[#bde9e4] cursor-pointer"
                aria-label="صفحه عضویت در باشگاه محاش"
              >
                عضویت در محاش
              </button>
              <button
                type="button"
                onClick={() => onNavigate('consultation')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="رزرو نوبت مشاوره روانشناسی"
              >
                رزرو مشاوره روانشناسی
              </button>
              <button
                type="button"
                onClick={() => onNavigate('teams-hub')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="آشنایی با تیم‌های پنج‌گانه باشگاه"
              >
                تیم‌های پنج‌گانه باشگاه
              </button>
              <button
                type="button"
                onClick={() => onNavigate('scores')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer flex items-center gap-1"
                aria-label="مشاهده جدول امتیازات تیم‌های باشگاه"
              >
                <span aria-hidden="true">🏆</span>
                <span>امتیازات تیم‌ها</span>
              </button>
            </div>
          </div>

          {/* خدمات و محتوا */}
          <div>
            <h4 className="text-base font-bold text-white mb-4 border-b border-white/15 pb-2">
              خدمات تخصصی
            </h4>
            <div className="flex flex-col gap-2.5 text-sm text-slate-200">
              <button
                type="button"
                onClick={() => onNavigate('education')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="بخش آموزش و مهارت‌های زندگی"
              >
                آموزش و مهارت‌های زندگی
              </button>
              <button
                type="button"
                onClick={() => onNavigate('rehab')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="بخش توانبخشی و گفتاردرمانی"
              >
                توانبخشی و گفتاردرمانی
              </button>
              <button
                type="button"
                onClick={() => onNavigate('employment')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="بخش اشتغال و توانمندسازی شغلی"
              >
                اشتغال و توانمندسازی شغلی
              </button>
              <button
                type="button"
                onClick={() => onNavigate('marriage')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="بخش مشاوره و خدمات ازدواج"
              >
                مشاوره و خدمات ازدواج
              </button>
              <button
                type="button"
                onClick={() => onNavigate('social-work')}
                className="text-right hover:text-[#5eead4] hover:translate-x-[-4px] transition-all cursor-pointer"
                aria-label="بخش مددکاری اجتماعی"
              >
                مددکاری اجتماعی
              </button>
            </div>
          </div>

          {/* ارتباط با محاش */}
          <div>
            <h4 className="text-base font-bold text-white mb-4 border-b border-white/15 pb-2">
              ارتباط با موسسه
            </h4>
            <div className="flex flex-col gap-3 text-xs text-slate-200">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#5eead4] shrink-0 mt-0.5" aria-hidden="true" />
                <span>تهران، میدان ولیعصر، بلوار کشاورز، خیابان فلسطین، کوچه ذاکری، پلاک ۵</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#5eead4] shrink-0" aria-hidden="true" />
                <div className="flex flex-wrap gap-2 text-xs">
                  <a href="tel:+982188892377" className="hover:text-white font-mono" dir="ltr" aria-label="تماس با تلفن ثابت: ۰۲۱۸۸۸۹۲۳۷۷">021-88892377</a>
                  <span aria-hidden="true">/</span>
                  <a href="tel:+989919834720" className="hover:text-white font-mono" dir="ltr" aria-label="تماس با تلفن همراه: ۰۹۹۱۹۸۳۴۷۲۰">09919834720</a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#5eead4] shrink-0" aria-hidden="true" />
                <a href="mailto:isihi2001@gmail.com" className="hover:text-white font-mono" aria-label="ارسال ایمیل به isihi2001@gmail.com">isihi2001@gmail.com</a>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#5eead4] shrink-0" aria-hidden="true" />
                <span>یکشنبه تا پنجشنبه: ۱۰ الی ۱۸</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-black/20 border-t border-white/10 py-4 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-300 text-center">
          <p className="m-0">© {new Date().getFullYear()} موسسه محاش | تمامی حقوق محفوظ است.</p>
          <div className="flex items-center gap-3">
            <span className="text-slate-400">موسسه حمایت از افراد با افت شنوایی (تأسیس ۱۳۸۰)</span>
            <span className="text-white/20" aria-hidden="true">|</span>
            <button
              type="button"
              onClick={() => onNavigate('admin')}
              className="text-[#bde9e4]/70 hover:text-white transition flex items-center gap-1 font-medium cursor-pointer"
              title="ورود به پنل مدیریت"
              aria-label={isAdmin ? 'ورود به پنل مدیریت سامانه' : 'ورود به بخش مدیریت'}
            >
              <span aria-hidden="true">🔐</span>
              {isAdmin ? <span>پنل مدیریت سامانه</span> : <span className="sr-only">ورود مدیریت</span>}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
