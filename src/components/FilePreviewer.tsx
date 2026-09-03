import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Maximize2, 
  Minimize2, 
  Download, 
  Printer, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  Sparkles,
  Eye,
  FileCheck
} from 'lucide-react';
import { toPersianDigits } from '../utils/persianDate';

export interface FileItem {
  id: string;
  name: string;
  url?: string;
  type: 'image' | 'pdf' | 'doc' | 'other';
  size?: number | string;
  caption?: string;
  date?: string;
}

interface FilePreviewerProps {
  files?: FileItem[];
  activeFile?: FileItem | null;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  teamName?: string;
  reportTitle?: string;
}

export const FilePreviewer: React.FC<FilePreviewerProps> = ({
  files = [],
  activeFile,
  isOpen,
  onClose,
  title = 'پیش‌نمایش تعاملی فایل و سند',
  teamName = 'باشگاه جوانان محاش',
  reportTitle
}) => {
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize activeFile
  useEffect(() => {
    if (activeFile && files.length > 0) {
      const idx = files.findIndex((f) => f.id === activeFile.id || f.url === activeFile.url);
      if (idx >= 0) {
        setCurrentIndex(idx);
      }
    }
  }, [activeFile, files]);

  // Reset transforms on file change
  useEffect(() => {
    setZoomScale(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  }, [currentIndex, isOpen]);

  // Handle ESC key & Arrow keys
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') handlePrev();
      if (e.key === 'ArrowLeft') handleNext();
      if (e.key === '+' || e.key === '=') handleZoomIn();
      if (e.key === '-') handleZoomOut();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, files.length]);

  if (!isOpen) return null;

  const currentFile = files[currentIndex] || activeFile;
  if (!currentFile) return null;

  const handleZoomIn = () => setZoomScale((prev) => Math.min(prev + 0.25, 3.5));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleResetZoom = () => {
    setZoomScale(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleNext = () => {
    if (files.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % files.length);
    }
  };

  const handlePrev = () => {
    if (files.length > 1) {
      setCurrentIndex((prev) => (prev - 1 + files.length) % files.length);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    if (!currentFile.url) return;
    const a = document.createElement('a');
    a.href = currentFile.url;
    a.download = currentFile.name || 'mahash-file';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Mouse Drag / Pan for zoomed content
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const isPDF = currentFile.type === 'pdf' || currentFile.name.toLowerCase().endsWith('.pdf');
  const isImage = currentFile.type === 'image' || /\.(jpg|jpeg|png|webp|svg|gif)$/i.test(currentFile.name);

  return (
    <div 
      className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-md flex flex-col justify-between animate-in fade-in duration-200"
      dir="rtl"
      ref={containerRef}
    >
      {/* Top Controls Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between gap-4 text-white z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
            {isPDF ? <FileText className="w-5 h-5 text-blue-400" /> : <ImageIcon className="w-5 h-5 text-emerald-400" />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm sm:text-base font-bold text-slate-100 truncate">
              {currentFile.name}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {reportTitle ? `${reportTitle} • ` : ''}{teamName}
              {files.length > 1 && ` • فایل ${toPersianDigits(currentIndex + 1)} از ${toPersianDigits(files.length)}`}
            </p>
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Zoom controls */}
          <div className="hidden sm:flex items-center bg-slate-800 border border-slate-700 rounded-xl p-1 gap-1">
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
              title="بزرگ‌نمایی (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="px-2 py-0.5 text-xs font-mono text-slate-300 hover:text-white hover:bg-slate-700 rounded transition"
              title="اندازه پیش‌فرض ۱۰۰٪"
            >
              {Math.round(zoomScale * 100)}%
            </button>
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition"
              title="کوچک‌نمایی (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          {/* Rotate */}
          <button
            onClick={handleRotate}
            className="p-2 sm:px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition flex items-center gap-1.5 text-xs"
            title="چرخش ۹۰ درجه"
          >
            <RotateCw className="w-4 h-4" />
            <span className="hidden md:inline">چرخش</span>
          </button>

          {/* Print */}
          <button
            onClick={handlePrint}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition hidden sm:flex items-center gap-1.5 text-xs"
            title="چاپ سند"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden md:inline">چاپ</span>
          </button>

          {/* Download */}
          {currentFile.url && (
            <button
              onClick={handleDownload}
              className="p-2 sm:px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow-md"
              title="دانلود فایل اصلی"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">دانلود</span>
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl transition"
            title={isFullscreen ? 'خروج از تمام‌صفحه' : 'حالت تمام‌صفحه'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="p-2 bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 rounded-xl transition ml-1"
            title="بستن (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main View Area */}
      <div 
        className="flex-1 relative overflow-hidden flex items-center justify-center p-2 sm:p-6 select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        style={{
          cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
        }}
      >
        {/* Previous Button */}
        {files.length > 1 && (
          <button
            onClick={handlePrev}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 border border-slate-700 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition group"
            title="فایل قبلی (کلید راست)"
          >
            <ChevronRight className="w-6 h-6 group-hover:scale-110 transition" />
          </button>
        )}

        {/* Content Render */}
        <div 
          className="w-full h-full flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: `translate(${panPosition.x}px, ${panPosition.y}px)`
          }}
        >
          {isImage && currentFile.url && (
            <img
              src={currentFile.url}
              alt={currentFile.name}
              className="max-h-[82vh] max-w-[92vw] object-contain rounded-2xl shadow-2xl transition-transform duration-150"
              style={{
                transform: `scale(${zoomScale}) rotate(${rotation}deg)`
              }}
              draggable={false}
            />
          )}

          {isPDF && (
            <div 
              className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 p-6 sm:p-10 my-4 text-right select-text origin-top max-h-[85vh] overflow-y-auto"
              style={{
                transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                fontFamily: 'Tahoma, system-ui, sans-serif'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Document Official Header */}
              <div className="flex flex-col sm:flex-row items-center justify-between pb-6 border-b-2 border-[#173b82] gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-14 h-14 rounded-2xl bg-blue-900/10 border-2 border-[#173b82] flex items-center justify-center p-2 shrink-0">
                    <FileText className="w-8 h-8 text-[#173b82]" />
                  </div>
                  <div>
                    <div className="inline-block bg-[#173b82] text-white text-[11px] font-bold px-3 py-1 rounded-full mb-1">
                      باشگاه جوانان مؤسسه توانبخشی و پیشگیری محاش
                    </div>
                    <h2 className="text-lg sm:text-xl font-black text-[#173b82]">
                      {reportTitle || currentFile.name}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {teamName} • سند رسمی گزارش فعالیت و ارزیابی
                    </p>
                  </div>
                </div>

                <div className="text-left text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 shrink-0 w-full sm:w-auto">
                  <div><strong>تاریخ صدور:</strong> ۱۴۰۵/۰۵/۲۲</div>
                  <div><strong>کد رهگیری سند:</strong> DOC-MAHASH-YOUTH</div>
                  <div className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>وضعیت: تایید شده و نهایی</span>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="mt-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2">
                <h3 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span>شرح اهداف و خلاصه فعالیت:</span>
                </h3>
                <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                  {currentFile.caption || 'سند رسمی گزارش فعالیت‌ها، مهارت‌افزایی و دستاوردهای تیم در جلسات باشگاه جوانان مؤسسه محاش.'}
                </p>
              </div>

              {/* 6 Sessions Content breakdown */}
              <div className="mt-6 space-y-3.5">
                <h3 className="text-sm font-black text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
                  <FileCheck className="w-4 h-4 text-blue-600" />
                  <span>محورهای عملکردی و جلسات توانمندسازی:</span>
                </h3>

                {[
                  { title: 'جلسه ۱: معارفه و تعیین اهداف تیمی', desc: 'شناخت نقاط قوت اعضا، تبیین آیین‌نامه و چشم‌انداز برنامه‌ها' },
                  { title: 'جلسه ۲: طراحی هویت بصری و تقسیم وظایف', desc: 'انتخاب نماد، شعار تیمی و تعیین مسئولیت‌های اجرایی هر عضو' },
                  { title: 'جلسه ۳: کارگاه مهارت‌های حل مسئله و بازی‌های فکری', desc: 'تقویت تفکر استراتژیک، همدلی و تصمیم‌گیری تیمی در موقعیت‌های چالش‌برانگیز' },
                  { title: 'جلسه ۴: خودمراقبتی و مدیریت احساسات', desc: 'آموزش بهداشت روانی، تاب‌آوری و تمرینات زبان بدن و نمایش مشارکتی' },
                  { title: 'جلسه ۵: کارآفرینی و ایده‌پردازی برای آینده', desc: 'ترسیم نقشه راه فردی و شغلی، آشنایی با ابزارهای نوین و فناوری' },
                  { title: 'جلسه ۶: ارزیابی نهایی و تجمیع دستاوردها', desc: 'بررسی شاخص‌های رشد، ارائه بازخوردهای سازنده و تدوین خروجی نهایی' }
                ].map((s, idx) => (
                  <div key={idx} className="bg-slate-50 border-r-4 border-blue-600 rounded-xl p-3 text-xs text-slate-800 space-y-1 border border-slate-200">
                    <div className="font-bold text-blue-900">{s.title}</div>
                    <div className="text-slate-600">{s.desc}</div>
                  </div>
                ))}
              </div>

              {/* Footer Stamp */}
              <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  مؤسسه توانبخشی و پیشگیری محاش — سامانه جامع گزارش‌دهی باشگاه جوانان
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-300">
                  مهر تأیید الکترونیکی دبیرخانه
                </span>
              </div>
            </div>
          )}

          {!isImage && !isPDF && (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center text-white space-y-4 max-w-md">
              <FileText className="w-16 h-16 text-blue-400 mx-auto" />
              <h3 className="text-lg font-bold">{currentFile.name}</h3>
              <p className="text-xs text-slate-400">
                این فایل برای مشاهده نیاز به دانلود دارد یا با نرم‌افزار مربوطه باز می‌شود.
              </p>
              {currentFile.url && (
                <button
                  onClick={handleDownload}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition flex items-center gap-2 mx-auto text-sm shadow-lg"
                >
                  <Download className="w-4 h-4" />
                  <span>دانلود مستقیم فایل</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Next Button */}
        {files.length > 1 && (
          <button
            onClick={handleNext}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate-900/80 hover:bg-blue-600 border border-slate-700 text-white flex items-center justify-center backdrop-blur-md shadow-2xl transition group"
            title="فایل بعدی (کلید چپ)"
          >
            <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition" />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multiple files) */}
      {files.length > 1 && (
        <div className="bg-slate-900/90 border-t border-slate-800 px-4 py-3 flex items-center justify-center gap-2 overflow-x-auto z-20">
          {files.map((file, idx) => (
            <button
              key={file.id || idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-14 h-14 rounded-xl border-2 transition overflow-hidden shrink-0 flex items-center justify-center bg-slate-800 ${
                currentIndex === idx
                  ? 'border-blue-500 shadow-lg scale-105 ring-2 ring-blue-400/30'
                  : 'border-slate-700 hover:border-slate-500 opacity-70 hover:opacity-100'
              }`}
              title={file.name}
            >
              {file.type === 'image' && file.url ? (
                <img loading="lazy" src={file.url} alt={file.name} className="w-full h-full object-cover" />
              ) : (
                <FileText className="w-6 h-6 text-slate-400" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
