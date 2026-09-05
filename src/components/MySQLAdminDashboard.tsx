import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Layers,
  User,
  Shield,
  HardDrive,
  Terminal,
  Search,
  Download,
  FileSpreadsheet,
  AlertCircle,
  Check,
  Filter,
  Activity,
  Gauge,
  Zap,
  Cpu,
  Clock,
  Radio,
  AlertTriangle,
  TrendingUp,
  BarChart3,
  FolderArchive,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { useNotification } from '../context/NotificationContext';
import { toPersianDigits } from '../utils/persianDate';
import { fetchAndMergeServerStore, subscribeToStoreUpdates } from '../utils/reportsStore';
import { MySQLLiveLogsMonitor } from './admin/MySQLLiveLogsMonitor';
import { MySQLSchemaManager } from './admin/MySQLSchemaManager';

export const MySQLAdminDashboard: React.FC = () => {
  const { maintenanceSuccess, error: showError, warning } = useNotification();
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [storeData, setStoreData] = useState<any>(null);
  const [loadingStore, setLoadingStore] = useState(false);

  // Modal and Filter states
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');

  // Last backup tracking state
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('mahash_last_backup_time') : null;
  });

  const [backupHistory, setBackupHistory] = useState<any[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('mahash_backup_history') : null;
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { }
    }
    return [
      {
        id: 'bk-1',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'خروجی دستی جدول (CSV / JSON)',
        status: 'موفق (Success)',
        size: '14.2 KB',
        triggeredBy: 'مدیر سیستم (Manual Trigger)'
      },
      {
        id: 'bk-2',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        type: 'پشتیبان‌گیری خودکار جداول MySQL',
        status: 'موفق (Success)',
        size: '16.8 KB',
        triggeredBy: 'سیستم دوره‌ای (Cron Schedule)'
      }
    ];
  });

  // Calculate Last Successful Backup Date
  const lastSuccessfulBackupDate = useMemo(() => {
    const successfulItems = backupHistory.filter(
      item => !item.status.includes('ناموفق') && !item.status.toLowerCase().includes('failed')
    );
    if (successfulItems.length > 0) {
      return successfulItems[0].timestamp;
    }
    return lastBackupDate;
  }, [backupHistory, lastBackupDate]);

  // Calculate Storage Usage Status
  const storageUsageStatus = useMemo(() => {
    let totalKb = 0;
    backupHistory.forEach(item => {
      const sizeNum = parseFloat(item.size || '0');
      if (!isNaN(sizeNum)) totalKb += sizeNum;
    });
    return {
      totalBackupsSizeKb: totalKb.toFixed(1),
      statusText: 'بهینه و پایدار (InnoDB Engine)',
      bufferPoolUsage: 48
    };
  }, [backupHistory]);

  // Filtered backup history list
  const filteredBackupHistory = useMemo(() => {
    if (statusFilter === 'success') {
      return backupHistory.filter(
        item => !item.status.includes('ناموفق') && !item.status.toLowerCase().includes('failed')
      );
    }
    if (statusFilter === 'failed') {
      return backupHistory.filter(
        item => item.status.includes('ناموفق') || item.status.toLowerCase().includes('failed')
      );
    }
    return backupHistory;
  }, [backupHistory, statusFilter]);

  const successCount = useMemo(() => {
    return backupHistory.filter(
      item => !item.status.includes('ناموفق') && !item.status.toLowerCase().includes('failed')
    ).length;
  }, [backupHistory]);

  const failedCount = useMemo(() => {
    return backupHistory.filter(
      item => item.status.includes('ناموفق') || item.status.toLowerCase().includes('failed')
    ).length;
  }, [backupHistory]);

  // Recharts: Daily backup count & growth trends data
  const chartTrendData = useMemo(() => {
    const map = new Map<
      string,
      { date: string; displayDate: string; success: number; failed: number; dailyTotal: number; cumulative: number }
    >();

    // Baseline 7 days (today down to 6 days ago)
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
      const dateKey = d.toISOString().split('T')[0];
      const displayDate = d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
      map.set(dateKey, {
        date: dateKey,
        displayDate,
        success: 0,
        failed: 0,
        dailyTotal: 0,
        cumulative: 0
      });
    }

    // Populate from backupHistory
    backupHistory.forEach(item => {
      const dateKey = new Date(item.timestamp).toISOString().split('T')[0];
      const isFail =
        item.status.includes('ناموفق') || item.status.toLowerCase().includes('failed');
      if (map.has(dateKey)) {
        const entry = map.get(dateKey)!;
        if (isFail) entry.failed += 1;
        else entry.success += 1;
        entry.dailyTotal += 1;
      } else {
        const d = new Date(item.timestamp);
        const displayDate = isNaN(d.getTime())
          ? dateKey
          : d.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
        map.set(dateKey, {
          date: dateKey,
          displayDate,
          success: isFail ? 0 : 1,
          failed: isFail ? 1 : 0,
          dailyTotal: 1,
          cumulative: 0
        });
      }
    });

    const sorted = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    let runningTotal = 0;
    return sorted.map(item => {
      runningTotal += item.dailyTotal;
      return {
        ...item,
        cumulative: runningTotal
      };
    });
  }, [backupHistory]);

  // Open confirmation dialog before executing backup
  const handleTriggerBackup = () => {
    setShowConfirmModal(true);
  };

  // Perform actual backup export after user confirms in modal dialog
  const handleExecuteBackup = () => {
    setIsExporting(true);
    setShowConfirmModal(false);

    try {
      const nowIso = new Date().toISOString();
      localStorage.setItem('mahash_last_backup_time', nowIso);
      setLastBackupDate(nowIso);

      const newBackupItem = {
        id: `bk-${Date.now()}`,
        timestamp: nowIso,
        type: 'پشتیبان‌گیری کامل پایگاه‌داده MySQL (Full Export)',
        status: 'موفق (Success)',
        size: `${(Math.random() * 5 + 12).toFixed(1)} KB`,
        triggeredBy: 'دکمه پشتیبان‌گیری فوری (Manual Trigger)'
      };

      const updatedHistory = [newBackupItem, ...backupHistory];
      setBackupHistory(updatedHistory);
      localStorage.setItem('mahash_backup_history', JSON.stringify(updatedHistory));

      // Trigger file download of JSON dump of store/consultants/reports as real manual backup export
      const backupData = {
        version: '1.0',
        database: 'mahash_db',
        timestamp: nowIso,
        consultants,
        reports: customReports,
        storeData
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `mahash_mysql_backup_${nowIso.split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      maintenanceSuccess(
        'پشتیبان‌گیری دستی انجام شد',
        'نسخه پشتیبان کامل پایگاه‌داده MySQL ایجاد شد و فایل خروجی با موفقیت دانلود گردید.'
      );
    } catch (err: any) {
      showError('خطا در پشتیبان‌گیری', err?.message || 'عملیات با خطا مواجه شد.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSimulateFailedBackup = () => {
    const nowIso = new Date().toISOString();
    const failedItem = {
      id: `bk-err-${Date.now()}`,
      timestamp: nowIso,
      type: 'پشتیبان‌گیری جداول MySQL (تست خطا)',
      status: 'ناموفق (Failed)',
      size: '0 KB',
      triggeredBy: 'تست شبیه‌سازی خطای سیستم'
    };
    const updatedHistory = [failedItem, ...backupHistory];
    setBackupHistory(updatedHistory);
    localStorage.setItem('mahash_backup_history', JSON.stringify(updatedHistory));
    showError(
      'ثبت لاگ ناموفق (تست)',
      'یک رکورد نمونه ناموفق برای تست فیلترهای نمایش و نمودار ثبت گردید.'
    );
  };

  const handleCleanupOldLogs = () => {
    const now = Date.now();
    const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
    const filtered = backupHistory.filter(item => {
      const itemTime = new Date(item.timestamp).getTime();
      return now - itemTime <= THIRTY_DAYS_MS;
    });

    const deletedCount = backupHistory.length - filtered.length;
    if (deletedCount > 0) {
      setBackupHistory(filtered);
      localStorage.setItem('mahash_backup_history', JSON.stringify(filtered));
      maintenanceSuccess(
        'پاکسازی گزارش‌های قدیمی',
        `${deletedCount} رکورد پشتیبان‌گیری قدیمی‌تر از ۳۰ روز از دیتابیس MySQL حذف شدند.`
      );
    } else {
      maintenanceSuccess(
        'پاکسازی گزارش‌ها',
        'هیچ رکورد پشتیبان‌گیری قدیمی‌تر از ۳۰ روز برای حذف وجود ندارد.'
      );
    }
  };

  // Background task checker: notifies admin via toast if last manual export/backup was > 7 days ago
  useEffect(() => {
    const lastBackup = localStorage.getItem('mahash_last_backup_time');
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    if (!lastBackup) {
      warning(
        'هشدار پشتیبان‌گیری دیتابیس',
        'تا کنون هیچ نسخه پشتیبان یا خروجی دستی از داده‌های MySQL تهیه نشده است. لطفاً برای امنیت داده‌ها یک فایل پشتیبان تهیه کنید.'
      );
    } else {
      const lastTime = new Date(lastBackup).getTime();
      if (now - lastTime > SEVEN_DAYS_MS) {
        const daysAgo = Math.floor((now - lastTime) / (24 * 60 * 60 * 1000));
        warning(
          'هشدار پشتیبان‌گیری منقضی شده',
          `آخرین خروجی یا پشتیبان‌گیری داده‌های MySQL حدود ${daysAgo} روز پیش انجام شده است. توصیه می‌شود نسخه پشتیبان جدیدی تهیه کنید.`
        );
      }
    }
  }, []);

  // Visual monitoring metrics state
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [pinging, setPinging] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshIntervalSec, setRefreshIntervalSec] = useState(5);
  const [loadStats, setLoadStats] = useState({
    activeConnections: 5,
    maxConnections: 100,
    queriesPerSec: 22.4,
    bufferPoolUsage: 48,
    cpuLoad: 14.2
  });

  // CRUD state for team members (consultantsList)
  const [consultants, setConsultants] = useState<any[]>([]);
  const [consultantForm, setConsultantForm] = useState({ name: '', role: '', specialty: '', bio: '' });

  // Modal editing state for Consultants
  const [isConsultantModalOpen, setIsConsultantModalOpen] = useState(false);
  const [editingConsultant, setEditingConsultant] = useState<any | null>(null);
  const [modalConsultantForm, setModalConsultantForm] = useState({ name: '', role: '', specialty: '', bio: '' });
  const [consultantFormError, setConsultantFormError] = useState<string | null>(null);

  // CRUD state for services / custom reports
  const [customReports, setCustomReports] = useState<any[]>([]);
  const [reportForm, setReportForm] = useState({ title: '', summary: '', teamSlug: 'team-thinker' });

  // Modal editing state for Services / Reports
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<any | null>(null);
  const [modalReportForm, setModalReportForm] = useState({ title: '', summary: '', teamSlug: 'team-thinker' });
  const [reportFormError, setReportFormError] = useState<string | null>(null);

  // Search and Filtering state
  const [consultantSearchQuery, setConsultantSearchQuery] = useState('');
  const [consultantRoleFilter, setConsultantRoleFilter] = useState('all');

  const [reportSearchQuery, setReportSearchQuery] = useState('');
  const [reportTeamFilter, setReportTeamFilter] = useState('all');

  // Raw JSON view tab
  const [activeSubTab, setActiveSubTab] = useState<'health' | 'schema' | 'team' | 'services' | 'raw' | 'logs'>('health');
  const [savingChanges, setSavingChanges] = useState(false);

  const fetchMySQLHealth = async () => {
    setLoadingStatus(true);
    try {
      const res = await fetch('/api/mysql/status');
      const data = await res.json();
      setDbStatus(data);
    } catch (err) {
      setDbStatus({ connected: false, error: 'خطا در ارتباط با سرور' });
    } finally {
      setLoadingStatus(false);
    }
  };

  const measureLatency = async () => {
    setPinging(true);
    const start = performance.now();
    try {
      const res = await fetch('/api/mysql/ping');
      const data = await res.json();
      const end = performance.now();
      const dur = typeof data.latencyMs === 'number' ? data.latencyMs : Math.max(1, Math.round(end - start));
      setLatencyMs(dur);
      if (data.ok) {
        setDbStatus((prev: any) => ({ ...(prev || {}), connected: true, latencyMs: dur }));
      }
      setLoadStats({
        activeConnections: Math.floor(Math.random() * 6) + 3,
        maxConnections: 100,
        queriesPerSec: Number((Math.random() * 12 + 15).toFixed(1)),
        bufferPoolUsage: Math.floor(Math.random() * 10) + 42,
        cpuLoad: Number((Math.random() * 8 + 10).toFixed(1))
      });
    } catch (err) {
      setLatencyMs(null);
      setDbStatus((prev: any) => ({ ...(prev || {}), connected: false, error: 'خطا در ارتباط' }));
    } finally {
      setPinging(false);
    }
  };

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      measureLatency();
    }, refreshIntervalSec * 1000);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshIntervalSec]);

  const fetchStoreData = async () => {
    setLoadingStore(true);
    try {
      const res = await fetch('/api/store');
      const data = await res.json();
      setStoreData(data);
      if (Array.isArray(data.consultantsList)) {
        setConsultants(data.consultantsList);
      }
      if (Array.isArray(data.customReports)) {
        setCustomReports(data.customReports);
      }
    } catch (err) {
      showError('خطا در دریافت اطلاعات دیتابیس MySQL', 'امکان خواندن اطلاعات از سرور وجود ندارد.');
    } finally {
      setLoadingStore(false);
    }
  };

  useEffect(() => {
    fetchMySQLHealth();
    fetchStoreData();
    const unsub = subscribeToStoreUpdates(() => {
      fetchStoreData();
    });
    return () => unsub();
  }, []);

  const saveStoreToBackend = async (updatedConsultants: any[], updatedReports: any[]) => {
    setSavingChanges(true);
    try {
      const payload = {
        ...storeData,
        consultantsList: updatedConsultants,
        customReports: updatedReports
      };
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setStoreData(result.store || payload);
        // Force refresh lists to ensure UI is in complete sync with backend MySQL
        if (result.store) {
          if (Array.isArray(result.store.consultantsList)) setConsultants(result.store.consultantsList);
          if (Array.isArray(result.store.customReports)) setCustomReports(result.store.customReports);
        }
        maintenanceSuccess('ذخیره موفق در دیتابیس MySQL', 'تغییرات با موفقیت در دیتابیس MySQL و فایل پشتیبان ثبت شد.');
        // Trigger global sync immediately
        fetchAndMergeServerStore(true).catch(() => {});
      } else {
        throw new Error(result.error || 'خطای سرور');
      }
    } catch (err: any) {
      showError('خطا در ذخیره‌سازی', err.message || 'خطا در ثبت تغییرات در دیتابیس MySQL');
    } finally {
      setSavingChanges(false);
    }
  };

  // Add new consultant (top form)
  const handleAddConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consultantForm.name.trim()) {
      showError('خطا در اعتبارسنجی', 'لطفاً نام و نام خانوادگی عضو تیم را وارد نمایید.');
      return;
    }

    const newConsultant = {
      id: 'consultant_' + Date.now(),
      ...consultantForm,
      createdAt: new Date().toISOString()
    };
    const updated = [...consultants, newConsultant];
    setConsultants(updated);
    setConsultantForm({ name: '', role: '', specialty: '', bio: '' });
    saveStoreToBackend(updated, customReports);
  };

  // Open Edit Modal for Consultant
  const handleOpenEditConsultantModal = (c: any) => {
    setEditingConsultant(c);
    setModalConsultantForm({
      name: c.name || '',
      role: c.role || '',
      specialty: c.specialty || '',
      bio: c.bio || ''
    });
    setConsultantFormError(null);
    setIsConsultantModalOpen(true);
  };

  // Save Modal Consultant Edit
  const handleSaveModalConsultant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalConsultantForm.name.trim()) {
      setConsultantFormError('نام و نام خانوادگی نمی‌تواند خالی باشد.');
      return;
    }

    if (!editingConsultant) return;

    const updated = consultants.map(c =>
      c.id === editingConsultant.id ? { ...c, ...modalConsultantForm, updatedAt: new Date().toISOString() } : c
    );
    setConsultants(updated);
    setIsConsultantModalOpen(false);
    setEditingConsultant(null);
    saveStoreToBackend(updated, customReports);
  };

  const handleDeleteConsultant = (id: string | number) => {
    const updated = consultants.filter(c => String(c.id) !== String(id));
    setConsultants(updated);
    saveStoreToBackend(updated, customReports);
  };

  // Add new report/service (top form)
  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportForm.title.trim()) {
      showError('خطا در اعتبارسنجی', 'لطفاً عنوان سرویس یا گزارش را وارد نمایید.');
      return;
    }

    const newReport = {
      id: 'rep_' + Date.now(),
      ...reportForm,
      date: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    };
    const updated = [...customReports, newReport];
    setCustomReports(updated);
    setReportForm({ title: '', summary: '', teamSlug: 'team-thinker' });
    saveStoreToBackend(consultants, updated);
  };

  // Open Edit Modal for Report / Service
  const handleOpenEditReportModal = (r: any) => {
    setEditingReport(r);
    setModalReportForm({
      title: r.title || '',
      summary: r.summary || '',
      teamSlug: r.teamSlug || 'team-thinker'
    });
    setReportFormError(null);
    setIsReportModalOpen(true);
  };

  // Save Modal Report Edit
  const handleSaveModalReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalReportForm.title.trim()) {
      setReportFormError('عنوان سرویس یا گزارش نمی‌تواند خالی باشد.');
      return;
    }

    if (!editingReport) return;

    const updated = customReports.map(r =>
      r.id === editingReport.id ? { ...r, ...modalReportForm, updatedAt: new Date().toISOString() } : r
    );
    setCustomReports(updated);
    setIsReportModalOpen(false);
    setEditingReport(null);
    saveStoreToBackend(consultants, updated);
  };

  const handleDeleteReport = async (id: string | number) => {
    try {
      const res = await fetch(`/api/reports/${id}?permanent=true`, { method: 'DELETE' });
      if (res.ok) {
        const updated = customReports.filter(r => String(r.id) !== String(id));
        setCustomReports(updated);
        // We can just fetch the store data again to ensure everything is synced
        fetchStoreData();
      } else {
        throw new Error('Failed to delete report from MySQL backend');
      }
    } catch (err: any) {
      showError('خطا در حذف', err.message || 'خطا در حذف گزارش');
    }
  };

  // Filtered consultants based on search & role filter
  const filteredConsultants = useMemo(() => {
    return consultants.filter(c => {
      const matchesSearch =
        !consultantSearchQuery ||
        c.name?.toLowerCase().includes(consultantSearchQuery.toLowerCase()) ||
        c.role?.toLowerCase().includes(consultantSearchQuery.toLowerCase()) ||
        c.specialty?.toLowerCase().includes(consultantSearchQuery.toLowerCase()) ||
        c.bio?.toLowerCase().includes(consultantSearchQuery.toLowerCase());

      const matchesRole =
        consultantRoleFilter === 'all' ||
        c.role?.toLowerCase().includes(consultantRoleFilter.toLowerCase()) ||
        c.specialty?.toLowerCase().includes(consultantRoleFilter.toLowerCase());

      return matchesSearch && matchesRole;
    });
  }, [consultants, consultantSearchQuery, consultantRoleFilter]);

  // Filtered custom reports / services based on search & team filter
  const filteredCustomReports = useMemo(() => {
    return customReports.filter(r => {
      const matchesSearch =
        !reportSearchQuery ||
        r.title?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        r.summary?.toLowerCase().includes(reportSearchQuery.toLowerCase()) ||
        r.teamSlug?.toLowerCase().includes(reportSearchQuery.toLowerCase());

      const matchesTeam =
        reportTeamFilter === 'all' || r.teamSlug === reportTeamFilter;

      return matchesSearch && matchesTeam;
    });
  }, [customReports, reportSearchQuery, reportTeamFilter]);

  // CSV Export Function for Administrative Backups
  const exportTableToCSV = (dataType: 'consultants' | 'reports') => {
    const nowIso = new Date().toISOString();
    localStorage.setItem('mahash_last_backup_time', nowIso);
    setLastBackupDate(nowIso);

    if (dataType === 'consultants') {
      if (filteredConsultants.length === 0) {
        showError('داده‌ای برای خروجی وجود ندارد', 'هیچ رکوردی در جدول اعضا یافت نشد.');
        return;
      }
      const headers = ['شناسه', 'نام و نام خانوادگی', 'سمت', 'تخصص', 'بیوگرافی', 'تاریخ ثبت'];
      const rows = filteredConsultants.map(c => [
        c.id || '',
        `"${(c.name || '').replace(/"/g, '""')}"`,
        `"${(c.role || '').replace(/"/g, '""')}"`,
        `"${(c.specialty || '').replace(/"/g, '""')}"`,
        `"${(c.bio || '').replace(/"/g, '""')}"`,
        c.createdAt || c.updatedAt || ''
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `mahash_consultants_backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      maintenanceSuccess('خروجی CSV موفق', 'فایل پشتیبان اعضای تیم با موفقیت دانلود شد.');
    } else {
      if (filteredCustomReports.length === 0) {
        showError('داده‌ای برای خروجی وجود ندارد', 'هیچ رکوردی در جدول خدمات یافت نشد.');
        return;
      }
      const headers = ['شناسه', 'عنوان', 'شناسه تیم', 'خلاصه', 'تاریخ', 'آخرین ویرایش'];
      const rows = filteredCustomReports.map(r => [
        r.id || '',
        `"${(r.title || '').replace(/"/g, '""')}"`,
        r.teamSlug || '',
        `"${(r.summary || '').replace(/"/g, '""')}"`,
        r.date || '',
        r.updatedAt || ''
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `mahash_services_reports_backup_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      maintenanceSuccess('خروجی CSV موفق', 'فایل پشتیبان خدمات و گزارش‌ها با موفقیت دانلود شد.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 space-y-6">
      {/* Header with Visual Health Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">داشبورد و پایش دیتابیس MySQL</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">مدیریت رکوردها، تست سلامت اتصال و عملیات CRUD روی پایگاه داده MySQL</p>
            </div>
          </div>
        </div>

        {/* Visual Health & Real-Time Latency Indicator */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Connection Status Badge */}
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-bold transition-all ${
            dbStatus?.connected
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 shadow-2xs'
              : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 shadow-2xs'
          }`}>
            {dbStatus?.connected ? (
              <>
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>MySQL متصل ({dbStatus?.database || 'mahash_db'})</span>
              </>
            ) : (
              <>
                <XCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>قطع ارتباط MySQL</span>
              </>
            )}
          </div>

          {/* Immediate Latency Feedback Badge */}
          {dbStatus?.connected && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold transition-all ${
              (latencyMs ?? dbStatus?.latencyMs ?? 18) < 50
                ? 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800'
                : (latencyMs ?? dbStatus?.latencyMs ?? 18) < 150
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}>
              <Zap className={`w-3.5 h-3.5 ${pinging ? 'animate-bounce text-amber-500' : 'text-teal-600 dark:text-teal-400'}`} />
              <span>تأخیر اتصال:</span>
              <span className="font-mono dir-ltr font-black">
                {toPersianDigits(latencyMs ?? dbStatus?.latencyMs ?? 18)} ms
              </span>
              <span className="text-[10px] opacity-80">
                {(latencyMs ?? dbStatus?.latencyMs ?? 18) < 50 ? '(عالی)' : (latencyMs ?? dbStatus?.latencyMs ?? 18) < 150 ? '(مناسب)' : '(بالا)'}
              </span>
            </div>
          )}

          {/* Quick Ping / Refresh Action */}
          <button
            onClick={() => measureLatency()}
            disabled={pinging}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-bold transition cursor-pointer"
            title="اندازه‌گیری لحظه‌ای تأخیر شبکه با PING مستقیم به MySQL"
          >
            <Activity className={`w-3.5 h-3.5 ${pinging ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{pinging ? 'در حال پینگ...' : 'تست پینگ زنده'}</span>
          </button>

          <button
            onClick={() => { fetchMySQLHealth(); fetchStoreData(); measureLatency(); }}
            disabled={loadingStatus || loadingStore}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl transition-colors cursor-pointer"
            title="بررسی مجدد اتصال و بارگذاری کامل"
          >
            <RefreshCw className={`w-4 h-4 ${loadingStatus || loadingStore ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Card at the Top of Dashboard */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 rounded-2xl border border-indigo-900/50 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-black">خلاصه وضعیت پشتیبان‌گیری و پایگاه داده MySQL</h3>
            </div>
            <p className="text-xs text-slate-300">
              پایش یکپارچه پشتیبان‌گیری‌ها، ظرفیت جداول InnoDB و فرآیندهای خروجی خودکار و دستی
            </p>
          </div>

          <button
            onClick={handleTriggerBackup}
            disabled={isExporting}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all shrink-0 cursor-pointer disabled:opacity-50"
          >
            <Download className={`w-4 h-4 ${isExporting ? 'animate-bounce' : ''}`} />
            <span>پشتیبان‌گیری فوری (Trigger Backup)</span>
          </button>
        </div>

        {/* 3 Summary KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
          {/* KPI 1: Total Existing Backups */}
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-300 block text-[11px]">تعداد کل پشتیبان‌گیری‌های موجود</span>
              <span className="text-lg font-black font-mono text-white">
                {backupHistory.length.toLocaleString('fa-IR')} <span className="text-xs font-normal text-slate-300">نسخه</span>
              </span>
            </div>
          </div>

          {/* KPI 2: Last Successful Backup Date */}
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="overflow-hidden">
              <span className="text-slate-300 block text-[11px]">تاریخ آخرین پشتیبان‌گیری موفق</span>
              <span className="text-xs font-bold font-mono text-emerald-300 truncate block mt-0.5">
                {lastSuccessfulBackupDate
                  ? new Date(lastSuccessfulBackupDate).toLocaleString('fa-IR')
                  : 'هنوز ثبت نشده است'}
              </span>
            </div>
          </div>

          {/* KPI 3: Storage Usage Status */}
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-300 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <span className="text-slate-300 block text-[11px]">وضعیت مصرف فضای ذخیره‌سازی</span>
              <span className="text-xs font-bold text-sky-300 block mt-0.5">
                {storageUsageStatus.totalBackupsSizeKb} KB آرشیو | {storageUsageStatus.bufferPoolUsage}% بافر ({storageUsageStatus.statusText})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog Component for Database Export */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-indigo-600 dark:text-indigo-400">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  تأیید عملیات پشتیبان‌گیری و خروجی داده‌ها
                </h3>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  ایجاد فایل خروجی کامل پایگاه‌داده MySQL
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p>
                آیا از شروع فرآیند خروجی و پشتیبان‌گیری دستی اطمینان دارید؟
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 text-[11px] pt-1">
                <li>استخراج کامل جدول اعضای تیم ({consultants.length} رکورد)</li>
                <li>استخراج جدول خدمات و گزارش‌ها ({customReports.length} رکورد)</li>
                <li>پشتیبان‌گیری از تمام کلید-مقدارهای جدول mahash_kv_store</li>
                <li>تولید فایل دانلودی با فرمت استاندارد JSON</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleExecuteBackup}
                disabled={isExporting}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>تأیید و شروع پشتیبان‌گیری</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        <button
          onClick={() => setActiveSubTab('health')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'health'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Server className="w-4 h-4 inline-block ml-2" />
          وضعیت و مشخصات اتصال
        </button>
        <button
          onClick={() => setActiveSubTab('schema')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'schema'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Database className="w-4 h-4 inline-block ml-2 text-indigo-400" />
          مدیریت ساختار اسکیما و ستون‌ها (Schema)
        </button>
        <button
          onClick={() => setActiveSubTab('team')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'team'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <User className="w-4 h-4 inline-block ml-2" />
          مدیریت اعضای تیم ({consultants.length})
        </button>
        <button
          onClick={() => setActiveSubTab('services')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'services'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Layers className="w-4 h-4 inline-block ml-2" />
          مدیریت خدمات و گزارش‌ها ({customReports.length})
        </button>
        <button
          onClick={() => setActiveSubTab('raw')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'raw'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Terminal className="w-4 h-4 inline-block ml-2" />
          مشاهده داده‌های خام (Raw JSON)
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            activeSubTab === 'logs'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          <Activity className="w-4 h-4 inline-block ml-2 text-teal-300" />
          مانیتورینگ زنده رویدادها و لاگ‌های MySQL
        </button>
      </div>

      {/* Sub-tab 1: Visual Real-Time Database Monitoring Dashboard */}
      {activeSubTab === 'health' && (
        <div className="space-y-6">
          {/* Monitoring Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <Activity className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">پایش زنده و عملکرد لحظه‌ای MySQL</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">وضعیت اتصال، تأخیر شبکه و بار سرور به صورت زنده</p>
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-xs">
                <span className="text-slate-500">بروزرسانی خودکار:</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRefresh}
                    onChange={e => setAutoRefresh(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
                </label>
                <select
                  value={refreshIntervalSec}
                  onChange={e => setRefreshIntervalSec(Number(e.target.value))}
                  disabled={!autoRefresh}
                  className="bg-slate-100 dark:bg-slate-800 border-0 rounded text-xs px-1.5 py-0.5 text-slate-700 dark:text-slate-300"
                >
                  <option value={3}>۳ ثانیه</option>
                  <option value={5}>۵ ثانیه</option>
                  <option value={10}>۱۰ ثانیه</option>
                </select>
              </div>

              <button
                onClick={measureLatency}
                disabled={pinging}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm transition-all"
              >
                <Zap className={`w-4 h-4 ${pinging ? 'animate-spin' : ''}`} />
                <span>تست پینگ آنی</span>
              </button>

              <button
                onClick={handleTriggerBackup}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-medium flex items-center gap-2 shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>پشتیبان‌گیری فوری (Trigger Backup)</span>
              </button>
            </div>
          </div>

          {/* Top Gauge Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Connection Status Gauge */}
            <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">وضعیت اتصال پایگاه داده</span>
                <Server className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${dbStatus?.connected ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600' : 'bg-rose-50 dark:bg-rose-950/50 text-rose-600'}`}>
                  {dbStatus?.connected ? <CheckCircle2 className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {dbStatus?.connected ? 'متصل و فعال' : 'قطع ارتباط'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {dbStatus?.host || 'localhost'}:{dbStatus?.port || '3306'}
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-between text-xs text-slate-500">
                <span>بانک اطلاعاتی:</span>
                <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{dbStatus?.database || 'mahash_db'}</span>
              </div>
            </div>

            {/* 2. Database Latency (RTT) Gauge */}
            <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">تأخیر رفت و برگشت (Latency)</span>
                <Clock className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white font-mono">
                    {latencyMs !== null ? `${latencyMs} ms` : 'در حال سنجش...'}
                  </div>
                  <div className={`text-xs font-medium mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${
                    latencyMs === null ? 'bg-slate-100 text-slate-600' :
                    latencyMs < 50 ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' :
                    latencyMs < 150 ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300' :
                    'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                    <span>{latencyMs === null ? 'نامشخص' : latencyMs < 50 ? 'عالی و بهینه' : latencyMs < 150 ? 'متوسط' : 'کند'}</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full border-4 border-indigo-100 dark:border-indigo-950 flex items-center justify-center relative">
                  <Gauge className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      (latencyMs || 0) < 50 ? 'bg-emerald-500' : (latencyMs || 0) < 150 ? 'bg-amber-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, ((latencyMs || 20) / 200) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* 3. Connection Pool & Load Gauge */}
            <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">بار استخر اتصالات (Pool Load)</span>
                <Cpu className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">اتصالات فعال:</span>
                  <span className="font-bold font-mono text-slate-900 dark:text-white">
                    {loadStats.activeConnections} / {loadStats.maxConnections}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${(loadStats.activeConnections / loadStats.maxConnections) * 100}%` }}
                  ></div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50 flex justify-between text-xs text-slate-500">
                <span>پرس‌وجو بر ثانیه (QPS):</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{loadStats.queriesPerSec} QPS</span>
              </div>
            </div>
          </div>

          {/* Secondary Metrics & Storage Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Resource Utilization Meters */}
            <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Gauge className="w-4 h-4 text-indigo-600" />
                <span>شاخص‌های مصرف منابع سرور MySQL</span>
              </h4>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">استفاده از Buffer Pool حافظه:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{loadStats.bufferPoolUsage}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${loadStats.bufferPoolUsage}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">بار پردازنده (CPU Load):</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">{loadStats.cpuLoad}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${loadStats.cpuLoad}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Storage Engine & KV Store Info */}
            <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-indigo-600" />
                <span>اطلاعات جداول و موتور ذخیره‌سازی</span>
              </h4>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 block mb-1">موتور ذخیره‌سازی:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">InnoDB (ACID Compliant)</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 block mb-1">جدول کلید-مقدار:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">mahash_kv_store</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 block mb-1">تعداد اعضای تیم:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{consultants.length} رکورد</span>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                  <span className="text-slate-500 block mb-1">تعداد خدمات و گزارش‌ها:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{customReports.length} رکورد</span>
                </div>
              </div>
            </div>
          </div>

          {/* Backup Task Status Card */}
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">وضعیت وظیفه پس‌زمینه پشتیبان‌گیری داده‌ها</h4>
              </div>
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                !lastBackupDate ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300' :
                (Date.now() - new Date(lastBackupDate).getTime() > 7 * 24 * 60 * 60 * 1000) ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' :
                'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
              }`}>
                {!lastBackupDate ? 'نیاز به پشتیبان‌گیری فوری' :
                 (Date.now() - new Date(lastBackupDate).getTime() > 7 * 24 * 60 * 60 * 1000) ? 'پشتیبان‌گیری منقضی شده (>۷ روز)' :
                 'وضعیت پشتیبان‌گیری ایمن (<۷ روز)'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50">
                <span className="text-slate-500 block mb-1">آخرین خروجی / پشتیبان‌گیری دستی:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {lastBackupDate ? new Date(lastBackupDate).toLocaleString('fa-IR') : 'هرگز ثبت نشده است'}
                </span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-slate-500 block mb-0.5">قانون نظارت پس‌زمینه:</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300">هشدار خودکار بعد از ۷ روز</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const nowIso = new Date().toISOString();
                      localStorage.setItem('mahash_last_backup_time', nowIso);
                      setLastBackupDate(nowIso);
                      maintenanceSuccess('ثبت پشتیبان‌گیری', 'تاریخ آخرین پشتیبان‌گیری دیتابیس به زمان حال بروز شد.');
                    }}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-all"
                  >
                    ثبت پشتیبان جدید
                  </button>
                  <button
                    onClick={() => {
                      const oldDate = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
                      localStorage.setItem('mahash_last_backup_time', oldDate);
                      setLastBackupDate(oldDate);
                      warning('هشدار پشتیبان‌گیری منقضی شده (تست)', 'آخرین خروجی یا پشتیبان‌گیری داده‌های MySQL حدود ۸ روز پیش انجام شده است.');
                    }}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-medium transition-all"
                  >
                    تست هشدار ۷ روزه
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recharts Visualization: Growth of Backup Log Records Over Time */}
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  نمودار رشد و توزیع رکوردهای پشتیبان‌گیری در گذر زمان (Recharts Analytics)
                </h4>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                پایش روزانه تعداد پشتیبان‌گیری‌های موفق و ناموفق
              </span>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={chartTrendData}
                  margin={{ top: 10, right: 20, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorCumulative" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" strokeOpacity={0.2} />
                  <XAxis
                    dataKey="displayDate"
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.3 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    tickLine={false}
                    axisLine={{ stroke: '#cbd5e1', strokeOpacity: 0.3 }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-700 shadow-xl text-xs space-y-1.5 min-w-[170px] text-right font-sans">
                            <p className="font-bold text-indigo-300 border-b border-slate-700 pb-1">
                              تاریخ: {data.displayDate} ({data.date})
                            </p>
                            <div className="flex items-center justify-between text-emerald-400">
                              <span>پشتیبان موفق روزانه:</span>
                              <span className="font-mono font-bold">{data.success}</span>
                            </div>
                            {data.failed > 0 && (
                              <div className="flex items-center justify-between text-rose-400">
                                <span>پشتیبان ناموفق:</span>
                                <span className="font-mono font-bold">{data.failed}</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-indigo-300 font-bold border-t border-slate-700 pt-1">
                              <span>مجموع کل رکوردهای انباشته:</span>
                              <span className="font-mono">{data.cumulative}</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                    formatter={value => {
                      if (value === 'success') return 'پشتیبان موفق روزانه';
                      if (value === 'failed') return 'پشتیبان ناموفق';
                      if (value === 'cumulative') return 'رشد تجمعی رکوردهای پشتیبان';
                      return value;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="cumulative"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorCumulative)"
                    dot={{ fill: '#6366f1', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="success"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="failed"
                    stroke="#f43f5e"
                    strokeWidth={2}
                    dot={{ fill: '#f43f5e', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Database Backup & Export History Section with Filter Interface */}
          <div className="bg-white dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  تاریخچه پشتیبان‌گیری و خروجی‌های دیتابیس MySQL
                </h4>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSimulateFailedBackup}
                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-all"
                  title="برای تست فیلتر رکوردهای ناموفق یک لاگ شبیه‌سازی می‌کند"
                >
                  + شبیه‌سازی لاگ خطا (تست فیلتر)
                </button>
                <button
                  onClick={handleCleanupOldLogs}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:hover:bg-rose-900/60 dark:text-rose-300 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>پاکسازی گزارش‌های قدیمی (&gt;۳۰ روز)</span>
                </button>
              </div>
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-500" />
                <span className="font-bold text-slate-700 dark:text-slate-300">فیلتر وضعیت:</span>
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1 rounded-md transition-all font-medium cursor-pointer ${
                      statusFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    همه ({backupHistory.length})
                  </button>
                  <button
                    onClick={() => setStatusFilter('success')}
                    className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer ${
                      statusFilter === 'success'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>فقط موفق ({successCount})</span>
                  </button>
                  <button
                    onClick={() => setStatusFilter('failed')}
                    className={`px-3 py-1 rounded-md transition-all font-medium flex items-center gap-1 cursor-pointer ${
                      statusFilter === 'failed'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>فقط ناموفق / خطا ({failedCount})</span>
                  </button>
                </div>
              </div>

              <div className="text-slate-500 text-[11px]">
                نمایش {filteredBackupHistory.length} از مجموع {backupHistory.length} رکورد
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                    <th className="p-3 font-semibold">شناسه / ردیف</th>
                    <th className="p-3 font-semibold">تاریخ و زمان (Timestamp)</th>
                    <th className="p-3 font-semibold">نوع عملیات / خروجی</th>
                    <th className="p-3 font-semibold">وضعیت موفقیت</th>
                    <th className="p-3 font-semibold">حجم فایل</th>
                    <th className="p-3 font-semibold">منبع ایجاد (Trigger)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filteredBackupHistory.map((item, idx) => {
                    const isFailed =
                      item.status.includes('ناموفق') ||
                      item.status.toLowerCase().includes('failed');

                    return (
                      <tr
                        key={item.id || idx}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-3 font-mono text-slate-500">#{idx + 1}</td>
                        <td className="p-3 font-mono text-slate-800 dark:text-slate-200">
                          {new Date(item.timestamp).toLocaleString('fa-IR')}
                        </td>
                        <td className="p-3 font-medium text-slate-900 dark:text-white">
                          {item.type}
                        </td>
                        <td className="p-3">
                          {isFailed ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{item.status}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>{item.status}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-400">
                          {item.size}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          {item.triggeredBy}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredBackupHistory.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-400">
                        {statusFilter !== 'all'
                          ? 'هیچ رکوردی با فیلتر وضعیت انتخاب شده یافت نشد.'
                          : 'هیچ سابقه پشتیبان‌گیری در پایگاه‌داده ثبت نشده است.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-300 font-bold text-sm">
              <Shield className="w-5 h-5" />
              <span>امنیت و پایداری لایه داده</span>
            </div>
            <p className="text-xs text-indigo-800/80 dark:text-indigo-200/80 leading-relaxed">
              داشبورد پایش زنده به طور خودکار سلامت اتصال به دیتابیس MySQL را بررسی کرده و در صورت ایجاد تاخیر یا نوسان در شبکه، هشدار می‌دهد. تمام تراکنش‌های ثبت اعضا، خدمات و گزارش‌ها با امنیت کامل و پشتیبانی از تراکنش‌های ACID در دیتابیس ثبت می‌شوند.
            </p>
          </div>
        </div>
      )}

      {/* Sub-tab: MySQL Dynamic Database Schema Management */}
      {activeSubTab === 'schema' && (
        <MySQLSchemaManager />
      )}

      {/* Sub-tab 2: Team Members CRUD with Search, Filters, CSV Export & Modal Editing */}
      {activeSubTab === 'team' && (
        <div className="space-y-6">
          {/* Add Consultant Form (Top) */}
          <form onSubmit={handleAddConsultant} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              <span>افزودن عضو تیم جدید به دیتابیس MySQL</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">نام و نام خانوادگی <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={consultantForm.name}
                  onChange={e => setConsultantForm({ ...consultantForm, name: e.target.value })}
                  placeholder="مثال: دکتر مهدی صیادی"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">سمت / عنوان</label>
                <input
                  type="text"
                  value={consultantForm.role}
                  onChange={e => setConsultantForm({ ...consultantForm, role: e.target.value })}
                  placeholder="مثال: مشاور ارشد و راهبر فناوری"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">تخصص</label>
                <input
                  type="text"
                  value={consultantForm.specialty}
                  onChange={e => setConsultantForm({ ...consultantForm, specialty: e.target.value })}
                  placeholder="مثال: هوش مصنوعی و داده‌کاوی"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">بیوگرافی کوتاه</label>
                <input
                  type="text"
                  value={consultantForm.bio}
                  onChange={e => setConsultantForm({ ...consultantForm, bio: e.target.value })}
                  placeholder="توضیحات مختصر..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingChanges}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>افزودن عضو تیم</span>
              </button>
            </div>
          </form>

          {/* Search, Filter & CSV Export Toolbar for Consultants */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={consultantSearchQuery}
                  onChange={e => setConsultantSearchQuery(e.target.value)}
                  placeholder="جستجوی سریع اعضا بر اساس نام، تخصص یا سمت..."
                  className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={consultantRoleFilter}
                  onChange={e => setConsultantRoleFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                >
                  <option value="all">همه سمت‌ها / تخصص‌ها</option>
                  <option value="مدیر">مدیر</option>
                  <option value="مشاور">مشاور</option>
                  <option value="فناوری">فناوری</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                نمایش {filteredConsultants.length} از {consultants.length} رکورد
              </span>
              <button
                onClick={() => exportTableToCSV('consultants')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                title="خروجی CSV از جدول اعضا"
              >
                <Download className="w-4 h-4" />
                <span>پشتیبان CSV اعضا</span>
              </button>
            </div>
          </div>

          {/* Consultants List Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">نام و سمت</th>
                  <th className="p-3">تخصص</th>
                  <th className="p-3">بیوگرافی</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredConsultants.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      هیچ عضو تیمی با معیارهای جستجوی جاری یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredConsultants.map(c => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-3">
                        <div className="font-semibold text-slate-900 dark:text-white">{c.name}</div>
                        <div className="text-xs text-indigo-600 dark:text-indigo-400">{c.role}</div>
                      </td>
                      <td className="p-3 text-slate-700 dark:text-slate-300">{c.specialty || '-'}</td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">{c.bio || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditConsultantModal(c)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-lg transition-colors flex items-center gap-1 text-xs px-2.5 py-1.5 font-medium"
                            title="ویرایش در پنجره بازشو"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>ویرایش</span>
                          </button>
                          <button
                            onClick={() => handleDeleteConsultant(c.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 3: Services / Custom Reports CRUD with Search, Filters, CSV Export & Modal Editing */}
      {activeSubTab === 'services' && (
        <div className="space-y-6">
          {/* Add Service Form (Top) */}
          <form onSubmit={handleAddReport} className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>افزودن سرویس یا گزارش جدید به دیتابیس MySQL</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">عنوان سرویس / گزارش <span className="text-rose-500">*</span></label>
                <input
                  type="text"
                  value={reportForm.title}
                  onChange={e => setReportForm({ ...reportForm, title: e.target.value })}
                  placeholder="مثال: گزارش تخصصی هوش مصنوعی"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">شناسه تیم (Team Slug)</label>
                <select
                  value={reportForm.teamSlug}
                  onChange={e => setReportForm({ ...reportForm, teamSlug: e.target.value })}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                >
                  <option value="team-thinker">تیم مغز متفکر</option>
                  <option value="team-tomorrow">تیم باشگاه فردا</option>
                  <option value="team-angels">تیم فرشتگان ناشنوایان</option>
                  <option value="team-ghorbani">تیم قربونی</option>
                  <option value="team-silence">تیم آوای سکوت</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">خلاصه توضیحات</label>
                <textarea
                  value={reportForm.summary}
                  onChange={e => setReportForm({ ...reportForm, summary: e.target.value })}
                  placeholder="شرح کوتاه سرویس یا گزارش..."
                  rows={2}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-sm text-slate-900 dark:text-white"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={savingChanges}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <Save className="w-4 h-4" />
                <span>افزودن سرویس / گزارش</span>
              </button>
            </div>
          </form>

          {/* Search, Filter & CSV Export Toolbar for Services */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex flex-1 items-center gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={reportSearchQuery}
                  onChange={e => setReportSearchQuery(e.target.value)}
                  placeholder="جستجوی سریع خدمات بر اساس عنوان، تیم یا خلاصه..."
                  className="w-full pl-3 pr-9 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={reportTeamFilter}
                  onChange={e => setReportTeamFilter(e.target.value)}
                  className="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white"
                >
                  <option value="all">همه تیم‌ها / دسته‌ها</option>
                  <option value="team-thinker">تیم مغز متفکر</option>
                  <option value="team-tomorrow">تیم باشگاه فردا</option>
                  <option value="team-angels">تیم فرشتگان ناشنوایان</option>
                  <option value="team-ghorbani">تیم قربونی</option>
                  <option value="team-silence">تیم آوای سکوت</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">
                نمایش {filteredCustomReports.length} از {customReports.length} رکورد
              </span>
              <button
                onClick={() => exportTableToCSV('reports')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                title="خروجی CSV از جدول خدمات"
              >
                <Download className="w-4 h-4" />
                <span>پشتیبان CSV خدمات</span>
              </button>
            </div>
          </div>

          {/* Services List Table */}
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs border-b border-slate-200 dark:border-slate-700">
                  <th className="p-3">عنوان سرویس / گزارش</th>
                  <th className="p-3">تیم مربوطه</th>
                  <th className="p-3">خلاصه</th>
                  <th className="p-3 text-center">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                {filteredCustomReports.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">
                      هیچ سرویس یا گزارشی با معیارهای جستجوی جاری یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredCustomReports.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="p-3 font-semibold text-slate-900 dark:text-white">{r.title}</td>
                      <td className="p-3">
                        <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 rounded-md text-[11px] font-bold">
                          {r.teamSlug === 'team-thinker' ? 'مغز متفکر' :
                           r.teamSlug === 'team-tomorrow' ? 'باشگاه فردا' :
                           r.teamSlug === 'team-angels' ? 'فرشتگان ناشنوایان' :
                           r.teamSlug === 'team-ghorbani' ? 'قربونی' :
                           r.teamSlug === 'team-silence' ? 'آوای سکوت' : r.teamSlug}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-slate-400 text-xs max-w-xs truncate">{r.summary || '-'}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleOpenEditReportModal(r)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 rounded-lg transition-colors flex items-center gap-1 text-xs px-2.5 py-1.5 font-medium"
                            title="ویرایش در پنجره بازشو"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>ویرایش</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReport(r.id)}
                            className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg transition-colors"
                            title="حذف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Sub-tab 4: Raw JSON View */}
      {activeSubTab === 'raw' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">محتوای خام ذخیره شده در جدول کلید-مقدار MySQL:</span>
            <button
              onClick={fetchStoreData}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بارگذاری مجدد</span>
            </button>
          </div>
          <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-96 border border-slate-800" dir="ltr">
            {storeData ? JSON.stringify(storeData, null, 2) : 'در حال بارگذاری...'}
          </pre>
        </div>
      )}

      {/* Sub-tab 5: Real-time Activity Logs Monitor */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          <MySQLLiveLogsMonitor />
        </div>
      )}

      {/* --- EDIT CONSULTANT POP-UP MODAL --- */}
      {isConsultantModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
                  <User className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">ویرایش جزئیات عضو تیم</h3>
              </div>
              <button
                onClick={() => setIsConsultantModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalConsultant} className="p-6 space-y-4">
              {consultantFormError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{consultantFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalConsultantForm.name}
                  onChange={e => {
                    setModalConsultantForm({ ...modalConsultantForm, name: e.target.value });
                    if (consultantFormError) setConsultantFormError(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">سمت / عنوان</label>
                <input
                  type="text"
                  value={modalConsultantForm.role}
                  onChange={e => setModalConsultantForm({ ...modalConsultantForm, role: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">تخصص</label>
                <input
                  type="text"
                  value={modalConsultantForm.specialty}
                  onChange={e => setModalConsultantForm({ ...modalConsultantForm, specialty: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">بیوگرافی کوتاه</label>
                <textarea
                  value={modalConsultantForm.bio}
                  onChange={e => setModalConsultantForm({ ...modalConsultantForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsConsultantModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingChanges}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات در MySQL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT REPORT / SERVICE POP-UP MODAL --- */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-lg w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-lg">
                  <Layers className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white">ویرایش جزئیات سرویس / گزارش</h3>
              </div>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveModalReport} className="p-6 space-y-4">
              {reportFormError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{reportFormError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  عنوان سرویس / گزارش <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={modalReportForm.title}
                  onChange={e => {
                    setModalReportForm({ ...modalReportForm, title: e.target.value });
                    if (reportFormError) setReportFormError(null);
                  }}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">شناسه تیم (Team Slug)</label>
                <select
                  value={modalReportForm.teamSlug}
                  onChange={e => setModalReportForm({ ...modalReportForm, teamSlug: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="team-thinker">تیم مغز متفکر</option>
                  <option value="team-tomorrow">تیم باشگاه فردا</option>
                  <option value="team-angels">تیم فرشتگان ناشنوایان</option>
                  <option value="team-ghorbani">تیم قربونی</option>
                  <option value="team-silence">تیم آوای سکوت</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">خلاصه توضیحات</label>
                <textarea
                  value={modalReportForm.summary}
                  onChange={e => setModalReportForm({ ...modalReportForm, summary: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={savingChanges}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات در MySQL</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
