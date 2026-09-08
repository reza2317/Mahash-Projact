import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Video,
  Trash2,
  Download,
  Copy,
  Database,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Filter,
  Eye,
  Check,
  Zap,
  Sliders,
  Play,
  Maximize2,
  Film,
  User,
  Shield,
  Layers,
  ArrowDownCircle,
  FileCheck,
  Cpu
} from 'lucide-react';
import {
  compressConsultantPhoto,
  ConsultantCompressionResult,
  isConsultantPhotoOptimized
} from '../../utils/consultantImageCompressor';
import {
  saveConsultantPhotoWithAutoCompression,
  saveConsultantPhoto,
  persistAllAssetsPermanentlyToMySQLAndNetlify,
  getAllConsultants,
  getAllTeams,
  getConsultantPhoto
} from '../../utils/reportsStore';
import { getCanonicalConsultantDocId } from '../../utils/firestorePersistence';
import { formatBytes } from '../../utils/imageOptimizer';
import { toPersianDigits } from '../../utils/persianDate';
import { useNotification } from '../../context/NotificationContext';

export interface UnifiedMediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  category: string;
  url: string;
  thumbnailUrl?: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
  sourceTable: string;
  tableName?: string;
  durationSeconds?: number;
  teamSlug?: string;
  isOptimized?: boolean;
  isPublic?: boolean;
  viewsCount?: number;
}

interface MySQLMediaFileManagerProps {
  onRefreshAll?: () => void;
  className?: string;
}

export const MySQLMediaFileManager: React.FC<MySQLMediaFileManagerProps> = ({
  onRefreshAll,
  className = ''
}) => {
  const { success, error, info } = useNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sub-tabs
  const [activeSubTab, setActiveSubTab] = useState<'browse' | 'upload' | 'consultant_optimizer'>('browse');

  // Media list state
  const [mediaList, setMediaList] = useState<UnifiedMediaItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'image' | 'video' | 'consultant' | 'logo'>('all');
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Delete modal state
  const [itemToDelete, setItemToDelete] = useState<UnifiedMediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Preview modal state (for lightbox or video player)
  const [previewItem, setPreviewItem] = useState<UnifiedMediaItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Upload state
  const [uploadCategory, setUploadCategory] = useState<'consultant' | 'official_logo' | 'team_logo' | 'video' | 'general'>('consultant');
  const [selectedConsultant, setSelectedConsultant] = useState<string>('دکتر نازی عباسیان');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isVideoSelected, setIsVideoSelected] = useState<boolean>(false);

  // Auto-compression state for upload
  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [compressionResult, setCompressionResult] = useState<ConsultantCompressionResult | null>(null);
  const [compressionQuality, setCompressionQuality] = useState<number>(0.82);
  const [maxDimension, setMaxDimension] = useState<number>(420);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Batch consultant optimizer state
  const [isBatchOptimizing, setIsBatchOptimizing] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [batchSavedBytes, setBatchSavedBytes] = useState<number>(0);
  const [isSyncingAllAssets, setIsSyncingAllAssets] = useState<boolean>(false);

  const consultants = getAllConsultants();
  const teams = getAllTeams();

  // Sync all current logos, consultants, and videos into MySQL
  const handleSyncAllAssetsToMySQL = async () => {
    setIsSyncingAllAssets(true);
    try {
      const res = await persistAllAssetsPermanentlyToMySQLAndNetlify();
      if (res.success) {
        success(`همگام‌سازی دارایی‌ها با موفقیت انجام شد: ${toPersianDigits(res.count)} مورد در دیتابیس MySQL ثبت گردید.`);
        await loadMedia();
        if (onRefreshAll) onRefreshAll();
      } else {
        error(res.message || 'خطا در همگام‌سازی دارایی‌ها با MySQL');
      }
    } catch (err: any) {
      console.error('Error syncing all assets to MySQL:', err);
      error('خطا در ارتباط با سرور یا دیتابیس MySQL');
    } finally {
      setIsSyncingAllAssets(false);
    }
  };

  // Load all media from MySQL
  const loadMedia = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mysql/media-unified');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.media)) {
          setMediaList(json.media);
          return;
        }
      }
      // Fallback: try /api/mysql/assets directly
      const assetsRes = await fetch('/api/mysql/assets');
      if (assetsRes.ok) {
        const assetsJson = await assetsRes.json();
        if (assetsJson && Array.isArray(assetsJson.assets)) {
          const fallbackList: UnifiedMediaItem[] = assetsJson.assets.map((a: any) => ({
            id: a.id,
            name: a.name || a.id,
            type: a.mime_type?.startsWith('video/') ? 'video' : 'image',
            category: a.category || 'general',
            url: a.data || `/api/mysql/assets/${a.id}`,
            thumbnailUrl: a.data || '',
            mimeType: a.mime_type || 'image/webp',
            sizeBytes: a.size_bytes || 0,
            updatedAt: a.updated_at || new Date().toISOString(),
            sourceTable: 'mahash_assets'
          }));
          setMediaList(fallbackList);
        }
      }
    } catch (err) {
      console.warn('Could not fetch MySQL media list:', err);
      error('خطا در دریافت لیست رسانه‌های MySQL');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMedia();
  }, []);

  // Handle file selection
  const handleFileSelect = async (file: File) => {
    setSelectedFile(file);
    const isVid = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
    setIsVideoSelected(isVid);

    if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
    const previewUrl = URL.createObjectURL(file);
    setFilePreviewUrl(previewUrl);

    if (!customTitle) {
      setCustomTitle(file.name.replace(/\.[^.]+$/, ''));
    }

    // If it is an image and category is consultant (or general), run automatic auto-compression
    if (!isVid && (uploadCategory === 'consultant' || uploadCategory === 'team_logo' || uploadCategory === 'official_logo')) {
      await runAutoCompression(file);
    } else {
      setCompressionResult(null);
    }
  };

  // Run auto-compression on selected file
  const runAutoCompression = async (file: File, quality = compressionQuality, maxDim = maxDimension) => {
    setIsCompressing(true);
    try {
      const result = await compressConsultantPhoto(file, {
        maxWidth: maxDim,
        maxHeight: maxDim,
        quality: quality,
        targetFormat: 'image/webp'
      });
      setCompressionResult(result);
    } catch (err: any) {
      console.error('Compression failed:', err);
      error('خطا در فشرده‌سازی تصویر: ' + (err?.message || 'فرمت نامعتبر'));
    } finally {
      setIsCompressing(false);
    }
  };

  // Execute upload to MySQL
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !compressionResult) {
      error('لطفاً ابتدا یک فایل تصویر یا ویدیو انتخاب نمایید.');
      return;
    }

    setIsUploading(true);
    try {
      // 1. If it's a consultant photo and we have the auto-compressed WebP dataUrl:
      if (uploadCategory === 'consultant' && compressionResult) {
        await saveConsultantPhotoWithAutoCompression(selectedConsultant, compressionResult.compressedDataUrl, {
          maxWidth: maxDimension,
          maxHeight: maxDimension,
          quality: compressionQuality
        });

        success(`تصویر مشاور «${selectedConsultant}» با موفقیت فشرده‌سازی خودکار WebP شد (${compressionResult.compressedSizeFormatted}) و در دیتابیس MySQL ثبت گردید.`);
      } else {
        // Multipart upload to /api/mysql/media-unified/upload
        const formData = new FormData();
        if (selectedFile) {
          formData.append('file', selectedFile);
        }
        formData.append('category', uploadCategory);
        formData.append('name', customTitle || selectedFile?.name || 'رسانه جدید');
        if (uploadCategory === 'consultant') formData.append('consultantName', selectedConsultant);
        if (selectedTeam) formData.append('teamSlug', selectedTeam);

        const res = await fetch('/api/mysql/media-unified/upload', {
          method: 'POST',
          body: formData
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'خطا در بارگذاری فایل در MySQL');
        }

        const resData = await res.json();
        success(resData.message || 'فایل با موفقیت در دیتابیس MySQL ثبت گردید.');
      }

      // Reset upload form
      setSelectedFile(null);
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
      setCompressionResult(null);
      setCustomTitle('');
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Reload list and notify parent
      await loadMedia();
      if (onRefreshAll) onRefreshAll();
      setActiveSubTab('browse');
    } catch (err: any) {
      console.error('Upload failed:', err);
      error(err?.message || 'خطا در بارگذاری رسانه در MySQL');
    } finally {
      setIsUploading(false);
    }
  };

  // Execute deletion from MySQL
  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/mysql/media-unified/${encodeURIComponent(itemToDelete.id)}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || 'خطا در حذف رسانه از MySQL');
      }

      success(`فایل «${itemToDelete.name}» با موفقیت از دیتابیس MySQL حذف شد.`);
      setItemToDelete(null);
      await loadMedia();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      console.error('Delete error:', err);
      error(err?.message || 'خطا در حذف فایل از MySQL');
    } finally {
      setIsDeleting(false);
    }
  };

  // Copy link/URL to clipboard
  const handleCopyUrl = (item: UnifiedMediaItem) => {
    const fullUrl = item.url.startsWith('data:') 
      ? item.url 
      : `${window.location.origin}${item.url}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedId(item.id);
    info('لینک فایل در کلیپ‌بورد کپی شد.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Batch optimize all consultant photos
  const handleBatchOptimizeConsultants = async () => {
    setIsBatchOptimizing(true);
    setBatchSavedBytes(0);
    let totalSaved = 0;
    let count = 0;

    try {
      const allConsultantsList = getAllConsultants();
      for (let i = 0; i < allConsultantsList.length; i++) {
        const c = allConsultantsList[i];
        setBatchProgress({ current: i + 1, total: allConsultantsList.length, name: c.name });

        const photo = getConsultantPhoto(c.name) || c.image;
        if (photo && !isConsultantPhotoOptimized(photo)) {
          try {
            const comp = await saveConsultantPhotoWithAutoCompression(c.name, photo, {
              maxWidth: 420,
              maxHeight: 420,
              quality: 0.82
            });
            totalSaved += comp.savedBytes;
            count++;
          } catch (cErr) {
            console.warn(`Could not optimize photo for ${c.name}:`, cErr);
          }
        }
      }

      setBatchSavedBytes(totalSaved);
      success(`بهینه‌سازی کلی با موفقیت پایان یافت! ${toPersianDigits(count)} تصویر بهینه‌سازی شد و ${formatBytes(totalSaved)} در فضای دیتابیس صرفه‌جویی گردید.`);
      await loadMedia();
      if (onRefreshAll) onRefreshAll();
    } catch (err: any) {
      error('خطا در بهینه‌سازی دسته‌ای تصاویر مشاوران: ' + err?.message);
    } finally {
      setIsBatchOptimizing(false);
      setBatchProgress(null);
    }
  };

  // Filtered media list
  const filteredList = useMemo(() => {
    return mediaList.filter((item) => {
      // Type filter
      if (filterType === 'image' && item.type !== 'image') return false;
      if (filterType === 'video' && item.type !== 'video') return false;
      if (filterType === 'consultant' && item.category !== 'consultant') return false;
      if (filterType === 'logo' && !item.category.includes('logo') && !item.id.includes('logo')) return false;

      // Team filter
      if (filterTeam !== 'all' && item.teamSlug && item.teamSlug !== filterTeam) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = item.name?.toLowerCase().includes(q);
        const matchId = item.id?.toLowerCase().includes(q);
        const matchCategory = item.category?.toLowerCase().includes(q);
        const matchTable = item.sourceTable?.toLowerCase().includes(q);
        if (!matchName && !matchId && !matchCategory && !matchTable) return false;
      }

      return true;
    });
  }, [mediaList, filterType, filterTeam, searchQuery]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = mediaList.length;
    const images = mediaList.filter(m => m.type === 'image');
    const videos = mediaList.filter(m => m.type === 'video');
    const consultantPhotos = mediaList.filter(m => m.category === 'consultant');
    const totalBytes = mediaList.reduce((acc, curr) => acc + (curr.sizeBytes || 0), 0);
    const optimizedCount = mediaList.filter(m => m.isOptimized).length;

    return {
      total,
      imagesCount: images.length,
      videosCount: videos.length,
      consultantCount: consultantPhotos.length,
      totalBytesFormatted: formatBytes(totalBytes),
      optimizedPercent: total > 0 ? Math.round((optimizedCount / total) * 100) : 100
    };
  }, [mediaList]);

  return (
    <div id="mysql-media-file-manager" className={`space-y-6 ${className}`}>
      {/* Top Banner & Stats */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 border border-indigo-900/60 rounded-2xl p-6 shadow-xl text-white">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-2 bg-indigo-600/40 border border-indigo-500/40 rounded-xl text-cyan-300">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                مرور، بارگذاری و مدیریت رسانه‌های MySQL
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  متصل به دیتابیس MySQL
                </span>
              </h2>
            </div>
            <p className="text-sm text-slate-300">
              سامانه یکپارچه ذخیره‌سازی، بهینه‌سازی WebP، بارگذاری و حذف تصاویر و ویدیوها در جداول{' '}
              <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">mahash_assets</code> و{' '}
              <code className="bg-black/30 px-1.5 py-0.5 rounded text-cyan-300 font-mono text-xs">mahash_videos</code>
            </p>
          </div>

          <div className="flex items-center gap-2 self-end md:self-center">
            <button
              id="refresh-mysql-media-btn"
              type="button"
              onClick={loadMedia}
              disabled={isLoading}
              className="px-3.5 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-white rounded-xl border border-slate-700 text-xs font-medium transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              title="بارگذاری مجدد از MySQL"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>به‌روزرسانی</span>
            </button>
            <button
              id="goto-upload-subtab-btn"
              type="button"
              onClick={() => setActiveSubTab('upload')}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>بارگذاری رسانه جدید</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3 mt-6 pt-5 border-t border-indigo-900/40">
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-slate-400">کل فایل‌های رسانه‌ای</div>
            <div className="text-xl font-black text-white mt-1">
              {toPersianDigits(stats.total)} <span className="text-xs font-normal text-slate-400">مورد</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-cyan-300 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              <span>تصاویر (WebP/SVG)</span>
            </div>
            <div className="text-xl font-black text-cyan-200 mt-1">
              {toPersianDigits(stats.imagesCount)} <span className="text-xs font-normal text-slate-400">فایل</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-blue-300 flex items-center gap-1">
              <Video className="w-3.5 h-3.5" />
              <span>ویدیوها (MP4/WebM)</span>
            </div>
            <div className="text-xl font-black text-blue-200 mt-1">
              {toPersianDigits(stats.videosCount)} <span className="text-xs font-normal text-slate-400">فایل</span>
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10">
            <div className="text-xs text-emerald-300 flex items-center gap-1">
              <Database className="w-3.5 h-3.5" />
              <span>کل حجم در MySQL</span>
            </div>
            <div className="text-xl font-black text-emerald-200 mt-1 dir-ltr text-right">
              {stats.totalBytesFormatted}
            </div>
          </div>
          <div className="bg-white/5 rounded-xl p-3 border border-white/10 col-span-2 sm:col-span-1">
            <div className="text-xs text-amber-300 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>نرخ بهینه‌سازی پروفایل‌ها</span>
            </div>
            <div className="text-xl font-black text-amber-200 mt-1">
              {toPersianDigits(stats.optimizedPercent)}٪
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          id="subtab-browse-btn"
          type="button"
          onClick={() => setActiveSubTab('browse')}
          className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'browse'
              ? 'border-indigo-600 text-indigo-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>مرور و مدیریت رسانه‌ها ({toPersianDigits(filteredList.length)})</span>
        </button>

        <button
          id="subtab-upload-btn"
          type="button"
          onClick={() => setActiveSubTab('upload')}
          className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'upload'
              ? 'border-indigo-600 text-indigo-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>بارگذاری رسانه در MySQL</span>
        </button>

        <button
          id="subtab-consultant-optimizer-btn"
          type="button"
          onClick={() => setActiveSubTab('consultant_optimizer')}
          className={`pb-3 px-4 text-sm font-bold transition flex items-center gap-2 border-b-2 cursor-pointer ${
            activeSubTab === 'consultant_optimizer'
              ? 'border-indigo-600 text-indigo-600 dark:text-cyan-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>سیستم فشرده‌سازی خودکار تصاویر مشاوران</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: BROWSE MEDIA FILES */}
      {/* ======================================================== */}
      {activeSubTab === 'browse' && (
        <div className="space-y-4">
          {/* Filters & Search Toolbar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-3">
              {/* Search input */}
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="mysql-media-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو بر اساس عنوان، شناسه، مشاور، دسته یا جدول..."
                  className="w-full pl-3 pr-9 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                    filterType === 'all'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  همه ({toPersianDigits(mediaList.length)})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('image')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                    filterType === 'image'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>تصاویر</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('video')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                    filterType === 'video'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>ویدیوها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('consultant')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                    filterType === 'consultant'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>مشاوران</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('logo')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1 cursor-pointer ${
                    filterType === 'logo'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>لوگوها</span>
                </button>
              </div>

              {/* View mode toggle */}
              <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 self-end">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded text-xs transition cursor-pointer ${
                    viewMode === 'grid' ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-cyan-400' : 'text-slate-400'
                  }`}
                  title="نمایش شبکه‌ای"
                >
                  <Layers className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded text-xs transition cursor-pointer ${
                    viewMode === 'table' ? 'bg-slate-200 dark:bg-slate-700 text-indigo-600 dark:text-cyan-400' : 'text-slate-400'
                  }`}
                  title="نمایش جدولی"
                >
                  <Sliders className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Media Items List/Grid */}
          {isLoading ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-3" />
              <p className="text-sm text-slate-500">در حال واکشی فایل‌های رسانه‌ای از دیتابیس MySQL...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
              <ImageIcon className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-200">رسانه‌ای با این مشخصات یافت نشد</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                می‌توانید با استفاده از زبانه «بارگذاری رسانه در MySQL» فایل جدیدی ارسال کنید یا فیلترهای جستجو را بازنشانی فرمایید.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterType('all');
                  }}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400 rounded-xl text-xs font-bold transition hover:bg-indigo-100 cursor-pointer"
                >
                  پاک‌کردن فیلترها
                </button>
                <button
                  type="button"
                  onClick={handleSyncAllAssetsToMySQL}
                  disabled={isSyncingAllAssets}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncingAllAssets ? 'animate-spin' : ''}`} />
                  <span>{isSyncingAllAssets ? 'در حال ثبت در MySQL...' : 'همگام‌سازی و انتقال دارایی‌های سیستم به MySQL'}</span>
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW */
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredList.map((item) => {
                const isVid = item.type === 'video';
                return (
                  <div
                    key={item.id}
                    className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                  >
                    {/* Media Preview Stage */}
                    <div className="relative aspect-video sm:aspect-square bg-slate-100 dark:bg-slate-950 flex items-center justify-center overflow-hidden">
                      {isVid ? (
                        item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-slate-400">
                            <Film className="w-10 h-10 text-indigo-400 mb-1" />
                            <span className="text-[11px] font-mono">ویدیو MP4</span>
                          </div>
                        )
                      ) : (
                        <img
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-contain p-2 transition group-hover:scale-105"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      )}

                      {/* Type Badge */}
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md text-[11px] font-bold bg-black/60 text-white backdrop-blur-xs flex items-center gap-1">
                        {isVid ? <Video className="w-3 h-3 text-cyan-400" /> : <ImageIcon className="w-3 h-3 text-emerald-400" />}
                        <span>{item.mimeType.split('/')[1]?.toUpperCase() || (isVid ? 'MP4' : 'WEBP')}</span>
                      </span>

                      {/* Optimization Status Badge */}
                      {item.isOptimized && (
                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500/90 text-white flex items-center gap-0.5 shadow-xs" title="بهینه‌شده برای لود سریع">
                          <Zap className="w-2.5 h-2.5" />
                          <span>بهینه</span>
                        </span>
                      )}

                      {/* Hover Overlay Buttons */}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="p-2 bg-white text-slate-900 rounded-full hover:bg-slate-100 transition shadow-md cursor-pointer"
                          title="پیش‌نمایش کامل"
                        >
                          {isVid ? <Play className="w-4 h-4 text-indigo-600 fill-indigo-600" /> : <Eye className="w-4 h-4 text-indigo-600" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopyUrl(item)}
                          className="p-2 bg-white text-slate-900 rounded-full hover:bg-slate-100 transition shadow-md cursor-pointer"
                          title="کپی پیوند"
                        >
                          {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-700" />}
                        </button>
                      </div>
                    </div>

                    {/* Metadata Content */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2.5">
                      <div>
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate flex-1" title={item.name}>
                            {item.name}
                          </h4>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono shrink-0">
                            {formatBytes(item.sizeBytes)}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                          <span className="truncate">{item.category}</span>
                          <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">{item.sourceTable}</span>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPreviewItem(item)}
                          className="text-xs font-semibold text-indigo-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>مشاهده</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                          title="حذف دائمی از MySQL"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* TABLE VIEW */
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-sm">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3 w-12">پیش‌نمایش</th>
                    <th className="p-3">عنوان و نام فایل</th>
                    <th className="p-3">نوع / فرمت</th>
                    <th className="p-3">دسته‌بندی</th>
                    <th className="p-3">حجم فایل</th>
                    <th className="p-3">جدول پایگاه داده</th>
                    <th className="p-3">وضعیت بهینگی</th>
                    <th className="p-3 text-center">عملیات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition">
                      <td className="p-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
                          {item.type === 'video' ? (
                            <Video className="w-5 h-5 text-indigo-500" />
                          ) : (
                            <img src={item.url} alt={item.name} className="w-full h-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                          )}
                        </div>
                      </td>
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                        <div>{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.id}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {item.mimeType}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300">{item.category}</td>
                      <td className="p-3 font-mono dir-ltr text-right">{formatBytes(item.sizeBytes)}</td>
                      <td className="p-3 font-mono text-cyan-600 dark:text-cyan-400">{item.sourceTable}</td>
                      <td className="p-3">
                        {item.isOptimized ? (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>بهینه‌شده</span>
                          </span>
                        ) : (
                          <span className="text-amber-500 flex items-center gap-1 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>عادی</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition cursor-pointer"
                            title="مشاهده"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCopyUrl(item)}
                            className="p-1.5 text-slate-500 hover:text-cyan-600 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 rounded-lg transition cursor-pointer"
                            title="کپی آدرس"
                          >
                            {copiedId === item.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => setItemToDelete(item)}
                            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition cursor-pointer"
                            title="حذف از دیتابیس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: UPLOAD NEW MEDIA (IMAGES & VIDEOS) */}
      {/* ======================================================== */}
      {activeSubTab === 'upload' && (
        <form onSubmit={handleUploadSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Main Column: Drag & Drop + Live Preview */}
            <div className="lg:col-span-2 space-y-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileSelect(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:border-indigo-400'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                />

                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-cyan-400 rounded-2xl">
                  {isVideoSelected ? <Video className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    برای انتخاب فایل اینجا کلیک کنید یا فایل را بکشید و رها کنید
                  </p>
                  <p className="text-xs text-slate-400">
                    پشتیبانی از تصاویر (PNG, JPG, WebP, SVG) و ویدیوها (MP4, WebM) تا حداکثر ۵۰ مگابایت
                  </p>
                </div>
              </div>

              {/* Live Preview Stage (Images with side-by-side compression or Video player) */}
              {selectedFile && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-indigo-500" />
                      <span>پیش‌نمایش فایل انتخابی</span>
                    </h4>
                    <span className="text-xs font-mono text-slate-500">
                      {selectedFile.name} ({formatBytes(selectedFile.size)})
                    </span>
                  </div>

                  {isVideoSelected ? (
                    /* Video Preview Player */
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-inner">
                      {filePreviewUrl && (
                        <video
                          src={filePreviewUrl}
                          controls
                          className="w-full h-full object-contain"
                        />
                      )}
                    </div>
                  ) : (
                    /* Image Preview Stage */
                    <div className="space-y-4">
                      {/* If Consultant Auto-Compression is Active, show Comparison */}
                      {compressionResult ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Original */}
                            <div className="bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                              <div className="text-xs font-bold text-slate-500 mb-2 flex items-center justify-between">
                                <span>تصویر اصلی انتخابی</span>
                                <span className="text-rose-500 font-mono">{compressionResult.originalSizeFormatted}</span>
                              </div>
                              <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                                {filePreviewUrl && (
                                  <img
                                    src={filePreviewUrl}
                                    alt="Original"
                                    className="w-full h-full object-cover"
                                    referrerPolicy="no-referrer"
                                  />
                                )}
                              </div>
                            </div>

                            {/* Auto-Compressed WebP */}
                            <div className="bg-emerald-50/50 dark:bg-emerald-950/20 p-3 rounded-xl border border-emerald-300 dark:border-emerald-800">
                              <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center justify-between">
                                <span className="flex items-center gap-1">
                                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                                  <span>فشرده‌سازی خودکار WebP</span>
                                </span>
                                <span className="font-mono text-emerald-600 font-bold">
                                  {compressionResult.compressedSizeFormatted}
                                </span>
                              </div>
                              <div className="aspect-square bg-slate-200 dark:bg-slate-800 rounded-lg overflow-hidden flex items-center justify-center">
                                <img
                                  src={compressionResult.compressedDataUrl}
                                  alt="Compressed"
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              </div>
                            </div>
                          </div>

                          {/* Compression Stats Highlight Box */}
                          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4 rounded-xl shadow-md flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-emerald-100">نتایج بهینه‌سازی سرعت پروفایل</div>
                              <div className="text-base font-black flex items-center gap-2">
                                <span>{compressionResult.speedBoostDescription}</span>
                              </div>
                            </div>
                            <div className="text-left font-mono">
                              <div className="text-2xl font-black">{toPersianDigits(compressionResult.compressionRatioPercent)}٪</div>
                              <div className="text-[10px] text-emerald-200">صرفه‌جویی در حجم</div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="max-w-xs mx-auto aspect-square bg-slate-100 dark:bg-slate-800 rounded-xl overflow-hidden flex items-center justify-center p-2">
                          {filePreviewUrl && (
                            <img
                              src={filePreviewUrl}
                              alt="Preview"
                              className="max-h-full max-w-full object-contain"
                              referrerPolicy="no-referrer"
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column: Category, Metadata & Controls */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <Database className="w-4 h-4 text-cyan-500" />
                  <span>مشخصات ذخیره‌سازی در دیتابیس</span>
                </h4>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    دسته‌بندی و نوع فایل
                  </label>
                  <select
                    id="upload-category-select"
                    value={uploadCategory}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setUploadCategory(cat);
                      if (selectedFile && !isVideoSelected && (cat === 'consultant' || cat === 'team_logo')) {
                        runAutoCompression(selectedFile);
                      }
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="consultant">👤 عکس پرسنلی مشاور (فشرده‌سازی خودکار WebP)</option>
                    <option value="official_logo">🛡️ لوگوی رسمی کانون و موسسه محاش</option>
                    <option value="team_logo">⚡ لوگوی اختصاصی تیم‌ها</option>
                    <option value="video">🎬 ویدیوی گزارش / فعالیت تیم</option>
                    <option value="general">📁 ضمیمه و تصویر عمومی</option>
                  </select>
                </div>

                {/* Conditional Consultant Selector */}
                {uploadCategory === 'consultant' && (
                  <div className="space-y-1.5 bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-200 dark:border-indigo-900/60">
                    <label className="text-xs font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" />
                      <span>انتخاب مشاور برای ثبت عکس</span>
                    </label>
                    <select
                      id="upload-consultant-target-select"
                      value={selectedConsultant}
                      onChange={(e) => setSelectedConsultant(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-indigo-300 dark:border-indigo-800 rounded-xl text-xs font-medium"
                    >
                      {consultants.map((c) => (
                        <option key={c.name} value={c.name}>
                          {c.name} ({c.role})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-indigo-700 dark:text-indigo-300 mt-1">
                      تصویر مشاور مستقیماً در جدول <code className="font-mono">mahash_assets</code> و کش پایدار با وضوح بهینه ذخیره خواهد شد.
                    </p>
                  </div>
                )}

                {/* Conditional Team Selector for videos and team logos */}
                {(uploadCategory === 'video' || uploadCategory === 'team_logo') && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      انتخاب تیم مربوطه
                    </label>
                    <select
                      id="upload-team-target-select"
                      value={selectedTeam}
                      onChange={(e) => setSelectedTeam(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                    >
                      <option value="all">همگانی / سراسری</option>
                      {Object.entries(teams).map(([slug, team]) => (
                        <option key={slug} value={slug}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Title/Name Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    عنوان / نام فایل در پایگاه داده
                  </label>
                  <input
                    id="upload-custom-title-input"
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="مثال: عکس رسمی دکتر نازی عباسیان..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                  />
                </div>

                {/* Compression Tuning Options (only for image) */}
                {uploadCategory === 'consultant' && selectedFile && !isVideoSelected && (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span className="flex items-center gap-1">
                        <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                        <span>تنظیم کیفیت فشرده‌سازی WebP</span>
                      </span>
                      <span className="font-mono text-indigo-600 dark:text-cyan-400">
                        {toPersianDigits(Math.round(compressionQuality * 100))}٪
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.4"
                      max="0.95"
                      step="0.05"
                      value={compressionQuality}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCompressionQuality(val);
                        if (selectedFile) runAutoCompression(selectedFile, val, maxDimension);
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                      <span>حداکثر ابعاد تصویر پروفایل</span>
                      <span className="font-mono text-indigo-600 dark:text-cyan-400">
                        {toPersianDigits(maxDimension)} پیکسل
                      </span>
                    </div>
                    <input
                      type="range"
                      min="200"
                      max="800"
                      step="50"
                      value={maxDimension}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        setMaxDimension(val);
                        if (selectedFile) runAutoCompression(selectedFile, compressionQuality, val);
                      }}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                  </div>
                )}

                {/* Submit Button */}
                <button
                  id="submit-media-upload-btn"
                  type="submit"
                  disabled={isUploading || (!selectedFile && !compressionResult)}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
                >
                  {isUploading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>در حال بارگذاری و ذخیره در MySQL...</span>
                    </>
                  ) : (
                    <>
                      <Database className="w-4 h-4" />
                      <span>بارگذاری و ذخیره قطعی در دیتابیس MySQL</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: CONSULTANT PROFILE AUTO-OPTIMIZER SUITE */}
      {/* ======================================================== */}
      {activeSubTab === 'consultant_optimizer' && (
        <div className="space-y-6">
          {/* Header Info Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-cyan-500/10 border border-amber-400/30 rounded-2xl p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 font-bold text-base">
                  <Sparkles className="w-5 h-5" />
                  <span>سیستم بهینه‌سازی و فشرده‌سازی خودکار تصاویر مشاوران</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                  تصاویر خام دوربین یا گوشی‌های هوشمند معمولاً ۲ تا ۸ مگابایت حجم دارند. این سامانه با تبدیل خودکار به فرمت{' '}
                  <strong className="text-indigo-600 dark:text-cyan-400 font-mono">WebP</strong> و کاهش ابعاد به مقیاس بهینه آواتار (۴۲۰ پیکسل)،{' '}
                  حجم تصاویر را تا <strong>۹۸٪ کاهش</strong> داده و زمان بارگذاری صفحه پروفایل‌ها را تا <strong>۱۰ برابر سریع‌تر</strong> می‌کند.
                </p>
              </div>

              <button
                id="batch-optimize-consultants-btn"
                type="button"
                disabled={isBatchOptimizing}
                onClick={handleBatchOptimizeConsultants}
                className="px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isBatchOptimizing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>در حال بهینه‌سازی دسته‌ای...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>فشرده‌سازی خودکار کلیه تصاویر مشاوران (۱ کلیک)</span>
                  </>
                )}
              </button>
            </div>

            {/* Batch Progress Bar if active */}
            {batchProgress && (
              <div className="mt-4 pt-4 border-t border-amber-300/40 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-200">
                  <span>در حال بهینه‌سازی تصویر: <strong>{batchProgress.name}</strong></span>
                  <span className="font-mono">{toPersianDigits(batchProgress.current)} از {toPersianDigits(batchProgress.total)}</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-amber-500 to-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Consultants Optimization Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {consultants.map((consultant) => {
              const currentPhoto = getConsultantPhoto(consultant.name) || consultant.image;
              const isOptimized = currentPhoto ? isConsultantPhotoOptimized(currentPhoto) : false;
              const photoSize = currentPhoto ? Math.round((currentPhoto.length * 3) / 4) : 0;

              return (
                <div
                  key={consultant.name}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs flex items-center gap-4"
                >
                  {/* Avatar */}
                  <div className="relative w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                    {currentPhoto ? (
                      <img
                        src={currentPhoto}
                        alt={consultant.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-400 m-auto mt-4" />
                    )}

                    {isOptimized && (
                      <span className="absolute bottom-0 inset-x-0 bg-emerald-500 text-white text-[9px] font-bold text-center py-0.5">
                        WebP
                      </span>
                    )}
                  </div>

                  {/* Info & Status */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                      {consultant.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">{consultant.role}</p>

                    <div className="flex items-center gap-2 pt-1">
                      {isOptimized ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>بهینه‌شده ({formatBytes(photoSize)})</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>نیاز به فشرده‌سازی ({formatBytes(photoSize)})</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Single Item Optimization Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      if (!currentPhoto) return;
                      try {
                        const comp = await saveConsultantPhotoWithAutoCompression(consultant.name, currentPhoto, {
                          maxWidth: 420,
                          maxHeight: 420,
                          quality: 0.82
                        });
                        success(`تصویر ${consultant.name} بهینه‌سازی شد: ${comp.compressedSizeFormatted} (${toPersianDigits(comp.compressionRatioPercent)}٪ صرفه‌جویی)`);
                        await loadMedia();
                        if (onRefreshAll) onRefreshAll();
                      } catch (err: any) {
                        error('خطا در فشرده‌سازی: ' + err?.message);
                      }
                    }}
                    className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 rounded-xl transition cursor-pointer shrink-0"
                    title="فشرده‌سازی این تصویر"
                  >
                    <Zap className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ======================================================== */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="p-2 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                تایید حذف قطعی رسانه از MySQL
              </h3>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا از حذف رسانه «<strong>{itemToDelete.name}</strong>» مطمئن هستید؟ این عملیات فایل را از جدول{' '}
              <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded font-mono">{itemToDelete.sourceTable}</code> و فضای ذخیره‌سازی سرور برای همیشه پاک خواهد کرد.
            </p>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl text-xs space-y-1 font-mono">
              <div className="text-slate-500">شناسه: {itemToDelete.id}</div>
              <div className="text-slate-500">حجم: {formatBytes(itemToDelete.sizeBytes)}</div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال حذف...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>بله، حذف شود</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PREVIEW LIGHTBOX MODAL */}
      {/* ======================================================== */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full p-4 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{previewItem.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {previewItem.sourceTable} • {formatBytes(previewItem.sizeBytes)} • {previewItem.mimeType}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Media Player or Zoomable Image */}
            <div className="max-h-[60vh] overflow-hidden rounded-xl bg-black/90 flex items-center justify-center">
              {previewItem.type === 'video' ? (
                <video
                  src={previewItem.url}
                  controls
                  autoPlay
                  className="max-h-[55vh] w-full object-contain"
                />
              ) : (
                <img
                  src={previewItem.url}
                  alt={previewItem.name}
                  className="max-h-[55vh] max-w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              )}
            </div>

            {/* Footer Action */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400 font-mono truncate max-w-md">{previewItem.url}</span>
              <button
                type="button"
                onClick={() => handleCopyUrl(previewItem)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                {copiedId === previewItem.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>کپی آدرس فایل</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
