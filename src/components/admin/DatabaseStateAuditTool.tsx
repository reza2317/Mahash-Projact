import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Database, 
  Activity, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  RefreshCw, 
  Download, 
  UploadCloud, 
  HardDrive, 
  Server, 
  Wifi, 
  WifiOff, 
  Clock, 
  ArrowUpDown, 
  FileText, 
  Video, 
  ShieldCheck, 
  Layers, 
  Search,
  Check,
  AlertCircle
} from 'lucide-react';
import { 
  getAllReports, 
  getCustomReportsMap, 
  saveCustomReportsMap,
  triggerGlobalCacheBust,
  triggerStoreUpdate,
  syncLocalDataToServer,
  fetchAndMergeServerStore,
  addSyncAttemptLog,
  TEAM_LOGOS_MAP_KEY,
  TEAM_OVERRIDES_KEY,
  SCORES_KEY,
  EVENTS_KEY,
  MAHASH_LOGO_KEY,
  CLUB_EMBLEM_KEY,
  CONSULTANT_PHOTOS_KEY,
  CONSULTANTS_STORAGE_KEY,
  MEMBER_AVATARS_KEY
} from '../../utils/reportsStore';
import { safeGetLocalStorage } from '../../utils/storage';
import { ActivityReport, TeamData } from '../../types';
import { toPersianDigits } from '../../utils/persianDate';

interface DiffItem {
  id: string;
  title: string;
  teamSlug?: string;
  type: 'missing_in_db' | 'missing_in_client' | 'content_mismatch' | 'timestamp_mismatch';
  fieldDifferences?: {
    field: string;
    clientValue: any;
    serverValue: any;
  }[];
  clientReport?: ActivityReport;
  serverReport?: any;
  severity: 'low' | 'medium' | 'high';
}

interface DatabaseStateAuditToolProps {
  onRefreshParentState?: (reports: ActivityReport[], teams: Record<string, TeamData>) => void;
  className?: string;
}

export const DatabaseStateAuditTool: React.FC<DatabaseStateAuditToolProps> = ({
  onRefreshParentState,
  className = ''
}) => {
  const [isRunningAudit, setIsRunningAudit] = useState<boolean>(false);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);

  // Health and connection state
  const [serverPingMs, setServerPingMs] = useState<number | null>(null);
  const [serverStatus, setServerStatus] = useState<'connected' | 'error' | 'checking'>('checking');
  const [mysqlStatus, setMysqlStatus] = useState<{
    connected: boolean;
    activePoolConnections?: number;
    databaseName?: string;
    host?: string;
    checkedAt?: string;
  } | null>(null);
  const [storeStatus, setStoreStatus] = useState<{
    ok: boolean;
    serverUpdatedAt?: string;
    customReportsCount?: number;
  } | null>(null);

  // Client vs Server Diff
  const [clientReportsCount, setClientReportsCount] = useState<number>(0);
  const [serverReportsCount, setServerReportsCount] = useState<number>(0);
  const [diffItems, setDiffItems] = useState<DiffItem[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Action status
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Run comprehensive audit
  const runAudit = useCallback(async () => {
    setIsRunningAudit(true);
    setActionMessage(null);
    const startTime = performance.now();

    try {
      // 1. Health check & latency
      let ping = 0;
      try {
        const hStart = performance.now();
        const healthRes = await fetch('/api/health', { cache: 'no-store' });
        const hEnd = performance.now();
        ping = Math.round(hEnd - hStart);
        setServerPingMs(ping);
        setServerStatus(healthRes.ok ? 'connected' : 'error');
      } catch (e) {
        setServerStatus('error');
        setServerPingMs(null);
      }

      // 2. MySQL health check
      try {
        const mysqlRes = await fetch('/api/mysql/health', { cache: 'no-store' });
        if (mysqlRes.ok) {
          const mysqlData = await mysqlRes.json();
          setMysqlStatus({
            connected: mysqlData.connected ?? false,
            activePoolConnections: mysqlData.activePoolConnections,
            databaseName: mysqlData.database,
            host: mysqlData.host,
            checkedAt: new Date().toLocaleTimeString('fa-IR')
          });
        } else {
          setMysqlStatus({ connected: false });
        }
      } catch (e) {
        setMysqlStatus({ connected: false });
      }

      // 3. Fetch server store for state diff
      const storeRes = await fetch('/api/store', {
        headers: { 'Cache-Control': 'no-store, no-cache' }
      });

      if (!storeRes.ok) {
        throw new Error(`پاسخ سرور در دریافت استیت ناموفق بود (${storeRes.status})`);
      }

      const storeData = await storeRes.json();
      const serverStore = storeData.store || storeData || {};
      const serverReports: any[] = Array.isArray(serverStore.customReports) ? serverStore.customReports : [];

      setStoreStatus({
        ok: true,
        serverUpdatedAt: serverStore.updatedAt || storeData.updatedAt,
        customReportsCount: serverReports.length
      });

      // 4. Gather client state
      const clientReports = getAllReports();
      setClientReportsCount(clientReports.length);
      setServerReportsCount(serverReports.length);

      // 5. Compute State Differences
      const diffs: DiffItem[] = [];
      const clientMap = new Map<string, ActivityReport>();
      clientReports.forEach(r => clientMap.set(r.id, r));

      const serverMap = new Map<string, any>();
      serverReports.forEach(r => serverMap.set(r.id, r));

      // A. Check reports that exist in Client but not in Server Store
      for (const [id, cRep] of clientMap.entries()) {
        const sRep = serverMap.get(id);
        if (!sRep) {
          diffs.push({
            id,
            title: cRep.title,
            teamSlug: cRep.teamSlug,
            type: 'missing_in_db',
            clientReport: cRep,
            severity: 'high'
          });
        } else {
          // Both exist: check content differences
          const fieldDiffs: { field: string; clientValue: any; serverValue: any }[] = [];

          // Compare titles
          if ((cRep.title || '').trim() !== (sRep.title || '').trim()) {
            fieldDiffs.push({
              field: 'عنوان گزارش',
              clientValue: cRep.title,
              serverValue: sRep.title
            });
          }

          // Compare video sources
          const cVid = (cRep.videoSrc || (cRep as any).videoUrl || '').trim();
          const sVid = (sRep.videoSrc || sRep.videoUrl || '').trim();
          if (cVid !== sVid) {
            fieldDiffs.push({
              field: 'آدرس فایل ویدیویی',
              clientValue: cVid || '(بدون ویدیو)',
              serverValue: sVid || '(بدون ویدیو)'
            });
          }

          // Compare report type
          if (cRep.reportType !== sRep.reportType) {
            fieldDiffs.push({
              field: 'فرمت گزارش',
              clientValue: cRep.reportType,
              serverValue: sRep.reportType
            });
          }

          // Compare update timestamp
          const cTime = typeof cRep.updatedAt === 'number' ? cRep.updatedAt : (cRep.updatedAt ? new Date(cRep.updatedAt).getTime() : 0);
          const sTime = typeof sRep.updatedAt === 'number' ? sRep.updatedAt : (sRep.updatedAt ? new Date(sRep.updatedAt).getTime() : 0);
          if (Math.abs(cTime - sTime) > 2000 && fieldDiffs.length > 0) {
            fieldDiffs.push({
              field: 'زمان آخرین به‌روزرسانی',
              clientValue: cTime ? new Date(cTime).toLocaleTimeString('fa-IR') : 'نامشخص',
              serverValue: sTime ? new Date(sTime).toLocaleTimeString('fa-IR') : 'نامشخص'
            });
          }

          if (fieldDiffs.length > 0) {
            diffs.push({
              id,
              title: cRep.title,
              teamSlug: cRep.teamSlug,
              type: 'content_mismatch',
              fieldDifferences: fieldDiffs,
              clientReport: cRep,
              serverReport: sRep,
              severity: 'medium'
            });
          }
        }
      }

      // B. Check reports that exist in Server Store but missing in Client
      for (const [id, sRep] of serverMap.entries()) {
        if (!clientMap.has(id)) {
          diffs.push({
            id,
            title: sRep.title || 'گزارش بدون عنوان',
            teamSlug: sRep.teamSlug,
            type: 'missing_in_client',
            serverReport: sRep,
            severity: 'high'
          });
        }
      }

      setDiffItems(diffs);
      setLastAuditTime(new Date());
    } catch (err: any) {
      console.error('[DatabaseStateAudit] Error running audit:', err);
      setActionMessage({
        type: 'error',
        text: `خطا در اجرای ارزیابی وضعیت دیتابیس: ${err?.message || 'خطای ناشناخته'}`
      });
    } finally {
      setIsRunningAudit(false);
    }
  }, []);

  useEffect(() => {
    runAudit();
  }, [runAudit]);

  // Filtered diffs based on type and search query
  const filteredDiffs = useMemo(() => {
    return diffItems.filter(item => {
      const matchesType = filterType === 'all' || item.type === filterType;
      const matchesSearch = 
        !searchQuery.trim() ||
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.teamSlug && item.teamSlug.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [diffItems, filterType, searchQuery]);

  // Action: Force Pull from Server and Overwrite Client Cache
  const handlePullFromServer = async () => {
    if (!confirm('آیا مطمئن هستید؟ با این کار داده‌های سرور پایگاه داده دریافت شده و جایگزین کش کلاینت خواهند شد.')) {
      return;
    }

    setActionInProgress('pull');
    setActionMessage(null);

    try {
      const res = await fetch('/api/store?t=' + Date.now(), {
        headers: { 'Cache-Control': 'no-store, no-cache' }
      });
      if (!res.ok) throw new Error('خطا در دریافت اطلاعات از سرور');
      const data = await res.json();
      const serverStore = data.store || data || {};
      const serverReports: ActivityReport[] = Array.isArray(serverStore.customReports) ? serverStore.customReports : [];

      // Format to custom reports map
      const newCustomMap: Record<string, ActivityReport[]> = {};
      serverReports.forEach(r => {
        const slug = r.teamSlug || 'team-thinker';
        if (!newCustomMap[slug]) newCustomMap[slug] = [];
        newCustomMap[slug].push(r);
      });

      saveCustomReportsMap(newCustomMap);
      if (serverStore.teamLogos) {
        localStorage.setItem(TEAM_LOGOS_MAP_KEY, JSON.stringify(serverStore.teamLogos));
      }
      if (serverStore.teamOverrides) {
        localStorage.setItem(TEAM_OVERRIDES_KEY, JSON.stringify(serverStore.teamOverrides));
      }
      if (serverStore.scores) {
        localStorage.setItem(SCORES_KEY, JSON.stringify(serverStore.scores));
      }
      if (serverStore.events) {
        localStorage.setItem(EVENTS_KEY, JSON.stringify(serverStore.events));
      }
      if (serverStore.mahashLogo) {
        localStorage.setItem(MAHASH_LOGO_KEY, serverStore.mahashLogo);
      }
      if (serverStore.clubEmblem) {
        localStorage.setItem(CLUB_EMBLEM_KEY, serverStore.clubEmblem);
      }
      if (serverStore.consultantPhotos) {
        localStorage.setItem(CONSULTANT_PHOTOS_KEY, JSON.stringify(serverStore.consultantPhotos));
      }
      if (serverStore.consultantsList) {
        localStorage.setItem(CONSULTANTS_STORAGE_KEY, JSON.stringify(serverStore.consultantsList));
      }
      if (serverStore.memberAvatars) {
        localStorage.setItem(MEMBER_AVATARS_KEY, JSON.stringify(serverStore.memberAvatars));
      }
      localStorage.setItem('mahash_last_successful_sync', new Date().toISOString());

      // Trigger full merge and cache bust across the entire app
      await fetchAndMergeServerStore(true);
      triggerGlobalCacheBust();
      triggerStoreUpdate();

      setActionMessage({
        type: 'success',
        text: `داده‌های دیتابیس با موفقیت دریافت و در کلاینت ذخیره قطعی شد (${toPersianDigits(serverReports.length)} گزارش و کلیه تنظیمات).`
      });

      await runAudit();
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `خطا در دریافت داده‌ها: ${err?.message}`
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Action: Force Push Client to Server
  const handlePushToServer = async () => {
    if (!confirm('آیا مطمئن هستید؟ تمامی داده‌های موجود در کلاینت به پایگاه داده سرور ارسال و ذخیره قطعی خواهند شد.')) {
      return;
    }

    setActionInProgress('push');
    setActionMessage(null);

    try {
      // 1. Gather all client reports and ensure they are populated in customReportsMap
      const clientReports = getAllReports();
      const customMap = getCustomReportsMap();
      const mergedMap: Record<string, ActivityReport[]> = { ...customMap };
      clientReports.forEach(r => {
        const slug = r.teamSlug || 'team-thinker';
        if (!mergedMap[slug]) mergedMap[slug] = [];
        const existingIdx = mergedMap[slug].findIndex(e => e.id === r.id);
        if (existingIdx >= 0) {
          mergedMap[slug][existingIdx] = { ...mergedMap[slug][existingIdx], ...r };
        } else {
          mergedMap[slug].push(r);
        }
      });
      saveCustomReportsMap(mergedMap);

      // 2. Perform definitive push to server
      const success = await syncLocalDataToServer(undefined, 0);
      if (success) {
        setActionMessage({
          type: 'success',
          text: 'تمام اطلاعات کلاینت با موفقیت به پایگاه داده سرور ارسال و ثبت قطعی شد.'
        });
        await runAudit();
      } else {
        throw new Error('سرور نگارش اطلاعات را تایید نکرد.');
      }
    } catch (err: any) {
      setActionMessage({
        type: 'error',
        text: `خطا در ارسال به پایگاه داده: ${err?.message}`
      });
    } finally {
      setActionInProgress(null);
    }
  };

  // Action: Export Diagnostic Report
  const handleExportAudit = () => {
    const reportData = {
      exportedAt: new Date().toISOString(),
      serverPingMs,
      serverStatus,
      mysqlStatus,
      storeStatus,
      clientReportsCount,
      serverReportsCount,
      diffCount: diffItems.length,
      diffs: diffItems
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `database-audit-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isFullySynchronized = 
    diffItems.length === 0 && 
    serverStatus === 'connected' && 
    mysqlStatus?.connected === true;

  return (
    <div className={`space-y-6 ${className}`} dir="rtl">
      {/* Header Banner with Overall Synchronization Status */}
      <div className={`p-6 rounded-2xl border transition-all duration-300 shadow-sm ${
        isFullySynchronized 
          ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40 text-emerald-900 dark:text-emerald-200' 
          : diffItems.length > 0 
          ? 'bg-amber-50/80 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
          : 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-2xl shrink-0 shadow-xs ${
              isFullySynchronized 
                ? 'bg-emerald-500 text-white' 
                : diffItems.length > 0 
                ? 'bg-amber-500 text-white' 
                : 'bg-rose-500 text-white'
            }`}>
              {isFullySynchronized ? (
                <ShieldCheck className="w-7 h-7" />
              ) : diffItems.length > 0 ? (
                <AlertTriangle className="w-7 h-7" />
              ) : (
                <WifiOff className="w-7 h-7" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <h3 className="text-base sm:text-lg font-bold">
                  {isFullySynchronized ? (
                    'پایگاه داده و استیت کلاینت در تطابق کامل قرار دارند (۱۰۰٪ همگام)'
                  ) : diffItems.length > 0 ? (
                    `مغایرت در داده‌ها شناسایی شد (${toPersianDigits(diffItems.length)} مورد تفاوت)`
                  ) : (
                    'اختلال در اتصال به سرور پایگاه داده'
                  )}
                </h3>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  isFullySynchronized
                    ? 'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                    : 'bg-amber-100 dark:bg-amber-900/50 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300'
                }`}>
                  {isFullySynchronized ? 'سالم و پایدار' : 'نیاز به بررسی'}
                </span>
              </div>
              <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
                این ابزار به صورت زنده ارتباط بین دیتابیس MySQL، مخزن متمرکز سرور و استیت کلاینت را تحلیل می‌کند تا از ثبت قطعی اطلاعات و عدم از دست رفتن رکوردها اطمینان حاصل شود.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={runAudit}
              disabled={isRunningAudit}
              className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin text-blue-500' : ''}`} />
              <span>{isRunningAudit ? 'در حال عیب‌یابی...' : 'ارزیابی مجدد'}</span>
            </button>

            <button
              onClick={handleExportAudit}
              className="px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-indigo-500" />
              <span>خروجی لاگ دیباگ</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-xs font-medium animate-fadeIn ${
          actionMessage.type === 'success'
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 text-rose-800 dark:text-rose-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            )}
            <span>{actionMessage.text}</span>
          </div>
          <button 
            onClick={() => setActionMessage(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            بستن
          </button>
        </div>
      )}

      {/* Connection & Health Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Latency & Server Status */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">پینگ سرور و API</span>
            <Server className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {serverPingMs !== null ? `${toPersianDigits(serverPingMs)} ms` : '—'}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              serverStatus === 'connected'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {serverStatus === 'connected' ? 'پاسخگو' : 'قطع'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">نقطه پایانی /api/health و وضعیت پورت ۳۰۰۰</span>
        </div>

        {/* MySQL Database Engine */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">پایگاه داده MySQL</span>
            <Database className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-lg font-black text-slate-800 dark:text-slate-100">
              {mysqlStatus?.connected ? 'متصل و آماده' : 'غیرفعال / خطا'}
            </span>
            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
              mysqlStatus?.connected
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            }`}>
              {mysqlStatus?.connected ? 'MySQL Live' : 'خطای استخر'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block truncate">
            {mysqlStatus?.databaseName ? `بانک: ${mysqlStatus.databaseName}` : 'ارتباط برقرار است'}
          </span>
        </div>

        {/* Client Reports Count */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">گزارش‌های کلاینت (محلی)</span>
            <HardDrive className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {toPersianDigits(clientReportsCount)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">رکورد در حافظه</span>
          </div>
          <span className="text-[11px] text-slate-400 block">گزارش‌های فعال در مرورگر کاربر</span>
        </div>

        {/* Server Reports Count & Diffs */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <span className="text-xs font-bold">گزارش‌های دیتابیس سرور</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-100 font-mono">
              {toPersianDigits(serverReportsCount)}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              diffItems.length === 0
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {diffItems.length === 0 ? 'کاملاً برابر' : `${toPersianDigits(diffItems.length)} مغایرت`}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 block">ثبت شده در /api/store و MySQL</span>
        </div>
      </div>

      {/* Quick Action Toolbar */}
      <div className="bg-slate-50 dark:bg-slate-900/70 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
          <ArrowUpDown className="w-4 h-4 text-blue-500" />
          <span>ابزارهای حل اختلاف و همگام‌سازی فوری:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handlePullFromServer}
            disabled={actionInProgress !== null}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="جایگزینی کش محلی کلاینت با اطلاعات موجود در دیتابیس سرور"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{actionInProgress === 'pull' ? 'در حال دریافت...' : 'دریافت قطعی از سرور (Pull)'}</span>
          </button>

          <button
            onClick={handlePushToServer}
            disabled={actionInProgress !== null}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            title="ارسال و ذخیره‌سازی داده‌های کلاینت در دیتابیس سرور با دریافت تاییدیه قطعی"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{actionInProgress === 'push' ? 'در حال ارسال...' : 'ارسال قطعی به سرور (Push)'}</span>
          </button>
        </div>
      </div>

      {/* Detailed Diff Report Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        {/* Diff Table Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              گزارش مقایسه‌ای رکوردها و مغایرت‌ها
            </h4>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
              {toPersianDigits(filteredDiffs.length)} مورد
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="جستجو در مغایرت‌ها..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-44 sm:w-56 pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter Pill Tabs */}
            <div className="flex items-center gap-1 bg-slate-200/70 dark:bg-slate-800 p-1 rounded-xl">
              {[
                { id: 'all', label: 'همه' },
                { id: 'missing_in_db', label: 'غایب در دیتابیس' },
                { id: 'missing_in_client', label: 'غایب در کلاینت' },
                { id: 'content_mismatch', label: 'تفاوت محتوا' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setFilterType(tab.id)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    filterType === tab.id
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Diff Items List */}
        {filteredDiffs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300 block">
                هیچ مغایرتی در این بخش یافت نشد
              </span>
              <span className="text-xs text-slate-400 block">
                تمامی داده‌های کلاینت با رکوردهای پایگاه داده سرور کاملاً یکپارچه و منطبق هستند.
              </span>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/70">
            {filteredDiffs.map(diff => (
              <div key={diff.id} className="p-4 hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 ${
                      diff.type === 'missing_in_db'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                        : diff.type === 'missing_in_client'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                        : 'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                    }`}>
                      {diff.type === 'missing_in_db'
                        ? 'فقط در کلاینت (ثبت نشده در دیتابیس)'
                        : diff.type === 'missing_in_client'
                        ? 'فقط در سرور (در کلاینت وجود ندارد)'
                        : 'اختلاف در مقادیر فیلدها'}
                    </span>

                    <h5 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                      {diff.title}
                    </h5>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-400 shrink-0 font-mono">
                    <span>شناسه: {diff.id}</span>
                    {diff.teamSlug && (
                      <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[10px]">
                        {diff.teamSlug}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-table for Field Discrepancies if any */}
                {diff.fieldDifferences && diff.fieldDifferences.length > 0 && (
                  <div className="mt-2 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200/80 dark:border-slate-800 p-3 text-xs space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">
                      جزئیات تفاوت مقادیر:
                    </span>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {diff.fieldDifferences.map((fd, fIdx) => (
                        <div key={fIdx} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 space-y-1">
                          <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 block">
                            فیلد: {fd.field}
                          </span>
                          <div className="text-[11px] space-y-0.5">
                            <div className="text-emerald-600 dark:text-emerald-400 truncate">
                              <span className="font-bold">کلاینت:</span> {String(fd.clientValue)}
                            </div>
                            <div className="text-indigo-600 dark:text-indigo-400 truncate">
                              <span className="font-bold">سرور:</span> {String(fd.serverValue)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5" />
          <span>
            آخرین زمان ارزیابی وضعیت: {lastAuditTime ? lastAuditTime.toLocaleTimeString('fa-IR') : '—'}
          </span>
        </div>
        <div>
          <span>نسخه ارزیاب و دیباگر: V2.4 (Definitive State Reconciliation Engine)</span>
        </div>
      </div>
    </div>
  );
};
