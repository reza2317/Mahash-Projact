import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Database,
  Activity,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Clock,
  User,
  Phone,
  FileText,
  UserPlus,
  MessageSquare,
  Trash2,
  Download,
  Eye,
  X,
  Play,
  Pause,
  Server,
  Zap,
  Check,
  Award,
  Sparkles,
  ChevronDown,
  BarChart3,
  TrendingUp,
  SlidersHorizontal,
  ArrowUpDown,
  Calendar,
  Layers,
  FileSpreadsheet,
  FileCode,
  RotateCcw,
  ShieldAlert,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  TooltipProps
} from 'recharts';
import {
  fetchMySQLLogs,
  logReportToMySQL,
  deleteMySQLLog,
  clearAllMySQLLogs,
  MySQLLogItem,
  MySQLActionType
} from '../../utils/mysqlLogger';
import { toPersianDigits } from '../../utils/persianDate';

export interface MySQLLiveLogsMonitorProps {
  onNavigate?: (tab: string) => void;
}

type ChartViewType = 'stacked_bar' | 'area_trend' | 'grouped_bar';
type DateFilterType = 'all' | 'today' | '24h' | '3d' | '7d' | '30d' | 'custom';
type SortFieldType = 'created_at' | 'action_type' | 'user_name' | 'title';
type SortDirectionType = 'desc' | 'asc';

export const MySQLLiveLogsMonitor: React.FC<MySQLLiveLogsMonitorProps> = () => {
  // Logs State
  const [logs, setLogs] = useState<MySQLLogItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<Date | null>(null);

  // Auto-Refresh Controls
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [refreshInterval, setRefreshInterval] = useState<number>(5000); // 5s default
  const [countdown, setCountdown] = useState<number>(5);

  // Chart State
  const [chartType, setChartType] = useState<ChartViewType>('stacked_bar');
  const [selectedChartMetric, setSelectedChartMetric] = useState<string>('all');
  const [isChartVisible, setIsChartVisible] = useState<boolean>(true);

  // Filter & Search Controls
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [selectedDateFilter, setSelectedDateFilter] = useState<DateFilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [userIdFilter, setUserIdFilter] = useState<string>('');

  // Sorting
  const [sortField, setSortField] = useState<SortFieldType>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirectionType>('desc');

  // Modals & Status
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<MySQLLogItem | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isSubmittingTest, setIsSubmittingTest] = useState<boolean>(false);
  const [isExportingCSV, setIsExportingCSV] = useState<boolean>(false);
  const [dbHealth, setDbHealth] = useState<{ connected: boolean; host?: string; database?: string; source?: string }>({
    connected: false
  });

  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(null);
    }, 4500);
  };

  // Load logs function
  const loadLogs = useCallback(async (isManual: boolean = false) => {
    if (isManual) setIsRefreshing(true);
    try {
      const result = await fetchMySQLLogs(300, selectedActionFilter === 'all' ? undefined : selectedActionFilter);
      if (result.success) {
        setLogs(result.logs);
        setDbHealth({
          connected: result.mysqlConnected ?? true,
          source: result.source
        });
        setLastUpdatedTime(new Date());
      }
    } catch (err) {
      console.warn('Failed to load MySQL logs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
      setCountdown(Math.floor(refreshInterval / 1000));
    }
  }, [selectedActionFilter, refreshInterval]);

  // Initial load
  useEffect(() => {
    setIsLoading(true);
    loadLogs();
  }, [loadLogs]);

  // Auto-refresh timer loop
  useEffect(() => {
    if (!autoRefresh) {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      return;
    }

    setCountdown(Math.floor(refreshInterval / 1000));

    // Countdown interval every second
    const tickInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadLogs(false);
          return Math.floor(refreshInterval / 1000);
        }
        return prev - 1;
      });
    }, 1000);

    countdownTimerRef.current = tickInterval;

    return () => {
      clearInterval(tickInterval);
    };
  }, [autoRefresh, refreshInterval, loadLogs]);

  // Check database health status
  useEffect(() => {
    fetch('/api/mysql/status')
      .then((res) => res.json())
      .then((data) => {
        setDbHealth((prev) => ({
          ...prev,
          connected: data.connected,
          host: data.host,
          database: data.database
        }));
      })
      .catch(() => {});
  }, []);

  // Filtered and sorted logs
  const filteredAndSortedLogs = useMemo(() => {
    let list = [...logs];

    // 1. Action filter
    if (selectedActionFilter !== 'all') {
      if (selectedActionFilter === 'reports_all') {
        list = list.filter((l) => l.action_type.startsWith('report_'));
      } else if (selectedActionFilter === 'comments_all') {
        list = list.filter((l) => l.action_type.startsWith('comment_'));
      } else {
        list = list.filter((l) => l.action_type === selectedActionFilter);
      }
    }

    // 2. Status filter
    if (selectedStatusFilter !== 'all') {
      list = list.filter((l) => (l.status || 'success') === selectedStatusFilter);
    }

    // 3. User ID / Contact filter
    if (userIdFilter.trim()) {
      const uq = userIdFilter.toLowerCase().trim();
      list = list.filter((l) => {
        const contactMatch = l.user_contact?.toLowerCase().includes(uq);
        const nameMatch = l.user_name?.toLowerCase().includes(uq);
        const idMatch = l.id?.toLowerCase().includes(uq);
        return contactMatch || nameMatch || idMatch;
      });
    }

    // 4. Date filter
    const now = new Date();
    if (selectedDateFilter === 'today') {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      list = list.filter((l) => new Date(l.created_at).getTime() >= todayStart);
    } else if (selectedDateFilter === '24h') {
      const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
      list = list.filter((l) => new Date(l.created_at).getTime() >= cutoff);
    } else if (selectedDateFilter === '3d') {
      const cutoff = now.getTime() - 3 * 24 * 60 * 60 * 1000;
      list = list.filter((l) => new Date(l.created_at).getTime() >= cutoff);
    } else if (selectedDateFilter === '7d') {
      const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      list = list.filter((l) => new Date(l.created_at).getTime() >= cutoff);
    } else if (selectedDateFilter === '30d') {
      const cutoff = now.getTime() - 30 * 24 * 60 * 60 * 1000;
      list = list.filter((l) => new Date(l.created_at).getTime() >= cutoff);
    } else if (selectedDateFilter === 'custom') {
      if (customStartDate) {
        const start = new Date(customStartDate).getTime();
        list = list.filter((l) => new Date(l.created_at).getTime() >= start);
      }
      if (customEndDate) {
        const end = new Date(customEndDate).getTime() + 24 * 60 * 60 * 1000;
        list = list.filter((l) => new Date(l.created_at).getTime() <= end);
      }
    }

    // 5. Text search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((l) => {
        const titleMatch = l.title?.toLowerCase().includes(q);
        const detailsMatch = l.details?.toLowerCase().includes(q);
        const userMatch = l.user_name?.toLowerCase().includes(q);
        const contactMatch = l.user_contact?.toLowerCase().includes(q);
        const teamMatch = l.team_slug?.toLowerCase().includes(q);
        const reportMatch = l.report_id?.toLowerCase().includes(q);
        return titleMatch || detailsMatch || userMatch || contactMatch || teamMatch || reportMatch;
      });
    }

    // 6. Sorting
    list.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'created_at') {
        const timeA = new Date(a.created_at).getTime();
        const timeB = new Date(b.created_at).getTime();
        comparison = timeA - timeB;
      } else if (sortField === 'action_type') {
        comparison = (a.action_type || '').localeCompare(b.action_type || '', 'fa');
      } else if (sortField === 'user_name') {
        comparison = (a.user_name || '').localeCompare(b.user_name || '', 'fa');
      } else if (sortField === 'title') {
        comparison = (a.title || '').localeCompare(b.title || '', 'fa');
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });

    return list;
  }, [
    logs,
    selectedActionFilter,
    selectedStatusFilter,
    userIdFilter,
    selectedDateFilter,
    customStartDate,
    customEndDate,
    searchQuery,
    sortField,
    sortDirection
  ]);

  // Overall Statistics KPI
  const stats = useMemo(() => {
    const total = logs.length;
    const consultations = logs.filter((l) => l.action_type === 'consultation_request').length;
    const teamJoins = logs.filter((l) => l.action_type === 'team_join').length;
    const reports = logs.filter((l) => l.action_type.startsWith('report_')).length;
    const comments = logs.filter((l) => l.action_type.startsWith('comment_')).length;
    const contacts = logs.filter((l) => l.action_type === 'contact_message').length;

    return { total, consultations, teamJoins, reports, comments, contacts };
  }, [logs]);

  // ==========================================
  // 7-DAY RECHARTS DATASET CALCULATION
  // ==========================================
  const last7DaysChartData = useMemo(() => {
    const daysArray: {
      dayIndex: number;
      dateKey: string;
      dateLabel: string;
      fullDateLabel: string;
      timestamp: number;
      consultations: number;
      teamJoins: number;
      reports: number;
      comments: number;
      contacts: number;
      system: number;
      total: number;
    }[] = [];

    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0).getTime();
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999).getTime();

      const isoDateKey = targetDate.toISOString().slice(0, 10);

      // Persian format for weekday & day
      let dayName = '';
      let fullPersian = '';
      try {
        dayName = targetDate.toLocaleDateString('fa-IR', { weekday: 'short' });
        const monthDay = targetDate.toLocaleDateString('fa-IR', { month: 'numeric', day: 'numeric' });
        fullPersian = targetDate.toLocaleDateString('fa-IR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        if (i === 0) {
          dayName = `امروز (${dayName})`;
        } else if (i === 1) {
          dayName = `دیروز (${dayName})`;
        } else {
          dayName = `${dayName} ${monthDay}`;
        }
      } catch {
        dayName = isoDateKey;
        fullPersian = isoDateKey;
      }

      // Filter logs for this day
      const dayLogs = logs.filter((l) => {
        const logTime = new Date(l.created_at).getTime();
        return logTime >= startOfDay && logTime <= endOfDay;
      });

      const consultations = dayLogs.filter((l) => l.action_type === 'consultation_request').length;
      const teamJoins = dayLogs.filter((l) => l.action_type === 'team_join').length;
      const reports = dayLogs.filter((l) => l.action_type.startsWith('report_')).length;
      const comments = dayLogs.filter((l) => l.action_type.startsWith('comment_')).length;
      const contacts = dayLogs.filter((l) => l.action_type === 'contact_message').length;
      const system = dayLogs.filter((l) => l.action_type === 'system_sync' || l.action_type === 'user_action').length;
      const total = dayLogs.length;

      daysArray.push({
        dayIndex: i,
        dateKey: isoDateKey,
        dateLabel: dayName,
        fullDateLabel: fullPersian,
        timestamp: startOfDay,
        consultations,
        teamJoins,
        reports,
        comments,
        contacts,
        system,
        total
      });
    }

    return daysArray;
  }, [logs]);

  // 7-day chart summary analytics
  const chartSummary = useMemo(() => {
    const total7Days = last7DaysChartData.reduce((acc, d) => acc + d.total, 0);
    const avgDaily = Math.round((total7Days / 7) * 10) / 10;
    
    // Find peak day
    let peakDay = last7DaysChartData[0];
    for (const d of last7DaysChartData) {
      if (d.total > (peakDay?.total || 0)) {
        peakDay = d;
      }
    }

    // Top action
    const categoryTotals = {
      'مشاوره': last7DaysChartData.reduce((acc, d) => acc + d.consultations, 0),
      'عضویت': last7DaysChartData.reduce((acc, d) => acc + d.teamJoins, 0),
      'گزارشات': last7DaysChartData.reduce((acc, d) => acc + d.reports, 0),
      'دیدگاه‌ها': last7DaysChartData.reduce((acc, d) => acc + d.comments, 0),
      'پیام‌های تماس': last7DaysChartData.reduce((acc, d) => acc + d.contacts, 0)
    };

    let topCategory = 'مشاوره';
    let maxCatCount = 0;
    for (const [cat, cnt] of Object.entries(categoryTotals)) {
      if (cnt > maxCatCount) {
        maxCatCount = cnt;
        topCategory = cat;
      }
    }

    return {
      total7Days,
      avgDaily,
      peakDayName: peakDay ? peakDay.dateLabel : '—',
      peakDayCount: peakDay ? peakDay.total : 0,
      topCategory: maxCatCount > 0 ? `${topCategory} (${toPersianDigits(maxCatCount)})` : 'ثبت گزارش'
    };
  }, [last7DaysChartData]);

  // ==========================================
  // CSV EXPORT GENERATOR
  // ==========================================
  const handleExportCSV = (exportOnlyFiltered: boolean = false) => {
    try {
      setIsExportingCSV(true);
      const dataset = exportOnlyFiltered ? filteredAndSortedLogs : logs;

      if (dataset.length === 0) {
        showStatus('هیچ رکوردی برای خروجی وجود ندارد.', 'error');
        setIsExportingCSV(false);
        return;
      }

      // Column Headers
      const headers = [
        'شناسه رکورد (ID)',
        'نوع عملیات (Action Type)',
        'عنوان نوع عملیات',
        'موضوع و عنوان رویداد (Title)',
        'شرح تفصیلی (Details)',
        'نام کاربر (User Name)',
        'شماره تماس / شناسه کاربر (User Contact / ID)',
        'تیم مرتبط (Team Slug)',
        'شناسه گزارش (Report ID)',
        'وضعیت (Status)',
        'زمان ثبت میلادی (Created At ISO)',
        'تاریخ و ساعت شمسی',
        'متادیتای ذخیره‌شده (JSON Metadata)'
      ];

      // Helper function to escape CSV cell content
      const escapeCSV = (val: any): string => {
        if (val === undefined || val === null) return '""';
        let str = typeof val === 'object' ? JSON.stringify(val) : String(val);
        // Replace double quotes with pair of double quotes
        str = str.replace(/"/g, '""');
        return `"${str}"`;
      };

      // Rows
      const rows = dataset.map((item) => {
        const badge = getActionBadge(item.action_type);
        const persianDate = formatDate(item.created_at);
        return [
          escapeCSV(item.id),
          escapeCSV(item.action_type),
          escapeCSV(badge.label),
          escapeCSV(item.title),
          escapeCSV(item.details || ''),
          escapeCSV(item.user_name || 'کاربر مهمان'),
          escapeCSV(item.user_contact || ''),
          escapeCSV(item.team_slug || 'عمومی'),
          escapeCSV(item.report_id || ''),
          escapeCSV(item.status || 'success'),
          escapeCSV(item.created_at),
          escapeCSV(persianDate),
          escapeCSV(item.metadata ? JSON.stringify(item.metadata) : '{}')
        ].join(',');
      });

      // Include UTF-8 BOM byte sequence (\uFEFF) for Persian/Excel support
      const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const dateStr = new Date().toISOString().slice(0, 10);
      link.download = `mysql-activity-logs-${exportOnlyFiltered ? 'filtered-' : 'all-'}${dateStr}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showStatus(`خروجی CSV با ${toPersianDigits(dataset.length)} رکورد با موفقیت دریافت گردید.`);
    } catch (err) {
      console.error('CSV export error:', err);
      showStatus('خطا در ایجاد خروجی CSV', 'error');
    } finally {
      setIsExportingCSV(false);
    }
  };

  // Export logs to JSON
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(filteredAndSortedLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mysql-activity-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showStatus('فایل JSON لاگ‌ها دانلود شد.');
  };

  // Handle single log deletion
  const handleDeleteLog = async (logId: string) => {
    const ok = await deleteMySQLLog(logId);
    if (ok) {
      setLogs((prev) => prev.filter((l) => l.id !== logId));
      if (selectedLogForDetails?.id === logId) setSelectedLogForDetails(null);
      showStatus('لاگ با موفقیت از پایگاه داده MySQL حذف گردید.');
    } else {
      showStatus('خطا در حذف لاگ', 'error');
    }
  };

  // Handle clear all logs
  const handleClearAll = async () => {
    if (!window.confirm('آیا از پاک‌سازی تمامی لاگ‌های ثبت‌شده در دیتابیس اطمینان دارید؟ این عملیات غیرقابل بازگشت است.')) {
      return;
    }
    const ok = await clearAllMySQLLogs();
    if (ok) {
      setLogs([]);
      setSelectedLogForDetails(null);
      showStatus('تمامی لاگ‌های فعالیت از دیتابیس MySQL پاک‌سازی شدند.');
    } else {
      showStatus('خطا در پاک‌سازی دیتابیس', 'error');
    }
  };

  // Handle manual test log
  const handleSendTestLog = async () => {
    setIsSubmittingTest(true);
    const testPayload = {
      actionType: 'system_sync',
      title: 'تست ارتباط زنده با MySQL',
      details: 'بررسی ثبت برخط رویدادها، نمودار ۷ روزه و صحت عملکرد کوئری‌های دیتابیس',
      userName: 'مدیر سامانه (تست)',
      userContact: '۰۹۱۲۰۰۰۰۰۰۰',
      metadata: {
        browserTime: new Date().toISOString(),
        clientAgent: navigator.userAgent,
        testMode: true
      },
      status: 'success' as const
    };

    const res = await logReportToMySQL(testPayload);
    setIsSubmittingTest(false);
    if (res.success) {
      showStatus('رویداد تستی با موفقیت در جدول mahash_activity_logs ذخیره شد.');
      loadLogs(true);
    } else {
      showStatus(res.error || 'خطا در ثبت رویداد تستی', 'error');
    }
  };

  // Helper for action badge styling
  const getActionBadge = (actionType: string) => {
    switch (actionType) {
      case 'consultation_request':
        return {
          label: 'درخواست مشاوره',
          bg: 'bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 border-teal-200 dark:border-teal-800',
          icon: Phone,
          colorHex: '#0d9488'
        };
      case 'team_join':
        return {
          label: 'عضویت و ثبت‌نام',
          bg: 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          icon: UserPlus,
          colorHex: '#2563eb'
        };
      case 'report_create':
        return {
          label: 'ثبت گزارش جدید',
          bg: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          icon: FileText,
          colorHex: '#059669'
        };
      case 'report_update':
        return {
          label: 'ویرایش گزارش',
          bg: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
          icon: FileText,
          colorHex: '#d97706'
        };
      case 'report_delete':
        return {
          label: 'حذف گزارش',
          bg: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
          icon: Trash2,
          colorHex: '#e11d48'
        };
      case 'comment_post':
        return {
          label: 'ثبت دیدگاه',
          bg: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800',
          icon: MessageSquare,
          colorHex: '#4f46e5'
        };
      case 'comment_delete':
        return {
          label: 'حذف دیدگاه',
          bg: 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-200 dark:border-red-800',
          icon: Trash2,
          colorHex: '#dc2626'
        };
      case 'contact_message':
        return {
          label: 'پیام تماس و پشتیبانی',
          bg: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800',
          icon: Phone,
          colorHex: '#0891b2'
        };
      case 'system_sync':
        return {
          label: 'تست و همگام‌سازی',
          bg: 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200 dark:border-purple-800',
          icon: Zap,
          colorHex: '#9333ea'
        };
      default:
        return {
          label: 'رویداد کاربری',
          bg: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
          icon: Activity,
          colorHex: '#64748b'
        };
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedActionFilter('all');
    setSelectedDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedStatusFilter('all');
    setSearchQuery('');
    setUserIdFilter('');
    setSortField('created_at');
    setSortDirection('desc');
    showStatus('تمامی فیلترها به حالت پیش‌فرض بازگردانی شدند.', 'info');
  };

  const isAnyFilterActive =
    selectedActionFilter !== 'all' ||
    selectedDateFilter !== 'all' ||
    selectedStatusFilter !== 'all' ||
    searchQuery.trim() !== '' ||
    userIdFilter.trim() !== '' ||
    sortField !== 'created_at' ||
    sortDirection !== 'desc';

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Status banner */}
      {statusMessage && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 text-xs font-bold transition duration-200 shadow-sm border ${
            statusMessage.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/70 dark:text-rose-200 dark:border-rose-800'
              : statusMessage.type === 'info'
              ? 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/70 dark:text-blue-200 dark:border-blue-800'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-200 dark:border-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : statusMessage.type === 'info' ? (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 cursor-pointer p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Controls Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="w-13 h-13 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-xs">
              <Database className="w-7 h-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-lg font-black text-slate-900 dark:text-white">
                  مانیتورینگ لحظه‌ای رویدادها و گزارش‌ها در دیتابیس MySQL
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                    dbHealth.connected
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      dbHealth.connected ? 'bg-emerald-500 animate-ping' : 'bg-amber-500'
                    }`}
                  />
                  {dbHealth.connected
                    ? `متصل به پایگاه داده ${dbHealth.database || 'mahash'}`
                    : 'حالت محلی / آماده اتصال به MySQL'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                ثبت بلادرنگ تمامی تعاملات کاربران: درخواست‌های مشاوره، ثبت‌نام عضویت، گزارش‌های فعالیت تیم‌ها و دیدگاه‌ها در پایگاه داده
              </p>
            </div>
          </div>

          {/* Top Actions: Toggle Auto-Refresh, Refresh, CSV Export & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Auto-Refresh Toggle Control */}
            <div className="flex items-center bg-slate-50 dark:bg-slate-800/90 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700 gap-1.5 shadow-xs">
              <button
                type="button"
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  autoRefresh
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
                title={autoRefresh ? 'توقف تازه‌سازی خودکار' : 'فعال‌سازی تازه‌سازی خودکار'}
              >
                {autoRefresh ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    <Pause className="w-3.5 h-3.5" />
                    <span>به‌روزرسانی زنده فعال ({toPersianDigits(countdown)}ث)</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>به‌روزرسانی متوقف</span>
                  </>
                )}
              </button>

              {/* Interval Select */}
              {autoRefresh && (
                <select
                  value={refreshInterval}
                  onChange={(e) => setRefreshInterval(Number(e.target.value))}
                  className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1 text-[11px] font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  title="تنظیم بازه زمانی تازه‌سازی خودکار"
                >
                  <option value={3000} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۳ ثانیه</option>
                  <option value={5000} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۵ ثانیه</option>
                  <option value={10000} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۱۰ ثانیه</option>
                  <option value={30000} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۳۰ ثانیه</option>
                  <option value={60000} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۱ دقیقه</option>
                </select>
              )}
            </div>

            {/* Manual Refresh Button */}
            <button
              onClick={() => loadLogs(true)}
              disabled={isRefreshing}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="تازه‌سازی فوری لاگ‌ها"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی دستی</span>
            </button>

            {/* CSV Export Dropdown / Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleExportCSV(true)}
                disabled={isExportingCSV}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                title="خروجی فایل اکسل و CSV از رکوردهای نمایش داده شده"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-100" />
                <span>خروجی CSV (فیلترشده)</span>
              </button>

              <button
                onClick={() => handleExportCSV(false)}
                disabled={isExportingCSV}
                className="p-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs font-bold transition cursor-pointer"
                title="خروجی فایل CSV کامل از تمام رکوردهای دیتابیس"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Test Log Insertion */}
            <button
              onClick={handleSendTestLog}
              disabled={isSubmittingTest}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>{isSubmittingTest ? 'در حال ثبت...' : 'تست ثبت رویداد'}</span>
            </button>

            {/* Clear All Logs */}
            {logs.length > 0 && (
              <button
                onClick={handleClearAll}
                className="p-2 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 rounded-xl transition cursor-pointer"
                title="پاک‌سازی تمامی لاگ‌های ثبت‌شده در دیتابیس"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Metric Cards KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 shrink-0">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">کل رویدادها</div>
              <div className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                {toPersianDigits(stats.total)}
              </div>
            </div>
          </div>

          <div className="bg-teal-50/70 dark:bg-teal-950/40 p-3.5 rounded-2xl border border-teal-200/80 dark:border-teal-800/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/60 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-teal-700 dark:text-teal-300 font-medium">رزرو مشاوره</div>
              <div className="text-base font-black text-teal-900 dark:text-teal-100 mt-0.5">
                {toPersianDigits(stats.consultations)}
              </div>
            </div>
          </div>

          <div className="bg-blue-50/70 dark:bg-blue-950/40 p-3.5 rounded-2xl border border-blue-200/80 dark:border-blue-800/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 flex items-center justify-center text-blue-700 dark:text-blue-300 shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-blue-700 dark:text-blue-300 font-medium">عضویت تیم‌ها</div>
              <div className="text-base font-black text-blue-900 dark:text-blue-100 mt-0.5">
                {toPersianDigits(stats.teamJoins)}
              </div>
            </div>
          </div>

          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-3.5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">ثبت و ویرایش گزارش</div>
              <div className="text-base font-black text-emerald-900 dark:text-emerald-100 mt-0.5">
                {toPersianDigits(stats.reports)}
              </div>
            </div>
          </div>

          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-3.5 rounded-2xl border border-indigo-200/80 dark:border-indigo-800/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/60 flex items-center justify-center text-indigo-700 dark:text-indigo-300 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-medium">نظرات کاربران</div>
              <div className="text-base font-black text-indigo-900 dark:text-indigo-100 mt-0.5">
                {toPersianDigits(stats.comments)}
              </div>
            </div>
          </div>

          <div className="bg-cyan-50/70 dark:bg-cyan-950/40 p-3.5 rounded-2xl border border-cyan-200/80 dark:border-cyan-800/60 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/60 flex items-center justify-center text-cyan-700 dark:text-cyan-300 shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-cyan-700 dark:text-cyan-300 font-medium">پیام‌های تماس</div>
              <div className="text-base font-black text-cyan-900 dark:text-cyan-100 mt-0.5">
                {toPersianDigits(stats.contacts)}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REQUIREMENT 1: 7-DAY RECHARTS ACTION FREQUENCY CHART */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <span>نمودار فراوانی و توزیع فعالیت کاربران در ۷ روز گذشته</span>
                  <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-700">
                    مبتنی بر داده‌های واقعی MySQL
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  ردگیری روند درخواست‌های مشاوره، عضویت، ثبت گزارش و دیدگاه‌ها طی هفته اخیر
                </p>
              </div>
            </div>

            {/* Chart Type Switches & Hide/Show */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <button
                  type="button"
                  onClick={() => setChartType('stacked_bar')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    chartType === 'stacked_bar'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  ستونی انباشته
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('area_trend')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    chartType === 'area_trend'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  روند خطی (مساحت)
                </button>
                <button
                  type="button"
                  onClick={() => setChartType('grouped_bar')}
                  className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                    chartType === 'grouped_bar'
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  تفکیکی
                </button>
              </div>

              <button
                onClick={() => setIsChartVisible(!isChartVisible)}
                className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl cursor-pointer"
                title={isChartVisible ? 'مخفی‌سازی نمودار' : 'نمایش نمودار'}
              >
                {isChartVisible ? <ChevronDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isChartVisible && (
            <>
              {/* 7-Day Key Metric Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 font-medium">مجموع فعالیت ۷ روز گذشته:</div>
                  <div className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                    {toPersianDigits(chartSummary.total7Days)} رویداد
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 font-medium">میانگین تعامل روزانه:</div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {toPersianDigits(chartSummary.avgDaily)} رویداد/روز
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 font-medium">شلوغ‌ترین روز هفته:</div>
                  <div className="text-xs font-black text-slate-800 dark:text-slate-200 mt-1 truncate">
                    {chartSummary.peakDayName} ({toPersianDigits(chartSummary.peakDayCount)} لاگ)
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="text-[11px] text-slate-500 font-medium">بیشترین دسته فعالیت:</div>
                  <div className="text-xs font-black text-purple-600 dark:text-purple-400 mt-1 truncate">
                    {chartSummary.topCategory}
                  </div>
                </div>
              </div>

              {/* Recharts Canvas */}
              <div className="h-64 sm:h-72 w-full bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <ResponsiveContainer width="100%" height="100%">
                  {chartType === 'area_trend' ? (
                    <AreaChart data={last7DaysChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2563eb" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#2563eb" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorConsult" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0d9488" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="colorJoin" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const dataItem = payload[0]?.payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 font-sans text-right" dir="rtl">
                                <div className="font-black text-blue-300 border-b border-slate-700 pb-1">
                                  {dataItem?.fullDateLabel || label}
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-teal-300">درخواست مشاوره:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.consultations || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-blue-300">عضویت تیم‌ها:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.teamJoins || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-emerald-300">گزارشات فعالیت:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.reports || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-indigo-300">نظرات کاربران:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.comments || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4">
                                  <span className="text-cyan-300">پیام‌های تماس:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.contacts || 0)}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-1 flex items-center justify-between gap-4 font-bold text-amber-300">
                                  <span>مجموع کل:</span>
                                  <span className="font-mono">{toPersianDigits(dataItem?.total || 0)}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                        formatter={(val) => {
                          const labels: Record<string, string> = {
                            total: 'مجموع رویدادها',
                            consultations: 'مشاوره',
                            teamJoins: 'عضویت',
                            reports: 'گزارشات',
                            comments: 'دیدگاه‌ها',
                            contacts: 'پیام تماس'
                          };
                          return labels[val] || val;
                        }}
                      />
                      <Area type="monotone" dataKey="total" stroke="#2563eb" fillOpacity={1} fill="url(#colorTotal)" name="total" />
                      <Area type="monotone" dataKey="consultations" stroke="#0d9488" fillOpacity={1} fill="url(#colorConsult)" name="consultations" />
                      <Area type="monotone" dataKey="teamJoins" stroke="#059669" fillOpacity={1} fill="url(#colorJoin)" name="teamJoins" />
                    </AreaChart>
                  ) : (
                    <BarChart data={last7DaysChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" opacity={0.6} />
                      <XAxis dataKey="dateLabel" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <Tooltip
                        content={({ active, payload, label }) => {
                          if (active && payload && payload.length) {
                            const dataItem = payload[0]?.payload;
                            return (
                              <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1.5 border border-slate-700 font-sans text-right" dir="rtl">
                                <div className="font-black text-blue-300 border-b border-slate-700 pb-1">
                                  {dataItem?.fullDateLabel || label}
                                </div>
                                <div className="flex items-center justify-between gap-4 text-teal-300">
                                  <span>درخواست مشاوره:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.consultations || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-blue-300">
                                  <span>عضویت تیم:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.teamJoins || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-emerald-300">
                                  <span>ثبت/ویرایش گزارش:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.reports || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-indigo-300">
                                  <span>نظرات:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.comments || 0)}</span>
                                </div>
                                <div className="flex items-center justify-between gap-4 text-cyan-300">
                                  <span>پیام تماس:</span>
                                  <span className="font-bold font-mono">{toPersianDigits(dataItem?.contacts || 0)}</span>
                                </div>
                                <div className="border-t border-slate-700 pt-1 flex items-center justify-between gap-4 font-bold text-amber-300">
                                  <span>مجموع این روز:</span>
                                  <span className="font-mono">{toPersianDigits(dataItem?.total || 0)}</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
                        formatter={(val) => {
                          const labels: Record<string, string> = {
                            consultations: 'مشاوره',
                            teamJoins: 'عضویت تیم',
                            reports: 'گزارشات',
                            comments: 'دیدگاه‌ها',
                            contacts: 'پیام تماس',
                            system: 'سیستمی'
                          };
                          return labels[val] || val;
                        }}
                      />
                      <Bar dataKey="consultations" stackId={chartType === 'stacked_bar' ? 'a' : undefined} fill="#0d9488" radius={[4, 4, 0, 0]} name="consultations" />
                      <Bar dataKey="teamJoins" stackId={chartType === 'stacked_bar' ? 'a' : undefined} fill="#2563eb" radius={[4, 4, 0, 0]} name="teamJoins" />
                      <Bar dataKey="reports" stackId={chartType === 'stacked_bar' ? 'a' : undefined} fill="#059669" radius={[4, 4, 0, 0]} name="reports" />
                      <Bar dataKey="comments" stackId={chartType === 'stacked_bar' ? 'a' : undefined} fill="#4f46e5" radius={[4, 4, 0, 0]} name="comments" />
                      <Bar dataKey="contacts" stackId={chartType === 'stacked_bar' ? 'a' : undefined} fill="#0891b2" radius={[4, 4, 0, 0]} name="contacts" />
                      <Bar dataKey="system" stackId={chartType === 'stacked_bar' ? 'a' : undefined} fill="#9333ea" radius={[4, 4, 0, 0]} name="system" />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            </>
          )}
        </div>

        {/* ========================================================================= */}
        {/* REQUIREMENT 3: ADVANCED FILTERING & SORTING CONTROLS */}
        {/* ========================================================================= */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-black text-slate-800 dark:text-slate-100">
                پالایش و جستجوی پیشرفته لاگ‌های دیتابیس
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                {toPersianDigits(filteredAndSortedLogs.length)} از {toPersianDigits(logs.length)} رکورد
              </span>
            </div>

            {isAnyFilterActive && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>پاکسازی فیلترها</span>
              </button>
            )}
          </div>

          {/* Filter Row 1: Action Type Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              نوع فعالیت / عملیات:
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: 'همه رویدادها' },
                { id: 'consultation_request', label: 'درخواست مشاوره' },
                { id: 'team_join', label: 'عضویت و پذیرش تیم' },
                { id: 'report_create', label: 'ثبت گزارش جدید' },
                { id: 'report_update', label: 'ویرایش گزارش' },
                { id: 'report_delete', label: 'حذف گزارش' },
                { id: 'comment_post', label: 'ثبت دیدگاه' },
                { id: 'contact_message', label: 'پیام تماس و پشتیبانی' },
                { id: 'system_sync', label: 'همگام‌سازی و تست' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedActionFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    selectedActionFilter === tab.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Filter Row 2: Search Inputs & Date Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Search Query */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                جستجوی متنی در عنوان و شرح:
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان، شرح، تیم..."
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* User ID / Phone / Name Filter */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                کاربر، شناسه یا شماره تماس:
              </label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={userIdFilter}
                  onChange={(e) => setUserIdFilter(e.target.value)}
                  placeholder="نام، شماره تماس، شناسه لاگ..."
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20"
                />
                {userIdFilter && (
                  <button
                    onClick={() => setUserIdFilter('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Date Filter Preset */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                بازه زمانی رویداد:
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  value={selectedDateFilter}
                  onChange={(e) => setSelectedDateFilter(e.target.value as DateFilterType)}
                  className="w-full pl-3 pr-8 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                >
                  <option value="all" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">همه زمان‌ها (کل لاگ‌ها)</option>
                  <option value="today" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">امروز</option>
                  <option value="24h" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۲۴ ساعت گذشته</option>
                  <option value="3d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۳ روز گذشته</option>
                  <option value="7d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۷ روز گذشته</option>
                  <option value="30d" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">۳۰ روز گذشته</option>
                  <option value="custom" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">تاریخ سفارشی...</option>
                </select>
              </div>
            </div>

            {/* Sorting Controls */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 block mb-1">
                مرتب‌سازی بر اساس:
              </label>
              <div className="flex items-center gap-1.5">
                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value as SortFieldType)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30 cursor-pointer"
                >
                  <option value="created_at" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">زمان ثبت (تاریخ)</option>
                  <option value="action_type" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">نوع رویداد</option>
                  <option value="user_name" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">نام کاربر</option>
                  <option value="title" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">عنوان رویداد</option>
                </select>

                <button
                  type="button"
                  onClick={() => setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')}
                  className="px-2.5 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer shrink-0"
                  title={sortDirection === 'desc' ? 'مرتب‌سازی نزولی (جدیدترین اول)' : 'مرتب‌سازی صعودی (قدیمی‌ترین اول)'}
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-blue-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Custom Date Range Picker Inputs */}
          {selectedDateFilter === 'custom' && (
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">از تاریخ:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600">تا تاریخ:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
            <p className="text-xs text-slate-500">در حال دریافت و واکشی لاگ‌ها از دیتابیس MySQL...</p>
          </div>
        ) : filteredAndSortedLogs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Database className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              رویدادی با فیلترهای انتخاب شده یافت نشد
            </p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              می‌توانید فیلترها را ریست کنید یا با ارسال یک درخواست تستی صحت ثبت را بررسی فرمایید.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              {isAnyFilterActive && (
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  بازنشانی فیلترها
                </button>
              )}
              <button
                onClick={handleSendTestLog}
                className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                ثبت لاگ تستی در MySQL
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-4 whitespace-nowrap">زمان ثبت</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">نوع عملیات</th>
                  <th className="py-3.5 px-4">عنوان و شرح رویداد</th>
                  <th className="py-3.5 px-4 whitespace-nowrap">کاربر / شناسه / تماس</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">وضعیت</th>
                  <th className="py-3.5 px-4 text-center whitespace-nowrap">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredAndSortedLogs.map((log) => {
                  const badge = getActionBadge(log.action_type);
                  const IconComp = badge.icon;
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(log.created_at)}</span>
                        </div>
                      </td>

                      {/* Action Type Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${badge.bg}`}
                        >
                          <IconComp className="w-3.5 h-3.5" />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      {/* Title & Details */}
                      <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                        <div className="font-bold text-slate-900 dark:text-slate-100 truncate">
                          {log.title}
                        </div>
                        {log.details && (
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                            {log.details}
                          </div>
                        )}
                      </td>

                      {/* User & Contact */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-medium">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.user_name || 'کاربر مهمان'}</span>
                        </div>
                        {log.user_contact && (
                          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{log.user_contact}</span>
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>ثبت در MySQL</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setSelectedLogForDetails(log)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition cursor-pointer"
                            title="مشاهده شناسنامه و جزئیات رکورد"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                            title="حذف این رکورد از دیتابیس"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details JSON Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  شناسنامه و جزئیات رکورد MySQL
                </h3>
              </div>
              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <span className="text-slate-400 block mb-0.5">شناسه رکورد (ID):</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {selectedLogForDetails.id}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">نوع رویداد:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">
                    {selectedLogForDetails.action_type}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">نام کاربر:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLogForDetails.user_name || 'ثبت‌نشده'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">شماره تماس / آیدی:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedLogForDetails.user_contact || 'ثبت‌نشده'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">زمان ثبت میلادی:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200 text-[11px]">
                    {selectedLogForDetails.created_at}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">زمان ثبت شمسی:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {formatDate(selectedLogForDetails.created_at)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">تیم مرتبط:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedLogForDetails.team_slug || 'عمومی'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">شناسه گزارش:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {selectedLogForDetails.report_id || '—'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1.5">عنوان و شرح رویداد:</span>
                <div className="bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                  <div className="font-bold text-slate-900 dark:text-white mb-1">
                    {selectedLogForDetails.title}
                  </div>
                  <div className="text-slate-600 dark:text-slate-300">
                    {selectedLogForDetails.details || 'بدون شرح تفصیلی'}
                  </div>
                </div>
              </div>

              {selectedLogForDetails.metadata && Object.keys(selectedLogForDetails.metadata).length > 0 && (
                <div>
                  <span className="text-slate-500 font-bold block mb-1.5">
                    متادیتای ذخیره‌شده در ستون JSON جدول MySQL:
                  </span>
                  <pre className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-[11px] overflow-x-auto border border-slate-800 text-left dir-ltr max-h-48">
                    {JSON.stringify(selectedLogForDetails.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => handleDeleteLog(selectedLogForDetails.id)}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف این رکورد از MySQL</span>
              </button>

              <button
                onClick={() => setSelectedLogForDetails(null)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
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
