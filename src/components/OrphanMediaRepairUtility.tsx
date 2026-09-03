import React, { useState, useEffect } from 'react';
import { 
  Wrench, ShieldCheck, Trash2, RefreshCw, AlertTriangle, 
  CheckCircle2, Film, Database, HardDrive, Sparkles, FileText, 
  ArrowRight, ShieldAlert, Check
} from 'lucide-react';
import { 
  scanForOrphanedMedia, 
  repairOrphanedMedia, 
  OrphanScanResult, 
  getAllReports, 
  removeVideoFromReport 
} from '../utils/reportsStore';
import { toPersianDigits } from '../utils/persianDate';

interface OrphanMediaRepairUtilityProps {
  onRepaired?: () => void;
}

export const OrphanMediaRepairUtility: React.FC<OrphanMediaRepairUtilityProps> = ({ onRepaired }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [scanResult, setScanResult] = useState<OrphanScanResult | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const runScan = async () => {
    setIsScanning(true);
    setSuccessMessage(null);
    try {
      const res = await scanForOrphanedMedia();
      setScanResult(res);
    } catch (err) {
      console.error('Scan error:', err);
    } finally {
      setIsScanning(false);
    }
  };

  useEffect(() => {
    runScan();
  }, []);

  const handleRepair = async (options: {
    deleteOrphans?: boolean;
    clearStaleTextBlobs?: boolean;
    fixBrokenReports?: boolean;
  }) => {
    setIsRepairing(true);
    setSuccessMessage(null);
    try {
      const res = await repairOrphanedMedia(options);
      setSuccessMessage(
        `تعمیر با موفقیت انجام شد: ${toPersianDigits(res.deletedCount)} فایل یتیم/معلق حذف شد و ${toPersianDigits(res.repairedCount)} گزارش اصلاح گردید.`
      );
      await runScan();
      if (onRepaired) onRepaired();
    } catch (err) {
      console.error('Repair error:', err);
    } finally {
      setIsRepairing(false);
    }
  };

  const totalIssues = (scanResult?.orphanedVideos.length || 0) + 
                      (scanResult?.brokenReports.length || 0) + 
                      (scanResult?.staleTextReports.length || 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '۰ بایت';
    const k = 1024;
    const sizes = ['بایت', 'کیلوبایت', 'مگابایت', 'گیگابایت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const val = parseFloat((bytes / Math.pow(k, i)).toFixed(2));
    return `${toPersianDigits(val)} ${sizes[i]}`;
  };

  return (
    <div id="media-repair-utility" className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>ابزار تعمیر و رفع تعارض فایل‌های ویدیویی (Repair Utility)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20 font-normal">
                یکپارچگی حافظه و رسانه
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              اسکن دقیق پایگاه داده و حافظه IndexedDB برای شناسایی ویدیوهای یتیم، پیوندهای گسسته و آزادسازی فضا
            </p>
          </div>
        </div>

        <button
          id="re-scan-storage-btn"
          type="button"
          onClick={runScan}
          disabled={isScanning || isRepairing}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2 border border-slate-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
          <span>{isScanning ? 'در حال اسکن حافظه...' : 'اسکن مجدد حافظه'}</span>
        </button>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>کل گزارشات</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {toPersianDigits(scanResult?.totalScannedReports || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>ویدیوهای کش‌شده</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-white">
            {toPersianDigits(scanResult?.totalCachedVideos || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>ویدیوهای یتیم</span>
            <Film className="w-4 h-4 text-amber-400" />
          </div>
          <div className={`text-xl font-bold ${scanResult?.orphanedVideos.length ? 'text-amber-400' : 'text-slate-300'}`}>
            {toPersianDigits(scanResult?.orphanedVideos.length || 0)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-1.5">
            <span>وضعیت سلامت</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xs font-bold text-emerald-400 mt-1.5 flex items-center gap-1">
            {totalIssues === 0 ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>کاملاً سالم و پایدار</span>
              </>
            ) : (
              <span className="text-amber-400">
                {toPersianDigits(totalIssues)} مورد نیازمند اصلاح
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Main Issues Breakdown */}
      {totalIssues === 0 ? (
        <div className="p-8 text-center rounded-2xl bg-emerald-950/20 border border-emerald-900/30 space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-200 text-sm">تمام پیوندها و فایل‌های چندرسانه‌ای در وضعیت استاندارد قرار دارند</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            هیچ فایل یتیم، پیوند گسسته یا تعارضی در حافظه IndexedDB و گزارش‌ها یافت نشد.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Quick 1-Click Fix All Banner */}
          <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <div className="text-xs font-bold text-amber-200">
                  {toPersianDigits(totalIssues)} مورد ناهماهنگی در حافظه تشخیص داده شد
                </div>
                <div className="text-[11px] text-amber-300/80 mt-0.5">
                  می‌توانید با یک کلیک تمام فایل‌های بدون گزارش را حذف و گزارش‌های متنی را پاکسازی نمایید.
                </div>
              </div>
            </div>

            <button
              id="fix-all-media-btn"
              type="button"
              onClick={() => handleRepair({ deleteOrphans: true, clearStaleTextBlobs: true, fixBrokenReports: true })}
              disabled={isRepairing}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap disabled:opacity-50"
            >
              {isRepairing ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>در حال تعمیر...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>تعمیر خودکار تمام موارد</span>
                </>
              )}
            </button>
          </div>

          {/* Issue Section 1: Orphaned Videos */}
          {scanResult && scanResult.orphanedVideos.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Film className="w-4 h-4 text-amber-400" />
                  <span>فایل‌های ویدیویی یتیم (بدون گزارش متصل) - {toPersianDigits(scanResult.orphanedVideos.length)} فایل</span>
                </div>
                <button
                  onClick={() => handleRepair({ deleteOrphans: true })}
                  disabled={isRepairing}
                  className="px-3 py-1 rounded-lg bg-red-950/60 hover:bg-red-900/60 text-red-300 border border-red-800/40 text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>حذف ویدیوهای یتیم</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {scanResult.orphanedVideos.map((ov) => (
                  <div key={ov.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-slate-300">
                    <div className="flex items-center gap-2 truncate">
                      <Film className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="font-mono text-[11px] truncate">{ov.name}</span>
                      <span className="text-[10px] text-slate-500 font-mono">({ov.id})</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono shrink-0 mr-2">
                      {formatBytes(ov.size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue Section 2: Broken References */}
          {scanResult && scanResult.brokenReports.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-400" />
                  <span>گزارش‌های با پیوند ویدیوی گسسته / مفقود - {toPersianDigits(scanResult.brokenReports.length)} گزارش</span>
                </div>
                <button
                  onClick={() => handleRepair({ fixBrokenReports: true })}
                  disabled={isRepairing}
                  className="px-3 py-1 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-800/40 text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Wrench className="w-3 h-3" />
                  <span>تبدیل به گزارش متنی تمیز</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {scanResult.brokenReports.map((br) => (
                  <div key={br.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-slate-300">
                    <div className="truncate">
                      <div className="font-semibold text-slate-200 truncate">{br.title}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{br.id}</div>
                    </div>
                    <button
                      onClick={() => {
                        removeVideoFromReport(br.id, br.teamSlug);
                        runScan();
                      }}
                      className="text-[10px] px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 shrink-0"
                    >
                      اصلاح تکی
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Issue Section 3: Stale Text Report Blobs */}
          {scanResult && scanResult.staleTextReports.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>ویدیوهای معلق در گزارش‌های متنی - {toPersianDigits(scanResult.staleTextReports.length)} مورد</span>
                </div>
                <button
                  onClick={() => handleRepair({ clearStaleTextBlobs: true })}
                  disabled={isRepairing}
                  className="px-3 py-1 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/40 text-[11px] font-semibold transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>پاکسازی و آزادسازی حافظه</span>
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {scanResult.staleTextReports.map((st) => (
                  <div key={st.id} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/60 text-slate-300">
                    <span className="truncate">{st.title}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{st.id}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OrphanMediaRepairUtility;
