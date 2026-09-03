import { useState, useEffect, useCallback, useRef } from 'react';
import {
  saveAssetToFirestore,
  getAssetFromFirestore,
  deleteAssetFromFirestore,
  logFirestoreDiagnostic,
} from '../utils/firestorePersistence';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import { isCustomImageDataUrlOrUrl } from '../utils/reportsStore';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage } from '../utils/storage';

export type AssetCategory = 'logo' | 'badge' | 'consultant_photo' | 'graphic';

export interface UseLogoSyncOptions {
  assetId: string;
  category?: AssetCategory;
  assetName?: string;
  initialLogo: string;
  maxFileSizeMB?: number; // Maximum allowed file size before compression (default: 5MB)
  maxDimension?: number;  // Max width/height for compression (default: 512)
  onGlobalSync?: (newDataUrl: string) => void;
}

export interface UseLogoSyncResult {
  currentLogo: string;
  previewUrl: string | null;
  selectedFile: File | null;
  syncStatus: 'idle' | 'validating' | 'syncing' | 'synced' | 'error';
  isSaving: boolean;
  isFading: boolean;
  errorMessage: string | null;
  lastSyncedAt: Date | null;
  fileInfo: { name: string; sizeKB: number; format: string; originalSizeMB: string } | null;
  handleFileSelect: (file: File) => Promise<boolean>;
  saveToFirestore: () => Promise<boolean>;
  cancelPreview: () => void;
  resetToDefault: (defaultLogo: string) => Promise<void>;
  retrySync: () => Promise<boolean>;
}

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/svg+xml',
  'image/webp',
  'image/gif'
];

const ALLOWED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.svg', '.webp', '.gif'];

export function useLogoSync({
  assetId,
  category = 'logo',
  assetName = 'لوگو',
  initialLogo,
  maxFileSizeMB = 5,
  maxDimension = 512,
  onGlobalSync
}: UseLogoSyncOptions): UseLogoSyncResult {
  // Active persisted logo
  const [currentLogo, setCurrentLogo] = useState<string>(() => {
    if (typeof window === 'undefined') return initialLogo;
    const local = safeGetLocalStorage(`mahash_asset_${assetId}`);
    return local && isCustomImageDataUrlOrUrl(local) ? local : initialLogo;
  });

  // Rollback state ref to guarantee instant revert on failed remote write
  const previousPersistentLogoRef = useRef<string>(currentLogo);

  // ObjectURL or temporary preview
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileInfo, setFileInfo] = useState<{
    name: string;
    sizeKB: number;
    format: string;
    originalSizeMB: string;
  } | null>(null);

  // Sync and UI statuses
  const [syncStatus, setSyncStatus] = useState<'idle' | 'validating' | 'syncing' | 'synced' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isFading, setIsFading] = useState<boolean>(false);

  // Keep previous persistent ref in sync
  useEffect(() => {
    previousPersistentLogoRef.current = currentLogo;
  }, [currentLogo]);

  // Initial cloud recovery from dedicated 'assets' collection
  useEffect(() => {
    let isMounted = true;
    async function loadCloudLogo() {
      try {
        const cloudData = await getAssetFromFirestore(assetId);
        if (isMounted && cloudData && isCustomImageDataUrlOrUrl(cloudData)) {
          setCurrentLogo(cloudData);
          setSyncStatus('synced');
          setLastSyncedAt(new Date());
          if (onGlobalSync) onGlobalSync(cloudData);
        }
      } catch (err) {
        console.warn(`[useLogoSync] Cloud fetch notice for ${assetId}:`, err);
      }
    }
    loadCloudLogo();
    return () => {
      isMounted = false;
    };
  }, [assetId]);

  // Clean up Object URL on unmount or change
  const activeBlobUrlRef = useRef<string | null>(null);
  const cleanupObjectUrl = useCallback(() => {
    if (activeBlobUrlRef.current) {
      try {
        URL.revokeObjectURL(activeBlobUrlRef.current);
      } catch {}
      activeBlobUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cleanupObjectUrl();
    };
  }, [cleanupObjectUrl]);

  /**
   * Validate and select image file using URL.createObjectURL
   */
  const handleFileSelect = useCallback(
    async (file: File): Promise<boolean> => {
      cleanupObjectUrl();
      setErrorMessage(null);
      setSyncStatus('validating');

      if (!file) {
        setErrorMessage('هیچ فایلی انتخاب نشده است.');
        setSyncStatus('idle');
        return false;
      }

      // 1. Validate MIME Type & Extension
      const fileExt = `.${file.name.split('.').pop()?.toLowerCase()}`;
      const isMimeValid = ALLOWED_MIME_TYPES.includes(file.type);
      const isExtValid = ALLOWED_EXTENSIONS.includes(fileExt);

      if (!isMimeValid && !isExtValid) {
        const err = `فرمت فایل (${file.type || fileExt}) پشتیبانی نمی‌شود. لطفاً از فرمت‌های PNG، JPG، SVG یا WebP استفاده نمایید.`;
        setErrorMessage(err);
        setSyncStatus('error');
        return false;
      }

      // 2. Validate File Size
      const maxBytes = maxFileSizeMB * 1024 * 1024;
      if (file.size > maxBytes) {
        const err = `حجم فایل (${(file.size / (1024 * 1024)).toFixed(1)}MB) بیش از حد مجاز (${maxFileSizeMB}MB) است. لطفاً تصویر کم‌حجم‌تری انتخاب فرمایید.`;
        setErrorMessage(err);
        setSyncStatus('error');
        return false;
      }

      // 3. Create visual preview using URL.createObjectURL()
      try {
        const objectUrl = URL.createObjectURL(file);
        activeBlobUrlRef.current = objectUrl;
        setPreviewUrl(objectUrl);
        setSelectedFile(file);
        setFileInfo({
          name: file.name,
          sizeKB: Math.round(file.size / 1024),
          format: file.type || fileExt.replace('.', '').toUpperCase(),
          originalSizeMB: (file.size / (1024 * 1024)).toFixed(2)
        });
        setSyncStatus('idle');
        return true;
      } catch (err) {
        console.error('Failed to create preview object URL:', err);
        setErrorMessage('خطا در تولید پیش‌نمایش تصویر');
        setSyncStatus('error');
        return false;
      }
    },
    [cleanupObjectUrl, maxFileSizeMB]
  );

  /**
   * Save and sync to Firestore with Rollback mechanism
   */
  const saveToFirestore = useCallback(async (): Promise<boolean> => {
    if (!selectedFile && !previewUrl) {
      setErrorMessage('فایلی برای ذخیره‌سازی انتخاب نشده است.');
      return false;
    }

    const previousLogo = previousPersistentLogoRef.current;
    setSyncStatus('syncing');
    setErrorMessage(null);

    let compressedDataUrl = '';

    // Step 1: Client-side compression / conversion
    try {
      if (selectedFile) {
        if (selectedFile.type === 'image/svg+xml') {
          // Read SVG text or as data URL directly
          compressedDataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(selectedFile);
          });
        } else {
          compressedDataUrl = await compressImageToDataUrl(selectedFile, maxDimension, 0.85);
        }
      } else if (previewUrl && previewUrl.startsWith('data:')) {
        compressedDataUrl = previewUrl;
      }

      if (!compressedDataUrl) {
        throw new Error('تصویر فشرده‌سازی نشد.');
      }
    } catch (compressErr) {
      console.warn('Compression error, falling back:', compressErr);
      setErrorMessage('خطا در فشرده‌سازی و پردازش تصویر.');
      setSyncStatus('error');
      return false;
    }

    // Step 2: Optimistic Local State Update with Fade-in trigger
    setCurrentLogo(compressedDataUrl);
    setIsFading(true);
    safeSetLocalStorage(`mahash_asset_${assetId}`, compressedDataUrl);
    if (onGlobalSync) onGlobalSync(compressedDataUrl);

    // Step 3: Firestore Write with Strict Timeout and Rollback
    try {
      const result = await saveAssetToFirestore(
        assetId,
        category,
        assetName,
        compressedDataUrl,
        selectedFile?.type || 'image/webp'
      );

      if (result.success) {
        // Success: Clean up preview and update timestamps
        cleanupObjectUrl();
        setPreviewUrl(null);
        setSelectedFile(null);
        setFileInfo(null);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        previousPersistentLogoRef.current = compressedDataUrl;

        setTimeout(() => {
          setIsFading(false);
        }, 600);

        return true;
      } else {
        throw new Error(result.error || 'پایگاه داده به درخواست ذخیره‌سازی پاسخ نداد.');
      }
    } catch (syncErr) {
      // ROLLBACK MECHANISM: Revert to previous persistent logo!
      console.error(`[useLogoSync] MySQL write failed for ${assetId}, triggering rollback:`, syncErr);
      setCurrentLogo(previousLogo);
      safeSetLocalStorage(`mahash_asset_${assetId}`, previousLogo);
      if (onGlobalSync) onGlobalSync(previousLogo);

      setSyncStatus('error');
      setErrorMessage(
        syncErr instanceof Error ? syncErr.message : 'خطا در ثبت اطلاعات در پایگاه داده MySQL.'
      );
      setIsFading(false);
      return false;
    }
  }, [selectedFile, previewUrl, maxDimension, assetId, category, assetName, onGlobalSync, cleanupObjectUrl]);

  /**
   * Cancel pending preview and revert to current saved logo
   */
  const cancelPreview = useCallback(() => {
    cleanupObjectUrl();
    setPreviewUrl(null);
    setSelectedFile(null);
    setFileInfo(null);
    setErrorMessage(null);
    setSyncStatus('idle');
  }, [cleanupObjectUrl]);

  /**
   * Reset logo to system default
   */
  const resetToDefault = useCallback(
    async (defaultLogo: string): Promise<void> => {
      cleanupObjectUrl();
      setPreviewUrl(null);
      setSelectedFile(null);
      setFileInfo(null);
      setErrorMessage(null);
      setSyncStatus('syncing');

      try {
        await deleteAssetFromFirestore(assetId);
        safeRemoveLocalStorage(`mahash_asset_${assetId}`);
        setCurrentLogo(defaultLogo);
        previousPersistentLogoRef.current = defaultLogo;
        if (onGlobalSync) onGlobalSync(defaultLogo);
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        setIsFading(true);
        setTimeout(() => setIsFading(false), 500);
      } catch (err) {
        console.warn(`[useLogoSync] Error resetting asset ${assetId}:`, err);
        setSyncStatus('error');
        setErrorMessage('خطا در بازنشانی تصویر به پیش‌فرض');
      }
    },
    [assetId, cleanupObjectUrl, onGlobalSync]
  );

  const retrySync = useCallback(async (): Promise<boolean> => {
    return saveToFirestore();
  }, [saveToFirestore]);

  return {
    currentLogo,
    previewUrl,
    selectedFile,
    syncStatus,
    isSaving: syncStatus === 'syncing',
    isFading,
    errorMessage,
    lastSyncedAt,
    fileInfo,
    handleFileSelect,
    saveToFirestore,
    cancelPreview,
    resetToDefault,
    retrySync,
  };
}
