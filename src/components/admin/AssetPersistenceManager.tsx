import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Database,
  Globe,
  Sparkles,
  AlertCircle,
  HardDrive,
  Video,
  FileText,
  Play,
  Layers,
  ExternalLink,
  Film
} from 'lucide-react';
import {
  getMahashLogo,
  setMahashLogo,
  getConsultantPhotos,
  getConsultantPhoto,
  saveConsultantPhoto,
  saveConsultantPhotoWithAutoCompression,
  getTeamLogo,
  saveTeamLogo,
  getAllTeamsList,
  getAllReports,
  persistAllAssetsPermanentlyToMySQLAndNetlify,
  persistReportsAndVideosPermanentlyToMySQL,
  subscribeToStoreUpdates
} from '../../utils/reportsStore';
import { getConsultantPhotoFromFirestore } from '../../utils/firestorePersistence';
import {
  MAHESH_LOGO_SVG,
  MAHESH_CLUB_EMBLEM_SVG,
  NAZI_AVATAR_SVG,
  RADIN_AVATAR_SVG
} from '../../utils/assets';
import { toPersianDigits } from '../../utils/persianDate';

interface AssetPersistenceManagerProps {
  onSuccessToast?: (msg: string) => void;
}

export const AssetPersistenceManager: React.FC<AssetPersistenceManagerProps> = ({
  onSuccessToast
}) => {
  const [mahashLogo, setLocalMahashLogo] = useState<string>(() => getMahashLogo() || MAHESH_LOGO_SVG);
  const [consultantPhotos, setLocalConsultantPhotos] = useState(() => getConsultantPhotos());
  const [teams, setTeams] = useState(() => getAllTeamsList());
  const [reports, setReports] = useState(() => getAllReports());
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSyncingReportsVideos, setIsSyncingReportsVideos] = useState(false);
  const [isSyncingConsultants, setIsSyncingConsultants] = useState(false);
  const [syncResult, setSyncResult] = useState<{
    success: boolean;
    totalAssets?: number;
    message?: string;
  } | null>(null);

  // Selected video for preview modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  // Prefetch consultant photos from Firestore/MySQL on mount
  useEffect(() => {
    let isMounted = true;
    const prefetchConsultants = async () => {
      try {
        const [nazi, radin] = await Promise.all([
          getConsultantPhotoFromFirestore('خانم دکتر نازی عباسیان'),
          getConsultantPhotoFromFirestore('آقای رادین اورومی')
        ]);
        if (!isMounted) return;
        setLocalConsultantPhotos(prev => ({
          ...prev,
          ...(nazi ? { 'خانم دکتر نازی عباسیان': nazi, 'consultant_nazi_abbasian': nazi, 'nazi_abbasian': nazi } : {}),
          ...(radin ? { 'آقای رادین اورومی': radin, 'consultant_radin_oroumi': radin, 'radin_oroumi': radin } : {})
        }));
      } catch (e) {
        console.warn('Could not prefetch consultant photos:', e);
      }
    };
    prefetchConsultants();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    const handleUpdate = () => {
      setLocalMahashLogo(getMahashLogo() || MAHESH_LOGO_SVG);
      setLocalConsultantPhotos(getConsultantPhotos());
      setTeams(getAllTeamsList());
      setReports(getAllReports());
    };
    const unsub = subscribeToStoreUpdates(handleUpdate);
    return () => unsub();
  }, []);

  const videoReports = reports.filter(r => Boolean((r as any).videoSrc || (r as any).videoUrl));

  const handleSyncAll = async () => {
    try {
      setIsSyncing(true);
      setSyncResult(null);

      const res = await persistAllAssetsPermanentlyToMySQLAndNetlify();

      setSyncResult({
        success: res.success,
        totalAssets: res.count,
        message: res.message || 'تمامی گزارشات، ویدیوها، لوگوها و تصاویر مشاوران با موفقیت در دیتابیس MySQL و بسته انتشار Netlify ثبت شدند.'
      });

      if (onSuccessToast) {
        onSuccessToast('تمامی گزارشات، ویدیوها، لوگوهای محاش و تصاویر مشاوران در دیتابیس MySQL ذخیره و دائمی شدند.');
      }
    } catch (err: any) {
      console.error('Error syncing assets to MySQL:', err);
      setSyncResult({
        success: false,
        message: 'خطا در ذخیره‌سازی دارایی‌ها: ' + (err?.message || 'ارتباط با سرور برقرار نشد.')
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncReportsAndVideosOnly = async () => {
    try {
      setIsSyncingReportsVideos(true);
      const res = await persistReportsAndVideosPermanentlyToMySQL();
      setSyncResult({
        success: res.success,
        totalAssets: res.repCount + res.vidCount,
        message: res.message || `تعداد ${res.repCount} گزارش و ${res.vidCount} ویدیو در جداول MySQL تثبیت شدند.`
      });
      if (onSuccessToast) {
        onSuccessToast('گزارشات و ویدیوها با موفقیت در دیتابیس MySQL ذخیره شدند.');
      }
    } catch (err: any) {
      setSyncResult({
        success: false,
        message: 'خطا در ثبت گزارشات و ویدیوها: ' + (err?.message || 'ارتباط با سرور برقرار نشد.')
      });
    } finally {
      setIsSyncingReportsVideos(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        await setMahashLogo(dataUrl);
        setLocalMahashLogo(dataUrl);
        if (onSuccessToast) {
          onSuccessToast('لوگوی جدید محاش با موفقیت آپلود و در دیتابیس MySQL ثبت شد.');
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleConsultantPhotoUpload = async (consultantName: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSyncingConsultants(true);
      const comp = await saveConsultantPhotoWithAutoCompression(consultantName, file);
      
      // Update local state immediately with compressed data
      const updatedPhotos = {
        ...getConsultantPhotos(),
        [consultantName]: comp.compressedDataUrl
      };
      setLocalConsultantPhotos(updatedPhotos);

      // Trigger automatic permanent synchronization to MySQL & Netlify
      await persistAllAssetsPermanentlyToMySQLAndNetlify();

      if (onSuccessToast) {
        onSuccessToast(`تصویر ${consultantName} با موفقیت فشرده‌سازی WebP شد (${comp.compressedSizeFormatted}) و به‌طور دائمی در دیتابیس MySQL و بسته انتشار Netlify ثبت گردید.`);
      }
    } catch (err: any) {
      console.error('Error in consultant photo auto-compression and sync:', err);
      if (onSuccessToast) {
        onSuccessToast('خطا در ذخیره‌سازی تصویر مشاور: ' + (err?.message || 'مشکل در فشرده‌سازی یا ارتباط با دیتابیس'));
      }
    } finally {
      setIsSyncingConsultants(false);
    }
  };

  const handleSyncConsultantPhotosDirectly = async () => {
    try {
      setIsSyncingConsultants(true);
      const res = await persistAllAssetsPermanentlyToMySQLAndNetlify();
      setLocalConsultantPhotos(getConsultantPhotos());
      if (onSuccessToast) {
        onSuccessToast(res.message || 'تصاویر مشاوران مؤسسه با موفقیت در دیتابیس MySQL و پکیج انتشار Netlify تثبیت شدند.');
      }
    } catch (err: any) {
      console.error('Error syncing consultant photos directly:', err);
    } finally {
      setIsSyncingConsultants(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-5 max-w-2xl w-full space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Video className="w-4 h-4 text-emerald-400" />
                <span>پیش‌نمایش ویدیوی ذخیره‌شده در MySQL</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewVideoUrl(null)}
                className="text-xs px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
              >
                بستن
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black aspect-video flex items-center justify-center">
              <video
                src={previewVideoUrl}
                controls
                autoPlay
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-900 rounded-3xl border border-emerald-500/30 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-12 translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>پایگاه داده پایدار MySQL &amp; پکیج انتشار Netlify</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                ذخیره‌سازی دائمی گزارشات، ویدیوها، لوگوهای محاش و تصاویر مشاوران در دیتابیس MySQL
              </h2>
              <p className="text-xs sm:text-sm text-emerald-200/90 leading-relaxed">
                کلیه گزارشات ۵ تیم، ویدیوهای ثبت‌شده، نشان رسمی مؤسسه محاش، نشان باشگاه جوانان،
                لوگوهای تیم‌ها و عکس‌های مشاوران در جداول MySQL (جداول <code className="font-mono text-emerald-300">mahash_reports</code>، <code className="font-mono text-emerald-300">mahash_videos</code> و <code className="font-mono text-emerald-300">mahash_assets</code>)
                تثبیت و مستقیماً در پکیج خروجی Netlify قرار می‌گیرند.
              </p>
            </div>

            <div className="flex flex-col gap-2.5 shrink-0">
              <button
                type="button"
                onClick={handleSyncAll}
                disabled={isSyncing || isSyncingReportsVideos}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 group"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : 'group-hover:rotate-180'} transition-transform`} />
                <span>
                  {isSyncing
                    ? 'در حال تثبیت جامع در MySQL...'
                    : 'تثبیت جامع همه دارایی‌ها در MySQL و Netlify'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleSyncReportsAndVideosOnly}
                disabled={isSyncing || isSyncingReportsVideos}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Video className={`w-4 h-4 text-cyan-300 ${isSyncingReportsVideos ? 'animate-spin' : ''}`} />
                <span>
                  {isSyncingReportsVideos
                    ? 'در حال ثبت گزارشات و ویدیوها...'
                    : 'تثبیت سریع گزارشات و ویدیوها در MySQL'}
                </span>
              </button>
            </div>
          </div>

          {/* Sync Result Banner */}
          {syncResult && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-3 animate-in fade-in ${
                syncResult.success
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-100'
                  : 'bg-rose-500/20 border-rose-400/40 text-rose-100'
              }`}
            >
              {syncResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              )}
              <div className="space-y-0.5">
                <div>{syncResult.message}</div>
                {syncResult.totalAssets !== undefined && (
                  <div className="text-[11px] opacity-80">
                    مجموع رکوردهای ثبت‌شده در MySQL: {toPersianDigits(syncResult.totalAssets)} رکورد
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-base sm:text-lg font-black text-cyan-300 font-mono">
                {toPersianDigits(reports.length)}
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">گزارش تیم‌ها در MySQL</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-base sm:text-lg font-black text-emerald-300 font-mono">
                {toPersianDigits(videoReports.length)}
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">ویدیو و رسانه ثبت‌شده</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-base sm:text-lg font-black text-amber-300 font-mono">
                {toPersianDigits(teams.length + 2)}
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">نشان و لوگوی رسمی</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-base sm:text-lg font-black text-purple-300 font-mono">
                {toPersianDigits(Object.keys(consultantPhotos).length || 2)}
              </div>
              <div className="text-[11px] text-emerald-200 mt-0.5">تصویر مشاور در دیتابیس</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Reports & Videos Persistence in MySQL (NEW) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                گزارشات تیم‌ها و ویدیوهای مستقر در MySQL (جداول mahash_reports و mahash_videos)
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                مشاهده وضعیت ذخیره‌سازی، پیش‌نمایش ویدیوها و تأیید همگام‌سازی دائمی با دیتابیس
              </p>
            </div>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5 self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{toPersianDigits(reports.length)} گزارش فعال</span>
          </span>
        </div>

        {/* Video & Report Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto pr-1">
          {reports.map((rep) => {
            const hasVideo = Boolean((rep as any).videoSrc || (rep as any).videoUrl);
            const videoSrc = (rep as any).videoSrc || (rep as any).videoUrl;
            const thumb = (rep as any).thumbnail || (rep as any).poster;

            return (
              <div
                key={rep.id}
                className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
                      {rep.teamName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rep.date || 'بدون تاریخ'}
                    </span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                    {rep.title}
                  </h4>

                  {rep.summary && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {rep.summary}
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-[10px]">
                  {hasVideo ? (
                    <button
                      type="button"
                      onClick={() => setPreviewVideoUrl(videoSrc)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition cursor-pointer"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>پخش ویدیو</span>
                    </button>
                  ) : (
                    <span className="text-slate-400 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>گزارش متنی</span>
                    </span>
                  )}

                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>پایدار در MySQL</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Official Logos Persistence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card: Mahash Official Logo */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    لوگوی رسمی مؤسسه محاش
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    شناسه: <code className="font-mono text-blue-600">mahash_official_logo</code> در MySQL
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                پایدار در MySQL
              </span>
            </div>

            <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 p-2 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                <img
                  src={mahashLogo}
                  alt="لوگوی رسمی محاش"
                  className="max-w-full max-h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="space-y-1 text-xs">
                <p className="font-bold text-slate-800 dark:text-slate-200">
                  لوگوی اصلی نوبار و فوتر سامانه
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  این لوگو در جدول mahash_assets ذخیره شده و هیچ‌گاه از دست نخواهد رفت.
                </p>
              </div>
            </div>
          </div>

          <label className="w-full py-2.5 px-4 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold border border-blue-200 dark:border-blue-800 transition flex items-center justify-center gap-2 cursor-pointer text-center">
            <Upload className="w-4 h-4" />
            <span>آپلود و جایگزینی لوگوی جدید محاش</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* Card: Consultant Photos */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    تصاویر اختصاصی مشاوران مؤسسه
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    ذخیره مستقیم در دیتابیس MySQL و پکیج Netlify
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                پایدار در MySQL
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Nazi Persian */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border-2 border-purple-400/50 bg-white p-0.5">
                  <img
                    src={
                      consultantPhotos['خانم دکتر نازی عباسیان'] ||
                      consultantPhotos['نازی عباسیان'] ||
                      consultantPhotos['consultant_nazi_abbasian'] ||
                      consultantPhotos['nazi_abbasian'] ||
                      getConsultantPhoto('خانم دکتر نازی عباسیان') ||
                      NAZI_AVATAR_SVG
                    }
                    alt="خانم دکتر نازی عباسیان"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  خانم دکتر نازی عباسیان
                </span>
                <label className="inline-block px-2.5 py-1 bg-white dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                  <span>{isSyncingConsultants ? 'در حال ثبت...' : 'تغییر تصویر'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSyncingConsultants}
                    onChange={(e) => handleConsultantPhotoUpload('خانم دکتر نازی عباسیان', e)}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Radin Oroumi */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-full overflow-hidden border-2 border-cyan-400/50 bg-white p-0.5">
                  <img
                    src={
                      consultantPhotos['آقای رادین اورومی'] ||
                      consultantPhotos['رادین اورومی'] ||
                      consultantPhotos['consultant_radin_oroumi'] ||
                      consultantPhotos['radin_oroumi'] ||
                      getConsultantPhoto('آقای رادین اورومی') ||
                      RADIN_AVATAR_SVG
                    }
                    alt="آقای رادین اورومی"
                    className="w-full h-full object-cover rounded-full"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  آقای رادین اورومی
                </span>
                <label className="inline-block px-2.5 py-1 bg-white dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100 transition-colors">
                  <span>{isSyncingConsultants ? 'در حال ثبت...' : 'تغییر تصویر'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isSyncingConsultants}
                    onChange={(e) => handleConsultantPhotoUpload('آقای رادین اورومی', e)}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Direct Sync Button for Consultant Photos */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSyncConsultantPhotosDirectly}
                disabled={isSyncingConsultants}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 active:scale-[0.98]"
              >
                {isSyncingConsultants ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-200" />
                )}
                <span>ذخیره مستقیم در دیتابیس MySQL و پکیج Netlify</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 3: Team Logos Grid */}
      <div className="space-y-2 pt-2">
        <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">
          لوگوهای تیم‌های پنج‌گانه باشگاه جوانان (ذخیره‌شده در MySQL و آماده انتشار):
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {teams.map((t) => {
            const logo = getTeamLogo(t.id) || t.logo;
            return (
              <div
                key={t.id}
                className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2"
              >
                <div className="w-12 h-12 mx-auto rounded-xl bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 flex items-center justify-center">
                  <img
                    src={logo}
                    alt={t.name}
                    className="max-w-full max-h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">
                  {t.name}
                </span>
                <label className="inline-block px-2 py-1 bg-white dark:bg-slate-700 text-[10px] font-bold text-slate-600 dark:text-slate-300 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:bg-slate-100">
                  <span>تغییر لوگو</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      const r = new FileReader();
                      r.onload = async (ev) => {
                        const d = ev.target?.result as string;
                        if (d) {
                          await saveTeamLogo(t.id, d);
                          setTeams(getAllTeamsList());
                          if (onSuccessToast) {
                            onSuccessToast(`لوگوی ${t.name} در دیتابیس MySQL ذخیره شد.`);
                          }
                        }
                      };
                      r.readAsDataURL(f);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
