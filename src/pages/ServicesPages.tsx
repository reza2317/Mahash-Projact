import React from 'react';
import { PageId } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { HeartPulse, Briefcase, Heart, Users, CheckCircle2 } from 'lucide-react';

interface ServicesPageProps {
  pageType: 'rehab' | 'employment' | 'marriage' | 'social-work';
  onNavigate: (page: PageId) => void;
}

export const ServicesPage: React.FC<ServicesPageProps> = ({ pageType, onNavigate }) => {
  const configs = {
    rehab: {
      title: 'توانبخشی و گفتاردرمانی',
      icon: <HeartPulse className="w-8 h-8 text-rose-600" />,
      desc: 'خدمات تخصصی تربیت شنوایی، گفتاردرمانی و توانبخشی ارتباطی برای کودکان و جوانان با افت شنوایی',
      points: [
        'ارزیابی دقیق وضعیت شنیداری و ارتباطی',
        'جلسات گفتاردرمانی و تقویت مهارت‌های کلامی',
        'تربیت شنوایی و آموزش استفاده بهینه از سمعک و کاشت حلزون',
        'مشاوره همراهی خانواده و پیگیری منظم پیشرفت مراجعان'
      ]
    },
    employment: {
      title: 'اشتغال و توانمندسازی شغلی',
      icon: <Briefcase className="w-8 h-8 text-blue-600" />,
      desc: 'بسترسازی برای اشتغال پایدار، مهارت‌آموزی حرفه‌ای و پیوند جوانان ناشنوا با فرصت‌های شغلی',
      points: [
        'مشاوره شغلی و استعدادیابی بر اساس علایق و مهارت‌ها',
        'آموزش‌های کاربردی مانند کامپیوتر، طراحی، فتوشاپ، عکاسی و مهارت‌های دیجیتال',
        'همکاری با کارفرمایان و سازمان‌های مسئولیت‌پذیر اجتماعی',
        'پشتیبانی و تسهیل ارتباط در محیط‌های کاری'
      ]
    },
    marriage: {
      title: 'مشاوره و خدمات ازدواج',
      icon: <Heart className="w-8 h-8 text-pink-600" />,
      desc: 'خدمات مشاوره پیش از ازدواج، آگاهی‌بخشی و همراهی در مسیر تشکیل خانواده پایدار',
      points: [
        'مشاوره پیش از ازدواج و ارزیابی تفاهم زوجین',
        'آشنایی مسئولانه و توانمندسازی زوج‌های جوان',
        'کارگاه‌های مهارت‌های ارتباطی و حل تعارض در زندگی مشترک',
        'مشاوره‌های تخصصی ژنتیک و همراهی پس از ازدواج'
      ]
    },
    'social-work': {
      title: 'مددکاری اجتماعی',
      icon: <Users className="w-8 h-8 text-emerald-600" />,
      desc: 'ارائه حمایت‌های اجتماعی، حقوقی و توانمندسازی خانواده‌های دارای فرد با افت شنوایی',
      points: [
        'مصاحبه تخصصی و نیازسنجی خانواده‌ها و مددجویان',
        'ارجاع به مراکز حمایتی، درمانی و قانونی مرتبط',
        'پیگیری پرونده‌های مددکاری و تسهیل دریافت خدمات',
        'حمایت‌های معیشتی و توان‌افزایی اعضای آسیب‌پذیر'
      ]
    }
  };

  const current = configs[pageType];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <Breadcrumb
        items={[
          { label: 'خدمات محاش', target: 'home' },
          { label: current.title }
        ]}
        onNavigate={onNavigate}
      />

      <div className="bg-white rounded-3xl p-6 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0">
            {current.icon}
          </div>
          <div>
            <span className="text-xs text-slate-500 font-bold block">خدمات تخصصی موسسه محاش</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 m-0">{current.title}</h1>
          </div>
        </div>

        <p className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium">
          {current.desc}
        </p>

        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-3">
          <h2 className="text-sm font-bold text-[#173b82]">محورها و برنامه‌های این بخش:</h2>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
            {current.points.map((p, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
          <button
            onClick={() => onNavigate('membership')}
            className="px-6 py-3 bg-[#173b82] hover:bg-[#0f275a] text-white rounded-full text-xs font-bold shadow-sm transition"
          >
            ثبت‌نام و عضویت در محاش
          </button>
          <button
            onClick={() => onNavigate('consultation')}
            className="px-6 py-3 bg-teal-50 border border-teal-200 hover:bg-teal-100 text-[#0f766e] rounded-full text-xs font-bold transition"
          >
            درخواست مشاوره مرتبط
          </button>
        </div>
      </div>
    </div>
  );
};
