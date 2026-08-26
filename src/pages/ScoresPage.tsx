import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  Trophy, 
  Upload, 
  Image as ImageIcon, 
  RotateCcw, 
  X, 
  Camera,
  Layers
} from 'lucide-react';

interface ScoresPageProps {
  onNavigate: (page: PageId) => void;
}

export const ScoresPage: React.FC<ScoresPageProps> = ({ onNavigate }) => {
  const { 
    logos, 
    teamsList, 
    mahashLogo, 
    getLogo, 
    updateTeamLogo, 
    resetTeamLogo, 
    updateMahashLogo, 
    resetMahashLogo 
  } = useTeamLogos();

  const [scores, setScores] = useState<ScoreItem[]>(() => getAllScores());
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null);
  const [newScoreVal, setNewScoreVal] = useState<number>(0);
  
  // Logo Manager Modal State
  const [showLogoModal, setShowLogoModal] = useState<boolean>(false);
  const [logoModalTarget, setLogoModalTarget] = useState<'teams' | 'mahash'>('teams');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState<boolean>(false);

  const fileInputMahashRef = useRef<HTMLInputElement>(null);
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

  // Upload Mahash Institution Logo directly to LocalStorage
  const handleMahashLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('لطفاً یک فایل تصویری معتبر انتخاب فرمایید.');
      return;
    }

    setIsProcessingUpload(true);
    try {
      await updateMahashLogo(file);
      logAuditEvent('UPDATE_LOGO', 'بارگذاری لوگوی جدید مؤسسه محاش', `فایل (${file.name}) در حافظه پایدار سیستم ذخیره شد.`);
      showToast('لوگوی مؤسسه محاش با موفقیت در LocalStorage ذخیره و اعمال گردید.');
    } catch (err) {
      console.error('Error uploading Mahash logo:', err);
      showToast('خطا در پردازش و ذخیره‌سازی تصویر لوگو.');
    } finally {
      setIsProcessingUpload(false);
      if (fileInputMahashRef.current) fileInputMahashRef.current.value = '';
    }
  };

  // Upload specific team logo directly to LocalStorage
  const handleTeamLogoUpload = async (teamId: string, teamName: string, file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('لطفاً یک فایل تصویری معتبر انتخاب فرمایید.');
      return;
    }

    setIsProcessingUpload(true);
    try {
      await updateTeamLogo(teamId, file);
      logAuditEvent('UPDATE_LOGO', `تغییر عکس/لوگوی تیم ${teamName}`, `لوگوی جدید تیم ${teamName} در LocalStorage ذخیره شد.`);
      showToast(`لوگوی تیم «${teamName}» با موفقیت ذخیره و در سراسر اپلیکیشن اعمال شد.`);
    } catch (err) {
      console.error('Error uploading team logo:', err);
      showToast('خطا در ذخیره‌سازی لوگوی تیم.');
    } finally {
      setIsProcessingUpload(false);
    }
  };

  const handleResetMahash = () => {
    resetMahashLogo();
    logAuditEvent('UPDATE_LOGO', 'بازنشانی لوگوی محاش به حالت پیش‌فرض', 'لوگوی رسمی مؤسسه به حالت اولیه وکتور بازگردانده شد.');
    showToast('لوگوی مؤسسه محاش به نشان استاندارد بازنشانی شد.');
  };

  const handleResetTeam = (teamId: string, teamName: string) => {
    resetTeamLogo(teamId);
    logAuditEvent('UPDATE_LOGO', `حذف و بازنشانی لوگوی تیم ${teamName}`, `لوگوی تیم ${teamName} به حالت پیش‌فرض بازگردانده شد.`);
    showToast(`لوگوی تیم «${teamName}» به نشان پیش‌فرض بازنشانی گردید.`);
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

      {/* Hidden File Input for quick Mahash logo upload */}
      <input
        type="file"
        ref={fileInputMahashRef}
        onChange={handleMahashLogoUpload}
        accept="image/*"
        className="hidden"
      />

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
            {/* Mahash Institution Official Logo (Editable) */}
            <div className="relative group/logo shrink-0">
              <div 
                onClick={() => onNavigate('home')}
                className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-white p-2 shadow-lg border-2 border-white/50 flex items-center justify-center cursor-pointer hover:scale-105 transition transform overflow-hidden"
                title="موسسه توانبخشی و پیشگیری محاش (برای رفتن به صفحه اصلی کلیک کنید)"
              >
                <img
                  src={effectiveMahashLogo}
                  alt="لوگوی رسمی موسسه محاش"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
              {/* Quick change overlay */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputMahashRef.current?.click();
                }}
                className="absolute inset-0 bg-black/65 text-white rounded-2xl opacity-0 group-hover/logo:opacity-100 transition-opacity flex flex-col items-center justify-center text-[10px] font-bold p-1 cursor-pointer"
                title="تغییر / بارگذاری عکس جدید لوگوی محاش"
              >
                <Camera className="w-4 h-4 mb-0.5" />
                <span>تغییر لوگو</span>
              </button>
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

          {/* Left: Update Date Badge & Quick Action Buttons */}
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/30 backdrop-blur-md border border-white/20 text-xs font-bold text-emerald-300 shadow-sm">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>{smartUpdateDate}</span>
            </div>

            {/* Quick Logo Management Modal Trigger */}
            <button
              onClick={() => {
                setLogoModalTarget('teams');
                setShowLogoModal(true);
              }}
              className="px-4 py-2 bg-amber-500/25 hover:bg-amber-500/35 text-amber-200 hover:text-white border border-amber-400/40 rounded-2xl text-xs font-bold backdrop-blur-md transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              title="بارگذاری، تغییر و ذخیره عکس و لوگوهای تیم‌ها"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>ویرایش و بارگذاری لوگوها</span>
            </button>

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

        {/* Team Badges Quick Strip with Direct Edit on Hover - EXACTLY 5 TEAMS */}
        <div className="mt-6 pt-5 border-t border-white/15 grid grid-cols-2 sm:grid-cols-5 gap-3">
          {scores.map((s) => {
            const teamLogo = getLogo(s.id);
            return (
              <div
                key={s.id}
                className="relative flex items-center gap-2.5 p-2 bg-white/10 hover:bg-white/20 rounded-2xl border border-white/10 text-right transition group"
              >
                <button
                  type="button"
                  onClick={() => onNavigate(`team-${s.id}` as PageId)}
                  className="flex items-center gap-2.5 min-w-0 flex-1 text-right cursor-pointer"
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

                {/* Direct quick upload button on strip */}
                <label
                  title={`تغییر عکس یا لوگوی ${s.name}`}
                  className="opacity-0 group-hover:opacity-100 p-1.5 bg-black/60 hover:bg-black/90 text-amber-300 rounded-xl transition cursor-pointer shrink-0"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleTeamLogoUpload(s.id, s.name, file);
                    }}
                  />
                </label>
              </div>
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
          <button
            onClick={() => {
              setLogoModalTarget('teams');
              setShowLogoModal(true);
            }}
            className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>ویرایش عکس همه تیم‌ها</span>
          </button>
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

                    {/* Team Name and Editable Logo */}
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3 text-right">
                        {/* Logo with interactive change button */}
                        <div className="relative group/teamlogo shrink-0">
                          <div 
                            onClick={() => onNavigate(`team-${item.id}` as PageId)}
                            className="w-12 h-12 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-sm group-hover/teamlogo:scale-105 group-hover/teamlogo:border-blue-500 transition cursor-pointer"
                            title={`مشاهده صفحه تیم ${item.name}`}
                          >
                            <img
                              src={teamLogoSrc}
                              alt={item.name}
                              loading="lazy"
                              decoding="async"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(item.id, item.name);
                              }}
                              className="w-full h-full object-contain rounded-full"
                            />
                          </div>
                          {/* Quick upload overlay on table row */}
                          <label
                            title={`تغییر عکس یا لوگوی ${item.name}`}
                            className="absolute inset-0 bg-black/60 text-white rounded-full opacity-0 group-hover/teamlogo:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                          >
                            <Camera className="w-4 h-4 text-amber-300" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleTeamLogoUpload(item.id, item.name, file);
                              }}
                            />
                          </label>
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

      {/* Logo Management Modal */}
      {showLogoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-xl w-full shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    بارگذاری، ویرایش و حذف لوگوها (LocalStorage)
                  </h3>
                  <p className="text-xs text-slate-500">
                    تغییر و ذخیره‌سازی دائمی لوگوی مؤسسه محاش و تیم‌های پنج‌گانه
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLogoModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Selector Tabs */}
            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setLogoModalTarget('teams')}
                className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  logoModalTarget === 'teams'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>لوگوی تیم‌های پنج‌گانه</span>
              </button>
              <button
                type="button"
                onClick={() => setLogoModalTarget('mahash')}
                className={`flex-1 py-2.5 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  logoModalTarget === 'mahash'
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>لوگوی مؤسسه محاش</span>
              </button>
            </div>

            {/* Content for EXACTLY the 5 Teams Logos */}
            {logoModalTarget === 'teams' && (
              <div className="space-y-3 max-h-80 overflow-y-auto p-1">
                {teamsList.map((t) => {
                  const currentLogo = getLogo(t.id);
                  return (
                    <div key={t.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-full bg-white p-0.5 border-2 border-blue-500/30 shadow-xs flex items-center justify-center shrink-0 overflow-hidden">
                          <img 
                            src={currentLogo} 
                            alt={t.name} 
                            className="w-full h-full object-contain rounded-full" 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(t.id, t.name);
                            }}
                          />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block truncate">{t.name}</span>
                          {t.manager && (
                            <span className="text-[10px] text-slate-500 block truncate">مدیر: {t.manager}</span>
                          )}
                          <span className="text-[9px] text-slate-400 block font-mono">
                            {t.isCustom ? '✓ تصویر سفارشی ذخیره‌شده' : 'نشان وکتور پیش‌فرض'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <label className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[11px] font-bold transition cursor-pointer flex items-center gap-1 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>آپلود تصویر</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleTeamLogoUpload(t.id, t.name, file);
                            }}
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => handleResetTeam(t.id, t.name)}
                          title="حذف لوگوی سفارشی و بازنشانی به پیش‌فرض"
                          className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition cursor-pointer"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Content for Mahash Logo */}
            {logoModalTarget === 'mahash' && (
              <div className="space-y-4 text-center py-2">
                <div className="w-28 h-28 mx-auto bg-slate-50 dark:bg-slate-800 rounded-3xl p-3 border-2 border-blue-500 shadow-md flex items-center justify-center">
                  <img src={effectiveMahashLogo} alt="لوگوی فعلی محاش" className="w-full h-full object-contain" />
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  لوگوی رسمی و سازمانی مؤسسه توانبخشی و پیشگیری محاش (ذخیره‌شده در LocalStorage)
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputMahashRef.current?.click()}
                    disabled={isProcessingUpload}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                  >
                    <Upload className="w-4 h-4" />
                    <span>{isProcessingUpload ? 'در حال پردازش...' : 'انتخاب و آپلود فایل لوگو'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleResetMahash}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>بازنشانی به پیش‌فرض</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
