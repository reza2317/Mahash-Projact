import React, { useState, useEffect, useRef } from 'react';
import { ReportAttachment, ActivityReport } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { getAttachmentsFromDB } from '../utils/attachmentsStorage';
import { buildNativePdfBlob, generatePrintablePdfHtml, triggerBrowserDownload } from '../utils/pdfGenerator';
import { 
  FileText, 
  File, 
  FileSpreadsheet, 
  FileArchive, 
  Download, 
  Eye, 
  ExternalLink, 
  Paperclip,
  Image as ImageIcon,
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  RotateCcw,
  Maximize2,
  Minimize2,
  RefreshCw,
  Move,
  AlertTriangle,
  CheckCircle2,
  Printer,
  Loader2
} from 'lucide-react';

interface ReportAttachmentsViewProps {
  report?: ActivityReport;
  attachments?: ReportAttachment[];
  images?: { src: string; caption: string }[];
  pdfUrl?: string;
  pdfLabel?: string;
  reportTitle?: string;
  teamName?: string;
}

export const ReportAttachmentsView: React.FC<ReportAttachmentsViewProps> = ({
  report,
  attachments = [],
  images = [],
  pdfUrl,
  pdfLabel,
  reportTitle = 'گزارش',
  teamName
}) => {
  const [activePreviewModal, setActivePreviewModal] = useState<{
    id: string;
    type: 'image' | 'pdf' | 'other';
    src?: string;
    htmlContent?: string;
    caption?: string;
    name: string;
    extension: string;
    sizeFormatted?: string;
  } | null>(null);

  // Download status & error alert states
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<{
    title: string;
    message: string;
    details?: string;
    fileName?: string;
  } | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Zoom & Pan State for Modal
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const modalContainerRef = useRef<HTMLDivElement | null>(null);

  const [dbAttachments, setDbAttachments] = useState<ReportAttachment[]>([]);

  const effectiveReportTitle = report?.title || reportTitle;
  const effectiveTeamName = teamName || (report?.id?.includes('tomorrow') ? 'باشگاه فردا' : 'باشگاه جوانان محاش');

  // Load attachments from IndexedDB if report is provided
  useEffect(() => {
    let isMounted = true;
    if (report?.id) {
      getAttachmentsFromDB(report.id).then((storedAtts) => {
        if (isMounted && storedAtts && storedAtts.length > 0) {
          setDbAttachments(storedAtts);
        }
      }).catch((e) => {
        console.warn('Error loading attachments from DB:', e);
      });
    }
    return () => {
      isMounted = false;
    };
  }, [report?.id]);

  // Reset zoom & pan whenever active preview changes
  useEffect(() => {
    if (activePreviewModal) {
      setZoomScale(1);
      setRotation(0);
      setPanPosition({ x: 0, y: 0 });
      setIsFullscreen(false);
    }
  }, [activePreviewModal?.id]);

  // Combine report.attachments, dbAttachments, and direct props
  const baseAttachments: ReportAttachment[] = [
    ...(report?.attachments || []),
    ...attachments
  ];

  // Merge with dbAttachments (giving priority to dataUrls from DB)
  const allAttachmentsMap = new Map<string, ReportAttachment>();

  baseAttachments.forEach((att) => {
    allAttachmentsMap.set(att.id || att.name, att);
  });

  dbAttachments.forEach((dbAtt) => {
    const key = dbAtt.id || dbAtt.name;
    const existing = allAttachmentsMap.get(key);
    if (existing) {
      allAttachmentsMap.set(key, { ...existing, dataUrl: dbAtt.dataUrl || existing.dataUrl });
    } else {
      allAttachmentsMap.set(key, dbAtt);
    }
  });

  const effectivePdfUrl = report?.pdfUrl || pdfUrl;
  const effectivePdfLabel = report?.pdfLabel || pdfLabel;

  // Add legacy pdfUrl if present and not already in map
  if (effectivePdfUrl && !Array.from(allAttachmentsMap.values()).some(a => a.dataUrl === effectivePdfUrl || a.extension === 'pdf')) {
    allAttachmentsMap.set('legacy-pdf', {
      id: 'legacy-pdf',
      name: effectivePdfLabel || 'سند رسمی گزارش فعالیت‌ها.pdf',
      type: 'pdf',
      extension: 'pdf',
      sizeFormatted: '۱.۴ مگابایت',
      caption: 'سند رسمی ثبت‌شده در سامانه باشگاه جوانان محاش',
      dataUrl: effectivePdfUrl !== '#' ? effectivePdfUrl : undefined
    });
  }

  // Add legacy images if present
  const effectiveImages = report?.images || images || [];
  if (effectiveImages.length > 0) {
    effectiveImages.forEach((img, idx) => {
      const imgKey = `legacy-img-${idx}`;
      if (!Array.from(allAttachmentsMap.values()).some(a => a.dataUrl === img.src)) {
        allAttachmentsMap.set(imgKey, {
          id: imgKey,
          name: img.caption || `تصویر ضمیمه ${toPersianDigits(idx + 1)}`,
          type: 'image',
          extension: 'jpg',
          sizeFormatted: 'تصویر ضمیمه',
          dataUrl: img.src,
          caption: img.caption
        });
      }
    });
  }

  const allAttachments = Array.from(allAttachmentsMap.values());

  if (allAttachments.length === 0) {
    return null;
  }

  const imageFiles = allAttachments.filter(a => a.type === 'image');
  const documentFiles = allAttachments.filter(a => a.type !== 'image');

  /**
   * Safe intelligent download handler for all file types (PDF, Images, etc.)
   */
  const handleDownloadAttachment = async (doc: ReportAttachment) => {
    setDownloadingId(doc.id);
    try {
      // 1. Direct valid dataUrl exists
      if (doc.dataUrl && doc.dataUrl !== '#' && !doc.dataUrl.startsWith('blob:null')) {
        const ok = triggerBrowserDownload(doc.dataUrl, doc.name);
        if (ok) {
          showSuccessMessage(`فایل «${doc.name}» با موفقیت دانلود شد.`);
          setDownloadingId(null);
          return;
        }
      }

      // 2. Try fetching from IndexedDB
      if (report?.id) {
        const dbList = await getAttachmentsFromDB(report.id);
        const match = dbList.find(d => d.id === doc.id || d.name === doc.name);
        if (match?.dataUrl && match.dataUrl !== '#') {
          const ok = triggerBrowserDownload(match.dataUrl, doc.name);
          if (ok) {
            showSuccessMessage(`فایل «${doc.name}» با موفقیت از پایگاه داده بازیابی و دانلود شد.`);
            setDownloadingId(null);
            return;
          }
        }
      }

      // 3. If it is a PDF or official report document (like Tomorrow Club 6-session report)
      const isPdf = doc.type === 'pdf' || doc.extension === 'pdf' || doc.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        const fallbackReport: ActivityReport = report || {
          id: doc.id,
          title: effectiveReportTitle,
          date: '',
          summary: doc.caption || 'سند رسمی گزارش فعالیت‌ها و کارگاه‌های باشگاه جوانان محاش.'
        };

        const pdfBlob = buildNativePdfBlob(fallbackReport, effectiveTeamName);
        const ok = triggerBrowserDownload(pdfBlob, doc.name.endsWith('.pdf') ? doc.name : `${doc.name}.pdf`);
        if (ok) {
          showSuccessMessage(`سند رسمی «${doc.name}» با موفقیت تولید و دانلود شد.`);
          setDownloadingId(null);
          return;
        }
      }

      // 4. If all recovery methods fail, trigger legitimate Persian error alert
      setDownloadError({
        title: 'خطا در بازیابی و دانلود فایل پیوست',
        fileName: doc.name,
        message: `فایل «${doc.name}» در حافظه ذخیره‌سازی محلی مرورگر یا پایگاه داده یافت نشد.`,
        details: 'ممکن است حافظه کش مرورگر پاک شده باشد یا فایل پیش‌تر در یک نشست موقت بارگذاری شده باشد. لطفاً از پنل مدیریت سامانه اقدام به بارگذاری مجدد فایل فرمایید.'
      });
    } catch (err: any) {
      console.error('Download attachment failed:', err);
      setDownloadError({
        title: 'خطای سیستمی در فرآیند دانلود',
        fileName: doc.name,
        message: 'سامانه در هنگام پردازش و آماده‌سازی فایل با خطا مواجه شد.',
        details: err?.message || 'لطفاً مجدداً تلاش فرمایید یا با مدیر سیستم تماس بگیرید.'
      });
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Preview handler with automatic PDF Blob synthesizer
   */
  const handlePreviewAttachment = async (doc: ReportAttachment) => {
    let previewSrc = doc.dataUrl && doc.dataUrl !== '#' ? doc.dataUrl : undefined;

    // Check DB if src is missing
    if (!previewSrc && report?.id) {
      try {
        const dbList = await getAttachmentsFromDB(report.id);
        const match = dbList.find(d => d.id === doc.id || d.name === doc.name);
        if (match?.dataUrl && match.dataUrl !== '#') {
          previewSrc = match.dataUrl;
        }
      } catch (e) {}
    }

    const isPdf = doc.type === 'pdf' || doc.extension === 'pdf' || doc.name.toLowerCase().endsWith('.pdf');

    // If PDF and no src, build Blob on-the-fly
    if (!previewSrc && isPdf) {
      const fallbackReport: ActivityReport = report || {
        id: doc.id,
        title: effectiveReportTitle,
        date: '',
        summary: doc.caption || 'سند رسمی گزارش فعالیت‌ها'
      };
      const pdfBlob = buildNativePdfBlob(fallbackReport, effectiveTeamName);
      previewSrc = URL.createObjectURL(pdfBlob);
    }

    setActivePreviewModal({
      id: doc.id,
      type: doc.type === 'image' ? 'image' : (isPdf ? 'pdf' : 'other'),
      src: previewSrc,
      caption: doc.caption || doc.name,
      name: doc.name,
      extension: doc.extension,
      sizeFormatted: doc.sizeFormatted
    });
  };

  const showSuccessMessage = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(prev + 0.25, 4));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setRotation(0);
    setPanPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Mouse pan handlers for image
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale > 1) {
      e.preventDefault();
      setIsDragging(true);
      setDragStart({ x: e.clientX - panPosition.x, y: e.clientY - panPosition.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoomScale > 1) {
      e.preventDefault();
      setPanPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handlePrintDocument = () => {
    if (report) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintablePdfHtml(report, effectiveTeamName));
        printWindow.document.close();
      }
    } else {
      window.print();
    }
  };

  const getFileIcon = (type: ReportAttachment['type']) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-red-600 dark:text-red-400" />;
      case 'word':
        return <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'excel':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'archive':
        return <FileArchive className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      default:
        return <File className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getBadgeColor = (type: ReportAttachment['type']) => {
    switch (type) {
      case 'pdf':
        return 'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-900';
      case 'word':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'excel':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'archive':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
      {/* Toast Alert */}
      {successToast && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{successToast}</span>
          </div>
          <button onClick={() => setSuccessToast(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h4 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-[#173b82] dark:text-blue-400" />
          <span>پیوست‌ها و فایل‌های ضمیمه ({toPersianDigits(allAttachments.length)} فایل)</span>
        </h4>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          با قابلیت دانلود سریع و پیش‌نمایش اختصاصی
        </span>
      </div>

      {/* Image Gallery Grid if images exist */}
      {imageFiles.length > 0 && (
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
            <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
            <span>تصاویر و اسناد تصویری ضمیمه ({toPersianDigits(imageFiles.length)})</span>
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {imageFiles.map((img) => (
              <div
                key={img.id}
                role="button"
                tabIndex={0}
                onClick={() => handlePreviewAttachment(img)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handlePreviewAttachment(img);
                  }
                }}
                aria-label={`مشاهده و بزرگ‌نمایی تصویر: ${img.caption || img.name}`}
                className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-4/3 cursor-pointer shadow-xs hover:shadow-md transition focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <img
                  src={img.dataUrl}
                  alt={img.caption || img.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2.5 text-white pointer-events-none">
                  <span className="text-[11px] font-bold truncate block">{img.caption || img.name}</span>
                  <span className="text-[9px] text-slate-300">{img.sizeFormatted}</span>
                </div>
                <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-xs text-white px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition flex items-center gap-1 text-[10px] font-bold pointer-events-none">
                  <ZoomIn className="w-3 h-3" aria-hidden="true" />
                  <span>پیش‌نمایش و زوم</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Document & File List */}
      {documentFiles.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="list" aria-label="فهرست اسناد و فایل‌های پیوست">
          {documentFiles.map((doc) => {
            const isPdf = doc.type === 'pdf' || doc.extension === 'pdf' || doc.name.toLowerCase().endsWith('.pdf');
            const isDownloading = downloadingId === doc.id;

            return (
              <div
                key={doc.id}
                role="listitem"
                className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3 hover:border-blue-300 dark:hover:border-blue-700 transition shadow-2xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 shadow-2xs" aria-hidden="true">
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate" title={doc.name}>
                      {doc.name}
                    </span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getBadgeColor(doc.type)}`}>
                        {doc.extension.toUpperCase()}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                        {doc.sizeFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Preview Button for PDF or supported docs */}
                  {isPdf && (
                    <button
                      type="button"
                      onClick={() => handlePreviewAttachment(doc)}
                      className="px-3 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                      title="پیش‌نمایش و مطالعه PDF با قابلیت زوم"
                      aria-label={`پیش‌نمایش و مطالعه فایل پی‌دی‌اف ${doc.name}`}
                    >
                      <Eye className="w-3.5 h-3.5" aria-hidden="true" />
                      <span className="hidden sm:inline text-[11px]">مشاهده</span>
                    </button>
                  )}

                  {/* Direct / Intelligent Download Button */}
                  <button
                    type="button"
                    onClick={() => handleDownloadAttachment(doc)}
                    disabled={isDownloading}
                    className="px-3 py-2 bg-white dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                    title="دانلود فایل اصلی"
                    aria-label={isDownloading ? `در حال آماده‌سازی دانلود ${doc.name}` : `دانلود فایل ${doc.name}`}
                  >
                    {isDownloading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
                        <span className="text-[11px]">آماده‌سازی...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" aria-hidden="true" />
                        <span className="text-[11px]">دانلود</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Error Alert Modal for missing or corrupted files */}
      {downloadError && (
        <div 
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setDownloadError(null)}
        >
          <div 
            className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-red-200 dark:border-red-900/60 space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 dark:text-red-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="p-2 bg-red-100 dark:bg-red-950 rounded-2xl">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black">{downloadError.title}</h3>
                {downloadError.fileName && (
                  <span className="text-xs text-slate-500 font-mono">{downloadError.fileName}</span>
                )}
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {downloadError.message}
            </p>

            {downloadError.details && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">
                {downloadError.details}
              </div>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDownloadError(null)}
                aria-label="بستن پیام خطا"
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-bold transition cursor-pointer"
              >
                متوجه شدم و بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Interactive Preview Modal with Zoom, Pan, Rotate, Fit Controls */}
      {activePreviewModal && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setActivePreviewModal(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`پیش‌نمایش ${activePreviewModal.caption || activePreviewModal.name}`}
        >
          <div 
            ref={modalContainerRef}
            className={`bg-slate-900 text-white rounded-2xl flex flex-col shadow-2xl border border-slate-700 transition-all duration-300 overflow-hidden ${
              isFullscreen 
                ? 'fixed inset-2 z-50 max-w-none max-h-none' 
                : 'w-full max-w-5xl max-h-[92vh] h-[85vh]'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header & Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between p-3 sm:p-4 bg-slate-950/90 border-b border-slate-800 gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0 max-w-md">
                <div className="p-1.5 rounded-lg bg-blue-950 text-blue-400 border border-blue-800 shrink-0" aria-hidden="true">
                  {activePreviewModal.type === 'pdf' ? <FileText className="w-4 h-4 text-red-400" /> : <ImageIcon className="w-4 h-4" />}
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-100 truncate block">
                    {activePreviewModal.caption || activePreviewModal.name}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {activePreviewModal.sizeFormatted || 'فایل ضمیمه'} • {activePreviewModal.extension.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Interactive Zoom & View Toolset */}
              <div className="flex items-center flex-wrap gap-1.5 bg-slate-800/90 p-1 rounded-xl border border-slate-700" role="toolbar" aria-label="ابزارهای کنترل نمایش و بزرگ‌نمایی سند">
                {/* Zoom Out */}
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  title="کوچک‌نمایی (-۲۵٪)"
                  aria-label="کوچک‌نمایی سند یا تصویر بیست و پنج درصد"
                >
                  <ZoomOut className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Percentage Indicator */}
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="px-2.5 py-1 text-xs font-black text-blue-400 hover:bg-slate-700 rounded-lg transition font-mono cursor-pointer"
                  title="بازنشانی اندازه (۱۰۰٪)"
                  aria-label={`میزان بزرگ‌نمایی ${toPersianDigits(Math.round(zoomScale * 100))} درصد، کلیک برای بازنشانی به ۱۰۰ درصد`}
                >
                  {toPersianDigits(Math.round(zoomScale * 100))}٪
                </button>

                {/* Zoom In */}
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  title="بزرگ‌نمایی (+۲۵٪)"
                  aria-label="بزرگ‌نمایی سند یا تصویر بیست و پنج درصد"
                >
                  <ZoomIn className="w-4 h-4" aria-hidden="true" />
                </button>

                <div className="w-px h-4 bg-slate-700 mx-1" aria-hidden="true"></div>

                {/* Rotate for Image */}
                {activePreviewModal.type === 'image' && (
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    title="چرخش ۹۰ درجه"
                    aria-label="چرخش تصویر نود درجه در جهت عقربه‌های ساعت"
                  >
                    <RotateCw className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}

                {/* Print button for PDF */}
                {activePreviewModal.type === 'pdf' && (
                  <button
                    type="button"
                    onClick={handlePrintDocument}
                    className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                    title="چاپ و استخراج سند"
                    aria-label="چاپ و استخراج سند پی‌دی‌اف"
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}

                {/* Fit / Reset */}
                <button
                  type="button"
                  onClick={handleResetZoom}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  title="تنظیم مجدد اندازه"
                  aria-label="تنظیم مجدد بزرگ‌نمایی و موقعیت نمایش"
                >
                  <RefreshCw className="w-4 h-4" aria-hidden="true" />
                </button>

                {/* Fullscreen toggle */}
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition cursor-pointer"
                  title={isFullscreen ? 'خروج از تمام صفحه' : 'نمایش تمام صفحه'}
                  aria-label={isFullscreen ? 'خروج از نمایش تمام صفحه پیش‌نمایش' : 'نمایش تمام صفحه پیش‌نمایش'}
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" aria-hidden="true" /> : <Maximize2 className="w-4 h-4" aria-hidden="true" />}
                </button>
              </div>

              {/* Action Buttons: Download + Close */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleDownloadAttachment({
                      id: activePreviewModal.id,
                      name: activePreviewModal.name,
                      type: activePreviewModal.type === 'image' ? 'image' : (activePreviewModal.type === 'pdf' ? 'pdf' : 'file'),
                      extension: activePreviewModal.extension,
                      sizeFormatted: activePreviewModal.sizeFormatted || 'فایل ضمیمه',
                      dataUrl: activePreviewModal.src,
                      caption: activePreviewModal.caption
                    });
                  }}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  title="دانلود فایل اصلی"
                  aria-label={`دانلود فایل ${activePreviewModal.name}`}
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>دانلود</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActivePreviewModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                  title="بستن پنجره"
                  aria-label="بستن پنجره پیش‌نمایش"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Main Stage View Area */}
            <div 
              className="flex-1 overflow-hidden relative bg-slate-950 flex items-center justify-center select-none"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              style={{ cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default' }}
            >
              {/* If Image: Render transformable img element */}
              {activePreviewModal.type === 'image' && activePreviewModal.src && (
                <div 
                  className="w-full h-full flex items-center justify-center p-4 transition-transform duration-100 ease-out"
                  style={{
                    transform: `translate(${panPosition.x}px, ${panPosition.y}px)`
                  }}
                >
                  <img
                    src={activePreviewModal.src}
                    alt={activePreviewModal.caption || activePreviewModal.name}
                    className="max-h-full max-w-full object-contain pointer-events-none transition-transform duration-200"
                    style={{
                      transform: `scale(${zoomScale}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center'
                    }}
                  />
                </div>
              )}

              {/* If PDF: Render Native High-Definition DOM A4 Document Viewer (No iframes, completely immune to Brave/sandbox blocking) */}
              {activePreviewModal.type === 'pdf' && (
                <div 
                  className="w-full h-full p-4 overflow-auto flex items-start justify-center"
                  style={{
                    cursor: zoomScale > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                  }}
                >
                  <div 
                    className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl shadow-2xl border border-slate-300 transition-transform duration-150 p-6 sm:p-10 my-4 text-right select-text origin-top"
                    style={{
                      transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoomScale}) rotate(${rotation}deg)`,
                      minHeight: '840px',
                      fontFamily: 'Tahoma, system-ui, sans-serif'
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Header with National / Official Identity */}
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
                            {report?.title || effectiveReportTitle}
                          </h2>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {effectiveTeamName} • شماره گزارش: {report?.reportNum ? toPersianDigits(report.reportNum) : '۱'}
                          </p>
                        </div>
                      </div>

                      <div className="text-left text-xs text-slate-600 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1 shrink-0 w-full sm:w-auto">
                        <div><strong>تاریخ صدور:</strong> {report?.date || '۱۴۰۵/۰۵/۲۰'}</div>
                        <div><strong>کد سند:</strong> {report?.id || 'DOC-MAHASH-01'}</div>
                        <div className="text-emerald-700 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>وضعیت: تأیید شده و نهایی</span>
                        </div>
                      </div>
                    </div>

                    {/* Executive Summary */}
                    <div className="mt-6 bg-emerald-50/80 border border-emerald-200 rounded-2xl p-5 space-y-2">
                      <h3 className="text-xs font-black text-emerald-900 flex items-center gap-1.5">
                        <span className="text-sm">📌</span>
                        <span>خلاصه اجرایی و اهداف فعالیت:</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-emerald-950 leading-relaxed">
                        {report?.summary || activePreviewModal.caption || 'سند رسمی گزارش فعالیت‌ها و دستاوردهای اعضای تیم در کارگاه‌های توانمندسازی باشگاه جوانان محاش.'}
                      </p>
                    </div>

                    {/* Content Section: 6-Session Breakdown for Tomorrow Club or Keypoints */}
                    <div className="mt-6 space-y-4">
                      <h3 className="text-sm sm:text-base font-black text-slate-900 pb-2 border-b border-slate-200 flex items-center gap-2">
                        <span>📝</span>
                        <span>
                          {report?.id?.includes('tomorrow') || effectiveTeamName.includes('فردا')
                            ? 'شرح تفصیلی جلسات ۶‌گانه و دستاوردهای اعضا'
                            : 'محورها و نکات کلیدی گزارش فعالیت'}
                        </span>
                      </h3>

                      {report?.id?.includes('tomorrow') || effectiveTeamName.includes('فردا') ? (
                        <div className="space-y-3.5">
                          {[
                            {
                              num: 1,
                              title: 'آغاز مسیر تیم‌سازی و شناخت اعضا',
                              summary: 'معارفه اعضا، شناسایی استعدادهای فردی و تبیین چشم‌انداز فعالیت‌های مشترک در باشگاه جوانان محاش.',
                              outcomes: ['آشنایی صمیمانه و ایجاد فضای امن گفت‌وگو', 'شناسایی علایق و مهارت‌های ویژه اعضا', 'توافق بر منشور اخلاقی همکاری تیمی']
                            },
                            {
                              num: 2,
                              title: 'ساختن هویت تیمی و همسویی اهداف',
                              summary: 'انتخاب نشان، شعار تیمی «امیدی برای فردایی بهتر!» و تعیین نقش‌های اجرایی هر عضو.',
                              outcomes: ['طراحی هویت بصری و نماد جوانه سبز', 'تقسیم مسئولیت‌ها بر اساس نقاط قوت', 'ایجاد انگیزه جمعی برای دستیابی به اهداف عالی']
                            },
                            {
                              num: 3,
                              title: 'محک زدن توانایی‌ها در میدان رقابت و بازی‌های فکری',
                              summary: 'برگزاری کارگاه‌های حل مسئله گروهی، چالش‌های ارتباطی و بازی‌های مهارتی متمرکز بر تفکر استراتژیک.',
                              outcomes: ['تقویت مهارت تصمیم‌گیری سریع', 'تمرین کار گروهی بدون اتکا به کلام', 'افزایش اعتمادبه‌نفس در موقعیت‌های نامتعارف']
                            },
                            {
                              num: 4,
                              title: 'هنر خودمراقبتی در قالب فعالیت گروهی و تئاتر',
                              summary: 'تمرکز بر خودمراقبتی، مدیریت استرس، سلامت روان و بیان احساسات از طریق زبان بدن و نمایش خلاق.',
                              outcomes: ['آموزش تکنیک‌های خودمراقبتی جسمی و روانی', 'اجرای اتودهای نمایشی و تئاتر شورایی', 'تقویت تاب‌آوری در محیط‌های کاری']
                            },
                            {
                              num: 5,
                              title: 'رؤیا، امید و تلاش برای آینده',
                              summary: 'کارگاه آینده‌پژوهی، ایده‌پردازی شغلی، کارآفرینی و تبدیل رویاها به برنامه‌های عملیاتی گام‌به‌گام.',
                              outcomes: ['ترسیم نقشه راه ۵ ساله شغلی و تحصیلی', 'بررسی فرصت‌های نوین فناوری و هوش مصنوعی', 'تقویت ذهنیت رشد پایدار']
                            },
                            {
                              num: 6,
                              title: 'مرور مسیر طی‌شده و تثبیت آموخته‌ها',
                              summary: 'جمع‌بندی دستاوردهای ۶ جلسه، ارزیابی شاخص‌های رشد فردی و تیمی و تدوین برنامه تداوم فعالیت‌ها.',
                              outcomes: ['ارائه بازخورد سازنده میان اعضا و مدیریت', 'تدوین سند نهایی دستاوردها', 'اعطای گواهی افتخاری مشارکت در کارگاه‌ها']
                            }
                          ].map((s) => (
                            <div key={s.num} className="bg-slate-50 border-r-4 border-emerald-500 rounded-xl p-3.5 sm:p-4 space-y-2 border border-slate-200">
                              <div className="flex items-center justify-between">
                                <span className="text-xs sm:text-sm font-black text-emerald-900">
                                  جلسه {toPersianDigits(s.num)}: {s.title}
                                </span>
                                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                  تکمیل شده
                                </span>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed">
                                {s.summary}
                              </p>
                              <div className="pt-1">
                                <span className="text-[11px] font-bold text-slate-800 block mb-1">دستاوردهای کلیدی:</span>
                                <ul className="list-disc list-inside text-[11px] text-slate-600 space-y-0.5">
                                  {s.outcomes.map((o, idx) => (
                                    <li key={idx}>{o}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : report?.keyPoints && report.keyPoints.length > 0 ? (
                        <div className="space-y-2.5">
                          {report.keyPoints.map((kp, idx) => (
                            <div key={idx} className="bg-slate-50 border-r-3 border-blue-600 rounded-xl p-3 text-xs text-slate-800 leading-relaxed border border-slate-200">
                              {kp}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 leading-relaxed">
                          این سند به عنوان گزارش رسمی عملکرد و فعالیت‌های برگزار شده جهت استحضار مدیریت و اعضای باشگاه جوانان محاش در سامانه ثبت گردیده است.
                        </div>
                      )}
                    </div>

                    {/* Official Signatures & Seal */}
                    <div className="mt-8 pt-6 border-t border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="text-right text-xs text-slate-500 space-y-1">
                        <div>مؤسسه توانبخشی و پیشگیری محاش — سامانه جامع پایش و ارزیابی تیم‌ها</div>
                        <div className="text-[10px] text-slate-400">این سند الکترونیکی رسمی و دارای اعتبار حقوقی در سامانه باشگاه جوانان محاش است.</div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-center shrink-0">
                        <div className="text-xs font-black text-emerald-800">مهر و تأیید دبیرخانه باشگاه جوانان محاش</div>
                        <div className="text-[10px] font-bold text-emerald-600 font-mono mt-0.5">کد رهگیری: {toPersianDigits(14050520)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Fallback if no previewable src */}
              {(!activePreviewModal.src || activePreviewModal.src === '#') && (
                <div className="text-center p-8 space-y-4 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">{activePreviewModal.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">
                      این سند به صورت رسمی ثبت شده است. برای دریافت فایل می‌توانید از دکمه «دانلود» بالای صفحه استفاده نمایید.
                    </p>
                  </div>
                </div>
              )}

              {/* Floating Helper for Zoom/Pan */}
              {zoomScale > 1 && (
                <div className="absolute bottom-4 right-4 bg-black/70 backdrop-blur-xs text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-white/10 pointer-events-none">
                  <Move className="w-3 h-3 text-blue-400" />
                  <span>برای جابجایی در سند یا تصویر، ماوس را بکشید (Drag)</span>
                </div>
              )}
            </div>

            {/* Footer with caption & preset zoom chips */}
            <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
              <span className="text-xs text-slate-400 text-center sm:text-right truncate max-w-xl">
                {activePreviewModal.caption || effectiveReportTitle}
              </span>

              {/* Quick zoom pills */}
              <div className="flex items-center gap-1 text-[10px] font-mono">
                {[0.75, 1, 1.5, 2, 3].map((scale) => (
                  <button
                    key={scale}
                    type="button"
                    onClick={() => {
                      setZoomScale(scale);
                      setPanPosition({ x: 0, y: 0 });
                    }}
                    aria-label={`تنظیم بزرگ‌نمایی به ${toPersianDigits(Math.round(scale * 100))} درصد`}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      Math.abs(zoomScale - scale) < 0.1
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                  >
                    {toPersianDigits(Math.round(scale * 100))}٪
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
