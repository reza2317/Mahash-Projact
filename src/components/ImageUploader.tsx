import React, { useState, useRef, useEffect } from 'react';
import { Upload, Check, X, RotateCcw, Camera, Eye, AlertCircle } from 'lucide-react';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { saveTeamLogo, resetTeamLogo, triggerGlobalCacheBust } from '../utils/reportsStore';
import { getTeamLogoPlaceholder } from '../utils/assets';

interface ImageUploaderProps {
  teamIdOrSlug?: string;
  teamId?: string;
  teamName: string;
  currentLogo?: string;
  compact?: boolean;
  onSaved?: (newLogo: string) => void;
  onLogoChange?: (newLogo: string) => void;
  onReset?: () => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  teamIdOrSlug,
  teamId,
  teamName,
  currentLogo,
  compact = true,
  onSaved,
  onLogoChange,
  onReset
}) => {
  const targetId = teamIdOrSlug || teamId || 'team-default';
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveCurrentLogo = currentLogo || getTeamLogoPlaceholder(targetId, teamName);
  const displayLogo = previewUrl || effectiveCurrentLogo;

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('فقط فرمت‌های تصویری مجاز هستند.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);

    // Instant local preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleSave = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedFile) return;

    setIsProcessing(true);
    setErrorMessage(null);
    try {
      // Compress and convert to Base64
      const compressedDataUrl = await compressImageToDataUrl(selectedFile, 512, 0.88);
      
      // Persist permanently in LocalStorage
      saveTeamLogo(targetId, compressedDataUrl);
      triggerGlobalCacheBust();

      setSaveSuccess(true);
      setSelectedFile(null);
      setPreviewUrl(null);

      if (onSaved) {
        onSaved(compressedDataUrl);
      }
      if (onLogoChange) {
        onLogoChange(compressedDataUrl);
      }

      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving team logo:', err);
      setErrorMessage('خطا در ذخیره‌سازی تصویر.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCancelPreview = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetToDefault = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    handleCancelPreview();
    resetTeamLogo(targetId);
    triggerGlobalCacheBust();
    if (onReset) onReset();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex items-center gap-3 p-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xs">
        {/* Avatar / Logo Display with Click to Pick */}
        <div className="relative group shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`w-12 h-12 rounded-full overflow-hidden border-2 transition cursor-pointer flex items-center justify-center p-0.5 bg-slate-50 dark:bg-slate-800 ${
              previewUrl
                ? 'border-amber-500 ring-2 ring-amber-400/50 shadow-md'
                : saveSuccess
                ? 'border-emerald-500 ring-2 ring-emerald-400/50'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-500'
            }`}
            title="برای انتخاب تصویر جدید کلیک کنید"
          >
            <img
              src={displayLogo}
              alt={teamName}
              className="w-full h-full object-contain rounded-full"
              onError={(e) => {
                (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(teamIdOrSlug, teamName);
              }}
            />
          </div>

          {/* Camera Hover overlay */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute inset-0 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
            title="انتخاب عکس جدید"
          >
            <Camera className="w-4 h-4 text-amber-300" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex-1 min-w-0 space-y-1">
          {previewUrl ? (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                <Eye className="w-3.5 h-3.5" />
                <span>پیش‌نمایش تصویر انتخابی</span>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
                >
                  <Check className="w-3 h-3" />
                  <span>{isProcessing ? 'در حال ذخیره...' : 'ذخیره تصویر'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelPreview}
                  disabled={isProcessing}
                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[11px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>لغو</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {teamName}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {saveSuccess ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> ذخیره شد در سیستم
                    </span>
                  ) : (
                    'برای تغییر تصویر کلیک کنید'
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 border border-blue-200 dark:border-blue-800 cursor-pointer"
                  title="انتخاب عکس از سیستم"
                >
                  <Upload className="w-3 h-3" />
                  <span>انتخاب</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetToDefault}
                  className="p-1 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                  title="بازنشانی لوگو به حالت پیش‌فرض"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="text-[10px] text-rose-500 font-bold flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
