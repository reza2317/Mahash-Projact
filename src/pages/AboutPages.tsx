import React, { useState } from 'react';
import { PageId } from '../types';
import { Breadcrumb } from '../components/Breadcrumb';
import { Info, History, Eye, Target, FileCheck, CheckCircle2, TrendingUp, Users, Award, BookOpen, BarChart3, Activity } from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { toPersianDigits } from '../utils/persianDate';

const membersGrowthData = [
  { year: '۱۳۸۰', members: 120, families: 85, label: 'تأسیس رسمی' },
  { year: '۱۳۸۵', members: 280, families: 195, label: 'توسعه خدمات' },
  { year: '۱۳۹۰', members: 490, families: 340, label: 'افتتاح باشگاه' },
  { year: '۱۳۹۵', members: 720, families: 510, label: 'گسترش استان‌ها' },
  { year: '۱۴۰۰', members: 980, families: 720, label: 'سامانه آنلاین' },
  { year: '۱۴۰۴', members: 1350, families: 990, label: 'همکاری بین‌المللی' }
];

const workshopsData = [
  { year: '۱۴۰۰', workshops: 38, attendees: 450 },
  { year: '۱۴۰۱', workshops: 52, attendees: 680 },
  { year: '۱۴۰۲', workshops: 68, attendees: 920 },
  { year: '۱۴۰۳', workshops: 84, attendees: 1150 },
  { year: '۱۴۰۴', workshops: 106, attendees: 1480 }
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 text-white p-3 rounded-2xl shadow-xl border border-slate-700 text-xs space-y-1">
        <p className="font-bold text-amber-300">سال {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={`item-${index}`} className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-slate-300">{entry.name}:</span>
            <span className="font-bold font-mono text-white">
              {toPersianDigits(entry.value)} نفر/مورد
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

interface AboutPagesProps {
  pageType: 'about' | 'history' | 'mission' | 'goals' | 'statute';
  onNavigate: (page: PageId) => void;
}

export const AboutPages: React.FC<AboutPagesProps> = ({ pageType, onNavigate }) => {
  const [activeChartTab, setActiveChartTab] = useState<'members' | 'workshops'>('members');
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

        {/* Interactive Impact Dashboard with Recharts */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                <span>داشبورد اثرگذاری و دستاوردها (Impact Dashboard)</span>
              </div>
              <h2 className="text-xl font-black text-slate-900">
                گزارش تصویری پیشرفت و خدمات موسسه
              </h2>
              <p className="text-xs text-slate-500">
                نمودار آماری اعضای تحت پوشش، خانواده‌ها و کارگاه‌های آموزشی برگزار شده در طول بیش از ۲ دهه فعالیت
              </p>
            </div>

            {/* Chart Switcher Tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl self-start sm:self-auto text-xs font-bold">
              <button
                onClick={() => setActiveChartTab('members')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeChartTab === 'members'
                    ? 'bg-[#173b82] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>رشد اعضا و خانواده‌ها</span>
              </button>
              <button
                onClick={() => setActiveChartTab('workshops')}
                className={`px-3.5 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
                  activeChartTab === 'workshops'
                    ? 'bg-[#173b82] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>کارگاه‌ها و شرکت‌کنندگان</span>
              </button>
            </div>
          </div>

          {/* Chart Display Area */}
          <div className="w-full h-72 sm:h-80 pt-2" dir="ltr">
            {activeChartTab === 'members' ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={membersGrowthData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="membersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#173b82" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#173b82" stopOpacity={0.05}/>
                    </linearGradient>
                    <linearGradient id="familiesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0f766e" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0f766e" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                    formatter={(value) => (value === 'members' ? 'تعداد اعضای تحت پوشش' : 'خانواده‌های عضو')}
                  />
                  <Area
                    type="monotone"
                    dataKey="members"
                    name="اعضای تحت پوشش"
                    stroke="#173b82"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#membersGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="families"
                    name="خانواده‌ها"
                    stroke="#0f766e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#familiesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={workshopsData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="year" stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <YAxis stroke="#94a3b8" tick={{ fontSize: 12, fill: '#64748b' }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                    formatter={(value) => (value === 'workshops' ? 'تعداد کارگاه‌ها' : 'شرکت‌کنندگان')}
                  />
                  <Bar dataKey="workshops" name="تعداد کارگاه‌ها" fill="#173b82" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="attendees" name="شرکت‌کنندگان" fill="#d97706" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100 text-center">
              <span className="text-blue-900 font-bold block text-[11px]">نرخ رضایت اعضا</span>
              <span className="text-lg font-black text-[#173b82] font-mono">۹۸.۴٪</span>
            </div>
            <div className="bg-teal-50/60 p-3 rounded-2xl border border-teal-100 text-center">
              <span className="text-teal-900 font-bold block text-[11px]">کارگاه‌های تخصصی</span>
              <span className="text-lg font-black text-teal-700 font-mono">+۳۵۰ دوره</span>
            </div>
            <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100 text-center">
              <span className="text-amber-900 font-bold block text-[11px]">پوشش استانی</span>
              <span className="text-lg font-black text-amber-700 font-mono">سراسری ایران</span>
            </div>
            <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 text-center">
              <span className="text-indigo-900 font-bold block text-[11px]">رویدادهای باشگاه</span>
              <span className="text-lg font-black text-indigo-700 font-mono">+۱۲۰ رویداد</span>
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
