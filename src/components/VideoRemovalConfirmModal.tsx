import React from 'react';
import { AlertTriangle, Trash2, X, Check, ShieldAlert, Film } from 'lucide-react';

interface VideoRemovalConfirmModalProps {
  isOpen: boolean;
  reportTitle: string;
  videoFileName?: string;
  fileName?: string;
  onConfirm?: () => void;
  onConfirmRemove?: (options?: { keepInStorage?: boolean }) => void;
  onCancel?: () => void;
  onClose?: () => void;
  isRemoving?: boolean;
}

export const VideoRemovalConfirmModal: React.FC<VideoRemovalConfirmModalProps> = ({
  isOpen,
  reportTitle,
  videoFileName,
  fileName,
  onConfirm,
  onConfirmRemove,
  onCancel,
  onClose,
  isRemoving = false
}) => {
  if (!isOpen) return null;

  const handleClose = () => {
    if (onCancel) onCancel();
    else if (onClose) onClose();
  };

  const handleConfirm = () => {
    if (onConfirm) onConfirm();
    else if (onConfirmRemove) onConfirmRemove({ keepInStorage: false });
  };

  const displayedFileName = videoFileName || fileName;

  return (
    <div 
      id="video-removal-modal-backdrop" 
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
    >
      <div 
        id="video-removal-modal"
        className="relative w-full max-w-md bg-slate-900 rounded-3xl border border-red-500/30 p-6 shadow-2xl space-y-5 text-right"
        onClick={(e) => e.stopPropagation()}
        dir="rtl"
      >
        {/* Warning Icon & Header */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              هشدار: حذف پیوست ویدیویی
            </h3>
            <p className="text-xs text-red-300/90 mt-0.5">
              تبدیل گزارش به نسخه متنی و پاکسازی فایل
            </p>
          </div>
        </div>

        {/* Warning Details */}
        <div className="p-4 rounded-2xl bg-red-950/30 border border-red-900/40 text-slate-300 text-xs leading-relaxed space-y-2">
          <p>
            آیا از حذف فایل ویدیویی پیوست شده به گزارش <strong className="text-white font-semibold">«{reportTitle || 'بدون عنوان'}»</strong> اطمینان دارید؟
          </p>
          {displayedFileName && (
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono bg-black/30 px-2.5 py-1.5 rounded-lg border border-white/5">
              <Film className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="truncate">{displayedFileName}</span>
            </div>
          )}
          <ul className="list-disc list-inside space-y-1 text-[11px] text-red-200/80 pt-1">
            <li>فایل ویدیو از حافظه پنهان و سرور حذف خواهد شد.</li>
            <li>گزارش به صورت خودکار به وضعیت «متنی / مستند» تغییر می‌یابد.</li>
            <li>زیرنویس‌های اختصاصی همگام پاکسازی می‌شوند.</li>
            <li>این عملیات غیرقابل بازگشت خواهد بود.</li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            id="cancel-remove-video-btn"
            type="button"
            onClick={handleClose}
            disabled={isRemoving}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <X className="w-4 h-4" />
            <span>انصراف و حفظ ویدیو</span>
          </button>

          <button
            id="confirm-remove-video-btn"
            type="button"
            onClick={handleConfirm}
            disabled={isRemoving}
            className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-red-600/30 flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isRemoving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال حذف...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>تأیید و حذف قطعی ویدیو</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRemovalConfirmModal;
