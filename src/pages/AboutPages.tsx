import React from 'react';
import { PageId } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { Info, History, Eye, Target, FileCheck, CheckCircle2 } from 'lucide-react';

interface AboutPagesProps {
  pageType: 'about' | 'history' | 'mission' | 'goals' | 'statute';
  onNavigate: (page: PageId) => void;
}

export const AboutPages: React.FC<AboutPagesProps> = ({ pageType, onNavigate }) => {
  if (pageType === 'about') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        <Breadcrumb items={[{ label: 'درباره ما' }]} onNavigate={onNavigate} />

        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#173b82] text-xs font-bold">
            <Info className="w-3.5 h-3.5" />
            <span>معرفی رسمی</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            آشنایی با موسسه محاش
          </h1>
          <p className="text-sm text-slate-600 font-medium">
            موسسه حمایت از افراد با افت شنوایی؛ یک تشکل غیردولتی، غیرانتفاعی و خانواده‌محور
          </p>
        </div>

        {/* 3 Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <span className="text-3xl">📖</span>
            <h2 className="text-lg font-black text-[#173b82]">تاریخچه شکل‌گیری</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              از اسفند ماه سال ۱۳۷۴ با همراهی کارشناسان دلسوز و خانواده‌های کودکان کم‌شنوا و تأسیس رسمی در سال ۱۳۸۰.
            </p>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-bold text-[#173b82] hover:underline block pt-2"
            >
              مطالعه تاریخچه ←
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <span className="text-3xl">🌱</span>
            <h2 className="text-lg font-black text-[#173b82]">چشم‌انداز و رسالت</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              فراهم شدن زمینه رشد مادی و معنوی افراد با افت شنوایی، فرصت‌های برابر و زندگی شاد و مستقل در جامعه.
            </p>
            <button
              onClick={() => onNavigate('mission')}
              className="text-xs font-bold text-[#173b82] hover:underline block pt-2"
            >
              مشاهده رسالت ←
            </button>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-3">
            <span className="text-3xl">🎯</span>
            <h2 className="text-lg font-black text-[#173b82]">اهداف و برنامه‌ها</h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              آگاه‌سازی جامعه، توانمندسازی افراد ناشنوا و خانواده‌ها، ارتقای خدمات تخصصی و توسعه باشگاه جوانان.
            </p>
            <button
              onClick={() => onNavigate('goals')}
              className="text-xs font-bold text-[#173b82] hover:underline block pt-2"
            >
              مشاهده اهداف ←
            </button>
          </div>
        </div>

        {/* Detailed Overview Panel */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-xl font-black text-[#173b82]">محاش در یک نگاه</h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            موسسه حمایت از افراد با افت شنوایی (محاش) یک تشکل غیردولتی، غیرانتفاعی و خانواده‌محور است که با هدف توانمندسازی افراد با افت شنوایی و خانواده‌هایشان و حضور موثر آنان در جامعه و استفاده از فرصت‌های برابر، در سال ۱۳۸۰ توسط جمعی از خانواده‌ها و کارشناسان این حوزه تاسیس شد.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200/80">
              <span className="text-2xl font-black text-[#173b82] block">+۱۰۰۰</span>
              <span className="text-xs text-slate-500 font-bold">اعضا و خانواده‌های همراه</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200/80">
              <span className="text-2xl font-black text-[#0f766e] block">+۵۰۰۰</span>
              <span className="text-xs text-slate-500 font-bold">ساعت کلاس و کارگاه‌های آموزشی</span>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-200/80">
              <span className="text-2xl font-black text-amber-700 block">+۵۰۰</span>
              <span className="text-xs text-slate-500 font-bold">دستاوردها و رویدادهای موفق</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageType === 'history') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumb
          items={[
            { label: 'درباره ما', target: 'about' },
            { label: 'تاریخچه' }
          ]}
          onNavigate={onNavigate}
        />

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-bold inline-block mb-1">
              پیشینه و شکل‌گیری
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">تاریخچه موسسه محاش</h1>
          </div>

          <div className="space-y-6">
            <div className="border-r-4 border-[#173b82] pr-4 space-y-1">
              <span className="text-xs font-black text-[#173b82]">اسفند ۱۳۷۴</span>
              <h2 className="text-base font-bold text-slate-900">آغاز آشنایی خانواده‌ها و کارشناسان</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                در یکی از روزهای سرد اسفند ماه سال ۱۳۷۴، همکاری و هماهنگی کارشناسان دلسوز و علاقمند، خانم‌ها حاج علی اکبر، افشارپور و جاراللهی، سبب‌ساز آشنایی والدین تعدادی از کودکان کم‌شنوا شد و سنگ بنای یک حرکت منسجم خانوادگی و توانمندسازی را پی‌ریزی کرد.
              </p>
            </div>

            <div className="border-r-4 border-[#0f766e] pr-4 space-y-1">
              <span className="text-xs font-black text-[#0f766e]">سال ۱۳۸۰</span>
              <h2 className="text-base font-bold text-slate-900">تأسیس و ثبت رسمی موسسه</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                بر اساس معرفی رسمی در پایگاه موسسه، موسسه حمایت از افراد با افت شنوایی در سال ۱۳۸۰ به صورت رسمی توسط جمعی از خانواده‌ها و متخصصان این حوزه به ثبت رسید تا خدماتی منسجم در زمینه‌های آموزشی، مشاوره‌ای، اشتغال، ازدواج و باشگاه جوانان ارائه دهد.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageType === 'mission') {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumb
          items={[
            { label: 'درباره ما', target: 'about' },
            { label: 'چشم‌انداز و رسالت' }
          ]}
          onNavigate={onNavigate}
        />

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs text-teal-700 bg-teal-50 px-3 py-1 rounded-full font-bold inline-block mb-1">
              رسالت و ارزش‌ها
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              چشم‌انداز، رسالت و ارزش‌های محاش
            </h1>
          </div>

          <div className="bg-gradient-to-br from-blue-50/80 to-teal-50/80 border border-blue-100 rounded-2xl p-6 space-y-3">
            <h2 className="text-base font-black text-[#173b82]">متن بیانیه چشم‌انداز:</h2>
            <p className="text-sm text-slate-700 leading-relaxed font-medium">
              «مؤسسه حمایت از افراد با افت شنوایی در مسیری تلاش می‌کند که زمینه رشد و کمال مادی و معنوی افراد با افت شنوایی از بدو تولد تا بلوغ و بزرگسالی به گونه‌ای در جامعه فراهم گردد که این افراد همانند افراد شنوا از امکانات برابر برخوردار و بهره‌مند گردند و همراه با خانواده خود زندگی شاد، مستقل و رضایت‌مندی داشته باشند.»
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (pageType === 'goals') {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Breadcrumb
          items={[
            { label: 'درباره ما', target: 'about' },
            { label: 'اهداف و برنامه‌ها' }
          ]}
          onNavigate={onNavigate}
        />

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-bold inline-block mb-1">
              اهداف راهبردی
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">
              اهداف و برنامه‌های موسسه محاش
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'آگاه‌سازی عمومی', desc: 'آگاه‌سازی افراد ناشنوا، خانواده‌هایشان، متخصصان و عموم جامعه' },
              { title: 'توانمندسازی جامع', desc: 'توانمندسازی همه‌جانبه و تقویت حضور موثر افراد با افت شنوایی در جامعه' },
              { title: 'فرصت‌های برابر', desc: 'تلاش برای بهره‌مندی از امکانات برابر، حقوق شهروندی و دسترسی‌پذیری' },
              { title: 'خدمات تخصصی', desc: 'توسعه آموزش، توانبخشی، مشاوره روانشناسی، مددکاری، اشتغال و ازدواج' },
              { title: 'خانواده‌محوری', desc: 'پشتیبانی از خانواده‌ها به عنوان کانون اصلی آرامش و رشد فرد' },
              { title: 'باشگاه جوانان', desc: 'ایجاد بستری پرنشاط برای کار تیمی، خودباوری و ارتباطات جوانان' }
            ].map((g, idx) => (
              <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <h3 className="text-sm font-bold text-[#173b82] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>{g.title}</span>
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed">{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Statute
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'درباره ما', target: 'about' },
          { label: 'اساسنامه' }
        ]}
        onNavigate={onNavigate}
      />

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <span className="text-xs text-blue-700 bg-blue-50 px-3 py-1 rounded-full font-bold inline-block mb-1">
            سند رسمی
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900">اساسنامه موسسه محاش</h1>
        </div>

        <p className="text-sm text-slate-700 leading-relaxed">
          اساسنامه مؤسسه حمایت از افراد با افت شنوایی (محاش) چارچوب حقوقی، ارکان، اهداف، ساختار مدیریتی و شیوه فعالیت رسمی مؤسسه را مشخص می‌کند.
        </p>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
          برای دریافت نسخه کامل چاپی یا دیجیتال اساسنامه و مدارک ثبتی، می‌توانید از طریق بخش ارتباط با ما درخواست خود را ثبت فرمایید.
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => onNavigate('contact')}
            className="px-5 py-2.5 bg-[#173b82] text-white rounded-full text-xs font-bold"
          >
            درخواست از طریق تماس با ما
          </button>
        </div>
      </div>
    </div>
  );
};
