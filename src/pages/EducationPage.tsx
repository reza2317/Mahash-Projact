import React from 'react';
import { PageId } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { BookOpen, Award, CheckCircle2, ArrowRight } from 'lucide-react';

interface EducationPageProps {
  onNavigate: (page: PageId) => void;
}

export const EducationPage: React.FC<EducationPageProps> = ({ onNavigate }) => {
  const topics = [
    { title: 'تیم‌سازی و ارتباط مؤثر', icon: '🤝', desc: 'مهارت‌های کار گروهی، ارتباط بدون کلام و ایجاد اعتماد در تیم' },
    { title: 'تفکر خلاق و حل مسئله', icon: '🧠', desc: 'بازی‌های فکری و ذهنی، تمرین تصمیم‌گیری و تفکر واگرا' },
    { title: 'هنر خودمراقبتی', icon: '💚', desc: 'توجه به سلامت جسمی، روانی، تنفسی و مدیریت استرس' },
    { title: 'هدف‌گذاری و امید به آینده', icon: '🎯', desc: 'برنامه‌ریزی برای اهداف شغلی، تحصیلی و باور به توانایی‌ها' },
    { title: 'خلاقیت، تئاتر و ارائه', icon: '🎭', desc: 'بیان احساسات در قالب نمایش، هنر تصویری و ارتباطات کلامی/اشاره' },
    { title: 'مسئولیت‌پذیری و رهبری', icon: '🏅', desc: 'ایفای نقش در تیم‌ها، مدیریت پروژه‌ها و مشارکت مدنی' }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <Breadcrumb items={[{ label: 'آموزش' }]} onNavigate={onNavigate} />

      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-[#173b82] text-xs font-bold">
          <BookOpen className="w-3.5 h-3.5" />
          <span>آموزش‌های کاربردی محاش</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
          آموزش‌های باشگاه جوانان
        </h1>
        <p className="text-sm text-slate-600 font-medium">
          یادگیری تجربه‌محور از دل جلسات و کارگاه‌های عملی باشگاه جوانان محاش
        </p>
      </div>

      {/* Topics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {topics.map((t, idx) => (
          <div
            key={idx}
            className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition space-y-3"
          >
            <span className="w-12 h-12 rounded-2xl bg-blue-50 text-2xl flex items-center justify-center">
              {t.icon}
            </span>
            <h3 className="text-base font-bold text-[#173b82]">{t.title}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t.desc}</p>
          </div>
        ))}
      </div>

      {/* 6 Sessions Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div className="border-b border-slate-100 pb-3">
          <h2 className="text-xl font-black text-[#173b82]">
            تایم‌لاین مسیر ۶ جلسه آموزشی باشگاه
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            سرفصل‌های مستندشده و اجراشده در دوره‌های توانمندسازی جوانان
          </p>
        </div>

        <div className="space-y-4">
          {[
            { num: '۱', title: 'جلسه اول: آشنایی و آغاز مسیر تیم‌سازی', desc: 'شناخت اعضای گروه، تعیین ارزش‌ها و قوانین مشترک' },
            { num: '۲', title: 'جلسه دوم: ساختن هویت تیمی و همسویی', desc: 'انتخاب نام و اهداف تیمی، کار گروهی و تمرین‌های ارتباطی' },
            { num: '۳', title: 'جلسه سوم: محک توانایی‌ها در میدان رقابت', desc: 'بازی‌های فکری، استراتژی حل مسئله و همکاری مشترک' },
            { num: '۴', title: 'جلسه چهارم: هنر خودمراقبتی در قالب تئاتر', desc: 'تمرین نمایش و شیوه‌های مراقبت از سلامت جسم و روان' },
            { num: '۵', title: 'جلسه پنجم: رؤیا، امید و تلاش برای آینده', desc: 'ترسیم نقشه راه آینده، کشف استعدادها و هدف‌گذاری' },
            { num: '۶', title: 'جلسه ششم: مرور مسیر طی‌شده و تثبیت آموخته‌ها', desc: 'ارائه دستاوردها، جمع‌بندی امتیازات و جشن پایانی' }
          ].map((s, idx) => (
            <div key={idx} className="flex items-start gap-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <span className="w-9 h-9 rounded-xl bg-[#173b82] text-white flex items-center justify-center font-black text-sm shrink-0">
                {s.num}
              </span>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-2 flex justify-between items-center">
          <button
            onClick={() => onNavigate('team-tomorrow')}
            className="text-xs font-bold text-[#173b82] hover:underline"
          >
            مشاهده گزارش ویدیویی و مستندات باشگاه فردا ←
          </button>
        </div>
      </div>
    </div>
  );
};
