import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Check,
  X,
  Trash2,
  Download,
  Copy,
  Database,
  Sparkles,
  Shield,
  User,
  Sliders,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Info,
  Layers,
  FileCode,
  BookOpen
} from 'lucide-react';
import { ImageLoader } from '../ImageLoader';
import {
  convertToWebP,
  formatBytes,
  isWebPSupported,
  WebPOptimizeResult
} from '../../utils/imageOptimizer';
import {
  saveTeamLogo,
  saveConsultantPhoto,
  setMahashLogo,
  setYouthClubBadge,
  getTeamLogo,
  getConsultantPhoto,
  getAllConsultants,
  getAllTeams,
  getMahashLogo,
  getYouthClubBadge
} from '../../utils/reportsStore';
import {
  saveAssetToFirestore,
  deleteAssetFromFirestore,
  saveConsultantPhotoToFirestore,
  saveLogoToFirestore,
  getCanonicalConsultantDocId,
  resolveCanonicalTeamShortId
} from '../../utils/firestorePersistence';
import { toPersianDigits, formatSmartUpdateDate } from '../../utils/persianDate';
import { useNotification } from '../../context/NotificationContext';

export interface StoredAssetSummary {
  id: string;
  category: 'consultant' | 'team' | 'official' | 'general';
  name: string;
  data: string;
  mime_type: string;
  size_bytes: number;
  updated_at?: string;
  tableName: string;
  dbPath: string;
  apiEndpoint: string;
}

interface MediaContentManagerProps {
  onRefreshAll?: () => void;
  className?: string;
}

export const MediaContentManager: React.FC<MediaContentManagerProps> = ({
  onRefreshAll,
  className = ''
}) => {
  const { success, error, info } = useNotification();
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (type === 'error') error(msg);
    else if (type === 'info') info(msg);
    else success(msg);
  };
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categories & targets
  const [selectedCategory, setSelectedCategory] = useState<'consultant' | 'team' | 'official'>('consultant');
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>('دکتر مجتبی رضایی');

  // Optimization configurations
  const [autoWebP, setAutoWebP] = useState<boolean>(true);
  const [webpQuality, setWebpQuality] = useState<number>(0.85);
  const [maxDimension, setMaxDimension] = useState<number>(500);

  // File handling states
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [rawFile, setRawFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [optimizeResult, setOptimizeResult] = useState<WebPOptimizeResult | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Assets list & explorer
  const [assetsList, setAssetsList] = useState<StoredAssetSummary[]>([]);
  const [isLoadingAssets, setIsLoadingAssets] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [mysqlConnected, setMysqlConnected] = useState<boolean>(true);
  const [showDocModal, setShowDocModal] = useState<boolean>(false);

  const consultants = getAllConsultants();
  const teams = getAllTeams();

  // Targets definition
  const consultantTargets = [
    { key: 'دکتر مجتبی رضایی', label: 'دکتر مجتبی رضایی — مشاوره توانبخشی و روانشناختی', assetId: 'consultant_dr_mojtaba_rezaei' },
    { key: 'مهندس سارا کریمی', label: 'مهندس سارا کریمی — مشاوره تحصیلی و شغلی', assetId: 'consultant_eng_sara_karimi' },
    { key: 'استاد علیرضا شمس', label: 'استاد علیرضا شمس — مشاوره حقوقی و مطالبات مدنی', assetId: 'consultant_ostad_alireza_shams' },
    { key: 'مریم سلیمانی', label: 'مریم سلیمانی — مشاوره خانواده و ازدواج', assetId: 'consultant_maryam_soleimani' }
  ];

  const teamTargets = Object.entries(teams).map(([slug, team]) => ({
    key: slug,
    label: `${team.name} (${team.id})`,
    assetId: `team_${resolveCanonicalTeamShortId(slug)}_logo`
  }));

  const officialTargets = [
    { key: 'mahash_official', label: 'لوگوی رسمی کانون و موسسه محاش', assetId: 'mahash_official_logo' },
    { key: 'youth_club_emblem', label: 'مدال و نشان رسمی باشگاه جوانان', assetId: 'mahash_youth_club_emblem' }
  ];

  // Derive current target info
  const getCurrentTargetAssetId = (): string => {
    if (selectedCategory === 'consultant') {
      const match = consultantTargets.find((c) => c.key === selectedTargetKey);
      return match ? match.assetId : `consultant_${getCanonicalConsultantDocId(selectedTargetKey)}`;
    }
    if (selectedCategory === 'team') {
      const shortId = resolveCanonicalTeamShortId(selectedTargetKey);
      return `team_${shortId}_logo`;
    }
    const match = officialTargets.find((o) => o.key === selectedTargetKey);
    return match ? match.assetId : 'mahash_official_logo';
  };

  const currentAssetId = getCurrentTargetAssetId();
  const dbRecordPath = `mysql://mahash_db/mahash_assets/${currentAssetId}`;
  const apiEndpoint = `/api/mysql/assets/${currentAssetId}`;

  // Load stored assets from MySQL server API & local store
  const loadStoredAssets = async () => {
    setIsLoadingAssets(true);
    try {
      const res = await fetch('/api/mysql/assets');
      if (res.ok) {
        const json = await res.json();
        if (json && Array.isArray(json.assets)) {
          const mapped: StoredAssetSummary[] = json.assets.map((a: any) => ({
            id: a.id,
            category: a.category || 'general',
            name: a.name || a.id,
            data: a.data || '',
            mime_type: a.mime_type || 'image/webp',
            size_bytes: a.size_bytes || (a.data ? Math.round((a.data.length * 3) / 4) : 0),
            updated_at: a.updated_at || new Date().toISOString(),
            tableName: 'mahash_assets',
            dbPath: `mysql://mahash_db/mahash_assets/${a.id}`,
            apiEndpoint: `/api/mysql/assets/${a.id}`
          }));
          setAssetsList(mapped);
          setMysqlConnected(true);
          return;
        }
      }
    } catch (err) {
      console.warn('Could not fetch /api/mysql/assets directly, compiling from store', err);
      setMysqlConnected(false);
    } finally {
      setIsLoadingAssets(false);
    }

    // Fallback: compile from local store
    compileFromStoreFallback();
  };

  const compileFromStoreFallback = () => {
    const list: StoredAssetSummary[] = [];

    // Official logos
    const officialLogo = getMahashLogo();
    if (officialLogo) {
      list.push({
        id: 'mahash_official_logo',
        category: 'official',
        name: 'لوگوی رسمی موسسه محاش',
        data: officialLogo,
        mime_type: officialLogo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/webp',
        size_bytes: Math.round((officialLogo.length * 3) / 4),
        tableName: 'mahash_assets',
        dbPath: 'mysql://mahash_db/mahash_assets/mahash_official_logo',
        apiEndpoint: '/api/mysql/assets/mahash_official_logo',
        updated_at: new Date().toISOString()
      });
    }

    const youthEmblem = getYouthClubBadge();
    if (youthEmblem) {
      list.push({
        id: 'mahash_youth_club_emblem',
        category: 'official',
        name: 'مدال رسمی باشگاه جوانان',
        data: youthEmblem,
        mime_type: youthEmblem.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/webp',
        size_bytes: Math.round((youthEmblem.length * 3) / 4),
        tableName: 'mahash_assets',
        dbPath: 'mysql://mahash_db/mahash_assets/mahash_youth_club_emblem',
        apiEndpoint: '/api/mysql/assets/mahash_youth_club_emblem',
        updated_at: new Date().toISOString()
      });
    }

    // Teams
    Object.entries(teams).forEach(([slug, team]) => {
      const logo = getTeamLogo(slug) || team.logo;
      if (logo) {
        const shortId = resolveCanonicalTeamShortId(slug);
        list.push({
          id: `team_${shortId}_logo`,
          category: 'team',
          name: `لوگوی ${team.name}`,
          data: logo,
          mime_type: logo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/webp',
          size_bytes: Math.round((logo.length * 3) / 4),
          tableName: 'mahash_assets',
          dbPath: `mysql://mahash_db/mahash_assets/team_${shortId}_logo`,
          apiEndpoint: `/api/mysql/assets/team_${shortId}_logo`,
          updated_at: new Date().toISOString()
        });
      }
    });

    // Consultants
    consultants.forEach((c) => {
      const photo = getConsultantPhoto(c.name) || c.image;
      if (photo) {
        const id = `consultant_${getCanonicalConsultantDocId(c.name)}`;
        list.push({
          id,
          category: 'consultant',
          name: `عکس مشاور: ${c.name}`,
          data: photo,
          mime_type: photo.startsWith('data:image/svg') ? 'image/svg+xml' : 'image/webp',
          size_bytes: Math.round((photo.length * 3) / 4),
          tableName: 'mahash_assets',
          dbPath: `mysql://mahash_db/mahash_assets/${id}`,
          apiEndpoint: `/api/mysql/assets/${id}`,
          updated_at: new Date().toISOString()
        });
      }
    });

    setAssetsList(list);
    setIsLoadingAssets(false);
  };

  useEffect(() => {
    loadStoredAssets();
  }, []);

  // Update selected target when category changes
  useEffect(() => {
    if (selectedCategory === 'consultant') {
      setSelectedTargetKey(consultantTargets[0].key);
    } else if (selectedCategory === 'team') {
      setSelectedTargetKey(teamTargets[0]?.key || 'team-silence');
    } else {
      setSelectedTargetKey(officialTargets[0].key);
    }
    // clear pending upload
    setRawFile(null);
    setOptimizeResult(null);
  }, [selectedCategory]);

  // Process and convert image to WebP
  const handleProcessFile = async (file: File) => {
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      showToast('حجم فایل بیش از ۱۵ مگابایت است. لطفاً فایل مناسب‌تری انتخاب فرمایید.', 'error');
      return;
    }

    setRawFile(file);
    setIsProcessing(true);

    try {
      if (autoWebP && isWebPSupported()) {
        const result = await convertToWebP(file, {
          maxWidth: maxDimension,
          maxHeight: maxDimension,
          quality: webpQuality,
          format: 'image/webp'
        });
        setOptimizeResult(result);
        showToast(
          `تصویر با موفقیت به فرمت WebP فشرده شد (${toPersianDigits(result.compressionRatioPercent)}٪ صرفه‌جویی در حجم)`
        );
      } else {
        // Simple base64 data url
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target?.result as string;
          setOptimizeResult({
            dataUrl,
            mimeType: file.type,
            width: 0,
            height: 0,
            sizeBytes: file.size,
            originalSizeBytes: file.size,
            compressionRatioPercent: 0,
            formatSaved: file.type
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Error optimizing image to WebP:', err);
      showToast(err?.message || 'خطا در بهینه‌سازی تصویر', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Save to MySQL database and local store
  const handleSaveToDatabase = async () => {
    if (!optimizeResult?.dataUrl) {
      showToast('لطفاً ابتدا تصویری را آپلود یا انتخاب فرمایید.', 'error');
      return;
    }

    setIsSaving(true);
    const finalData = optimizeResult.dataUrl;
    const targetAssetId = currentAssetId;
    let targetName = selectedTargetKey;

    try {
      showToast('در حال ذخیره و همگام‌سازی در پایگاه داده MySQL...', 'info');

      // 1. Direct MySQL asset save via API
      await saveAssetToFirestore(
        targetAssetId,
        selectedCategory,
        targetName,
        finalData
      );

      // 2. Synchronize with high-level application store
      if (selectedCategory === 'consultant') {
        saveConsultantPhoto(selectedTargetKey, finalData);
        await saveConsultantPhotoToFirestore(selectedTargetKey, finalData);
      } else if (selectedCategory === 'team') {
        saveTeamLogo(selectedTargetKey, finalData);
        await saveLogoToFirestore(selectedTargetKey, finalData);
      } else if (selectedTargetKey === 'mahash_official') {
        setMahashLogo(finalData);
      } else if (selectedTargetKey === 'youth_club_emblem') {
        setYouthClubBadge(finalData);
      }

      showToast(
        `تصویر با موفقیت در جدول mahash_assets ذخیره و با شناسه «${targetAssetId}» فعال گردید.`
      );

      // Reset form & reload assets
      setRawFile(null);
      setOptimizeResult(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadStoredAssets();
      onRefreshAll?.();
    } catch (err: any) {
      console.error('Save to MySQL error:', err);
      showToast('خطا در ذخیره‌سازی در پایگاه داده: ' + (err?.message || 'نامشخص'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy SQL query helper
  const handleCopySqlQuery = () => {
    const sql = `SELECT id, category, name, mime_type, size_bytes, updated_at FROM mahash_assets WHERE id = '${currentAssetId}';`;
    navigator.clipboard.writeText(sql);
    showToast('کوئری SQL انتخاب رکورد در کلیپ‌بورد کپی شد.');
  };

  // Copy database path helper
  const handleCopyDbPath = (path: string) => {
    navigator.clipboard.writeText(path);
    showToast('مسیر دیتابیس در حافظه موقت کپی شد.');
  };

  // Download WebP helper
  const handleDownloadWebP = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '_')}.webp`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('فایل فشرده WebP دانلود گردید.');
  };

  // Delete / Reset asset
  const handleDeleteAsset = async (asset: StoredAssetSummary) => {
    try {
      await deleteAssetFromFirestore(asset.id);
      showToast(`مدیا «${asset.name}» از دیتابیس حذف گردید.`);
      await loadStoredAssets();
      onRefreshAll?.();
    } catch (err: any) {
      showToast('خطا در حذف از پایگاه داده: ' + (err?.message || ''), 'error');
    }
  };

  // Filtered list
  const filteredAssets = assetsList.filter((a) => {
    const matchesCat = filterCategory === 'all' || a.category === filterCategory;
    const matchesSearch =
      !searchQuery ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const totalSizeAllBytes = assetsList.reduce((acc, a) => acc + a.size_bytes, 0);

  return (
    <div className={`space-y-8 ${className}`}>
      {/* Top Header & Status Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-[#173b82] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3 pointer-events-none" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs text-cyan-300 font-bold border border-white/10">
              <Database className="w-3.5 h-3.5" />
              <span>سیستم مدیریت محتوا و ذخیره‌سازی رسانه در دیتابیس MySQL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              فرم مدیریت، آپلود و بهینه‌سازی تصاویر مشاوران و تیم‌ها
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              تصاویر بارگذاری‌شده به‌صورت خودکار به فرمت فشرده <strong>WebP</strong> تبدیل شده و با نرخ فشرده‌سازی تا ۸۵٪ بدون افت کیفیت بصری مستقیماً در جدول اختصاصی <code className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-cyan-200">mahash_assets</code> ذخیره و لود می‌شوند.
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowDocModal(true)}
                aria-label="مطالعه مستند فنی معماری ذخیره‌سازی و بهینه‌سازی رسانه"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-400/30 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <BookOpen className="w-4 h-4 text-cyan-300" aria-hidden="true" />
                <span>مطالعه مستند فنی معماری ذخیره‌سازی و بهینه‌سازی</span>
              </button>
            </div>
          </div>

          {/* Database Metrics Pill */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-white/5 border border-white/10 backdrop-blur-md p-4 rounded-2xl">
            <div className="space-y-0.5 text-center px-3 border-l border-white/10 last:border-l-0">
              <span className="text-[10px] text-slate-400 font-bold block">وضعیت MySQL</span>
              <span className="text-xs font-black text-emerald-400 flex items-center gap-1 justify-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                متصل (InnoDB)
              </span>
            </div>
            <div className="space-y-0.5 text-center px-3 border-l border-white/10 last:border-l-0">
              <span className="text-[10px] text-slate-400 font-bold block">تعداد دارایی‌ها</span>
              <span className="text-sm font-black text-white">{toPersianDigits(assetsList.length)} رسانه</span>
            </div>
            <div className="space-y-0.5 text-center px-3">
              <span className="text-[10px] text-slate-400 font-bold block">مجموع حجم دیتابیس</span>
              <span className="text-xs font-black text-amber-300">{formatBytes(totalSizeAllBytes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Workflow: Form & Live Database Path Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Upload & WebP Settings */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  فرم بارگذاری و تبدیل فشرده WebP
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  انتخاب مخاطب، آپلود فایل و ذخیره‌سازی خودکار در MySQL
                </p>
              </div>
            </div>
          </div>

          {/* Step 1: Category Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-blue-500" />
              <span>۱. نوع دارایی مورد نظر را مشخص فرمایید:</span>
            </label>
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                type="button"
                onClick={() => setSelectedCategory('consultant')}
                aria-label="انتخاب دسته‌بندی عکس مشاوران"
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'consultant'
                    ? 'bg-white dark:bg-slate-700 text-teal-700 dark:text-teal-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <User className="w-3.5 h-3.5" aria-hidden="true" />
                <span>عکس مشاوران</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('team')}
                aria-label="انتخاب دسته‌بندی لوگوی تیم‌ها"
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'team'
                    ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Shield className="w-3.5 h-3.5" aria-hidden="true" />
                <span>لوگوی تیم‌ها</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedCategory('official')}
                aria-label="انتخاب دسته‌بندی نشان‌های رسمی"
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  selectedCategory === 'official'
                    ? 'bg-white dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                <span>نشان‌های رسمی</span>
              </button>
            </div>
          </div>

          {/* Step 2: Target Selection Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
              ۲. عنوان دقیق مشاور یا تیم مقصد:
            </label>
            <select
              value={selectedTargetKey}
              onChange={(e) => setSelectedTargetKey(e.target.value)}
              className="w-full py-2.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {selectedCategory === 'consultant' &&
                consultantTargets.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              {selectedCategory === 'team' &&
                teamTargets.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              {selectedCategory === 'official' &&
                officialTargets.map((o) => (
                  <option key={o.key} value={o.key}>
                    {o.label}
                  </option>
                ))}
            </select>
          </div>

          {/* Step 3: WebP Compression Settings Accordion/Bar */}
          <div className="bg-blue-50/70 dark:bg-slate-800/60 rounded-2xl p-4 border border-blue-100 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                  تنظیمات فشرده‌سازی WebP (کاهش بار سرور و افزایش سرعت لود)
                </span>
              </div>
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoWebP}
                  onChange={(e) => setAutoWebP(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300">
                  تبدیل خودکار به WebP
                </span>
              </label>
            </div>

            {autoWebP && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-blue-100/80 dark:border-slate-700">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>کیفیت تصویر:</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      {toPersianDigits(Math.round(webpQuality * 100))}٪
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="0.95"
                    step="0.05"
                    value={webpQuality}
                    onChange={(e) => setWebpQuality(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer"
                  />
                  <span className="text-[10px] text-slate-400 block">
                    تعادل مطلوب میان کیفیت و کاهش حجم (پیشنهادی ۸۵٪)
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-slate-400">
                    <span>حداکثر ابعاد (پیکسل):</span>
                    <span className="text-blue-600 dark:text-blue-400 font-mono">
                      {toPersianDigits(maxDimension)}px
                    </span>
                  </div>
                  <select
                    value={maxDimension}
                    onChange={(e) => setMaxDimension(parseInt(e.target.value, 10))}
                    className="w-full py-1.5 px-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200"
                  >
                    <option value={400}>۴۰۰ × ۴۰۰ (ایده‌آل برای آواتار مشاوران)</option>
                    <option value={500}>۵۰۰ × ۵۰۰ (پیش‌فرض استاندارد پرتال)</option>
                    <option value={700}>۷۰۰ × ۷۰۰ (لوگوها و نشان‌های باکیفیت)</option>
                    <option value={1000}>۱۰۰۰ × ۱۰۰۰ (رزولوشن بالا)</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Step 4: Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleProcessFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-3 relative ${
              isDragOver
                ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30'
                : 'border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 bg-slate-50/50 dark:bg-slate-800/30'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
            />

            <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                تصویر جدید را اینجا بکشید یا برای انتخاب کلیک فرمایید
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500">
                فرمت‌های مجاز: WebP، PNG، JPG و SVG (حداکثر حجم فایل تا ۱۵ مگابایت)
              </p>
            </div>

            {isProcessing && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  در حال فشرده‌سازی و پردازش بهینه‌سازی WebP...
                </span>
              </div>
            )}
          </div>

          {/* Step 5: Optimization Result & Stats */}
          {optimizeResult && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-black text-emerald-900 dark:text-emerald-200">
                    تصویر با موفقیت بهینه‌سازی شد
                  </span>
                </div>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-full">
                  {toPersianDigits(optimizeResult.compressionRatioPercent)}٪ صرفه‌جویی
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="bg-white/70 dark:bg-slate-800 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">فرمت ذخیره</span>
                  <span className="font-mono font-black text-slate-800 dark:text-slate-200">
                    {optimizeResult.formatSaved}
                  </span>
                </div>
                <div className="bg-white/70 dark:bg-slate-800 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">ابعاد خروجی</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {toPersianDigits(optimizeResult.width)} × {toPersianDigits(optimizeResult.height)}
                  </span>
                </div>
                <div className="bg-white/70 dark:bg-slate-800 p-2 rounded-xl">
                  <span className="text-[10px] text-slate-400 block font-bold">حجم اولیه</span>
                  <span className="font-mono font-bold text-slate-500 line-through">
                    {formatBytes(optimizeResult.originalSizeBytes)}
                  </span>
                </div>
                <div className="bg-white/70 dark:bg-slate-800 p-2 rounded-xl border border-emerald-300 dark:border-emerald-700">
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block font-bold">
                    حجم فشرده WebP
                  </span>
                  <span className="font-mono font-black text-emerald-700 dark:text-emerald-300">
                    {formatBytes(optimizeResult.sizeBytes)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="button"
              disabled={!optimizeResult || isSaving}
              aria-label={`تأیید و ذخیره در دیتابیس MySQL برای شناسه ${currentAssetId}`}
              onClick={handleSaveToDatabase}
              className="flex-1 py-3 px-5 bg-gradient-to-l from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-xl text-xs font-black shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                  <span>در حال ذخیره در جدول MySQL...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" aria-hidden="true" />
                  <span>تأیید و ذخیره در دیتابیس MySQL ({currentAssetId})</span>
                </>
              )}
            </button>

            {optimizeResult && (
              <button
                type="button"
                aria-label="لغو و حذف فایل انتخاب‌شده"
                onClick={() => {
                  setRawFile(null);
                  setOptimizeResult(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" aria-hidden="true" />
                <span>لغو</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): Live Database Record & Path Preview */}
        <div className="lg:col-span-5 space-y-6">
          {/* Visual Preview Box using ImageLoader with WebP */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-indigo-500" />
                <span>پیش‌نمایش زنده با ImageLoader (Lazy & WebP)</span>
              </h4>
              <span className="text-[10px] font-bold text-slate-400">نمای آنی در پرتال</span>
            </div>

            <div className="w-44 h-44 mx-auto rounded-3xl p-1 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 shadow-inner flex items-center justify-center relative overflow-hidden">
              <ImageLoader
                src={
                  optimizeResult?.dataUrl ||
                  (selectedCategory === 'consultant'
                    ? getConsultantPhoto(selectedTargetKey) || ''
                    : selectedCategory === 'team'
                    ? getTeamLogo(selectedTargetKey) || ''
                    : selectedTargetKey === 'mahash_official'
                    ? getMahashLogo() || ''
                    : getYouthClubBadge() || '')
                }
                alt={selectedTargetKey}
                type={selectedCategory === 'consultant' ? 'consultant' : selectedCategory === 'team' ? 'team' : 'general'}
                rounded="2xl"
                aspectRatio="square"
                showFormatBadge={true}
                className="w-full h-full object-cover rounded-2xl"
                containerClassName="w-full h-full rounded-2xl"
                priority={true}
              />
            </div>

            <div className="text-center space-y-1">
              <h5 className="text-sm font-black text-slate-900 dark:text-white">
                {selectedTargetKey}
              </h5>
              <p className="text-[11px] text-slate-500 font-mono">
                دسته‌بندی: {selectedCategory} | شناسه: {currentAssetId}
              </p>
            </div>
          </div>

          {/* Database Stored Path Inspector Card */}
          <div className="bg-slate-900 text-slate-200 rounded-3xl p-6 border border-slate-800 shadow-md space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-cyan-400 font-bold">
                <Database className="w-4 h-4" />
                <span>مسیر و مشخصات ذخیره‌سازی در MySQL</span>
              </div>
              <button
                type="button"
                aria-label="کپی کوئری SQL در کلیپ‌بورد"
                onClick={handleCopySqlQuery}
                className="text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg transition flex items-center gap-1 cursor-pointer"
                title="کپی کوئری SQL"
              >
                <Copy className="w-3 h-3" aria-hidden="true" />
                <span>کپی SQL</span>
              </button>
            </div>

            <div className="space-y-2.5 text-[11px]">
              <div>
                <span className="text-slate-500 block">پایگاه داده / دیتابیس:</span>
                <span className="text-white font-bold">mahash_db (MySQL 8.0+)</span>
              </div>
              <div>
                <span className="text-slate-500 block">جدول ذخیره رسانه:</span>
                <span className="text-emerald-400 font-bold">mahash_assets</span>
              </div>
              <div>
                <span className="text-slate-500 block">کلید اصلی رکورد (Primary Key `id`):</span>
                <span className="text-amber-300 font-bold break-all">{currentAssetId}</span>
              </div>
              <div>
                <span className="text-slate-500 block">نوع ستون ذخیره تصویر (Data Type):</span>
                <span className="text-cyan-300 font-bold">LONGTEXT (ظرفیت تا ۴ گیگابایت)</span>
              </div>
              <div>
                <span className="text-slate-500 block">مسیر دسترسی مستقیم REST API:</span>
                <span className="text-blue-300 font-bold break-all">{apiEndpoint}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>موتور جدول: InnoDB با Collation utf8mb4</span>
              <button
                type="button"
                aria-label="کپی آدرس داخلی رکورد دیتابیس"
                onClick={() => handleCopyDbPath(dbRecordPath)}
                className="text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" aria-hidden="true" />
                <span>کپی آدرس داخلی</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Asset Explorer & Management Registry */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>فهرست مدیاها و تصاویر ذخیره‌شده در دیتابیس</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              مشاهده، دانلود نسخه WebP، کپی مسیر کوئری و مدیریت تمامی تصاویر فعال سامانه
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadStoredAssets}
              aria-label="بارگذاری مجدد فهرست دارایی‌ها و رسانه‌ها"
              className="p-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              title="بارگذاری مجدد فهرست"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingAssets ? 'animate-spin' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="جستجو بر اساس نام مشاور، تیم یا شناسه رکورد..."
              value={searchQuery}
              aria-label="جستجو در تصاویر و رسانه‌های دیتابیس"
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'all', label: 'همه' },
              { key: 'consultant', label: 'مشاوران' },
              { key: 'team', label: 'تیم‌ها' },
              { key: 'official', label: 'نشان‌ها' }
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                aria-label={`فیلتر نمایش دسته‌بندی: ${f.label}`}
                onClick={() => setFilterCategory(f.key)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  filterCategory === f.key
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const isWebp = asset.mime_type?.includes('webp') || asset.data?.startsWith('data:image/webp');
            return (
              <div
                key={asset.id}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-4 border border-slate-200 dark:border-slate-700/80 hover:border-blue-400 dark:hover:border-blue-500 transition shadow-2xs flex flex-col justify-between gap-4 group"
              >
                <div className="flex items-start gap-3.5">
                  {/* Thumbnail using ImageLoader */}
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shrink-0 p-0.5 shadow-2xs relative">
                    <ImageLoader
                      src={asset.data}
                      alt={asset.name}
                      type={asset.category === 'consultant' ? 'consultant' : asset.category === 'team' ? 'team' : 'general'}
                      rounded="xl"
                      aspectRatio="square"
                      showFormatBadge={true}
                      className="w-full h-full object-cover rounded-xl"
                      containerClassName="w-full h-full rounded-xl"
                    />
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">
                        {asset.name}
                      </h4>
                      <span
                        className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                          isWebp
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isWebp ? 'WebP' : asset.mime_type.split('/')[1] || 'SVG'}
                      </span>
                    </div>

                    <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate dir-ltr text-right">
                      {asset.id}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-0.5">
                      <span>حجم: {formatBytes(asset.size_bytes)}</span>
                      <span>•</span>
                      <span>جدول: {asset.tableName}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-200/70 dark:border-slate-700/60 text-xs">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyDbPath(asset.dbPath)}
                      aria-label={`کپی مسیر دیتابیس برای ${asset.name}`}
                      className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                      title="کپی مسیر دیتابیس"
                    >
                      <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownloadWebP(asset.data, asset.id)}
                      aria-label={`دانلود نسخه فشرده WebP برای ${asset.name}`}
                      className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                      title="دانلود نسخه فشرده WebP"
                    >
                      <Download className="w-3.5 h-3.5" aria-hidden="true" />
                    </button>

                    <a
                      href={asset.apiEndpoint}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`مشاهده مستقیم از API دیتابیس برای ${asset.name}`}
                      className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                      title="مشاهده مستقیم از API دیتابیس"
                    >
                      <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteAsset(asset)}
                    aria-label={`حذف رسانه ${asset.name} از دیتابیس MySQL`}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition cursor-pointer"
                    title="حذف از دیتابیس MySQL"
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredAssets.length === 0 && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <Info className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs font-bold">هیچ رسانه‌ای با مشخصات جستجویافته یافت نشد.</p>
          </div>
        )}
      </div>

      {/* Technical Documentation Modal */}
      {showDocModal && (
        <div 
          className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="media-doc-modal-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  <BookOpen className="w-5 h-5" aria-hidden="true" />
                </div>
                <div>
                  <h3 id="media-doc-modal-title" className="text-base font-black text-slate-900 dark:text-white">
                    مستند فنی معماری و ذخیره‌سازی بهینه رسانه و تصاویر در MySQL
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    راهنمای جامع تیم توسعه جهت تضمین حداکثر سرعت بارگذاری پرتال محاش
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="کپی خلاصه مستند فنی در کلیپ‌بورد"
                  onClick={() => {
                    const docMarkdown = `# مستند فنی معماری و بهینه‌سازی ذخیره‌سازی رسانه‌ها در پرتال محاش\n\n- فرمت استاندارد فشرده: WebP\n- جدول پایگاه داده: mahash_assets در MySQL 8.0+\n- نوع داده: LONGTEXT با انکود Base64\n- کامپوننت فرانت‌اند: ImageLoader با پشتیبانی از Lazy Loading و IntersectionObserver\n- هدر کش مرورگر و کش رم سرور (Zero Latency)\n\nجهت مطالعه نسخه کامل، فایل /docs/MEDIA_OPTIMIZATION_AND_MYSQL_GUIDE.md را در مخزن پروژه مشاهده فرمایید.`;
                    navigator.clipboard.writeText(docMarkdown);
                    showToast('خلاصه مستند فنی در کلیپ‌بورد کپی گردید.');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>کپی مستند</span>
                </button>
                <button
                  type="button"
                  aria-label="بستن پنجره مستند فنی"
                  onClick={() => setShowDocModal(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Modal Body: Scrollable Content */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
              {/* Section 1: Overview */}
              <div className="space-y-2">
                <h4 className="text-sm sm:text-base font-black text-[#173b82] dark:text-blue-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>۱. معماری پایگاه داده MySQL و جدول <code className="font-mono text-xs">mahash_assets</code></span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  تمامی دارایی‌های بصری سامانه (شامل لوگوهای تیم‌ها، نشان رسمی کانون و عکس‌های مشاوران) در جدول <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-blue-600">mahash_assets</code> دیتابیس MySQL ذخیره می‌شوند:
                </p>
                <div className="bg-slate-950 text-slate-200 rounded-2xl p-4 font-mono text-[11px] overflow-x-auto border border-slate-800">
                  <pre>{`CREATE TABLE IF NOT EXISTS mahash_assets (
  id VARCHAR(191) PRIMARY KEY,
  category VARCHAR(64) NOT NULL,
  name VARCHAR(255) NOT NULL,
  data LONGTEXT NOT NULL,
  mime_type VARCHAR(64) NOT NULL DEFAULT 'image/webp',
  size_bytes BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;`}</pre>
                </div>
              </div>

              {/* Section 2: Why WebP */}
              <div className="space-y-2">
                <h4 className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>۲. چرا فشرده‌سازی WebP در کلاینت الزامی است؟</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ذخیره تصاویر با فرمت خام PNG یا JPG با حجم چند مگابایتی در پایگاه داده، باعث مصرف بیش از حد حافظه رم Buffer Pool در MySQL و افزایش چشمگیر زمان بارگذاری اولیه صفحه می‌شود. تبدیل به فرمت <strong>WebP</strong> مزایای زیر را فراهم می‌آورد:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">۷۰٪ تا ۹۰٪ کاهش حجم</span>
                    <p className="text-[11px] text-slate-500">کاهش سایز عکس ۱ مگابایتی به کمتر از ۵۰ کیلوبایت بدون افت وضوح.</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">بهبود شاخص LCP</span>
                    <p className="text-[11px] text-slate-500">لود سریع‌تر بزرگ‌ترین المان صفحه (Largest Contentful Paint) برای سئو.</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="font-bold text-slate-900 dark:text-white block mb-1">کاهش فشار روی دیتابیس</span>
                    <p className="text-[11px] text-slate-500">حجم کمتر در ستون LONGTEXT و سرعت بالاتر در واکشی کوئری‌ها.</p>
                  </div>
                </div>
              </div>

              {/* Section 3: Frontend ImageLoader */}
              <div className="space-y-2">
                <h4 className="text-sm sm:text-base font-black text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                  <Layers className="w-4 h-4" />
                  <span>۳. استراتژی لود تصاویر با کامپوننت <code className="font-mono text-xs">ImageLoader</code></span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  در فرانت‌اند، کامپوننت <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ImageLoader.tsx</code> با استانداردهای مدرن جایگزین تگ‌های سنتی <code className="font-mono">&lt;img&gt;</code> شده است:
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs text-slate-600 dark:text-slate-400 pr-2">
                  <li><strong>Lazy Loading هوشمند:</strong> استفاده از <code className="font-mono">IntersectionObserver</code> با پیش‌بارگذاری ۲۰۰ پیکسلی قبل از ورود به اسکرول.</li>
                  <li><strong>کش حافظه کلاینت:</strong> جلوگیری از درخواست تکراری تصاویر با استفاده از کش <code className="font-mono">memoryImageCache</code> در سطح React.</li>
                  <li><strong>افکت اسکلتون (Skeleton Loading):</strong> ممانعت از پرش المان‌های صفحه (حذف کامل شاخص تخریبی CLS).</li>
                  <li><strong>فال‌بک وکتور خودکار:</strong> در صورت عدم دسترسی به شبکه، تصویر وکتور پیش‌فرض با رنگ سازمانی به نمایش درمی‌آید.</li>
                </ul>
              </div>

              {/* Section 4: Scale-up Path to Cloud Object Storage */}
              <div className="space-y-2">
                <h4 className="text-sm sm:text-base font-black text-amber-600 dark:text-amber-400 flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span>۴. نقشه راه مهاجرت به سرویس‌های ابری (Cloud Object Storage S3 / CDN)</span>
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  در صورت افزایش حجم کل فایل‌های رسانه به بیش از چند گیگابایت، مهاجرت به ذخیره‌سازی ابری به عنوان فاز بعدی پیشنهاد می‌شود:
                </p>
                <div className="bg-blue-50/60 dark:bg-slate-800/60 p-4 rounded-2xl border border-blue-100 dark:border-slate-700 text-xs space-y-2">
                  <p>
                    <strong>روش بهینه در مقیاس بالا:</strong> تصاویر بر روی باکت‌های سازگار با پروتکل S3 (مانند MinIO، آروان‌کلود، لیارا یا Cloudflare R2) ذخیره شده و در جدول دیتابیس MySQL تنها فیلدهای متادیتا و لینک CDN قرار می‌گیرند.
                  </p>
                  <p className="text-slate-500 font-mono text-[11px]">
                    فایل مستندات کامل در ریشه پروژه: <code className="bg-white dark:bg-slate-900 px-1 py-0.5 rounded">/docs/MEDIA_OPTIMIZATION_AND_MYSQL_GUIDE.md</code>
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex justify-end bg-slate-50/50 dark:bg-slate-800/40">
              <button
                type="button"
                aria-label="متوجه شدم و بستن راهنمای فنی"
                onClick={() => setShowDocModal(false)}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                متوجه شدم و بستن راهنما
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
