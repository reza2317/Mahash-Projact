import React, { useState, useEffect } from 'react';
import { PageId, ScoreItem } from '../types';
import { 
  getAllScores, 
  updateTeamScore, 
  subscribeToStoreUpdates, 
  isAdminAuthenticated, 
  getLatestReportUpdateDate,
  triggerGlobalCacheBust
} from '../utils/reportsStore';
import { useTeamLogos } from '../hooks/useTeamLogos';
import { getTeamLogoPlaceholder, MAHESH_LOGO_SVG } from '../utils/assets';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { Breadcrumb } from '../components/Breadcrumb';
import { formatSmartUpdateDate, toPersianDigits } from '../utils/persianDate';
import { logAuditEvent } from '../utils/auditLogger';
import { 
  Award, 
  CheckCircle2, 
  Calendar, 
  Info, 
  Edit3, 
  Check, 
  Trophy
} from 'lucide-react';

interface ScoresPageProps {
  onNavigate: (page: PageId) => void;
}

export const ScoresPage: React.FC<ScoresPageProps> = ({ onNavigate }) => {
  const { 
    teamsList, 
    mahashLogo, 
    getLogo
  } = useTeamLogos();

  const [scores, setScores] = useState<ScoreItem[]>(() => getAllScores());
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [newScoreVal, setNewScoreVal] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isAdmin = isAdminAuthenticated();

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const refresh = () => {
      setScores(getAllScores());
    };
    const unsub = subscribeToStoreUpdates(refresh);
    return () => unsub();
  }, []);

  const effectiveMahashLogo = mahashLogo || MAHESH_LOGO_SVG;
  const maxScore = Math.max(...scores.map((s) => s.score), 1);
  const smartUpdateDate = formatSmartUpdateDate(getLatestReportUpdateDate(), { persianDigits: true });

  const handleSaveScore = (teamId: string) => {
    updateTeamScore(teamId, Number(newScoreVal));
    setEditingScoreId(null);
    logAuditEvent('UPDATE_SCORE', `به‌روزرسانی امتیاز تیم`, `امتیاز تیم با شناسه ${teamId} به ${newScoreVal} تغییر یافت.`);
    triggerGlobalCacheBust();
    setScores(getAllScores());
    showToast('امتیاز با موفقیت در سیستم ذخیره و اعمال شد.');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8" dir="rtl">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-blue-500/40 text-xs sm:text-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'باشگاه جوانان', target: 'home' },
          { label: 'جمع‌بندی امتیازات تیم‌ها' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Hero Header with Mahash Official Logo and Title */}
      <div className="bg-gradient-to-br from-[#0f2f6b] via-[#173b82] to-[#2563eb] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Ambient subtle glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Right/Top: Single Prominent Official Mahash Logo & Title */}
          <div className="flex flex-col sm:flex-row items-center gap-5 shrink-0 text-center sm:text-right">
            <div 
              onClick={() => onNavigate('home')}
              className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-white p-2 shadow-lg border-2 border-white/50 flex items-center justify-center cursor-pointer hover:scale-105 transition transform overflow-hidden"
              title="موسسه توانبخشی و پیشگیری محاش (برای رفتن به صفحه اصلی کلیک کنید)"
            >
              <ResponsiveImage
                src={effectiveMahashLogo}
                fallbackSrc={MAHESH_LOGO_SVG}
                alt="لوگوی رسمی موسسه محاش"
                className="w-full h-full object-contain rounded-xl img-sharp"
                priority={true}
              />
            </div>

            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold mb-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>باشگاه جوانان مؤسسه محاش</span>
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white m-0 tracking-tight">
                جمع‌بندی امتیازات تیم‌ها
              </h1>
              <p className="text-xs text-blue-100/90 mt-1.5">
                رتبه‌بندی رسمی، مقایسه عملکرد و جدول پایش پیشرفت تیم‌های پنج‌گانه
              </p>
            </div>
          </div>

          {/* Left: Update Date Badge & Admin Actions */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300 shadow-sm">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{smartUpdateDate}</span>
            </div>

            {isAdmin && (
              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-2xl text-xs font-bold backdrop-blur-md border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>مدیریت امتیازها</span>
              </button>
            )}
          </div>
        </div>

        {/* Team Badges Quick Strip - EXACTLY 5 TEAMS */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {scores.map((s) => {
            const teamLogo = getLogo(s.id);
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onNavigate(`team-${s.id}` as PageId)}
                className="relative flex items-center gap-2.5 p-2 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-right transition group cursor-pointer"
              >
                <div className="relative w-10 h-10 rounded-full bg-white p-0.5 shrink-0 overflow-hidden shadow-xs group-hover:scale-105 transition border border-white/40">
                  <img
                    src={teamLogo}
                    alt={s.name}
                    className="w-full h-full object-contain rounded-full"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(s.id, s.name);
                    }}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[11px] font-bold text-white truncate block group-hover:text-amber-300 transition">
                    {s.name}
                  </span>
                  <span className="text-[10px] font-black text-amber-300">
                    {toPersianDigits(s.score)} امتیاز
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Table Card */}
      <div className="max-w-4xl mx-auto bg-white dark:bg-slate-900 rounded-3xl p-4 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        <div className="flex items-center justify-between pb-4 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              جدول رتبه‌بندی و نشان تیم‌ها
            </h2>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-500 dark:text-slate-400">
                <th className="py-3 px-4 text-center w-16">رتبه</th>
                <th className="py-3 px-4">نشان و عنوان تیم</th>
                <th className="py-3 px-4 text-center w-28">امتیاز</th>
                <th className="py-3 px-4 w-52 sm:w-64">پیشرفت / وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {scores.map((item, idx) => {
                const percentage = Math.round((item.score / maxScore) * 100);
                const rankNumber = idx + 1;
                const isEditing = editingScoreId === item.id;
                const teamLogoSrc = getLogo(item.id);
                const teamMeta = teamsList.find((t) => t.id === item.id || t.slug === `team-${item.id}`);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition">
                    {/* Rank */}
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`w-8 h-8 rounded-full inline-flex items-center justify-center font-black text-sm ${
                          rankNumber === 1
                            ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 ring-2 ring-amber-400 shadow-xs'
                            : rankNumber === 2
                            ? 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            : 'bg-slate-50 dark:bg-slate-850 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {toPersianDigits(rankNumber)}
                      </span>
                    </td>

                    {/* Team Name and Logo */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3 text-right">
                        <div 
                          onClick={() => onNavigate(`team-${item.id}` as PageId)}
                          className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-sm hover:scale-105 hover:border-blue-500 transition cursor-pointer shrink-0"
                          title={`مشاهده صفحه تیم ${item.name}`}
                        >
                          <ResponsiveImage
                            src={teamLogoSrc}
                            fallbackSrc={getTeamLogoPlaceholder(item.id, item.name)}
                            alt={item.name}
                            className="w-full h-full object-contain rounded-full img-sharp"
                          />
                        </div>

                        <button
                          onClick={() => onNavigate(`team-${item.id}` as PageId)}
                          className="text-right hover:text-[#173b82] dark:hover:text-blue-400 transition cursor-pointer"
                        >
                          <span className="text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-[#173b82] dark:hover:text-blue-400 block">
                            {item.name}
                          </span>
                          {teamMeta?.manager && (
                            <span className="text-[11px] text-slate-500 dark:text-slate-400">
                              مدیر: {teamMeta.manager}
                            </span>
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-4 px-4 text-center font-black text-base text-[#173b82] dark:text-blue-400">
                      {isAdmin && isEditing ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <input
                            type="text"
                            inputMode="numeric"
                            value={toPersianDigits(newScoreVal)}
                            onChange={(e) => {
                              const cleaned = e.target.value.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
                              const parsed = parseInt(cleaned.replace(/[^0-9]/g, ''), 10);
                              setNewScoreVal(isNaN(parsed) ? 0 : parsed);
                            }}
                            className="w-20 px-2 py-1 bg-white dark:bg-slate-800 border-2 border-blue-500 rounded-lg text-center font-black text-sm text-slate-900 dark:text-white"
                            autoFocus
                          />
                          <button
                            onClick={() => handleSaveScore(item.id)}
                            className="p-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition cursor-pointer"
                            title="ذخیره امتیاز"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <span>{toPersianDigits(item.score)}</span>
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setEditingScoreId(item.id);
                                setNewScoreVal(item.score);
                              }}
                              className="opacity-60 hover:opacity-100 p-1 text-slate-400 hover:text-blue-600 transition cursor-pointer"
                              title="تغییر امتیاز توسط مدیر"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Progress Bar & Status */}
                    <td className="py-4 px-4">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                          <span>{toPersianDigits(percentage)}٪ پیشرفت</span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            ثبت شده
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-teal-500 to-[#173b82] dark:from-teal-400 dark:to-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Note */}
        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
          <span>
            امتیازات بر اساس مشارکت تیمی، گزارش فعالیت‌های انجام‌شده و جلسات کار گروهی ثبت و در حافظه پایدار LocalStorage ذخیره می‌شوند.
          </span>
        </div>
      </div>
    </div>
  );
};
