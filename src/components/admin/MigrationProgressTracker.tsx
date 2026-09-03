import React from 'react';
import { HardDrive, RefreshCw, CheckCircle2, ShieldCheck, FileArchive } from 'lucide-react';

interface MigrationProgressTrackerProps {
  isExporting: boolean;
  progress: number;
  statusText: string;
  checksum: string | null;
  onStartExport: () => void;
  downloadUrl?: string | null;
  filename?: string | null;
}

export const MigrationProgressTracker: React.FC<MigrationProgressTrackerProps> = ({
  isExporting,
  progress,
  statusText,
  checksum,
  onStartExport,
  downloadUrl,
  filename,
}) => {
  return (
    <div className="bg-[#15191e] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ردیاب پیشرفته مهاجرت و بسته‌بندی کلاینت (JSZip)</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                اسکن، بافرینگ و بسته‌بندی امن کل ساختار سورس‌کد و پوسته وردپرس با گزارش لحظه‌ای پیشرفت.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onStartExport}
          disabled={isExporting}
          className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl text-sm transition shadow-lg flex items-center justify-center gap-2 cursor-pointer shrink-0"
        >
          {isExporting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <HardDrive className="w-4 h-4" />}
          {isExporting ? 'در حال اسکن و بسته‌بندی...' : 'شروع بسته‌بندی و تولید پکیج'}
        </button>
      </div>

      {/* Global Progress Feedback Bar & Step Log */}
      {(isExporting || progress > 0) && (
        <div className="bg-[#1b2128] border border-slate-700 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-200 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              {statusText || 'در حال آماده‌سازی فایل‌ها...'}
            </span>
            <span className="font-mono text-amber-400 font-bold text-sm">{progress}%</span>
          </div>

          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
            <div
              className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full rounded-full transition-all duration-300 shadow-sm"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[11px] text-slate-400">
            <div className={`p-2 rounded-lg border ${progress >= 15 ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-slate-900 border-slate-800'}`}>
              ۱. اسکن پوسته وردپرس
            </div>
            <div className={`p-2 rounded-lg border ${progress >= 35 ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-slate-900 border-slate-800'}`}>
              ۲. تنظیمات و پکیج پایه
            </div>
            <div className={`p-2 rounded-lg border ${progress >= 60 ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-slate-900 border-slate-800'}`}>
              ۳. بافرینگ src و public
            </div>
            <div className={`p-2 rounded-lg border ${progress >= 96 ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-slate-900 border-slate-800'}`}>
              ۴. تاییدیه SHA-256
            </div>
          </div>
        </div>
      )}

      {/* Checksum Result Banner */}
      {checksum && !isExporting && (
        <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-xs font-bold text-emerald-300">مهاجرت و بسته‌بندی با موفقیت تأیید شد</div>
              <div className="text-[10px] font-mono text-slate-400 mt-0.5 truncate max-w-md">
                SHA-256: {checksum}
              </div>
            </div>
          </div>
          {downloadUrl && filename && (
            <a
              href={downloadUrl}
              download={filename}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-2 shrink-0"
            >
              <ShieldCheck className="w-4 h-4" />
              دانلود پکیج نهایی تاییدشده
            </a>
          )}
        </div>
      )}
    </div>
  );
};
