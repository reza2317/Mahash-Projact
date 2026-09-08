import React, { useState } from 'react';
import {
  Package,
  Download,
  Database,
  Globe,
  FileCode,
  FileSpreadsheet,
  Server,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Code2,
  Terminal,
  ExternalLink,
  HardDrive,
  Video,
  Share2,
  ShieldCheck,
  FolderArchive
} from 'lucide-react';
import {
  generateMasterFullMigrationZip,
  generateCompleteMySQLDump,
  generateWordPressWxrExportXml,
  generateHtaccessConfig,
  generateNginxConfig,
  generateWebConfig,
  generateLocalRunnerScripts,
  generateWordPressEmbedCodes,
  generateMigrationReadmeFA,
  downloadFile
} from '../../utils/comprehensiveMigrationExporter';
import {
  getAllReports,
  getAllScores,
  getAllTeamsList,
  getNewsAnnouncements,
  exportFullDatabaseJSON,
  exportReportsCSV,
  exportScoresCSV,
  exportNewsAnnouncementsCSV,
  exportConsultantsCSV,
  getMahashLogo,
  getYouthClubBadge
} from '../../utils/reportsStore';
import { downloadNetlifyDeploymentZip } from '../../utils/netlifyExport';
import { toPersianDigits } from '../../utils/persianDate';
import { MAHESH_LOGO_SVG, MAHESH_CLUB_EMBLEM_SVG } from '../../utils/assets';

interface ComprehensiveExportHubProps {
  onSuccessToast?: (msg: string) => void;
}

export const ComprehensiveExportHub: React.FC<ComprehensiveExportHubProps> = ({
  onSuccessToast
}) => {
  const [isGeneratingMaster, setIsGeneratingMaster] = useState(false);
  const [masterProgress, setMasterProgress] = useState<number>(0);
  const [masterStatus, setMasterStatus] = useState<string>('');
  const [isDownloadingNetlify, setIsDownloadingNetlify] = useState(false);

  const reports = getAllReports();
  const scores = getAllScores();
  const teams = getAllTeamsList();
  const news = getNewsAnnouncements();

  const handleDownloadMaster = async () => {
    try {
      setIsGeneratingMaster(true);
      setMasterProgress(5);
      setMasterStatus('در حال آغاز پکیج‌بندی جامع...');

      const result = await generateMasterFullMigrationZip((percent, status) => {
        setMasterProgress(percent);
        setMasterStatus(status);
      });

      downloadFile(result.blob, result.filename, 'application/zip');

      if (onSuccessToast) {
        onSuccessToast('پکیج جامع مهاجرت و انتقال کامل با موفقیت دانلود شد.');
      }
    } catch (err: any) {
      console.error('Error generating master migration bundle:', err);
      alert('خطا در تولید پکیج جامع: ' + (err?.message || 'نامشخص'));
    } finally {
      setTimeout(() => {
        setIsGeneratingMaster(false);
        setMasterProgress(0);
        setMasterStatus('');
      }, 1500);
    }
  };

  const handleDownloadNetlify = async () => {
    try {
      setIsDownloadingNetlify(true);
      const res = await downloadNetlifyDeploymentZip((msg) => {
        if (onSuccessToast && msg) onSuccessToast(msg);
      });
      if (res.success && onSuccessToast) {
        onSuccessToast('بسته استقرار Netlify با موفقیت دریافت شد.');
      }
    } catch (err: any) {
      alert('خطا در دانلود بسته Netlify: ' + err?.message);
    } finally {
      setIsDownloadingNetlify(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Master Action */}
      <div className="bg-gradient-to-br from-indigo-900 via-blue-950 to-slate-900 rounded-3xl border border-indigo-500/30 p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 -translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 translate-x-12 translate-y-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                <span>سامانه جامع برون‌بری، استقرار و مهاجرت چندمنظوره</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white leading-snug">
                مرکز تولید بسته‌های خروجی، هاستینگ، لوکال و وردپرس مؤسسه محاش
              </h2>
              <p className="text-xs sm:text-sm text-indigo-200/90 leading-relaxed">
                تولید یک‌کلیکه و اختصاصی کلیه فایل‌های وب‌استاتیک (HTML5 / CSS / JS)، رسانه‌ها و ویدیوها،
                اسکریپت دیتابیس MySQL (با ساختار جداول و درج داده‌ها)، فایل رسمی درون‌ریزی وردپرس (WXR XML)،
                پوسته اختصاصی وردپرس، کانفیگ‌های سرور (.htaccess و nginx.conf) و فایل‌های راه‌انداز لوکال جهت انتقال به هاست، cPanel، لوکال‌هاست یا داکر.
              </p>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              <button
                type="button"
                onClick={handleDownloadMaster}
                disabled={isGeneratingMaster}
                className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-60 group"
              >
                <FolderArchive className={`w-5 h-5 ${isGeneratingMaster ? 'animate-bounce' : 'group-hover:scale-110'} transition-transform`} />
                <span>
                  {isGeneratingMaster
                    ? 'در حال تولید پکیج جامع...'
                    : 'تولید و دانلود پکیج جامع مهاجرت کامل (Master ZIP)'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleDownloadNetlify}
                disabled={isDownloadingNetlify}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${isDownloadingNetlify ? 'animate-spin text-amber-300' : ''}`} />
                <span>دانلود سریع پکیج وب استاتیک Netlify (ZIP)</span>
              </button>
            </div>
          </div>

          {/* Progress Bar (if generating) */}
          {isGeneratingMaster && (
            <div className="p-4 rounded-2xl bg-black/40 border border-emerald-500/40 space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-emerald-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  {masterStatus}
                </span>
                <span className="font-mono text-emerald-300">{toPersianDigits(masterProgress)}%</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${masterProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Statistics Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-cyan-300 font-mono">
                {toPersianDigits(reports.length)}
              </div>
              <div className="text-[11px] text-indigo-200 mt-0.5">گزارش و ویدیو آماده</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-emerald-300 font-mono">
                {toPersianDigits(scores.length)}
              </div>
              <div className="text-[11px] text-indigo-200 mt-0.5">تیم در جدول امتیازات</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-amber-300 font-mono">
                {toPersianDigits(news.length)}
              </div>
              <div className="text-[11px] text-indigo-200 mt-0.5">اطلاعیه و خبر Ticker</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-purple-300 font-mono">۵ جدول</div>
              <div className="text-[11px] text-indigo-200 mt-0.5">ساختار استاندارد MySQL</div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
              <div className="text-lg font-black text-rose-300 font-mono">WXR 1.2</div>
              <div className="text-[11px] text-indigo-200 mt-0.5">سازگاری رسمی وردپرس</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Specialized Export Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CARD 1: Database & SQL Full Export */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    پایگاه داده و اسکریپت جامع MySQL
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    اسکریپت کامل SQL با ایجاد جداول و درج اطلاعات، نسخه JSON و CSV
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono">
                UTF8MB4
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              شامل تمامی جداول <code className="font-mono text-blue-600">mahash_reports</code>، <code className="font-mono text-blue-600">mahash_team_scores</code>، <code className="font-mono text-blue-600">mahash_news_announcements</code>، <code className="font-mono text-blue-600">mahash_assets</code> و <code className="font-mono text-blue-600">mahash_videos</code> قابل ایمپورت مستقیم در phpMyAdmin یا کنسول MySQL.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const sql = generateCompleteMySQLDump();
                downloadFile(sql, `mahash_full_database_dump_${Date.now()}.sql`, 'application/sql;charset=utf-8');
                if (onSuccessToast) onSuccessToast('فایل اسکریپت کامل دیتابیس MySQL دانلود شد.');
              }}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>دانلود اسکریپت کامل دیتابیس MySQL (.sql)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const json = exportFullDatabaseJSON();
                  downloadFile(json, `mahash_database_backup_${Date.now()}.json`, 'application/json;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('پشتیبان ساختاریافته JSON دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileCode className="w-3.5 h-3.5 text-blue-500" />
                <span>پشتیبان JSON کامل</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const csv = exportReportsCSV();
                  downloadFile(csv, `mahash_reports_${Date.now()}.csv`, 'text/csv;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('فایل اکسل گزارش‌ها دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
                <span>اکسل گزارش‌ها (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const csv = exportScoresCSV();
                  downloadFile(csv, `mahash_team_scores_${Date.now()}.csv`, 'text/csv;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('فایل اکسل امتیازات دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-amber-500" />
                <span>اکسل امتیازات (CSV)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const csv = exportNewsAnnouncementsCSV();
                  downloadFile(csv, `mahash_news_announcements_${Date.now()}.csv`, 'text/csv;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('فایل اکسل اخبار دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-purple-500" />
                <span>اکسل اخبار و Ticker (CSV)</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 2: WordPress Migration Package */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center text-purple-600 dark:text-purple-400">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    پکیج مهاجرت و درون‌ریزی در وردپرس
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    فرمت رسمی WXR 1.2 XML، پوسته اختصاصی و کدهای کوتاه
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                WordPress Native
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              با دانلود فایل WXR XML می‌توانید از مسیر <b>پیشخوان وردپرس &gt; ابزارها &gt; درون‌ریزی &gt; WordPress</b> کلیه مطالب و گزارش‌ها را همراه با دسته‌بندی تیم‌ها و برچسب باشگاه به وردپرس منتقل کنید.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const xml = generateWordPressWxrExportXml();
                downloadFile(xml, 'mahash_wordpress_wxr_import.xml', 'application/xml;charset=utf-8');
                if (onSuccessToast) onSuccessToast('فایل درون‌ریزی WXR XML وردپرس با موفقیت دانلود شد.');
              }}
              className="w-full py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل درون‌ریزی وردپرس (WXR 1.2 XML)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <a
                href="/api/wp/export-theme"
                download="mahash-theme.zip"
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer text-center"
              >
                <Layers className="w-3.5 h-3.5 text-purple-500" />
                <span>پوسته اختصاصی وردپرس</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const embedCode = generateWordPressEmbedCodes();
                  downloadFile(embedCode, 'mahash_wordpress_embed_codes.html', 'text/html;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('کدهای کوتاه و امبد وردپرس دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Code2 className="w-3.5 h-3.5 text-cyan-500" />
                <span>کدهای امبد و شورت‌کد</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 3: Web Hosting Configs (cPanel, Apache, Nginx) */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400">
                  <Server className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    پیکربندی وب‌سرور (cPanel / Apache / Nginx)
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    فایل‌های .htaccess، nginx.conf، فشرده‌سازی Gzip و روت‌های SPA
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Server Configs
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              فایل‌های پیکربندی تست‌شده جهت جلوگیری از خطای ۴۰۴ در تغییر مسیرهای داخلی، فعال‌سازی ماژول کش مرورگر و افزایش چندبرابری سرعت بارگذاری سامانه.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const htaccess = generateHtaccessConfig();
                downloadFile(htaccess, '.htaccess', 'text/plain;charset=utf-8');
                if (onSuccessToast) onSuccessToast('فایل .htaccess دانلود شد.');
              }}
              className="w-full py-2.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4" />
              <span>دانلود فایل پیکربندی cPanel و آپاچی (.htaccess)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const nginx = generateNginxConfig();
                  downloadFile(nginx, 'nginx.conf', 'text/plain;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('فایل کانفیگ nginx.conf دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Server className="w-3.5 h-3.5 text-amber-500" />
                <span>کانفیگ Nginx</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const webconfig = generateWebConfig();
                  downloadFile(webconfig, 'web.config', 'application/xml;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('فایل web.config برای ویندوز دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-blue-500" />
                <span>کانفیگ IIS (web.config)</span>
              </button>
            </div>
          </div>
        </div>

        {/* CARD 4: Localhost & Testing Scripts */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Terminal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    راه‌اندازهای لوکال و آزمایش آفلاین
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    اسکریپت‌های اجرایی ویندوز، لینوکس و شبیه‌ساز سرور محلی
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                Offline Ready
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              اسکریپت‌های آماده برای آزمایش سریع سایت روی کامپیوتر شخصی و لپ‌تاپ از طریق Node.js، پایتون، XAMPP یا Laragon بدون نیاز به اتصال به اینترنت.
            </p>
          </div>

          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => {
                const scripts = generateLocalRunnerScripts();
                downloadFile(scripts.bat, 'run_local.bat', 'text/plain;charset=utf-8');
                if (onSuccessToast) onSuccessToast('فایل اجرایی ویندوز (run_local.bat) دانلود شد.');
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              <Terminal className="w-4 h-4" />
              <span>دانلود اسکریپت اجرای تک‌کلیکه ویندوز (run_local.bat)</span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  const scripts = generateLocalRunnerScripts();
                  downloadFile(scripts.sh, 'run_local.sh', 'application/x-sh;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('فایل اجرایی لینوکس/مک (run_local.sh) دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-500" />
                <span>اسکریپت لینوکس/مک (.sh)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const readme = generateMigrationReadmeFA();
                  downloadFile(readme, 'README_MIGRATION_FA.md', 'text/markdown;charset=utf-8');
                  if (onSuccessToast) onSuccessToast('کتابچه راهنمای فارسی انتقال دانلود شد.');
                }}
                className="py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-blue-500" />
                <span>راهنمای فارسی انتقال (.md)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
