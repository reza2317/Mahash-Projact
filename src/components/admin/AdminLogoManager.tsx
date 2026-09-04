import React, { useRef, useState } from 'react';
import {
  Upload,
  Check,
  X,
  RotateCcw,
  Loader2,
  Image as ImageIcon,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  FileCheck
} from 'lucide-react';
import { useLogoSync, AssetCategory } from '../../hooks/useLogoSync';
import { SyncStatusBadge } from '../SyncStatusBadge';
import { toPersianDigits } from '../../utils/persianDate';

export interface AdminLogoManagerProps {
  id?: string;
  assetId: string;
  category?: AssetCategory;
  title: string;
  description: string;
  defaultSvg: string;
  maxFileSizeMB?: number;
  maxDimension?: number;
  badgeText?: string;
  onSyncSuccess?: (newDataUrl: string) => void;
  className?: string;
}

export const AdminLogoManager: React.FC<AdminLogoManagerProps> = ({
  id = 'admin-logo-manager',
  assetId,
  category = 'logo',
  title,
  description,
  defaultSvg,
  maxFileSizeMB = 5,
  maxDimension = 480,
  badgeText,
  onSyncSuccess,
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const {
    currentLogo,
    previewUrl,
    selectedFile,
    syncStatus,
    isSaving,
    isFading,
    errorMessage,
    lastSyncedAt,
    fileInfo,
    handleFileSelect,
    saveToFirestore,
    cancelPreview,
    resetToDefault,
  } = useLogoSync({
    assetId,
    category: category as AssetCategory,
    assetName: title,
    initialLogo: defaultSvg,
    maxFileSizeMB,
    maxDimension,
    onGlobalSync: onSyncSuccess,
  });

  const displaySrc = previewUrl || currentLogo || defaultSvg;

  const onFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
    // Reset file input value so user can re-pick the same file if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      await handleFileSelect(file);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs transition-all duration-300 ${
        isDragOver ? 'ring-2 ring-blue-500 border-transparent bg-blue-50/30 dark:bg-blue-950/20' : ''
      } ${className}`}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      {/* Header Info & Sync Status */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div className="space-y-1 max-w-md">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <span>{title}</span>
            </h3>
            {badgeText && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {badgeText}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <SyncStatusBadge status={syncStatus} lastSyncedAt={lastSyncedAt} errorMessage={errorMessage} />
        </div>
      </div>

      {/* Main Image Display & Preview Area */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center bg-slate-50 dark:bg-slate-950/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80">
        {/* Visual Box */}
        <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 relative group">
          <div
            className={`w-32 h-32 md:w-36 md:h-36 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center p-2.5 overflow-hidden transition-all duration-500 ${
              isFading ? 'opacity-40 scale-95' : 'opacity-100 scale-100'
            } ${previewUrl ? 'ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-slate-900' : ''}`}
          >
            <img
              src={displaySrc}
              alt={title}
              className={`w-full h-full object-contain transition-all duration-500 ${
                isFading ? 'filter blur-[1px]' : ''
              }`}
              referrerPolicy="no-referrer"
            />
          </div>

          {previewUrl && (
            <span className="mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 flex items-center gap-1">
              <FileCheck className="w-3 h-3" />
              پیش‌نمایش موقت (ذخیره نشده)
            </span>
          )}
        </div>

        {/* Action Controls & Information */}
        <div className="sm:col-span-7 flex flex-col justify-between space-y-3">
          {/* File format guidelines & Specs */}
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 bg-white/70 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200/70 dark:border-slate-800">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                فرمت‌های مجاز: PNG, JPG, SVG, WebP
              </span>
              <span>حداکثر حجم: {toPersianDigits(maxFileSizeMB)} مگابایت</span>
            </div>

            {fileInfo && (
              <div className="pt-1.5 mt-1 border-t border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2 text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
                <span className="truncate max-w-[180px] font-mono">{fileInfo.name}</span>
                <span>•</span>
                <span>{toPersianDigits(fileInfo.sizeKB)} کیلوبایت</span>
                <span>•</span>
                <span className="uppercase">{fileInfo.format}</span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/svg+xml, image/webp"
              className="hidden"
              onChange={onFileInputChange}
            />

            {previewUrl ? (
              <>
                {/* Save to Firestore Button */}
                <button
                  type="button"
                  id={`${id}-save-btn`}
                  disabled={isSaving}
                  aria-label={`تأیید و ذخیره ${title} در پایگاه داده ابری`}
                  onClick={async () => {
                    await saveToFirestore();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" aria-hidden="true" />
                      <span>در حال ذخیره در دیتابیس...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" aria-hidden="true" />
                      <span>تأیید و ذخیره در پایگاه داده ابری</span>
                    </>
                  )}
                </button>

                {/* Cancel Button */}
                <button
                  type="button"
                  id={`${id}-cancel-btn`}
                  disabled={isSaving}
                  aria-label="انصراف از تغییر تصویر"
                  onClick={cancelPreview}
                  className="px-3 py-2 bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                  <span>انصراف</span>
                </button>
              </>
            ) : (
              <>
                {/* Select / Change File Button */}
                <button
                  type="button"
                  id={`${id}-upload-btn`}
                  disabled={isSaving}
                  aria-label={`انتخاب و بارگذاری تصویر جدید برای ${title}`}
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" aria-hidden="true" />
                  <span>انتخاب و بارگذاری تصویر جدید</span>
                </button>

                {/* Reset to Default Button */}
                <button
                  type="button"
                  id={`${id}-reset-btn`}
                  disabled={isSaving}
                  aria-label={`بازنشانی ${title} به نشان پیش‌فرض`}
                  onClick={() => resetToDefault(defaultSvg)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-600 dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-400 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  title="بازنشانی به وکتور اصلی"
                >
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>بازنشانی به پیش‌فرض</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Error Message Box */}
      {errorMessage && (
        <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 flex items-start gap-2 text-rose-700 dark:text-rose-300 text-xs animate-in fade-in duration-200">
          <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">خطا: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};
