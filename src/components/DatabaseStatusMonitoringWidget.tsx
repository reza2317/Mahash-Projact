import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  Server,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  HelpCircle,
  Activity,
  Zap,
  Lock,
  ArrowUpRight,
  Image as ImageIcon,
  UserX,
  FileText,
  Clock,
  History,
  AlertCircle,
  Wrench,
  Sparkles,
  CheckCircle,
  AlertOctagon,
  Award
} from 'lucide-react';
import {
  getSyncDebugLogs,
  clearSyncDebugLogs,
  subscribeToSyncDebugLogs,
  exportSyncDebugLogsAsJson,
  SyncDebugLogEntry,
  getPendingSyncCount,
  getPendingSyncKeys,
  getLastSuccessfulSync,
  getActivePersistenceErrors,
  clearPersistenceError,
  clearAllPersistenceErrors,
  subscribeToPersistenceErrors,
  PersistenceErrorAlert,
  getMySQLTransactionErrors,
  fetchRemoteTransactionErrors,
  resolveTransactionError,
  clearMySQLTransactionErrors,
  subscribeToTransactionErrors,
  MySQLTransactionErrorRecord,
  retrySyncWithClientPriority,
  triggerForceServerSync,
  isStoreTransactionLocked
} from '../utils/reportsStore';
import { toPersianDigits } from '../utils/persianDate';

export interface DatabaseStatusMonitoringWidgetProps {
  onNavigateToLogs?: () => void;
  className?: string;
  showDetailsDefault?: boolean;
}

interface MySQLStatusResponse {
  success: boolean;
  connected: boolean;
  mode: 'live_mysql' | 'fallback_file_db';
  storageEngine?: string;
  host?: string;
  port?: number;
  database?: string;
  error?: string | null;
  message?: string;
  timestamp?: string;
  stats?: {
    kv_count?: number;
    reports_count?: number;
    assets_count?: number;
    consultations_count?: number;
    members_count?: number;
  };
}

export const DatabaseStatusMonitoringWidget: React.FC<DatabaseStatusMonitoringWidgetProps> = ({
  onNavigateToLogs,
  className = '',
  showDetailsDefault = false
}) => {
  const [status, setStatus] = useState<MySQLStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [isForceSyncing, setIsForceSyncing] = useState(false);
  const [retryingTarget, setRetryingTarget] = useState<string | null>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [lastCheckTime, setLastCheckTime] = useState<Date | null>(null);
  const [showDetails, setShowDetails] = useState(showDetailsDefault);
  const [activeDrawerTab, setActiveDrawerTab] = useState<'none' | 'debug_logs' | 'tx_errors'>('none');
  const [showTroubleshootModal, setShowTroubleshootModal] = useState(false);
  const [copiedLog, setCopiedLog] = useState(false);
  const [copiedTxLogs, setCopiedTxLogs] = useState(false);

  // Persistence Error Alerts state
  const [persistenceErrors, setPersistenceErrors] = useState<PersistenceErrorAlert[]>([]);

  // Transaction errors state
  const [txErrors, setTxErrors] = useState<MySQLTransactionErrorRecord[]>([]);
  const [txFilter, setTxFilter] = useState<'all' | 'pending' | 'resolved'>('all');
  const [resolvingTxId, setResolvingTxId] = useState<string | null>(null);

  // Sync debug logs state
  const [debugLogs, setDebugLogs] = useState<SyncDebugLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'error' | 'warn' | 'success'>('all');
  const [pendingKeys, setPendingKeys] = useState<string[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(getLastSuccessfulSync());

  // Format Persian Date & Time
  const formatPersianTime = (isoString?: string | null) => {
    if (!isoString) return 'نامشخص / هنوز ثبت‌نشده';
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return isoString;
      return `${d.toLocaleDateString('fa-IR')} ساعت ${d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    } catch {
      return isoString;
    }
  };

  const getTimeAgoPersian = (isoString?: string | null) => {
    if (!isoString) return null;
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      if (isNaN(diffMs) || diffMs < 0) return null;
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 60) return `${toPersianDigits(diffSec)} ثانیه پیش`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
      const diffHour = Math.floor(diffMin / 60);
      if (diffHour < 24) return `${toPersianDigits(diffHour)} ساعت پیش`;
      const diffDay = Math.floor(diffHour / 24);
      return `${toPersianDigits(diffDay)} روز پیش`;
    } catch {
      return null;
    }
  };

  // Fetch status
  const checkStatus = useCallback(async () => {
    setIsLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/mysql/status', {
        headers: { 'Cache-Control': 'no-cache' }
      });
      const data: MySQLStatusResponse = await res.json();
      const elapsed = Math.round(performance.now() - start);
      setLatencyMs(elapsed);
      setStatus(data);
      setLastCheckTime(new Date());
    } catch (err: any) {
      setLatencyMs(null);
      setStatus({
        success: false,
        connected: false,
        mode: 'fallback_file_db',
        error: err?.message || 'خطا در برقراری ارتباط با سرویس وضعیت دیتابیس',
        message: 'سرور در دسترس نیست یا سرویس آفلاین است'
      });
      setLastCheckTime(new Date());
    } finally {
      setIsLoading(false);
      setPendingKeys(getPendingSyncKeys());
      setLastSyncTime(getLastSuccessfulSync());
    }
  }, []);

  // Fetch transaction errors from remote endpoint
  const refreshTxErrors = useCallback(async () => {
    try {
      const remote = await fetchRemoteTransactionErrors();
      setTxErrors(remote);
    } catch (e) {
      setTxErrors(getMySQLTransactionErrors());
    }
  }, []);

  // Manual reconnect trigger
  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      const res = await fetch('/api/mysql/reconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.connected) {
        setStatus((prev) => prev ? { ...prev, connected: true, mode: 'live_mysql', error: null, message: data.message } : null);
      }
      await checkStatus();
      await refreshTxErrors();
    } catch (err: any) {
      console.error('[MySQL Monitoring] Reconnect failed:', err);
    } finally {
      setIsReconnecting(false);
    }
  };

  // Force Full Sync
  const handleForceSync = async () => {
    setIsForceSyncing(true);
    try {
      await triggerForceServerSync();
      await checkStatus();
      await refreshTxErrors();
      setLastSyncTime(getLastSuccessfulSync());
    } catch (err) {
      console.error('[MySQL Monitoring] Force sync failed:', err);
    } finally {
      setIsForceSyncing(false);
    }
  };

  // Retry persistence item with Client Priority
  const handleRetryPersistenceError = async (alert: PersistenceErrorAlert) => {
    setRetryingTarget(alert.id);
    try {
      let priorityKeys: string[] = [];
      if (alert.category === 'logo') {
        priorityKeys = [alert.target, 'mahash_team_logos_map', 'mahash_app_logo_url'];
      } else if (alert.category === 'consultant') {
        priorityKeys = [alert.target, 'mahash_consultants_list_v1', 'mahash_consultant_photos_map'];
      } else {
        priorityKeys = [alert.target];
      }

      await retrySyncWithClientPriority(`تلاش مجدد و رفع تضاد برای ${alert.target}`, priorityKeys);
      clearPersistenceError(alert.id);
      await refreshTxErrors();
      setLastSyncTime(getLastSuccessfulSync());
    } catch (err) {
      console.warn('Retry failed for persistence error:', err);
    } finally {
      setRetryingTarget(null);
    }
  };

  // Resolve single transaction error
  const handleResolveTx = async (txId: string) => {
    setResolvingTxId(txId);
    try {
      resolveTransactionError(txId);
      await refreshTxErrors();
    } finally {
      setResolvingTxId(null);
    }
  };

  // Initial fetch and 10s auto-polling
  useEffect(() => {
    checkStatus();
    refreshTxErrors();
    setDebugLogs(getSyncDebugLogs());
    setPendingKeys(getPendingSyncKeys());
    setPersistenceErrors(getActivePersistenceErrors());
    setLastSyncTime(getLastSuccessfulSync());

    const unsubLogs = subscribeToSyncDebugLogs((updated) => {
      setDebugLogs([...updated]);
      setPendingKeys(getPendingSyncKeys());
      setLastSyncTime(getLastSuccessfulSync());
    });

    const unsubAlerts = subscribeToPersistenceErrors((alerts) => {
      setPersistenceErrors([...alerts]);
    });

    const unsubTx = subscribeToTransactionErrors((errs) => {
      setTxErrors([...errs]);
    });

    const interval = setInterval(() => {
      checkStatus();
      refreshTxErrors();
      setLastSyncTime(getLastSuccessfulSync());
    }, 10000);

    return () => {
      unsubLogs();
      unsubAlerts();
      unsubTx();
      clearInterval(interval);
    };
  }, [checkStatus, refreshTxErrors]);

  const isConnected = Boolean(status?.connected);
  const isLiveMySQL = status?.mode === 'live_mysql';

  const filteredLogs = debugLogs.filter((log) => {
    if (logFilter === 'all') return true;
    return log.level === logFilter;
  });

  const filteredTxErrors = txErrors.filter((tx) => {
    if (txFilter === 'all') return true;
    return tx.status === txFilter;
  });

  const pendingTxCount = txErrors.filter(tx => tx.status === 'pending').length;

  const handleCopyLogs = () => {
    const jsonStr = exportSyncDebugLogsAsJson();
    navigator.clipboard?.writeText(jsonStr).then(() => {
      setCopiedLog(true);
      setTimeout(() => setCopiedLog(false), 2000);
    }).catch(() => {});
  };

  const handleCopyTxErrors = () => {
    const jsonStr = JSON.stringify(txErrors, null, 2);
    navigator.clipboard?.writeText(jsonStr).then(() => {
      setCopiedTxLogs(true);
      setTimeout(() => setCopiedTxLogs(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className={`flex flex-col gap-3 ${className}`} id="db-monitoring-widget">
      {/* 1. Offline Alert Banner (Shown prominently when connection is down) */}
      {!isConnected && status && (
        <div
          id="mysql-offline-alert-banner"
          className="relative overflow-hidden bg-gradient-to-r from-rose-950/90 via-amber-950/70 to-rose-950/90 border-2 border-rose-500/80 rounded-3xl p-4 sm:p-5 shadow-2xl shadow-rose-950/50 text-white animate-in fade-in"
          role="alert"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-400/40 text-rose-300 flex items-center justify-center shrink-0 shadow-inner animate-pulse">
                <AlertTriangle className="w-6 h-6 text-rose-400" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-black text-sm sm:text-base text-rose-200">
                    ⚠️ هشدار ارتباط با پایگاه داده MySQL: قطع اتصال (Offline)
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/30 text-rose-200 border border-rose-400/40 font-mono">
                    حالت: پشتیبان فایل (Fallback Mode)
                  </span>
                </div>
                <p className="text-xs text-rose-100/85 leading-relaxed max-w-2xl">
                  ارتباط مستقیم با سرور MySQL روی آدرس{' '}
                  <code className="font-mono bg-black/40 px-1.5 py-0.5 rounded text-rose-300" dir="ltr">
                    {status.host || '127.0.0.1'}:{status.port || 3306}/{status.database || 'mahash'}
                  </code>{' '}
                  برقرار نیست. داده‌ها هم‌اکنون در فایل پایدار دیسک ذخیره می‌شوند، اما برای پایداری قطعی چندکاربره نیاز به اتصال زنده به دیتابیس است.
                </p>
                {status.error && (
                  <div className="text-[11px] font-mono text-rose-300/90 bg-rose-950/60 px-2.5 py-1 rounded-lg border border-rose-800/40 mt-1 inline-block truncate max-w-xl" dir="ltr">
                    {status.error}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
              <button
                type="button"
                onClick={handleReconnect}
                disabled={isReconnecting}
                title="تلاش مجدد برای برقراری اتصال با سرور MySQL"
                className="px-4 py-2.5 bg-gradient-to-r from-rose-500 to-amber-600 hover:from-rose-600 hover:to-amber-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-950/50 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isReconnecting ? 'animate-spin' : ''}`} />
                <span>{isReconnecting ? 'در حال اتصال مجدد...' : 'تلاش مجدد اتصال (Reconnect)'}</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab(activeDrawerTab === 'debug_logs' ? 'none' : 'debug_logs')}
                title="مشاهده لاگ‌های دیباگ همگام‌سازی"
                className="px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-rose-100 font-bold text-xs rounded-xl border border-white/10 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Terminal className="w-3.5 h-3.5 text-rose-300" />
                <span>لاگ‌های دیباگ</span>
                {debugLogs.length > 0 && (
                  <span className="px-1.5 py-0.2 bg-rose-500/40 text-rose-200 text-[10px] rounded-full font-mono">
                    {toPersianDigits(debugLogs.length)}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setShowTroubleshootModal(true)}
                title="راهنمای رفع مشکل ارتباط با دیتابیس"
                className="p-2.5 bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white rounded-xl border border-white/10 transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Visual Alerts for Data Persistence Failures (Logos, Consultants, Reports) */}
      {persistenceErrors.length > 0 && (
        <div
          id="persistence-errors-alert-box"
          className="bg-amber-950/60 dark:bg-amber-950/80 border-2 border-amber-500/70 rounded-2xl p-4 shadow-xl space-y-3 animate-in fade-in"
          role="alert"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/30">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertOctagon className="w-5 h-5 text-amber-400 animate-pulse" />
              <span className="font-black text-sm text-amber-200">
                هشدارهای بصری پایداری داده‌ها (Persistence Alerts)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/30 text-amber-200 border border-amber-400/40 font-mono">
                {toPersianDigits(persistenceErrors.length)} مورد تضاد/خطای ذخیره‌سازی
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={clearAllPersistenceErrors}
                className="text-xs text-amber-300/80 hover:text-amber-100 flex items-center gap-1 cursor-pointer transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>صرف‌نظر از همه</span>
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            {persistenceErrors.map((errAlert) => {
              const isRetryingThis = retryingTarget === errAlert.id;
              let CategoryIcon = AlertCircle;
              let categoryLabel = 'عمومی';
              let badgeColor = 'bg-slate-700 text-slate-200';

              if (errAlert.category === 'logo') {
                CategoryIcon = ImageIcon;
                categoryLabel = 'لوگو / نشان تیم یا سامانه';
                badgeColor = 'bg-sky-500/30 text-sky-200 border border-sky-400/30';
              } else if (errAlert.category === 'consultant') {
                CategoryIcon = UserX;
                categoryLabel = 'تصویر / اطلاعات مشاور';
                badgeColor = 'bg-purple-500/30 text-purple-200 border border-purple-400/30';
              } else if (errAlert.category === 'report') {
                CategoryIcon = FileText;
                categoryLabel = 'گزارش ارسالی';
                badgeColor = 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/30';
              } else if (errAlert.category === 'score') {
                CategoryIcon = Award;
                categoryLabel = 'جدول امتیازات';
                badgeColor = 'bg-amber-500/30 text-amber-200 border border-amber-400/30';
              }

              return (
                <div
                  key={errAlert.id}
                  className="bg-black/40 border border-amber-500/40 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-start gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-400/30 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                      <CategoryIcon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}`}>
                          {categoryLabel}
                        </span>
                        <span className="font-black text-slate-100">{errAlert.target}</span>
                        <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                          {new Date(errAlert.timestamp).toLocaleTimeString('fa-IR')}
                        </span>
                      </div>
                      <p className="text-[11px] text-amber-100/90 leading-relaxed">
                        {errAlert.message}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                    <button
                      type="button"
                      onClick={() => handleRetryPersistenceError(errAlert)}
                      disabled={isRetryingThis}
                      className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-emerald-600 hover:from-amber-600 hover:to-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      title="تلاش مجدد با اولویت کلاینت و رفع تضاد در دیتابیس MySQL"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRetryingThis ? 'animate-spin' : ''}`} />
                      <span>{isRetryingThis ? 'در حال تثبیت...' : 'رفع و تثبیت در سرور (Retry)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => clearPersistenceError(errAlert.id)}
                      className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white rounded-xl transition cursor-pointer text-xs"
                      title="حذف این هشدار"
                    >
                      صرف‌نظر
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Main Monitoring Card (Live status + Last Successful Sync + Controls) */}
      <div
        id="mysql-status-card"
        className="bg-slate-900/90 dark:bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-2xl p-3.5 sm:p-4 shadow-xl transition-all hover:border-slate-700/80"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Status Indicator & Title & Last Successful Sync */}
          <div className="flex items-start sm:items-center gap-3">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border shadow-inner ${
                isConnected
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  : 'bg-rose-500/15 border-rose-500/30 text-rose-400'
              }`}
            >
              {isConnected ? (
                <Wifi className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : (
                <WifiOff className="w-5 h-5 text-rose-400" />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs sm:text-sm font-black text-slate-100 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-sky-400" />
                  <span>پایش پایداری داده‌ها و اتصال دیتابیس</span>
                </span>

                {/* Pulsing Status Pill */}
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black border ${
                    isConnected
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-400/30'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-400'
                    }`}
                  />
                  <span>{isConnected ? 'آنلاین (MySQL Connected)' : 'آفلاین (Disk Fallback)'}</span>
                </span>

                {isLiveMySQL && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-500/15 text-sky-300 border border-sky-400/20">
                    <ShieldCheck className="w-3 h-3 text-sky-400" />
                    <span>تراکنش‌های امن ACID فعال</span>
                  </span>
                )}

                {/* Last Successful Sync Badge */}
                <div
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-950/50 text-emerald-300 border border-emerald-500/30"
                  title={`آخرین همگام‌سازی موفق با دیتابیس: ${formatPersianTime(lastSyncTime)}`}
                >
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>آخرین همگام‌سازی موفق:</span>
                  <span className="font-mono text-emerald-200">
                    {getTimeAgoPersian(lastSyncTime) || (lastSyncTime ? formatPersianTime(lastSyncTime) : 'در حال انتظار')}
                  </span>
                </div>
              </div>

              {/* Server Info / Subtext */}
              <div className="flex items-center gap-3 text-[11px] text-slate-400 flex-wrap">
                <span className="font-mono text-slate-300" dir="ltr">
                  {status?.host || '127.0.0.1'}:{status?.port || 3306} ({status?.database || 'mahash'})
                </span>

                {latencyMs !== null && (
                  <span className="flex items-center gap-1 text-slate-400 font-mono text-[10px]" dir="ltr">
                    <Zap className="w-2.5 h-2.5 text-amber-400" />
                    {latencyMs} ms
                  </span>
                )}

                {lastCheckTime && (
                  <span className="text-slate-500 text-[10px]">
                    بررسی وضعیت: {lastCheckTime.toLocaleTimeString('fa-IR')}
                  </span>
                )}

                {pendingKeys.length > 0 && (
                  <span className="text-amber-400 text-[10px] font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-400/20">
                    {toPersianDigits(pendingKeys.length)} تغییر در انتظار همگام‌سازی
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 shrink-0 self-end lg:self-auto flex-wrap">
            {/* Ping / Status Test */}
            <button
              type="button"
              onClick={checkStatus}
              disabled={isLoading}
              title="تست و پینگ مجدد وضعیت اتصال دیتابیس"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-slate-700/60 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            {/* Reconnect (If Offline) */}
            {!isConnected && (
              <button
                type="button"
                onClick={handleReconnect}
                disabled={isReconnecting}
                title="تلاش برای اتصال مجدد به MySQL"
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isReconnecting ? 'animate-spin' : ''}`} />
                <span>اتصال مجدد</span>
              </button>
            )}

            {/* Force Sync */}
            <button
              type="button"
              onClick={handleForceSync}
              disabled={isForceSyncing}
              title="نوسازی و همگام‌سازی فوری کامل از سرور مرکزی (Force Server Sync)"
              className="px-3 py-1.5 bg-slate-800 hover:bg-emerald-600/30 text-slate-200 hover:text-emerald-300 border border-slate-700/70 hover:border-emerald-500/50 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isForceSyncing ? 'animate-spin text-emerald-400' : 'text-emerald-400'}`} />
              <span>همگام‌سازی فوری</span>
            </button>

            {/* Transaction Errors Drawer Toggle */}
            <button
              type="button"
              onClick={() => setActiveDrawerTab(activeDrawerTab === 'tx_errors' ? 'none' : 'tx_errors')}
              title="مشاهده لاگ‌های خطای تراکنش MySQL"
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition flex items-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'tx_errors'
                  ? 'bg-rose-500/30 text-rose-200 border-rose-400/40'
                  : pendingTxCount > 0
                  ? 'bg-rose-950/40 text-rose-300 border-rose-700/60 hover:bg-rose-900/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
              }`}
            >
              <AlertOctagon className={`w-3.5 h-3.5 ${pendingTxCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-400'}`} />
              <span>خطاهای تراکنش</span>
              {pendingTxCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white text-[10px] rounded-full font-mono font-black">
                  {toPersianDigits(pendingTxCount)}
                </span>
              )}
            </button>

            {/* Sync Debug Logs Drawer Toggle */}
            <button
              type="button"
              onClick={() => setActiveDrawerTab(activeDrawerTab === 'debug_logs' ? 'none' : 'debug_logs')}
              title="مشاهده لاگ‌های دیباگ همگام‌سازی"
              className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition flex items-center gap-1.5 cursor-pointer ${
                activeDrawerTab === 'debug_logs'
                  ? 'bg-sky-500/30 text-sky-200 border-sky-400/40'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5 text-sky-400" />
              <span>لاگ‌های دیباگ</span>
            </button>

            {/* Expand / Collapse Details */}
            <button
              type="button"
              onClick={() => setShowDetails(!showDetails)}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title={showDetails ? 'بستن جزئیات' : 'مشاهده جزئیات بیشتر'}
            >
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 4. Expandable Technical Details Grid */}
        {showDetails && (
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs animate-in fade-in">
            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block">موتور ذخیره‌سازی</span>
              <span className="font-black text-slate-200 font-mono">
                {status?.storageEngine || (isConnected ? 'InnoDB' : 'Disk JSON')}
              </span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block">حالت عملیاتی مخزن</span>
              <span className={`font-black text-xs ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isLiveMySQL ? 'MySQL Transactional' : 'Fallback File Database'}
              </span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block">آخرین ثبت موفق (ISO)</span>
              <span className="font-bold text-emerald-300 text-[10px] font-mono block truncate" title={lastSyncTime || ''}>
                {formatPersianTime(lastSyncTime)}
              </span>
            </div>

            <div className="bg-black/30 p-2.5 rounded-xl border border-white/5 space-y-1">
              <span className="text-[10px] text-slate-400 block">قفل تراکنش‌های کلاینت</span>
              <span className="font-black text-slate-200 font-mono text-[11px]">
                {isStoreTransactionLocked() ? '🔒 فعال (در حال پردازش)' : 'آزاد (Idle)'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. Transaction Errors Drawer */}
      {activeDrawerTab === 'tx_errors' && (
        <div
          id="tx-errors-drawer"
          className="bg-slate-900/95 border border-rose-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
                <AlertOctagon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>مدیریت و گزارش خطاهای تراکنش MySQL</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {toPersianDigits(txErrors.length)} رکورد
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  ردیابی خطاهای رخ‌داده در عملیات پایدارسازی پایگاه داده همراه با قابلیت حل مشکل (Resolve)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filter */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-[11px]">
                {(['all', 'pending', 'resolved'] as const).map((filterVal) => (
                  <button
                    key={filterVal}
                    type="button"
                    onClick={() => setTxFilter(filterVal)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      txFilter === filterVal
                        ? 'bg-rose-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filterVal === 'all' && 'همه'}
                    {filterVal === 'pending' && `در انتظار اقدام (${toPersianDigits(pendingTxCount)})`}
                    {filterVal === 'resolved' && 'حل‌شده'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyTxErrors}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="کپی لاگ خطاهای تراکنش به صورت JSON"
              >
                {copiedTxLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedTxLogs ? 'کپی شد' : 'کپی JSON'}</span>
              </button>

              <button
                type="button"
                onClick={clearMySQLTransactionErrors}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 rounded-xl border border-slate-700 transition cursor-pointer"
                title="پاکسازی تمام خطاهای تراکنش"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab('none')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>

          {/* Transaction Errors List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredTxErrors.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs flex flex-col items-center gap-2">
                <CheckCircle className="w-6 h-6 text-emerald-400" />
                <span>هیچ خطای تراکنشی در این دسته‌بندی ثبت نشده است.</span>
              </div>
            ) : (
              filteredTxErrors.map((tx) => {
                const isPending = tx.status === 'pending';
                const isResolving = resolvingTxId === tx.id;

                return (
                  <div
                    key={tx.id}
                    className={`p-3 rounded-xl border text-xs transition space-y-2 ${
                      isPending
                        ? 'bg-rose-950/40 border-rose-800/60 text-rose-100'
                        : 'bg-slate-900/60 border-slate-800 text-slate-300 opacity-80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-black ${
                            isPending
                              ? 'bg-rose-500 text-white shadow-sm'
                              : 'bg-emerald-700/60 text-emerald-200'
                          }`}
                        >
                          {isPending ? 'در انتظار حل (Pending)' : 'حل‌شده (Resolved)'}
                        </span>

                        <span className="font-bold text-slate-100">{tx.operation}</span>

                        {tx.rolledBack && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] bg-amber-500/20 text-amber-300 border border-amber-400/30 font-bold">
                            بازگشت تراکنش (Rollback شده)
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono" dir="ltr">
                        <span>{new Date(tx.timestamp).toLocaleTimeString('fa-IR')}</span>
                      </div>
                    </div>

                    <div className="text-xs text-rose-200/90 font-medium">
                      {tx.errorMessage}
                    </div>

                    {tx.keys && tx.keys.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 flex-wrap">
                        <span className="text-slate-400">کلیدهای تحت تاثیر:</span>
                        {tx.keys.map((k) => (
                          <code key={k} className="bg-black/40 px-1.5 py-0.2 rounded text-slate-300 font-mono" dir="ltr">
                            {k}
                          </code>
                        ))}
                      </div>
                    )}

                    {/* Action button: Resolve */}
                    {isPending && (
                      <div className="flex items-center justify-end gap-2 pt-1 border-t border-rose-900/40">
                        <button
                          type="button"
                          onClick={() => handleResolveTx(tx.id)}
                          disabled={isResolving}
                          className="px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-lg shadow transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isResolving ? 'animate-spin' : ''}`} />
                          <span>{isResolving ? 'در حال علامت‌گذاری...' : 'حل مشکل (Resolve)'}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 6. Sync Debug Logs Drawer */}
      {activeDrawerTab === 'debug_logs' && (
        <div
          id="sync-debug-log-drawer"
          className="bg-slate-900/95 border border-sky-500/30 rounded-3xl p-4 sm:p-5 shadow-2xl space-y-4 animate-in fade-in"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Terminal className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-black text-white flex items-center gap-2">
                  <span>لاگ‌های سیستم همگام‌سازی و دیباگ دیتابیس</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                    {toPersianDigits(debugLogs.length)} رکورد
                  </span>
                </h4>
                <p className="text-[11px] text-slate-400">
                  ردیابی دقیق مراحل ارسال، دریافت، تصمیم‌های ادغام (Merge Decisions) و خطاهای همگام‌سازی
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Level Filter */}
              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-[11px]">
                {(['all', 'success', 'warn', 'error'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                      logFilter === lvl
                        ? 'bg-sky-500 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {lvl === 'all' && 'همه'}
                    {lvl === 'success' && 'موفق'}
                    {lvl === 'warn' && 'هشدار'}
                    {lvl === 'error' && 'خطا'}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleCopyLogs}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer"
                title="کپی لاگ‌ها به صورت ساختار JSON برای خطایابی عمیق"
              >
                {copiedLog ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                <span>{copiedLog ? 'کپی شد' : 'کپی JSON'}</span>
              </button>

              <button
                type="button"
                onClick={clearSyncDebugLogs}
                className="p-1.5 bg-slate-800 hover:bg-rose-500/20 hover:text-rose-300 text-slate-400 rounded-xl border border-slate-700 transition cursor-pointer"
                title="پاکسازی تاریخچه لاگ‌ها"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setActiveDrawerTab('none')}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>

          {/* Log Entry List */}
          <div className="max-h-80 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                هیچ لاگی در این فیلتر ثبت نشده است.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isErr = log.level === 'error';
                const isWarn = log.level === 'warn';
                const isSucc = log.level === 'success';

                return (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border text-xs transition space-y-1 ${
                      isErr
                        ? 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                        : isWarn
                        ? 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                        : isSucc
                        ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                        : 'bg-slate-800/60 border-slate-700/50 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                            isErr
                              ? 'bg-rose-600 text-white'
                              : isWarn
                              ? 'bg-amber-600 text-white'
                              : isSucc
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-700 text-slate-200'
                          }`}
                        >
                          {log.phase}
                        </span>
                        <span className="font-bold text-slate-100">{log.summary}</span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono" dir="ltr">
                        {log.durationMs !== undefined && (
                          <span className="text-amber-400/90">{log.durationMs}ms</span>
                        )}
                        <span>{new Date(log.timestamp).toLocaleTimeString('fa-IR')}</span>
                      </div>
                    </div>

                    {log.details && Object.keys(log.details).length > 0 && (
                      <pre className="text-[10px] font-mono bg-black/40 p-2 rounded-lg text-slate-300 overflow-x-auto" dir="ltr">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 7. Troubleshooting Modal */}
      {showTroubleshootModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 space-y-4 shadow-2xl text-slate-200 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-base text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                <span>راهنمای رفع مشکل عدم اتصال به MySQL</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowTroubleshootModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300">
              <p>
                اگر وضعیت دیتابیس در حالت <strong>Offline</strong> قرار دارد، موارد زیر را در محیط سرور بررسی نمایید:
              </p>

              <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-[11px]">
                <div className="text-sky-400 font-bold">۱. بررسی وضعیت سرویس MySQL در لینوکس:</div>
                <div className="bg-black/50 p-2 rounded text-emerald-400 select-all" dir="ltr">
                  sudo systemctl status mysql
                </div>
                <div className="text-slate-400 text-[10px]">اگر غیرفعال است: sudo systemctl restart mysql</div>
              </div>

              <div className="space-y-2 bg-slate-950 p-3 rounded-2xl border border-slate-800 font-mono text-[11px]">
                <div className="text-sky-400 font-bold">۲. بررسی متغیرهای محیطی دیتابیس در فایل .env:</div>
                <div className="text-slate-300 space-y-1 text-[10px]" dir="ltr">
                  <div>MYSQL_HOST=127.0.0.1</div>
                  <div>MYSQL_PORT=3306</div>
                  <div>MYSQL_USER=mahash</div>
                  <div>MYSQL_PASSWORD=...</div>
                  <div>MYSQL_DATABASE=mahash</div>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/40 rounded-2xl text-emerald-200 text-[11px]">
                <strong>🛡️ تضمین عدم از دست رفتن اطلاعات:</strong> سیستم مجهز به مخزن پشتیبان محلی دیسک (Disk Fallback) است. هیچ تغییری تا زمان راه‌اندازی مجدد MySQL از بین نخواهد رفت.
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setShowTroubleshootModal(false);
                  handleReconnect();
                }}
                className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                تلاش مجدد اتصال
              </button>
              <button
                type="button"
                onClick={() => setShowTroubleshootModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
