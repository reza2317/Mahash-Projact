import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MonthlyReports } from '../components/MonthlyReports';
import { WordPressCMSPanel } from '../components/WordPressCMSPanel';
import { MySQLAdminDashboard } from '../components/MySQLAdminDashboard';
import { MySQLLiveLogsMonitor } from '../components/admin/MySQLLiveLogsMonitor';
import { AuditLogsTab } from '../components/admin/AuditLogsTab';
import { AdminVideoMonitorTab } from '../components/AdminVideoMonitorTab';
import { SyncLogger } from '../components/admin/SyncLogger';
import { WordPressService } from '../services/WordPressService';
import { useNotification } from '../context/NotificationContext';
import { logReportToMySQL, fetchMySQLLogs, archiveAndClearLogsAPI, MySQLLogItem } from '../utils/mysqlLogger';
import { securePermanentReportPurge } from '../utils/secureDeletion';
import DatePicker, { DateObject } from 'react-multi-date-picker';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { PageId, ActivityReport, ReportType, TeamData, ScoreItem, EventItem, ReportAttachment, Consultant, ReportDraft } from '../types';
import {
  getAllTeams,
  getAllReports,
  saveReport,
  deleteReport,
  deleteReportPermanently,
  removeVideoFromReport,
  getNextReportNumberForTeam,
  getSavedDrafts,
  saveDraft,
  deleteDraft,
  getDraftById,
  updateTeamDetails,
  saveTeamLogo,
  resetTeamLogo,
  getAllScores,
  updateTeamScore,
  getAllEvents,
  saveEvent,
  deleteEvent,
  getAllReportViews,
  getReportViews,
  setReportViews,
  resetReportViews,
  isAdminAuthenticated,
  loginAdmin,
  logoutAdmin,
  getAdminUsername,
  setAdminUsername,
  setAdminPassword,
  getAdminPassword,
  resetAdminCredentialsToDefault,
  recoverAdminPassword,
  exportBackupJSON,
  importBackupJSON,
  resetAllDataToDefault,
  subscribeToStoreUpdates,
  getMahashLogo,
  setMahashLogo,
  resetMahashLogo,
  getYouthClubBadge,
  setYouthClubBadge,
  resetYouthClubBadge,
  cleanUnknownOrCorruptVideos,
  triggerGlobalCacheBust,
  syncLocalDataToServer,
  fetchAndMergeServerStore,
  restoreAllOfficialReportsAndPublish,
  getMemberAvatars,
  getMemberAvatar,
  saveMemberAvatar,
  resetMemberAvatar,
  getAllConsultants,
  saveAllConsultants,
  getConsultantPhotos,
  getConsultantPhoto,
  saveConsultantPhoto,
  resetConsultantPhoto,
  updateConsultantInfo,
  addConsultant,
  deleteConsultant,
  isCustomImageDataUrlOrUrl,
  getPendingSyncCount,
  clearPendingSyncItems,
  getLastSuccessfulSync,
  getSyncHistoryLogs,
  SyncAttemptLog
} from '../utils/reportsStore';
import { RecentSyncLogs } from '../components/admin/RecentSyncLogs';
import { VideoRemovalConfirmModal } from '../components/VideoRemovalConfirmModal';
import { OrphanMediaRepairUtility } from '../components/OrphanMediaRepairUtility';
import { VideoGalleryView } from '../components/VideoGalleryView';
import { SyncStatusBadge } from '../components/SyncStatusBadge';
import { AdminLogoManager } from '../components/admin/AdminLogoManager';
import { MediaContentManager } from '../components/admin/MediaContentManager';
import { MySQLVideoManager } from '../components/admin/MySQLVideoManager';
import { MembershipsManagementDashboard } from '../components/admin/MembershipsManagementDashboard';
import { DatabaseStateAuditTool } from '../components/admin/DatabaseStateAuditTool';
import {
  saveMahashLogoToFirestore,
  saveYouthClubEmblemToFirestore,
  saveConsultantPhotoToFirestore,
  getConsultantPhotoFromFirestore,
  deleteConsultantPhotoFromFirestore
} from '../utils/firestorePersistence';
import { NAZI_AVATAR_SVG, RADIN_AVATAR_SVG } from '../utils/assets';
import { compressImageToDataUrl } from '../utils/imageCompressor';
import {
  saveVideoToCache,
  getVideoFromCache,
  getAllCachedVideos,
  deleteVideoFromCache,
  getStorageStats
} from '../utils/videoCache';
import {
  detectAttachmentType,
  formatFileSize,
  readFileAsDataURL,
  saveAttachmentRecord,
  getAttachmentsFromDB,
  deleteAllAttachmentsForReport
} from '../utils/attachmentsStorage';
import {
  validateVideoFile,
  validateAttachmentFile,
  validateFullReportSubmission
} from '../utils/fileValidation';
import { uploadFileToServerStorage, uploadFileToGoogleDrive, deleteFileFromGoogleDrive } from '../utils/googleDriveStorage';
import { getSmartCurrentDate, toPersianDigits, formatReportNumberDisplay, extractReportSequenceNumber, getJalaliDayOfWeek, parseReportTimestamp } from '../utils/persianDate';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage } from '../utils/storage';
import {
  getTeamLogoPlaceholder,
  CIRCULAR_BADGE_PRESETS,
  CircularBadgePreset,
  MAHESH_LOGO_SVG,
  MAHESH_CLUB_EMBLEM_SVG
} from '../utils/assets';
import {
  normalizePersianText,
  extractKeyPoints,
  generateExecutiveSummary,
  generateSubtitleScenario,
  proofreadAndPolishText
} from '../utils/persianTextProcessor';
import { IntegrityAuditorTab } from '../components/admin/IntegrityAuditorTab';
import { ImageUploader } from '../components/ImageUploader';
import { RichTextEditor } from '../components/admin/RichTextEditor';
import { PrintReportButton } from '../components/PrintReportButton';
import { useReportSync } from '../hooks/useReportSync';
import {
  Lock,
  Unlock,
  User,
  ShieldCheck,
  Film,
  PlusCircle,
  FolderDown,
  Trash2,
  Edit3,
  CheckCircle2,
  Eye,
  EyeOff,
  LogOut,
  Upload, CloudUpload,
  Video,
  FileText,
  Users,
  HardDrive,
  Sparkles,
  Search,
  ExternalLink,
  Save,
  RefreshCw,
  RotateCcw,
  Key,
  KeyRound,
  HelpCircle,
  Database,
  ArrowRight,
  Sliders,
  Check,
  X,
  AlertCircle,
  Radio,
  Loader2,
  FileSpreadsheet,
  Award,
  Calendar,
  CalendarPlus,
  Clock,
  MapPin,
  Tag,
  TrendingUp,
  BarChart3,
  Flame,
  Play,
  ArrowUpDown,
  Paperclip,
  Image as ImageIcon,
  FileArchive,
  File as FileIcon,
  Download,
  AlertTriangle,
  Palette,
  Activity,
  FileWarning,
  XCircle,
  Wrench,
  Send,
  Share2,
  Globe,
  Bell,
  BellRing,
  Archive,
  Zap,
  ShieldAlert,
  Shield,
  CheckSquare,
  Layers
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (page: PageId) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const { isSaving, saveSuccess, syncReportData } = useReportSync();
  const { maintenanceSuccess } = useNotification();
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isAdminAuthenticated());
  const [usernameInput, setUsernameInput] = useState<string>('');
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Password Recovery state
  const [showRecoveryModal, setShowRecoveryModal] = useState<boolean>(false);
  const [recoveryKeyInput, setRecoveryKeyInput] = useState<string>('');
  const [showRecoveryKey, setShowRecoveryKey] = useState<boolean>(false);
  const [recoveryNewPasswordInput, setRecoveryNewPasswordInput] = useState<string>('');
  const [showRecoveryNewPass, setShowRecoveryNewPass] = useState<boolean>(false);
  const [recoveryConfirmInput, setRecoveryConfirmInput] = useState<string>('');
  const [showRecoveryConfirmPass, setShowRecoveryConfirmPass] = useState<boolean>(false);
  const [recoveryMessage, setRecoveryMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<boolean>(false);

  // Active Admin Tab
  const [activeTab, setActiveTab] = useState<'create' | 'reports' | 'drafts' | 'repair' | 'gallery' | 'monthly' | 'teams' | 'members_dashboard' | 'scores' | 'events' | 'analytics' | 'logos' | 'media' | 'video_manager' | 'video_errors' | 'health' | 'storage' | 'settings' | 'wordpress' | 'mysql' | 'mysql_logs' | 'audit_logs' | 'db_audit'>('create');
  const [mysqlHealthStatus, setMysqlHealthStatus] = useState<{ connected: boolean; host?: string; database?: string; timestamp?: string } | null>(null);

  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const [isForceRefreshing, setIsForceRefreshing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(() => getPendingSyncCount());
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => getLastSuccessfulSync());
  const [syncLogsList, setSyncLogsList] = useState<SyncAttemptLog[]>(() => getSyncHistoryLogs());
  const [showForceRefreshConfirmModal, setShowForceRefreshConfirmModal] = useState<boolean>(false);

  // Sync state updater
  useEffect(() => {
    const updateSyncIndicators = () => {
      setPendingSyncCount(getPendingSyncCount());
      setLastSyncTime(getLastSuccessfulSync());
      setSyncLogsList(getSyncHistoryLogs());
    };

    updateSyncIndicators();
    const unsub = subscribeToStoreUpdates(updateSyncIndicators);
    const interval = setInterval(updateSyncIndicators, 3000);
    return () => {
      unsub();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const checkMysqlHealth = async () => {
      try {
        const res = await fetch('/api/mysql/status');
        const data = await res.json();
        setMysqlHealthStatus(data);
      } catch {
        setMysqlHealthStatus({ connected: false });
      }
    };
    checkMysqlHealth();
    const interval = setInterval(checkMysqlHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  // Video preservation & removal confirmation state
  const [keepVideoAttachment, setKeepVideoAttachment] = useState<boolean>(false);
  const [videoRemovalModal, setVideoRemovalModal] = useState<{
    isOpen: boolean;
    reportId?: string;
    teamSlug?: string;
    reportTitle: string;
    fileName?: string;
  }>({
    isOpen: false,
    reportTitle: '',
  });

  // Saved drafts list state
  const [savedDraftsList, setSavedDraftsList] = useState<ReportDraft[]>(() => getSavedDrafts());

  // Store data
  const [teams, setTeams] = useState<Record<string, TeamData>>(getAllTeams());
  const [allReports, setAllReports] = useState(getAllReports());
  const [scoresList, setScoresList] = useState<ScoreItem[]>(getAllScores());
  const [eventsList, setEventsList] = useState<EventItem[]>(getAllEvents());
  const [reportViews, setReportViewsState] = useState<Record<string, number>>(() => getAllReportViews());
  const [storageStats, setStorageStats] = useState<{ count: number; totalSizeBytes: number }>({ count: 0, totalSizeBytes: 0 });
  const [cachedVideos, setCachedVideos] = useState<any[]>([]);
  const [uploadingVideoId, setUploadingVideoId] = useState<string | null>(null);

  // Logos and Circular Badges Management State
  const [mahashLogoSrc, setMahashLogoSrc] = useState<string>(() => getMahashLogo());
  const [mahashSyncStatus, setMahashSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [mahashLastSyncedAt, setMahashLastSyncedAt] = useState<Date | null>(null);
  const [mahashPreviewUrl, setMahashPreviewUrl] = useState<string | null>(null);
  const [mahashSelectedFile, setMahashSelectedFile] = useState<File | null>(null);
  const [isMahashSaving, setIsMahashSaving] = useState<boolean>(false);

  const [youthClubBadgeSrc, setYouthClubBadgeSrc] = useState<string>(() => getYouthClubBadge());
  const [youthClubSyncStatus, setYouthClubSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [youthClubLastSyncedAt, setYouthClubLastSyncedAt] = useState<Date | null>(null);
  const [youthClubPreviewUrl, setYouthClubPreviewUrl] = useState<string | null>(null);
  const [youthClubSelectedFile, setYouthClubSelectedFile] = useState<File | null>(null);
  const [isYouthClubSaving, setIsYouthClubSaving] = useState<boolean>(false);

  const [memberAvatars, setMemberAvatars] = useState<Record<string, string>>(() => getMemberAvatars());
  const [consultantsList, setConsultantsList] = useState<Consultant[]>(() => getAllConsultants());
  const [consultantPhotos, setConsultantPhotos] = useState<Record<string, string>>(() => getConsultantPhotos());
  const [consultantPreviews, setConsultantPreviews] = useState<Record<string, string>>({});
  const [consultantSelectedFiles, setConsultantSelectedFiles] = useState<Record<string, File>>({});
  const [consultantSavingMap, setConsultantSavingMap] = useState<Record<string, boolean>>({});
  const [consultantSyncStatusMap, setConsultantSyncStatusMap] = useState<Record<string, 'idle' | 'syncing' | 'synced' | 'error'>>({});
  const [consultantLastSyncedMap, setConsultantLastSyncedMap] = useState<Record<string, Date | null>>({});
  const [newConsultantName, setNewConsultantName] = useState<string>('');
  const [newConsultantRole, setNewConsultantRole] = useState<string>('');
  const [newConsultantSpecialty, setNewConsultantSpecialty] = useState<string>('');
  const [newConsultantBio, setNewConsultantBio] = useState<string>('');
  const [activeBadgeCategoryFilter, setActiveBadgeCategoryFilter] = useState<'all' | 'mahash' | 'teams' | 'specialty' | 'custom'>('all');
  const [selectedTargetTeamForBadge, setSelectedTargetTeamForBadge] = useState<string>('team-thinker');
  const [newBadgeTitle, setNewBadgeTitle] = useState<string>('');
  const [newBadgeDescription, setNewBadgeDescription] = useState<string>('');
  const [newBadgeFileBase64, setNewBadgeFileBase64] = useState<string | null>(null);
  const [customBadgesList, setCustomBadgesList] = useState<CircularBadgePreset[]>(() => {
    try {
      const saved = safeGetLocalStorage('mahash_custom_badges_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // MySQL Backup & Storage Summary for Top Summary Card
  const backupSummary = useMemo(() => {
    const saved = safeGetLocalStorage('mahash_backup_history');
    let history: any[] = [];
    if (saved) {
      try { history = JSON.parse(saved); } catch (e) {}
    }
    const lastBackupTime = safeGetLocalStorage('mahash_last_backup_time');
    const successful = history.filter(item => !item.status?.includes('ناموفق') && !item.status?.toLowerCase().includes('failed'));
    const lastSuccess = successful.length > 0 ? successful[0].timestamp : lastBackupTime;
    
    let totalKb = 0;
    history.forEach(item => {
      const sizeNum = parseFloat(item.size || '0');
      if (!isNaN(sizeNum)) totalKb += sizeNum;
    });

    return {
      totalBackups: history.length,
      lastSuccessDate: lastSuccess ? new Date(lastSuccess).toLocaleDateString('fa-IR') : 'ثبت نشده',
      storageUsage: `${totalKb.toFixed(1)} KB (InnoDB)`
    };
  }, [activeTab]);

  // Quick Stats Summary State for Today's MySQL Activity (Task 5)
  const [todayLogsStats, setTodayLogsStats] = useState<{
    total: number;
    success: number;
    failed: number;
    rate: number;
    lastUpdated: string;
  }>({
    total: 0,
    success: 0,
    failed: 0,
    rate: 100,
    lastUpdated: new Date().toLocaleTimeString('fa-IR')
  });
  const [isRefreshingQuickStats, setIsRefreshingQuickStats] = useState<boolean>(false);

  // System Notification Badge State for High-Priority Consultation Requests (Task 4)
  const [highPriorityConsultations, setHighPriorityConsultations] = useState<MySQLLogItem[]>([]);
  const [unreadConsultationCount, setUnreadConsultationCount] = useState<number>(0);
  const [showNotificationPopup, setShowNotificationPopup] = useState<boolean>(false);
  const [hasDismissedAlertBanner, setHasDismissedAlertBanner] = useState<boolean>(false);

  // MySQL Archive and Clear Modal State (Task 3)
  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState<boolean>(false);
  const [archiveOlderThanDays, setArchiveOlderThanDays] = useState<number>(0);
  const [archiveConfirmInput, setArchiveConfirmInput] = useState<string>('');
  const [isArchivingLogs, setIsArchivingLogs] = useState<boolean>(false);
  const [archiveResult, setArchiveResult] = useState<{
    success: boolean;
    totalArchived: number;
    clearedCount: number;
    archiveFileName?: string;
  } | null>(null);

  // Poll MySQL for Today's Activity & Real-Time Consultation Requests
  const refreshQuickStatsAndAlerts = async (showLoading: boolean = false) => {
    if (showLoading) setIsRefreshingQuickStats(true);
    try {
      const res = await fetchMySQLLogs(100);
      const logs: MySQLLogItem[] = Array.isArray(res) ? res : (res?.logs || []);
      const todayStr = new Date().toDateString();
      const todayItems = logs.filter(l => {
        const d = new Date(l.created_at || (l as any).timestamp || 0);
        return !isNaN(d.getTime()) && d.toDateString() === todayStr;
      });

      const total = todayItems.length;
      const success = todayItems.filter(l => l.status === 'success').length;
      const failed = todayItems.filter(l => l.status === 'error' || l.status === 'warning').length;
      const rate = total > 0 ? Math.round((success / total) * 100) : 100;

      setTodayLogsStats({
        total,
        success,
        failed,
        rate,
        lastUpdated: new Date().toLocaleTimeString('fa-IR')
      });

      // Filter high priority consultations
      const consultations = logs.filter(l => l.action_type === 'consultation_request');
      setHighPriorityConsultations(consultations);
      setUnreadConsultationCount(consultations.length);
    } catch (err) {
      console.warn('Could not refresh quick stats and alerts:', err);
    } finally {
      if (showLoading) setIsRefreshingQuickStats(false);
    }
  };

  useEffect(() => {
    refreshQuickStatsAndAlerts(false);
    const interval = setInterval(() => refreshQuickStatsAndAlerts(false), 5000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Execute Safe Archive and Clear
  const handleArchiveAndClearLogs = async () => {
    if (
      archiveConfirmInput.trim() !== 'بایگانی' &&
      archiveConfirmInput.trim().toUpperCase() !== 'ARCHIVE'
    ) {
      showToast('جهت تایید عملیات، لطفاً عبارت «بایگانی» را دقیقاً وارد کنید.', 'error');
      return;
    }

    setIsArchivingLogs(true);
    try {
      const res = await archiveAndClearLogsAPI(archiveOlderThanDays, true, true);
      if (res.success) {
        setArchiveResult(res);
        showToast(
          `بایگانی ایمن با موفقیت انجام شد: ${toPersianDigits(res.totalArchived)} لاگ ذخیره و فایل JSON دانلود گردید (${toPersianDigits(res.clearedCount)} مورد پاک‌سازی شدند).`
        );
        setIsArchiveModalOpen(false);
        setArchiveConfirmInput('');
        await refreshQuickStatsAndAlerts(false);
      } else {
        showToast(`خطا در بایگانی لاگ‌های دیتابیس: ${res.error || 'نامشخص'}`, 'error');
      }
    } catch (err: any) {
      showToast(`خطا در فرآیند بایگانی: ${err?.message || 'نامشخص'}`, 'error');
    } finally {
      setIsArchivingLogs(false);
    }
  };

  // Search & Filters in Reports table
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterMediaType, setFilterMediaType] = useState<'all' | 'video' | 'text-only'>('all');
  const [filterDatePeriod, setFilterDatePeriod] = useState<'all' | '1405' | '1404' | 'custom'>('all');
  const [customDateQuery, setCustomDateQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportsSortBy, setReportsSortBy] = useState<'date-desc' | 'date-asc' | 'views-desc' | 'views-asc' | 'num-desc' | 'num-asc' | 'title'>('views-desc');

  // Quick edit views modal / state
  const [editingViewsReport, setEditingViewsReport] = useState<{ id: string; title: string; currentViews: number } | null>(null);
  const [customViewsInput, setCustomViewsInput] = useState<number>(0);
  const [editingDateReport, setEditingDateReport] = useState<{ id: string; teamSlug: string; title: string; currentDate: string } | null>(null);
  const [customDateInput, setCustomDateInput] = useState<string>('');
  const [editingNumReport, setEditingNumReport] = useState<{ id: string; teamSlug: string; title: string; reportNum: string } | null>(null);
  const [customNumInput, setCustomNumInput] = useState<string>('');
  const [customTitleInput, setCustomTitleInput] = useState<string>('');

  // Event form state
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventTitle, setEventTitle] = useState<string>('');
  const [eventCategory, setEventCategory] = useState<any>('workshop');
  const [eventCategoryLabel, setEventCategoryLabel] = useState<string>('کارگاه آموزشی');
  const [eventDateJalali, setEventDateJalali] = useState<string>('۱۴۰۵/۰۶/۱۵');
  const [eventTime, setEventTime] = useState<string>('۱۶:۰۰ الی ۱۸:۳۰');
  const [eventLocation, setEventLocation] = useState<string>('سالن همایش‌های موسسه محاش');
  const [eventOrganizer, setEventOrganizer] = useState<string>('باشگاه جوانان محاش');
  const [eventInstructor, setEventInstructor] = useState<string>('');
  const [eventDesc, setEventDesc] = useState<string>('');
  const [eventCost, setEventCost] = useState<string>('رایگان برای اعضای محاش');

  // Form State for creating / editing a report
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [selectedTeamSlug, setSelectedTeamSlug] = useState<string>('team-angels');
  const [reportFormat, setReportFormat] = useState<ReportType>('hybrid');
  const [reportNum, setReportNum] = useState<string>(() => getNextReportNumberForTeam('team-angels'));
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(getSmartCurrentDate());
  const [reportSummary, setReportSummary] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<'published' | 'draft'>('published');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [previewVideoLoaded, setPreviewVideoLoaded] = useState<boolean>(false);
  const [keyPointsText, setKeyPointsText] = useState<string>('');

  useEffect(() => {
    setPreviewVideoLoaded(false);
  }, [videoPreviewUrl]);
  
  // Attachments State (JPG, PNG, PDF, Word, Excel, ZIP, etc.)
  const [attachments, setAttachments] = useState<ReportAttachment[]>([]);
  const [isUploadingAttachment, setIsUploadingAttachment] = useState<boolean>(false);
  const attachmentInputRef = useRef<HTMLInputElement | null>(null);

  // Delete Report & Event Modal States
  const [reportToDelete, setReportToDelete] = useState<{
    id: string;
    teamSlug: string;
    title: string;
    teamName?: string;
  } | null>(null);
  const [deleteConfirmAck, setDeleteConfirmAck] = useState<boolean>(false);
  const [deleteOperatorName, setDeleteOperatorName] = useState<string>('مدیر ارشد سامانه (Admin)');
  const [deleteReason, setDeleteReason] = useState<string>('درخواست حذف نهایی توسط مدیر');
  const [deleteReasonCustom, setDeleteReasonCustom] = useState<string>('');
  const [eventToDelete, setEventToDelete] = useState<{
    id: string;
    title: string;
    categoryLabel: string;
    dateJalali: string;
  } | null>(null);
  const [showResetAllConfirmModal, setShowResetAllConfirmModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [hasRestoredDraft, setHasRestoredDraft] = useState<boolean>(false);

  const DRAFT_KEY = 'mahash_report_form_draft_v1';

  // Load draft on initial mount if available and not editing
  useEffect(() => {
    try {
      const savedDraft = safeGetLocalStorage(DRAFT_KEY);
      if (savedDraft && !editingReportId) {
        const draft = JSON.parse(savedDraft);
        if (draft.reportTitle || draft.reportSummary || draft.keyPointsText) {
          if (draft.selectedTeamSlug) setSelectedTeamSlug(draft.selectedTeamSlug);
          if (draft.reportFormat) setReportFormat(draft.reportFormat);
          if (draft.reportNum) setReportNum(draft.reportNum);
          if (draft.reportTitle) setReportTitle(draft.reportTitle);
          if (draft.reportDate) setReportDate(draft.reportDate);
          if (draft.reportSummary) setReportSummary(draft.reportSummary);
          if (draft.reportStatus) setReportStatus(draft.reportStatus);
          if (draft.keyPointsText) setKeyPointsText(draft.keyPointsText);
          setHasRestoredDraft(true);
        }
      }
    } catch {}
  }, []);

  // Auto-save draft changes to storage with debounce to ensure fluid typing
  useEffect(() => {
    if (editingReportId) return; // do not overwrite draft when editing existing report
    const hasData = reportTitle.trim() || reportSummary.trim() || keyPointsText.trim();
    if (!hasData) return;

    const timer = setTimeout(() => {
      try {
        safeSetLocalStorage(
          DRAFT_KEY,
          JSON.stringify({
            selectedTeamSlug,
            reportFormat,
            reportNum,
            reportTitle,
            reportDate,
            reportSummary,
            reportStatus,
            keyPointsText,
            updatedAt: Date.now()
          })
        );
      } catch {}
    }, 500);

    return () => clearTimeout(timer);
  }, [selectedTeamSlug, reportFormat, reportNum, reportTitle, reportDate, reportSummary, reportStatus, keyPointsText, editingReportId]);

  const clearFormDraft = () => {
    try {
      safeRemoveLocalStorage(DRAFT_KEY);
      setHasRestoredDraft(false);
    } catch {}
  };

  // Run script to clean corrupt/unknown video entries
  
  const handleTransferToMySQL = async (video: any) => {
    try {
      setUploadingVideoId(video.reportId);
      
      const formData = new FormData();
      formData.append('file', video.blob, video.name || 'video.mp4');

      const res = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('خطا در آپلود ویدیو به سرور');
      const data = await res.json();
      
      if (data.success && data.url) {
        // Update report to use remote URL
        const allReps = getAllReports();
        const report = allReps.find((r: any) => r.id === video.reportId);
        
        if (report) {
          const updatedReport = { ...report, videoSrc: data.url, videoUrl: data.url, updatedAt: Date.now() };
          saveReport(updatedReport, updatedReport.teamSlug);
          
          // Re-sync allReports state
          setAllReports(getAllReports());
        }

        // Delete from local IndexedDB cache
        await deleteVideoFromCache(video.reportId);
        
        // Refresh UI
        const list = await getAllCachedVideos();
        setCachedVideos(list);
        const stats = await getStorageStats();
        setStorageStats(stats);
        
        showToast('ویدیو با موفقیت به سرور MySQL منتقل شد.');
      } else {
        throw new Error(data.error || 'خطای نامشخص در آپلود');
      }
    } catch (err: any) {
      console.error(err);
      showToast(`خطا در انتقال: ${err.message}`, 'error');
    } finally {
      setUploadingVideoId(null);
    }
  };

  const handleRunVideoCleanup = () => {
    const result = cleanUnknownOrCorruptVideos();
    triggerGlobalCacheBust();
    if (result.cleanedVideosCount > 0) {
      showToast(`پاکسازی با موفقیت انجام شد: ${toPersianDigits(result.cleanedVideosCount)} ویدیوی نامعتبر پاک شد و بخش ویدیو آماده آپلود تمیز است.`);
    } else {
      showToast('بررسی انجام شد: تمامی فایل‌های ویدیویی سالم بوده و هیچ ویدیوی نامعتبر یا معیوبی یافت نشد.');
    }
  };

  // Transcript / Subtitles lines
  const [transcriptLines, setTranscriptLines] = useState<
    { speaker: string; role: string; text: string; avatar: string }[]
  >([
    { speaker: 'رضا زنگنه', role: 'مدیر تیم', text: '', avatar: '👨‍💼' },
    { speaker: 'همکار محترم تیم', role: 'عضو تیم', text: '', avatar: '👩‍💼' }
  ]);

  // Operations feedback & Live Upload State
  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitProgress, setSubmitProgress] = useState<number>(0);
  const [submitStageText, setSubmitStageText] = useState<string>('');
  const [submitProgressDetails, setSubmitProgressDetails] = useState<{ loadedFormatted: string; totalFormatted: string } | null>(null);
  const [submitErrorMessage, setSubmitErrorMessage] = useState<string | null>(null);

  // Settings tab: Change username & password state
  const [adminUsername, setAdminUsernameState] = useState<string>(() => getAdminUsername());
  const [showAdminUsername, setShowAdminUsername] = useState<boolean>(false);
  const [newUsername, setNewUsername] = useState<string>('');
  const [usernameChangeSuccess, setUsernameChangeSuccess] = useState<boolean>(false);
  const [newPassword, setNewPassword] = useState<string>('');
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Gemini AI Assistant state inside Admin Panel
  const [adminGeminiTone, setAdminGeminiTone] = useState<'official' | 'motivational' | 'brief' | 'educational'>('official');
  const [adminGeminiCustomPrompt, setAdminGeminiCustomPrompt] = useState<string>('');
  const [isAdminGeminiLoading, setIsAdminGeminiLoading] = useState<boolean>(false);
  const [adminGeminiSuggestion, setAdminGeminiSuggestion] = useState<string | null>(null);
  const [copiedAdminGemini, setCopiedAdminGemini] = useState<boolean>(false);
  const [showAdminGeminiBox, setShowAdminGeminiBox] = useState<boolean>(true);

  // Handle Gemini AI suggestion request for admin report formulation
  const handleRequestAdminGemini = async (mode: 'polish' | 'bullets' | 'summary' | 'subtitles' | 'normalize' | 'custom' = 'polish') => {
    const textToAnalyze = (adminGeminiCustomPrompt.trim() && !reportSummary.trim() && !reportTitle.trim())
      ? adminGeminiCustomPrompt.trim()
      : (reportSummary.trim() || reportTitle.trim() || adminGeminiCustomPrompt.trim());

    if (!textToAnalyze) {
      showToast('لطفاً ابتدا بخشی از متن گزارش، عنوان یا کادر دستور را وارد نمایید تا هوش مصنوعی آن را تحلیل کند.', 'error');
      return;
    }

    setIsAdminGeminiLoading(true);
    setAdminGeminiSuggestion(null);

    const targetTeam = teams[selectedTeamSlug] || getAllTeams()[selectedTeamSlug];
    const teamName = targetTeam?.name || 'باشگاه جوانان محاش';

    // Instant offline normalization
    if (mode === 'normalize') {
      const normalized = normalizePersianText(textToAnalyze);
      setAdminGeminiSuggestion(normalized);
      setIsAdminGeminiLoading(false);
      showToast('متن با اصلاح نیم‌فاصله‌ها و قواعد نگارش فارسی پاکسازی شد.');
      return;
    }

    try {
      const res = await fetch('/api/gemini/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText: textToAnalyze,
          teamName: teamName,
          tone: adminGeminiTone,
          customPrompt: adminGeminiCustomPrompt || undefined,
          mode: mode
        })
      });

      if (!res.ok) throw new Error('Gemini API error');
      const data = await res.json();
      if (data.suggestion) {
        setAdminGeminiSuggestion(data.suggestion);
        showToast('پردازش و استخراج هوشمند با موفقیت آماده شد.');
        return;
      }
      throw new Error('Empty response');
    } catch (err) {
      console.warn('Gemini request fallback:', err);
      // Fallback structured generation using persianTextProcessor
      const result = proofreadAndPolishText(textToAnalyze, {
        title: reportTitle || undefined,
        teamName,
        tone: adminGeminiTone,
        customPrompt: adminGeminiCustomPrompt || undefined
      });

      if (mode === 'bullets') {
        setAdminGeminiSuggestion(
          `🎯 **محورها و نکات کلیدی استخراج‌شده (${teamName}):**\n\n` +
          result.keyPoints.map((k) => `• ${k}`).join('\n')
        );
      } else if (mode === 'summary') {
        setAdminGeminiSuggestion(result.executiveSummary);
      } else if (mode === 'subtitles') {
        setAdminGeminiSuggestion(result.subtitleScenario);
      } else {
        setAdminGeminiSuggestion(result.polishedText);
      }
      showToast('متن هوشمند با الگوی استاندارد پردازش گردید.');
    } finally {
      setIsAdminGeminiLoading(false);
    }
  };

  const handleApplyGeminiToSummary = () => {
    if (!adminGeminiSuggestion) return;
    setReportSummary(adminGeminiSuggestion);
    showToast('متن پیشنهادی با موفقیت در فیلد توضیحات گزارش درج گردید.');
  };

  const handleApplyGeminiToKeyPoints = () => {
    if (!adminGeminiSuggestion) return;
    const extracted = extractKeyPoints(adminGeminiSuggestion);
    if (extracted.length > 0) {
      setKeyPointsText(extracted.join('\n'));
      showToast(`${toPersianDigits(extracted.length)} محور کلیدی استخراج‌شده در لیست نکات درج گردید.`);
    } else {
      setKeyPointsText(adminGeminiSuggestion);
      showToast('متن پیشنهادی در لیست محورهای کلیدی درج شد.');
    }
  };

  const handleCopyAdminGemini = () => {
    if (!adminGeminiSuggestion) return;
    navigator.clipboard.writeText(adminGeminiSuggestion);
    setCopiedAdminGemini(true);
    showToast('متن هوش مصنوعی در حافظه کپی شد.');
    setTimeout(() => setCopiedAdminGemini(false), 2000);
  };

  // Check for preselected team from TeamDetailPage navigation
  useEffect(() => {
    try {
      const preselectedTeam = sessionStorage.getItem('mahash_admin_preselected_team');
      if (preselectedTeam && getAllTeams()[preselectedTeam]) {
        setSelectedTeamSlug(preselectedTeam);
        setReportNum(getNextReportNumberForTeam(preselectedTeam));
        setFilterTeam(preselectedTeam);
        setActiveTab('create');
        const teamName = getAllTeams()[preselectedTeam]?.name || preselectedTeam;
        showToast(`تیم «${teamName}» جهت ثبت گزارش و ویدیو انتخاب شد.`, 'success');
        sessionStorage.removeItem('mahash_admin_preselected_team');
      }
    } catch (e) {}
  }, [isAuthenticated]);

  // Subscribe to store updates
  useEffect(() => {
    const refreshData = async () => {
      setTeams(getAllTeams());
      setAllReports(getAllReports());
      setScoresList(getAllScores());
      setEventsList(getAllEvents());
      setReportViewsState(getAllReportViews());
      setMahashLogoSrc(getMahashLogo());
      setYouthClubBadgeSrc(getYouthClubBadge());
      setMemberAvatars(getMemberAvatars());
      setConsultantsList(getAllConsultants());
      setConsultantPhotos(getConsultantPhotos());
      setAdminUsernameState(getAdminUsername());
      const stats = await getStorageStats();
      setStorageStats(stats);
      const list = await getAllCachedVideos();
      setCachedVideos(list);
    };

    refreshData();
    const unsub = subscribeToStoreUpdates(() => {
      refreshData();
    });

    return () => unsub();
  }, [isAuthenticated]);

  // Run one-time background Firestore hydration for official consultants
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const currentPhotos = getConsultantPhotos();
    const naziPhotoExists = !!currentPhotos['خانم دکتر نازی عباسیان'] || !!currentPhotos['consultant_nazi_abbasian'] || !!currentPhotos['nazi_abbasian'];
    const radinPhotoExists = !!currentPhotos['آقای رادین اورومی'] || !!currentPhotos['consultant_radin_oroumi'] || !!currentPhotos['radin_oroumi'];

    if (!naziPhotoExists || !radinPhotoExists) {
      Promise.all([
        !naziPhotoExists ? getConsultantPhotoFromFirestore('خانم دکتر نازی عباسیان') : Promise.resolve(null),
        !radinPhotoExists ? getConsultantPhotoFromFirestore('آقای رادین اورومی') : Promise.resolve(null)
      ]).then(([naziPhoto, radinPhoto]) => {
        let updated = false;
        if (naziPhoto && isCustomImageDataUrlOrUrl(naziPhoto)) {
          saveConsultantPhoto('خانم دکتر نازی عباسیان', naziPhoto);
          updated = true;
        }
        if (radinPhoto && isCustomImageDataUrlOrUrl(radinPhoto)) {
          saveConsultantPhoto('آقای رادین اورومی', radinPhoto);
          updated = true;
        }
        if (updated) {
          setConsultantPhotos(getConsultantPhotos());
          setConsultantsList(getAllConsultants());
        }
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  // Handle Custom Security Key Password Reset
  const handleCustomRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryMessage(null);

    const key = recoveryKeyInput.trim();
    if (!key) {
      setRecoveryMessage({ type: 'error', text: 'لطفاً کلید امنیتی بازیابی را وارد نمایید.' });
      return;
    }

    if (recoveryNewPasswordInput) {
      if (recoveryNewPasswordInput.length < 4) {
        setRecoveryMessage({ type: 'error', text: 'کلمه عبور جدید باید حداقل ۴ کاراکتر باشد.' });
        return;
      }
      if (recoveryNewPasswordInput !== recoveryConfirmInput) {
        setRecoveryMessage({ type: 'error', text: 'کلمه عبور جدید و تکرار آن یکسان نیستند.' });
        return;
      }

      const result = recoverAdminPassword(key, recoveryNewPasswordInput);
      if (result.success) {
        setRecoveryMessage({ type: 'success', text: result.message });
        setRecoverySuccess(true);
        setUsernameInput('Admin');
        setPasswordInput(recoveryNewPasswordInput);
        showToast('کلمه عبور جدید با موفقیت تنظیم شد.');
      } else {
        setRecoveryMessage({ type: 'error', text: result.message });
      }
    } else {
      // Direct reset via authorized recovery key
      const result = recoverAdminPassword(key);
      if (result.success) {
        setRecoveryMessage({
          type: 'success',
          text: 'اطلاعات ورود مدیر با موفقیت بازنشانی گردید. اکنون می‌توانید وارد شوید.'
        });
        setRecoverySuccess(true);
        setUsernameInput('Admin');
        setPasswordInput(result.tempPassword || '');
        showToast('اطلاعات ورود مدیر با موفقیت بازیابی شد.');
      } else {
        setRecoveryMessage({ type: 'error', text: result.message });
      }
    }
  };

  // Handle Admin Login with Username & Password
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const enteredUsername = usernameInput.trim();
    const enteredPassword = passwordInput.trim();

    if (!enteredUsername) {
      setAuthError('لطفاً نام کاربری را وارد نمایید.');
      return;
    }

    if (!enteredPassword) {
      setAuthError('لطفاً کلمه عبور را وارد نمایید.');
      return;
    }

    const success = loginAdmin(enteredUsername, enteredPassword);
    if (success) {
      setIsAuthenticated(true);
      setUsernameInput('');
      setPasswordInput('');
      setShowRecoveryModal(false);
      showToast('ورود با موفقیت انجام شد. خوش آمدید مدیر گرامی!');
    } else {
      setAuthError('نام کاربری یا کلمه عبور وارد شده نادرست است. در صورت فراموشی می‌توانید از دکمه «بازیابی کلمه عبور» استفاده نمایید.');
    }
  };

  // Handle Admin Logout
  const handleLogout = () => {
    triggerGlobalCacheBust();
    logoutAdmin();
    setIsAuthenticated(false);
    showToast('با موفقیت از حساب مدیریت خارج شدید و کش برنامه بازنشانی گردید.');
  };

  // Handle Video Selection with Advanced Validation
  const handleVideoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Advanced Validation (MIME type, extension, size limit, and header magic numbers)
    const validation = await validateVideoFile(file);
    if (!validation.isValid) {
      showToast(validation.errorMessage || 'فایل ویدیویی انتخاب شده نامعتبر است.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    if (reportFormat === 'text') {
      setReportFormat('hybrid');
    }
    showToast(`فایل ویدیو «${file.name}» تأیید شد (${(file.size / (1024 * 1024)).toFixed(1)} مگابایت)`);
  };

  // Trigger Video Removal Modal
  const handleRemoveVideo = () => {
    setVideoRemovalModal({
      isOpen: true,
      reportId: editingReportId || undefined,
      teamSlug: selectedTeamSlug,
      reportTitle: reportTitle || 'گزارش فعلی',
      fileName: videoFile?.name || (editingReportId ? 'ویدیوی متصل به گزارش' : undefined)
    });
  };

  // Perform confirmed video removal
  const performConfirmedVideoRemoval = async (options?: { keepInStorage?: boolean }) => {
    const targetReportId = videoRemovalModal.reportId || editingReportId;
    const targetTeamSlug = videoRemovalModal.teamSlug || selectedTeamSlug;
    const isCurrentEditing = !videoRemovalModal.reportId || videoRemovalModal.reportId === editingReportId;

    if (isCurrentEditing) {
      setVideoFile(null);
      setVideoPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setKeepVideoAttachment(options?.keepInStorage || false);
      setReportFormat('text');
    }

    if (targetReportId) {
      try {
        await deleteVideoFromCache(targetReportId);
        removeVideoFromReport(targetReportId, targetTeamSlug);
        setAllReports(getAllReports());
        setTeams(getAllTeams());
      } catch (err) {
        console.warn('Could not delete video cache:', err);
      }
    }

    setVideoRemovalModal({ isOpen: false, reportTitle: '' });
    showToast('ویدیو با موفقیت از این گزارش و حافظه حذف شد و گزارش به حالت متنی درآمد.');
  };

  // Handle Attachments Selection with Advanced Validation
  const handleAttachmentFilesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingAttachment(true);
    try {
      const newAttachments: ReportAttachment[] = [];
      let rejectedCount = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Advanced validation per attachment
        const validation = validateAttachmentFile(file);
        if (!validation.isValid) {
          rejectedCount++;
          showToast(`فایل «${file.name}»: ${validation.errorMessage}`, 'error');
          continue;
        }

        const dataUrl = URL.createObjectURL(file);
        const ext = file.name.split('.').pop()?.toLowerCase() || 'file';
        const attType = detectAttachmentType(file.name, file.type);
        
        const newAtt: ReportAttachment = {
          id: `att-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
          name: file.name,
          type: attType,
          extension: ext,
          sizeBytes: file.size,
          sizeFormatted: formatFileSize(file.size),
          dataUrl,
          file,
          uploadDate: getSmartCurrentDate()
        };
        newAttachments.push(newAtt);
      }

      if (newAttachments.length > 0) {
        setAttachments((prev) => [...prev, ...newAttachments]);
        showToast(`${toPersianDigits(newAttachments.length)} فایل ضمیمه با موفقیت اعتبارسنجی و بارگذاری شد.`);
      } else if (rejectedCount > 0) {
        showToast('هیچ فایلی به دلیل عدم تطابق با معیارهای امنیتی ذخیره نشد.', 'error');
      }
    } catch (err) {
      console.error('Error processing attachments:', err);
      showToast('خطا در پردازش فایل‌های ضمیمه.', 'error');
    } finally {
      setIsUploadingAttachment(false);
      if (attachmentInputRef.current) attachmentInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleUpdateAttachmentCaption = (attId: string, caption: string) => {
    setAttachments((prev) =>
      prev.map((a) => (a.id === attId ? { ...a, caption } : a))
    );
  };

  // Add / Remove transcript line
  const handleAddTranscriptLine = () => {
    setTranscriptLines((prev) => [
      ...prev,
      { speaker: 'گوینده', role: 'عضو تیم', text: '', avatar: '🎙️' }
    ]);
  };

  const handleUpdateTranscriptLine = (index: number, field: string, value: string) => {
    setTranscriptLines((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleRemoveTranscriptLine = (index: number) => {
    setTranscriptLines((prev) => prev.filter((_, i) => i !== index));
  };

  // Calculate next sequential report number for a given team
  const getNextReportNumForTeam = (teamSlug: string) => {
    return getNextReportNumberForTeam(teamSlug);
  };

  const handleTeamChange = (newSlug: string) => {
    setSelectedTeamSlug(newSlug);
    if (!editingReportId) {
      setReportNum(getNextReportNumberForTeam(newSlug));
      const targetTeam = teams[newSlug] || getAllTeams()[newSlug];
      if (targetTeam) {
        setTranscriptLines([
          { speaker: targetTeam.manager || 'مدیر تیم', role: 'مدیر تیم', text: '', avatar: '👨‍💼' },
          { speaker: 'عضو تیم', role: 'عضو تیم', text: '', avatar: '👩‍💼' }
        ]);
      }
    }
  };

  // Reset form
  const resetForm = () => {
    setEditingReportId(null);
    setSelectedTeamSlug('team-angels');
    setReportFormat('hybrid');
    setReportNum(getNextReportNumberForTeam('team-angels'));
    setReportTitle('');
    setReportDate(getSmartCurrentDate());
    setReportSummary('');
    setReportStatus('published');
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setAttachments([]);
    setKeyPointsText('');
    const targetTeam = teams['team-angels'] || getAllTeams()['team-angels'];
    setTranscriptLines([
      { speaker: targetTeam?.manager || 'شیلا چرمیان', role: 'مدیر تیم', text: '', avatar: '🧕' },
      { speaker: 'عضو تیم', role: 'عضو تیم', text: '', avatar: '👩‍💼' }
    ]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (attachmentInputRef.current) attachmentInputRef.current.value = '';
  };

  // Populate form for editing existing report
  const handleEditReport = async (report: ActivityReport, teamSlug: string) => {
    setEditingReportId(report.id);
    setSelectedTeamSlug(teamSlug);
    const hasVideo = Boolean((report.videoSrc && report.videoSrc !== '#' && report.videoSrc.trim() !== '') || false);
    const initialFormat: ReportType = report.reportType || (hasVideo ? 'hybrid' : 'text');
    setReportFormat(initialFormat);
    setReportNum(report.reportNum ? formatReportNumberDisplay(report.reportNum) : getNextReportNumberForTeam(teamSlug));
    setReportTitle(report.title || '');
    setReportDate(report.date || getSmartCurrentDate());
    setReportSummary(report.summary || '');
    setReportStatus(report.status || 'published');
    setKeyPointsText((report.keyPoints || []).join('\n'));

    // Load attachments
    let loadedAttachments: ReportAttachment[] = [];
    if (report.attachments && report.attachments.length > 0) {
      loadedAttachments = [...report.attachments];
    } else {
      const dbAtts = await getAttachmentsFromDB(report.id);
      if (dbAtts.length > 0) {
        loadedAttachments = dbAtts;
      }
    }

    // Add legacy pdfUrl or images if not present
    if (report.pdfUrl && !loadedAttachments.some(a => a.dataUrl === report.pdfUrl)) {
      loadedAttachments.push({
        id: `att-pdf-${Date.now()}`,
        name: report.pdfLabel || 'سند گزارش (PDF)',
        type: 'pdf',
        extension: 'pdf',
        sizeFormatted: 'فایل PDF',
        dataUrl: report.pdfUrl
      });
    }
    if (report.images && report.images.length > 0) {
      report.images.forEach((img, idx) => {
        if (!loadedAttachments.some(a => a.dataUrl === img.src)) {
          loadedAttachments.push({
            id: `att-img-${idx}-${Date.now()}`,
            name: img.caption || `تصویر شماره ${toPersianDigits(idx + 1)}`,
            type: 'image',
            extension: 'jpg',
            sizeFormatted: 'تصویر ضمیمه',
            dataUrl: img.src,
            caption: img.caption
          });
        }
      });
    }

    setAttachments(loadedAttachments);

    if (report.transcript && report.transcript.length > 0) {
      setTranscriptLines(
        report.transcript.map((t) => ({
          speaker: t.speaker,
          role: t.role || '',
          text: t.text,
          avatar: t.avatar || '🎙️'
        }))
      );
    } else {
      setTranscriptLines([
        { speaker: 'گوینده', role: 'عضو تیم', text: '', avatar: '🎙️' }
      ]);
    }

    // Check cached video or report.videoSrc
    setVideoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    if (initialFormat === 'text') {
      setVideoPreviewUrl(null);
    } else {
      const cached = await getVideoFromCache(report.id);
      if (cached && cached.blob) {
        const url = URL.createObjectURL(cached.blob);
        setVideoPreviewUrl(url);
      } else if (report.videoSrc && !report.videoSrc.startsWith('indexeddb:') && !report.videoSrc.startsWith('blob:') && report.videoSrc !== '#') {
        setVideoPreviewUrl(report.videoSrc);
      } else {
        setVideoPreviewUrl(null);
      }
    }

    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`در حال ویرایش گزارش «${report.title}»`);
  };

  // Submit Form (Save or Update Report)
  const handleSubmitReport = async (e?: React.FormEvent) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }

    // 1. Advanced Full Report Submission Validation
    const validation = await validateFullReportSubmission(reportTitle, videoFile, attachments);
    if (!validation.isValid) {
      showToast(validation.errorMessage || 'لطفاً خطاهای فرم را برطرف نمایید.', 'error');
      return;
    }

    setIsSubmitting(true);
    setSubmitErrorMessage(null);
    setSubmitProgress(10);
    setSubmitStageText('در حال بررسی و اعتبارسنجی اطلاعات گزارش...');
    setSubmitProgressDetails(null);

    try {
      const reportId = editingReportId || `report-${Date.now()}`;
      const targetTeam = teams[selectedTeamSlug] || getAllTeams()[selectedTeamSlug];

      // 1. Save video file to permanent server storage and local IndexedDB cache
      let videoSrc: string | undefined = undefined;

      if (reportFormat === 'text') {
        // Clear any existing video for text-only reports or when explicitly converted to text
        videoSrc = undefined;
        if (editingReportId && !keepVideoAttachment) {
          try {
            await deleteVideoFromCache(editingReportId);
            removeVideoFromReport(editingReportId, selectedTeamSlug);
          } catch {}
        }
      } else if (videoFile) {
        setSubmitStageText('در حال آماده‌سازی و بارگذاری فایل ویدیو...');
        setSubmitProgress(15);
        
        // Cache video immediately in client IndexedDB for instant playback
        try {
          await saveVideoToCache(reportId, videoFile, videoFile.name);
        } catch (cacheErr) {
          console.warn('Local cache warning:', cacheErr);
        }

        const uploadResult = await uploadFileToServerStorage(videoFile, (p, info) => {
          // Scale video progress between 15% and 80%
          const scaledPercent = Math.min(80, Math.max(15, 15 + Math.round((p / 100) * 65)));
          setSubmitProgress(scaledPercent);
          if (info) {
            const loadedMB = (info.loadedBytes / (1024 * 1024)).toFixed(1);
            const totalMB = (info.totalBytes / (1024 * 1024)).toFixed(1);
            setSubmitProgressDetails({
              loadedFormatted: `${toPersianDigits(loadedMB)} MB`,
              totalFormatted: `${toPersianDigits(totalMB)} MB`
            });
            setSubmitStageText(`در حال آپلود ویدیو (${toPersianDigits(loadedMB)} MB از ${toPersianDigits(totalMB)} MB - ${toPersianDigits(p)}٪)...`);
          } else {
            setSubmitStageText(`در حال بارگذاری فایل ویدیو (${toPersianDigits(p)}٪)...`);
          }
        });

        videoSrc = uploadResult?.url || `indexeddb:${reportId}`;
      } else if (editingReportId) {
        // Retain existing video when only text or meta is being edited
        const existingRep = (targetTeam?.reports || []).find((r: any) => r.id === editingReportId) || allReports.find((r: any) => r.id === editingReportId);
        const existingVideo = existingRep?.videoSrc || (existingRep as any)?.videoUrl;

        if (videoPreviewUrl && !videoPreviewUrl.startsWith('blob:')) {
          videoSrc = videoPreviewUrl;
        } else if (existingVideo && !existingVideo.startsWith('blob:') && existingVideo !== '#') {
          videoSrc = existingVideo;
        } else if (existingVideo) {
          videoSrc = existingVideo;
        } else if (videoPreviewUrl) {
          videoSrc = `indexeddb:${editingReportId}`;
        }
      } else if (videoPreviewUrl && !videoPreviewUrl.startsWith('blob:')) {
        videoSrc = videoPreviewUrl;
      } else {
        videoSrc = undefined;
      }

      // 2. Save attachments to permanent storage and local IndexedDB in parallel
      setSubmitStageText('در حال بارگذاری و ذخیره فایل‌های پیوست...');
      setSubmitProgress(82);

      let finalAttachments = [...attachments];
      if (finalAttachments && finalAttachments.length > 0) {
        const processed = await Promise.all(
          finalAttachments.map(async (att) => {
            if (att.file) {
              try {
                await saveAttachmentRecord(reportId, att, att.file);
                const uploadResult = await uploadFileToServerStorage(att.file);
                return {
                  ...att,
                  dataUrl: uploadResult.url,
                  file: undefined
                };
              } catch (attErr) {
                console.warn(`Attachment processing fallback for ${att.name}:`, attErr);
                return {
                  ...att,
                  file: undefined
                };
              }
            }
            return att;
          })
        );
        finalAttachments = processed;
      }

      // 3. Parse key points from textarea
      setSubmitStageText('در حال قالب‌بندی متون، دیالوگ‌ها و محورهای کلیدی...');
      setSubmitProgress(88);

      const parsedKeyPoints = keyPointsText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      // 4. Clean transcript lines
      const validTranscript = transcriptLines
        .map((l) => ({
          speaker: l.speaker.trim() || 'گوینده',
          role: l.role.trim() || 'عضو تیم',
          text: l.text.trim(),
          avatar: l.avatar.trim() || '🎙️'
        }))
        .filter((l) => l.text.length > 0);

      // Clean and normalize report number to prevent duplicate 'گزارش'
      const trimmedNum = reportNum.trim();
      const finalReportNum = trimmedNum 
        ? formatReportNumberDisplay(trimmedNum) 
        : getNextReportNumberForTeam(selectedTeamSlug);
      const finalReportDate = reportDate.trim() || getSmartCurrentDate();

      let isoToSave = new Date().toISOString();
      const parsedTime = parseReportTimestamp({ date: finalReportDate });
      if (parsedTime > 0) {
        isoToSave = new Date(parsedTime).toISOString();
      }

      if (editingReportId) {
        const oldReport = targetTeam?.reports.find(r => r.id === editingReportId);
        if (oldReport && oldReport.date === finalReportDate) {
          isoToSave = oldReport.datetimeIso || isoToSave;
        }
      }

      const reportObject: ActivityReport = {
        id: reportId,
        reportNum: finalReportNum,
        title: reportTitle.trim(),
        date: finalReportDate,
        datetimeIso: isoToSave,
        summary: reportSummary.trim() || 'گزارش رسمی فعالیت تیم در باشگاه جوانان محاش.',
        status: reportStatus,
        reportType: reportFormat,
        videoSrc: videoSrc || undefined,
        posterSrc: targetTeam?.logo || undefined,
        keyPoints: parsedKeyPoints.length > 0 ? parsedKeyPoints : undefined,
        transcript: validTranscript,
        attachments: finalAttachments.length > 0 ? finalAttachments : undefined,
        updatedAt: Date.now()
      };
      (reportObject as any).videoUrl = videoSrc || undefined;

      // 5. Save to store & trigger sync hook with keepVideoAttachment
      setSubmitStageText('در حال ذخیره نهایی در پایگاه داده و ثبت در سایت...');
      setSubmitProgress(94);

      await syncReportData(
        reportObject, 
        selectedTeamSlug, 
        (freshReports, freshTeams) => {
          setAllReports([...freshReports]);
          setTeams({...freshTeams});
        },
        { keepVideoAttachment }
      );

      // Complete progress animation
      setSubmitProgress(100);
      setSubmitStageText('گزارش با موفقیت ذخیره و منتشر گردید.');

      // Log action to MySQL database in real-time
      logReportToMySQL({
        actionType: editingReportId ? 'report_update' : 'report_create',
        title: `${editingReportId ? 'ویرایش' : 'ثبت'} گزارش: ${reportTitle.trim()}`,
        details: `تیم: ${targetTeam?.name || selectedTeamSlug} | شماره: ${finalReportNum} | فرمت: ${reportFormat}`,
        userName: 'مدیر سامانه',
        teamSlug: selectedTeamSlug,
        reportId: reportObject.id,
        metadata: {
          reportNum: finalReportNum,
          title: reportTitle.trim(),
          format: reportFormat,
          hasVideo: !!videoSrc,
          attachmentsCount: finalAttachments.length
        },
        status: 'success'
      });

      // Clear local draft upon successful submission
      clearFormDraft();
      setSavedDraftsList(getSavedDrafts());

      showToast(
        editingReportId
          ? 'گزارش با موفقیت بروزرسانی و منتشر گردید.'
          : 'گزارش و محتوای ویدیو با موفقیت ذخیره و در سایت منتشر شد.'
      );

      resetForm();
      setActiveTab('reports');
    } catch (err: any) {
      console.error('Error saving report:', err);
      const friendlyMsg = err?.message || 'خطا در ارتباط با سرور یا پردازش فایل‌ها رخ داده است.';
      setSubmitErrorMessage(friendlyMsg);
      showToast(`خطا در ذخیره‌سازی: اطلاعات فرم حفظ شده است. جهت تلاش دوباره دکمه «تلاش مجدد» را کلیک کنید.`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Explicit Save as Draft Action
  const handleSaveDraftAction = async () => {
    if (!reportTitle.trim() && !reportSummary.trim()) {
      showToast('حداقل عنوان یا چکیده گزارش را برای ذخیره پیش‌نویس وارد کنید.', 'error');
      return;
    }

    try {
      const draftId = `draft-${Date.now()}`;
      const parsedKeyPoints = keyPointsText
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

      const draft: ReportDraft = {
        id: draftId,
        reportId: editingReportId || undefined,
        teamSlug: selectedTeamSlug,
        reportFormat,
        title: reportTitle.trim() || 'پیش‌نویس بدون عنوان',
        date: reportDate.trim() || getSmartCurrentDate(),
        reportNum: reportNum.trim() || getNextReportNumberForTeam(selectedTeamSlug),
        summary: reportSummary.trim(),
        keyPoints: parsedKeyPoints,
        videoSrc: videoPreviewUrl || undefined,
        transcript: transcriptLines,
        attachments,
        keepVideoAttachment,
        status: 'draft',
        updatedAt: Date.now()
      };

      saveDraft(draft);
      setSavedDraftsList(getSavedDrafts());
      showToast('پیش‌نویس گزارش با موفقیت در بخش پیش‌نویس‌ها ذخیره شد.', 'success');
    } catch (err: any) {
      showToast(`خطا در ذخیره پیش‌نویس: ${err?.message}`, 'error');
    }
  };

  // Load draft into active editor
  const handleLoadDraft = (draft: ReportDraft) => {
    if (draft.reportId) {
      setEditingReportId(draft.reportId);
    } else {
      setEditingReportId(null);
    }
    setSelectedTeamSlug(draft.teamSlug || 'team-angels');
    setReportFormat(draft.reportFormat || 'hybrid');
    setReportNum(draft.reportNum || getNextReportNumberForTeam(draft.teamSlug || 'team-angels'));
    setReportTitle(draft.title || '');
    setReportDate(draft.date || getSmartCurrentDate());
    setReportSummary(draft.summary || '');
    setReportStatus('draft');
    setKeyPointsText((draft.keyPoints || []).join('\n'));
    if (draft.videoSrc) {
      setVideoPreviewUrl(draft.videoSrc);
    }
    if (draft.attachments) {
      setAttachments(draft.attachments);
    }
    if (draft.transcript && draft.transcript.length > 0) {
      setTranscriptLines(draft.transcript);
    }
    if (draft.keepVideoAttachment !== undefined) {
      setKeepVideoAttachment(draft.keepVideoAttachment);
    }
    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`پیش‌نویس «${draft.title}» در فرم بارگذاری شد.`);
  };

  // Delete draft action
  const handleDeleteDraftAction = (draftId: string) => {
    deleteDraft(draftId);
    setSavedDraftsList(getSavedDrafts());
    showToast('پیش‌نویس با موفقیت حذف گردید.');
  };

  // Delete Report Handlers
  const handleOpenDeleteReportModal = (reportId: string, teamSlug: string, title: string, teamName?: string) => {
    setReportToDelete({ id: reportId, teamSlug, title, teamName });
    setDeleteConfirmAck(false);
    setDeleteOperatorName(adminUsername ? `مدیر (${adminUsername})` : 'مدیر ارشد سامانه (Admin)');
    setDeleteReason('درخواست حذف نهایی توسط مدیر');
    setDeleteReasonCustom('');
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = reportToDelete.id;
      const targetSlug = reportToDelete.teamSlug;
      const finalReason = deleteReason === 'other' ? (deleteReasonCustom.trim() || 'سایر دلایل') : deleteReason;
      const finalOperator = deleteOperatorName.trim() || 'مدیر ارشد سامانه (Admin)';

      // 1. Permanently purge report from all databases, caches, and server storage with audit logging
      const purgeResult = await securePermanentReportPurge({
        reportId: targetId,
        teamSlug: targetSlug,
        reportTitle: reportToDelete.title,
        teamName: reportToDelete.teamName,
        operatorName: finalOperator,
        operatorRole: 'مدیر سامانه',
        reason: finalReason,
        purgeMedia: true
      });

      triggerGlobalCacheBust();

      // 2. Immediately refresh state & cache
      setAllReports(getAllReports());
      setTeams(getAllTeams());
      setReportViewsState(getAllReportViews());

      showToast(
        `گزارش «${reportToDelete.title}» به صورت قطعی و امن پاکسازی گردید و در لاگ نظارتی (Audit Log) ثبت شد.`,
        'success'
      );
      setReportToDelete(null);
    } catch (err: any) {
      console.error('Error deleting report:', err);
      showToast(`خطا در حذف گزارش: ${err?.message || 'خطای سرور'}`, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Transfer and publish approved reports directly to the public "My Group" / Team page
  const handleTransferApprovedReportsToPublicGroup = (targetSlug?: string) => {
    try {
      const currentTeams = getAllTeams();
      let updatedCount = 0;

      // Ensure all reports in selected team or across all teams have 'published' status
      Object.entries(currentTeams).forEach(([slug, team]) => {
        if (!targetSlug || slug === targetSlug) {
          (team.reports || []).forEach((r) => {
            if (r.status !== 'published') {
              r.status = 'published';
              saveReport(r, slug);
              updatedCount++;
            }
          });
        }
      });

      syncLocalDataToServer().catch(console.error);
      triggerGlobalCacheBust();
      setAllReports(getAllReports());
      setTeams(getAllTeams());

      const destinationSlug = targetSlug || (filterTeam !== 'all' ? filterTeam : 'team-angels');
      const targetTeamName = currentTeams[destinationSlug]?.name || 'گروه من';

      showToast(`گزارش‌های تایید شده با موفقیت به صفحه عمومی «${targetTeamName}» منتقل و نمایش داده شدند.`);

      // Seamlessly navigate to the public page
      setTimeout(() => {
        onNavigate(destinationSlug as PageId);
      }, 500);
    } catch (err: any) {
      console.error('Error transferring reports:', err);
      showToast('خطا در انتقال گزارش‌ها به صفحه عمومی', 'error');
    }
  };

  // Delete Event Handlers
  const handleOpenDeleteEventModal = (ev: EventItem) => {
    setEventToDelete({
      id: ev.id,
      title: ev.title,
      categoryLabel: ev.categoryLabel,
      dateJalali: ev.dateJalali
    });
  };

  const handleConfirmDeleteEvent = () => {
    if (!eventToDelete) return;
    try {
      deleteEvent(eventToDelete.id);
      setEventsList(getAllEvents());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mahash_store_updated'));
      }
      showToast(`رویداد «${eventToDelete.title}» با موفقیت حذف گردید.`);
      setEventToDelete(null);
    } catch (err) {
      console.error('Error deleting event:', err);
      showToast('خطا در حذف رویداد.', 'error');
    }
  };

  // Reset All Data Handler
  const handleConfirmResetAllData = () => {
    try {
      resetAllDataToDefault();
      setAllReports(getAllReports());
      setTeams(getAllTeams());
      setEventsList(getAllEvents());
      setScoresList(getAllScores());
      setMahashLogoSrc(getMahashLogo());
      setYouthClubBadgeSrc(getYouthClubBadge());
      setReportViewsState(getAllReportViews());
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mahash_store_updated'));
      }
      setShowResetAllConfirmModal(false);
      showToast('داده‌های سامانه با موفقیت به حالت اولیه بازنشانی شدند.');
    } catch (err) {
      console.error('Error resetting all data:', err);
      showToast('خطا در بازنشانی داده‌ها.', 'error');
    }
  };

  // Change Admin Username
  const handleChangeUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || newUsername.trim().length < 2) {
      showToast('نام کاربری باید حداقل ۲ نویسه باشد.', 'error');
      return;
    }
    setAdminUsername(newUsername.trim());
    setAdminUsernameState(getAdminUsername());
    setNewUsername('');
    setUsernameChangeSuccess(true);
    showToast('نام کاربری مدیریت با موفقیت بروزرسانی شد.');
    setTimeout(() => setUsernameChangeSuccess(false), 4000);
  };

  // Change Admin Password
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 3) {
      showToast('کلمه عبور باید حداقل ۳ نویسه باشد.', 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('تکرار کلمه عبور همخوانی ندارد.', 'error');
      return;
    }

    setAdminPassword(newPassword);
    setNewPassword('');
    setConfirmPassword('');
    setPasswordChangeSuccess(true);
    showToast('کلمه عبور مدیریت با موفقیت تغییر یافت.');
    setTimeout(() => setPasswordChangeSuccess(false), 4000);
  };

  // ----------------------------------------------------
  // Logo & Circular Badge Actions
  // ----------------------------------------------------

  const uploadAndProcessImageFile = async (file: File, maxWidth = 480, quality = 0.85): Promise<string> => {
    // Ultra-fast client-side compression into a lightweight base64 Data URL with hardware acceleration
    try {
      const compressed = await compressImageToDataUrl(file, maxWidth, quality);
      if (compressed) return compressed;
    } catch (err) {
      console.warn('Fast compression failed, trying fallback:', err);
    }

    // Fallback to FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve((reader.result as string) || '');
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const allAvailableBadges: CircularBadgePreset[] = useMemo(() => [
    ...CIRCULAR_BADGE_PRESETS,
    ...customBadgesList
  ], [customBadgesList]);

  const filteredBadges = useMemo(() => allAvailableBadges.filter((b) => {
    if (activeBadgeCategoryFilter === 'all') return true;
    return b.category === activeBadgeCategoryFilter;
  }), [allAvailableBadges, activeBadgeCategoryFilter]);

  const handleApplyLogoToMahash = async (logoData: string, title?: string) => {
    const previousLogo = mahashLogoSrc;
    setMahashSyncStatus('syncing');
    setMahashLogo(logoData);
    setMahashLogoSrc(logoData);
    
    // WordPress API sync with explicit try-catch state rollback
    try {
      await WordPressService.saveLogo('mahash_official_logo', logoData, 'logo', title || 'لوگوی رسمی مؤسسه محاش');
      await saveMahashLogoToFirestore(logoData);
      setMahashSyncStatus('synced');
      setMahashLastSyncedAt(new Date());
      showToast(`لوگوی اصلی مؤسسه محاش به «${title || 'طرح انتخابی'}» تغییر یافت و در دیتابیس وردپرس و فایربیس ثبت شد.`);
      setTimeout(() => setMahashSyncStatus('idle'), 3500);
    } catch (err) {
      // Explicit state rollback to prevent 'Saving...' loop
      setMahashLogoSrc(previousLogo);
      setMahashLogo(previousLogo);
      setMahashSyncStatus('error');
      showToast('خطا در ذخیره‌سازی لوگوی محاش در وردپرس. حالت قبلی با موفقیت بازیابی شد.', 'error');
    }
  };

  const handleResetMahashLogoAction = async () => {
    const previousLogo = mahashLogoSrc;
    setMahashSyncStatus('syncing');
    resetMahashLogo();
    setMahashLogoSrc(MAHESH_LOGO_SVG);
    try {
      await WordPressService.saveLogo('mahash_official_logo', MAHESH_LOGO_SVG, 'logo', 'لوگوی رسمی مؤسسه محاش');
      await saveMahashLogoToFirestore('');
      setMahashSyncStatus('synced');
      setMahashLastSyncedAt(new Date());
      showToast('لوگوی مؤسسه محاش به نشان وکتور استاندارد بازنشانی شد.');
      setTimeout(() => setMahashSyncStatus('idle'), 2500);
    } catch (err) {
      setMahashLogoSrc(previousLogo);
      setMahashSyncStatus('error');
      showToast('خطا در بازنشانی لوگو. حالت قبلی بازیابی شد.', 'error');
    }
  };

  const handleApplyBadgeToYouthClub = async (badgeData: string, title?: string) => {
    const previousBadge = youthClubBadgeSrc;
    setYouthClubSyncStatus('syncing');
    setYouthClubBadge(badgeData);
    setYouthClubBadgeSrc(badgeData);

    try {
      await WordPressService.saveLogo('mahash_youth_club_emblem', badgeData, 'badge', title || 'نشان رسمی باشگاه جوانان');
      await saveYouthClubEmblemToFirestore(badgeData);
      setYouthClubSyncStatus('synced');
      setYouthClubLastSyncedAt(new Date());
      showToast(`نشان اختصاصی باشگاه جوانان به «${title || 'طرح انتخابی'}» تغییر یافت و همگام شد.`);
      setTimeout(() => setYouthClubSyncStatus('idle'), 3500);
    } catch (err) {
      // Explicit state rollback
      setYouthClubBadgeSrc(previousBadge);
      setYouthClubBadge(previousBadge);
      setYouthClubSyncStatus('error');
      showToast('خطا در ذخیره‌سازی نشان باشگاه جوانان در وردپرس. حالت قبلی بازیابی شد.', 'error');
    }
  };

  const handleResetYouthClubBadgeAction = async () => {
    const previousBadge = youthClubBadgeSrc;
    setYouthClubSyncStatus('syncing');
    resetYouthClubBadge();
    setYouthClubBadgeSrc(MAHESH_CLUB_EMBLEM_SVG);
    try {
      await WordPressService.saveLogo('mahash_youth_club_emblem', MAHESH_CLUB_EMBLEM_SVG, 'badge', 'نشان رسمی باشگاه جوانان');
      await saveYouthClubEmblemToFirestore('');
      setYouthClubSyncStatus('synced');
      setYouthClubLastSyncedAt(new Date());
      showToast('نشان باشگاه جوانان به طرح اصلی بازنشانی گردید.');
      setTimeout(() => setYouthClubSyncStatus('idle'), 2500);
    } catch (err) {
      setYouthClubBadgeSrc(previousBadge);
      setYouthClubSyncStatus('error');
      showToast('خطا در بازنشانی نشان باشگاه. حالت قبلی بازیابی شد.', 'error');
    }
  };

  const handleSyncToServer = async () => {
    setIsSyncingServer(true);
    setSyncProgress(0);
    setSyncMessage('در حال آماده‌سازی...');
    try {
      const ok = await syncLocalDataToServer((progress, message) => {
        setSyncProgress(progress);
        setSyncMessage(message);
      });
      if (ok) {
        const msg = 'تمامی لوگوها، گزارش‌ها، امتیازات و تنظیمات با موفقیت روی سرور مرکزی منتشر و ذخیره شد.';
        showToast(msg);
        maintenanceSuccess('همگام‌سازی و انتشار موفق سرور', msg);
      } else {
        showToast('خطا در انتشار روی سرور مرکزی. لطفاً اتصال اینترنت را بررسی کنید.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setTimeout(() => {
        setIsSyncingServer(false);
        setSyncProgress(0);
        setSyncMessage('');
      }, 1000);
    }
  };

  const handlePullFromServer = async () => {
    setIsSyncingServer(true);
    try {
      const ok = await fetchAndMergeServerStore();
      if (ok) {
        const msg = 'اطلاعات و لوگوها با موفقیت از سرور مرکزی دریافت و اعمال گردید.';
        showToast(msg);
        maintenanceSuccess('دریافت و هماهنگ‌سازی موفق اطلاعات', msg);
      } else {
        showToast('دریافت اطلاعات از سرور انجام نشد.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setIsSyncingServer(false);
    }
  };

  const executeForceRefresh = async () => {
    setIsForceRefreshing(true);
    try {
      const ok = await fetchAndMergeServerStore(true);
      if (ok) {
        clearPendingSyncItems();
        const msg = 'آخرین اطلاعات و گزارش‌ها با موفقیت از سرور دریافت و نوسازی اجباری (Force Refresh) انجام شد.';
        showToast(msg);
        maintenanceSuccess('نوسازی اجباری و دریافت آخرین اطلاعات', msg);
      } else {
        showToast('خطا در دریافت آخرین اطلاعات از سرور یا ارتباط برقرار نشد.', 'error');
      }
    } catch (err: any) {
      showToast(`خطا در نوسازی اجباری از سرور: ${err?.message || 'نامشخص'}`, 'error');
    } finally {
      setIsForceRefreshing(false);
      setShowForceRefreshConfirmModal(false);
      setPendingSyncCount(getPendingSyncCount());
      setLastSyncTime(getLastSuccessfulSync());
      setSyncLogsList(getSyncHistoryLogs());
    }
  };

  const handleForceRefresh = () => {
    const pending = getPendingSyncCount();
    if (pending > 0) {
      setShowForceRefreshConfirmModal(true);
    } else {
      executeForceRefresh();
    }
  };

  const handleAssignBadgeToTeam = (teamSlug: string, logoData: string, badgeTitle?: string) => {
    const targetTeam = teams[teamSlug];
    if (!targetTeam) return;
    saveTeamLogo(teamSlug, logoData);
    showToast(`لوگوی تیم «${targetTeam.name}» به «${badgeTitle || 'نشان انتخابی'}» تغییر یافت و پایدار شد.`);
  };

  const handleResetTeamLogo = (teamSlug: string) => {
    const targetTeam = teams[teamSlug];
    if (!targetTeam) return;
    resetTeamLogo(teamSlug);
    showToast(`لوگوی تیم «${targetTeam.name}» به نشان پیش‌فرض بازنشانی شد.`);
  };

  const handleAddNewCustomBadge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBadgeTitle.trim()) {
      showToast('لطفاً عنوان نشان را وارد کنید.', 'error');
      return;
    }
    if (!newBadgeFileBase64) {
      showToast('لطفاً فایل تصویر یا لوگوی وکتور نشان را انتخاب نمایید.', 'error');
      return;
    }

    const newBadgeItem: CircularBadgePreset = {
      id: `custom-badge-${Date.now()}`,
      name: newBadgeTitle.trim(),
      title: newBadgeTitle.trim(),
      description: newBadgeDescription.trim() || 'نشان و لوگوی حلقوی اختصاصی',
      category: 'custom',
      svg: newBadgeFileBase64,
      svgDataUri: newBadgeFileBase64
    };

    const updated = [newBadgeItem, ...customBadgesList];
    setCustomBadgesList(updated);
    safeSetLocalStorage('mahash_custom_badges_v1', JSON.stringify(updated));
    triggerGlobalCacheBust();

    setNewBadgeTitle('');
    setNewBadgeDescription('');
    setNewBadgeFileBase64(null);
    showToast(`نشان جدید «${newBadgeItem.name}» با موفقیت به کتابخانه افزوده و پایدار شد.`);
  };

  const handleDeleteCustomBadge = (badgeId: string, badgeTitle: string) => {
    const updated = customBadgesList.filter((b) => b.id !== badgeId);
    setCustomBadgesList(updated);
    safeSetLocalStorage('mahash_custom_badges_v1', JSON.stringify(updated));
    triggerGlobalCacheBust();
    showToast(`نشان «${badgeTitle}» با موفقیت از کتابخانه حذف شد.`);
  };

  // Filtered & Sorted reports list for table (memoized to prevent lag during form typing)
  const filteredReports = useMemo(() => {
    return allReports
      .filter((r) => {
        // 1. Team filter
        const matchesTeam = filterTeam === 'all' || r.teamSlug === filterTeam;

        // 2. Status filter
        const rStatus = r.status || 'published';
        const matchesStatus =
          filterStatus === 'all' ||
          (filterStatus === 'published' && rStatus === 'published') ||
          (filterStatus === 'draft' && rStatus === 'draft');

        // 3. Media Type filter (video vs text-only)
        const hasVideo = Boolean(r.videoSrc && r.videoSrc !== '#' && r.videoSrc.trim() !== '');
        const matchesMediaType =
          filterMediaType === 'all' ||
          (filterMediaType === 'video' && hasVideo) ||
          (filterMediaType === 'text-only' && !hasVideo);

        // 4. Date period filter
        let matchesDate = true;
        if (filterDatePeriod === '1405') {
          matchesDate = r.date.includes('۱۴۰۵') || r.date.includes('1405');
        } else if (filterDatePeriod === '1404') {
          matchesDate = r.date.includes('۱۴۰۴') || r.date.includes('1404');
        } else if (filterDatePeriod === 'custom' && customDateQuery.trim() !== '') {
          const q = customDateQuery.trim();
          matchesDate = r.date.includes(q) || (r.datetimeIso && r.datetimeIso.includes(q));
        }

        // 5. Search query
        const matchesSearch =
          searchQuery.trim() === '' ||
          r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          r.reportNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (r.teamName && r.teamName.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesTeam && matchesStatus && matchesMediaType && matchesDate && matchesSearch;
      })
      .sort((a, b) => {
        const viewsA = reportViews[a.id] ?? 0;
        const viewsB = reportViews[b.id] ?? 0;
        if (reportsSortBy === 'views-desc') return viewsB - viewsA;
        if (reportsSortBy === 'views-asc') return viewsA - viewsB;
        if (reportsSortBy === 'title') return a.title.localeCompare(b.title, 'fa');
        if (reportsSortBy === 'num-desc') {
          const seqA = extractReportSequenceNumber(a);
          const seqB = extractReportSequenceNumber(b);
          if (seqA !== seqB) return seqB - seqA;
          return parseReportTimestamp(b) - parseReportTimestamp(a);
        }
        if (reportsSortBy === 'num-asc') {
          const seqA = extractReportSequenceNumber(a);
          const seqB = extractReportSequenceNumber(b);
          if (seqA !== seqB) return seqA - seqB;
          return parseReportTimestamp(a) - parseReportTimestamp(b);
        }
        if (reportsSortBy === 'date-asc') {
          const timeDiff = parseReportTimestamp(a) - parseReportTimestamp(b);
          if (timeDiff !== 0) return timeDiff;
          return extractReportSequenceNumber(a) - extractReportSequenceNumber(b);
        }
        // Default: date-desc
        const timeDiff = parseReportTimestamp(b) - parseReportTimestamp(a);
        if (timeDiff !== 0) return timeDiff;
        return extractReportSequenceNumber(b) - extractReportSequenceNumber(a);
      });
  }, [allReports, filterTeam, filterStatus, filterMediaType, filterDatePeriod, customDateQuery, searchQuery, reportsSortBy, reportViews]);

  // Calculate high-level video popularity metrics (memoized)
  const totalViewsCount: number = useMemo(() => {
    return (Object.values(reportViews) as number[]).reduce((acc: number, v: number) => acc + (Number(v) || 0), 0);
  }, [reportViews]);

  const reportsWithViews = useMemo(() => {
    return allReports.map((r) => ({
      ...r,
      views: Number(reportViews[r.id]) || 0
    }));
  }, [allReports, reportViews]);

  const rankedReports = useMemo(() => {
    return [...reportsWithViews].sort((a, b) => b.views - a.views);
  }, [reportsWithViews]);

  const topReport = rankedReports.length > 0 ? rankedReports[0] : null;
  const maxViews = useMemo(() => {
    return rankedReports.length > 0 ? Math.max(...rankedReports.map((r) => r.views), 1) : 1;
  }, [rankedReports]);

  const avgViewsPerReport: number = useMemo(() => {
    return allReports.length > 0 ? Math.round(totalViewsCount / allReports.length) : 0;
  }, [allReports.length, totalViewsCount]);

  // Team views statistics (memoized)
  const teamViewsStats = useMemo(() => {
    return (Object.entries(teams) as [string, TeamData][])
      .map(([slug, team]) => {
        const teamReps = team.reports || [];
        const teamTotalViews = teamReps.reduce((sum, r) => sum + (Number(reportViews[r.id]) || 0), 0);
        const percentage = totalViewsCount > 0 ? Math.round((teamTotalViews / totalViewsCount) * 100) : 0;
        return {
          slug,
          name: team.name,
          icon: team.icon,
          manager: team.manager,
          logo: team.logo,
          reportsCount: teamReps.length,
          totalViews: teamTotalViews,
          percentage
        };
      })
      .sort((a, b) => b.totalViews - a.totalViews);
  }, [teams, reportViews, totalViewsCount]);

  const topTeam = teamViewsStats.length > 0 ? teamViewsStats[0] : null;

  // ----------------------------------------------------
  // Render: Login Gate if not authenticated
  // ----------------------------------------------------
  if (!isAuthenticated) {
    return (
      <div className="min-h-[85vh] flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6">
          {/* Lock Icon and Header */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">پنل مدیریت محاش</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              ورود به سامانه مدیریت گزارش‌ها، ویدیوها و اعضای تیم‌ها
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {authError && (
              <div className="bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs p-3.5 rounded-xl flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                  <span className="font-semibold">{authError}</span>
                </div>
                <div className="flex items-center justify-end pt-1 border-t border-rose-200/60 dark:border-rose-800/60 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setShowRecoveryModal(true);
                      setRecoveryMessage(null);
                    }}
                    className="text-indigo-600 dark:text-indigo-400 underline hover:font-bold transition cursor-pointer"
                  >
                    بازیابی کلمه عبور
                  </button>
                </div>
              </div>
            )}

            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نام کاربری
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  data-allow-latin="true"
                  placeholder="نام کاربری مدیریت..."
                  className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition dark:text-white"
                  autoFocus
                  required
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  کلمه عبور مدیریت
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setShowRecoveryModal(!showRecoveryModal);
                    setRecoveryMessage(null);
                  }}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <KeyRound className="w-3 h-3" />
                  <span>بازیابی / فراموشی رمز</span>
                </button>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  data-allow-latin="true"
                  placeholder="کلمه عبور مدیریت را وارد نمایید..."
                  className="w-full pr-10 pl-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none transition dark:text-white"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
                  tabIndex={-1}
                  aria-label={showPassword ? 'مخفی کردن کلمه عبور' : 'نمایش کلمه عبور'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#173b82] to-blue-600 hover:from-blue-700 hover:to-blue-800 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-sm"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>ورود به پنل مدیریت</span>
            </button>
          </form>

          {/* Password Recovery Box / Modal */}
          {showRecoveryModal && (
            <div className="bg-gradient-to-b from-indigo-50/70 to-blue-50/40 dark:from-slate-800 dark:to-slate-800/80 border border-indigo-200 dark:border-indigo-900/60 rounded-2xl p-4 sm:p-5 space-y-4 animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-slate-700 pb-2">
                <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200 font-black text-xs sm:text-sm">
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>سامانه بازیابی کلمه عبور مدیر</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer"
                >
                  بستن ✕
                </button>
              </div>

              {recoveryMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                    recoveryMessage.type === 'success'
                      ? 'bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/70 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {recoveryMessage.type === 'success' ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                  )}
                  <span>{recoveryMessage.text}</span>
                </div>
              )}

              {/* Secure Recovery via Master Key */}
              <form onSubmit={handleCustomRecovery} className="space-y-3 bg-white dark:bg-slate-900/80 p-3.5 rounded-xl border border-indigo-100/80 dark:border-slate-700">
                <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                  جهت بازیابی یا تغییر رمز عبور، کلید امنیتی مدیریت را وارد نمایید.
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                    کد امنیتی بازیابی
                  </label>
                  <div className="relative">
                    <input
                      type={showRecoveryKey ? 'text' : 'password'}
                      value={recoveryKeyInput}
                      onChange={(e) => setRecoveryKeyInput(e.target.value)}
                      data-allow-latin="true"
                      placeholder="کد امنیتی معتبر..."
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRecoveryKey(!showRecoveryKey)}
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                      title={showRecoveryKey ? 'مخفی کردن کد' : 'نمایش کد'}
                    >
                      {showRecoveryKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      کلمه عبور جدید (اختیاری)
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoveryNewPass ? 'text' : 'password'}
                        value={recoveryNewPasswordInput}
                        onChange={(e) => setRecoveryNewPasswordInput(e.target.value)}
                        data-allow-latin="true"
                        placeholder="رمز جدید..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryNewPass(!showRecoveryNewPass)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                        title={showRecoveryNewPass ? 'مخفی کردن رمز' : 'نمایش رمز'}
                      >
                        {showRecoveryNewPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">
                      تکرار کلمه عبور جدید
                    </label>
                    <div className="relative">
                      <input
                        type={showRecoveryConfirmPass ? 'text' : 'password'}
                        value={recoveryConfirmInput}
                        onChange={(e) => setRecoveryConfirmInput(e.target.value)}
                        data-allow-latin="true"
                        placeholder="تکرار رمز..."
                        className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium focus:ring-1 focus:ring-indigo-500 focus:outline-none dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRecoveryConfirmPass(!showRecoveryConfirmPass)}
                        className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                        title={showRecoveryConfirmPass ? 'مخفی کردن رمز' : 'نمایش رمز'}
                      >
                        {showRecoveryConfirmPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تأیید و اعمال بازیابی</span>
                </button>
              </form>
            </div>
          )}

          {/* Return Home */}
          <div className="text-center pt-2 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => onNavigate('home')}
              className="text-xs text-slate-500 hover:text-blue-600 dark:text-slate-400 transition cursor-pointer"
            >
              بازگشت به صفحه اصلی سایت
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // Render: Full Authenticated Admin Dashboard
  // ----------------------------------------------------
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-5 right-5 z-[9999] p-4 rounded-2xl shadow-2xl border flex items-center gap-3 text-sm font-bold animate-bounce transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : notification.type === 'info'
              ? 'bg-blue-600 text-white border-blue-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : notification.type === 'info' ? (
            <Sparkles className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Banner & User Session Toolbar */}
      <div className="bg-gradient-to-r from-[#0a1f44] via-[#173b82] to-[#1e40af] text-white rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner shrink-0 border border-white/20">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  مدیر ارشد سامانه
                </span>
                <span className="text-xs text-blue-200 font-medium">باشگاه جوانان محاش</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white m-0">
                پنل مدیریت گزارش‌ها و رسانه‌ها
              </h1>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* MySQL System Health Indicator Badge */}
            <div className="flex items-center gap-2 bg-black/30 px-3.5 py-1.5 rounded-xl border border-white/10 text-xs">
              <span className={`w-2.5 h-2.5 rounded-full ${mysqlHealthStatus?.connected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <div className="flex flex-col">
                <span className="text-white font-medium">
                  {mysqlHealthStatus?.connected ? `Live: متصل (${mysqlHealthStatus.database || 'mahash_db'})` : 'Disconnected (قطع)'}
                </span>
                {mysqlHealthStatus?.timestamp && (
                  <span className="text-[10px] text-slate-400 font-mono mt-0.5">
                    آخرین بررسی: {new Date(mysqlHealthStatus.timestamp).toLocaleTimeString('fa-IR')}
                  </span>
                )}
              </div>
            </div>

            {/* Real-time System Notification Badge (Task 4) */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowNotificationPopup(!showNotificationPopup)}
                className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-indigo-400/30 cursor-pointer relative"
                title="اعلان‌های زنده سامانه و درخواست‌های مشاوره"
              >
                <Bell className="w-3.5 h-3.5 text-indigo-300" />
                <span>اعلان‌ها</span>
                {unreadConsultationCount > 0 && (
                  <span className="flex items-center justify-center px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono animate-pulse">
                    {toPersianDigits(unreadConsultationCount)}
                  </span>
                )}
              </button>

              {/* Dropdown notification popup */}
              {showNotificationPopup && (
                <div className="absolute left-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-4 z-50 text-slate-900 dark:text-white space-y-3 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-indigo-500" />
                      <span className="font-bold text-xs">درخواست‌های مشاوره جدید</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {toPersianDigits(unreadConsultationCount)} مورد
                    </span>
                  </div>

                  {highPriorityConsultations.length === 0 ? (
                    <div className="text-center py-4 text-xs text-slate-400">
                      هیچ درخواست جدیدی در انتظار نیست.
                    </div>
                  ) : (
                    <div className="max-h-56 overflow-y-auto space-y-2 text-xs">
                      {highPriorityConsultations.slice(0, 5).map((c, idx) => (
                        <div
                          key={c.id || idx}
                          onClick={() => {
                            setActiveTab('mysql_logs');
                            setShowNotificationPopup(false);
                          }}
                          className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 border border-slate-100 dark:border-slate-800 transition cursor-pointer space-y-1"
                        >
                          <div className="flex items-center justify-between font-bold text-[11px]">
                            <span className="text-indigo-600 dark:text-indigo-400">
                              {c.user_name || 'کاربر متقاضی'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(c.created_at || (c as any).timestamp || 0).toLocaleTimeString('fa-IR')}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                            {c.details || 'درخواست مشاوره ثبت شده در MySQL'}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                    <button
                      onClick={() => {
                        setActiveTab('mysql_logs');
                        setShowNotificationPopup(false);
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                    >
                      مشاهده همه لاگ‌ها
                    </button>
                    <button
                      onClick={() => setShowNotificationPopup(false)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Database & State Audit Debug Tool Button */}
            <button
              type="button"
              onClick={() => setActiveTab('db_audit')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                activeTab === 'db_audit'
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                  : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 hover:text-white border-blue-400/30'
              }`}
              title="ابزار عیب‌یابی، تست اتصال دیتابیس و بررسی تطبیق استیت کلاینت با پایگاه داده"
            >
              <Database className="w-3.5 h-3.5 text-blue-300" />
              <span>🔍 دیباگ و تطبیق استیت</span>
            </button>

            {/* Archive & Clear Logs Button (Task 3) */}
            <button
              type="button"
              onClick={() => setIsArchiveModalOpen(true)}
              className="px-3.5 py-2 bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-teal-400/30 cursor-pointer"
              title="بایگانی ایمن و پاک‌سازی لاگ‌های قدیمی دیتابیس MySQL همراه با دانلود فایل پشتیبان"
            >
              <Archive className="w-3.5 h-3.5 text-teal-300" />
              <span>📦 بایگانی لاگ‌ها</span>
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={handleSyncToServer}
                disabled={isSyncingServer}
                title="ارسال و ذخیره‌سازی دائمی تمامی لوگوها و گزارش‌ها در سرور مرکزی تا در تمام سیستم‌ها و دامنه عمومی دقیقاً یکسان نمایش داده شود"
                aria-label="انتشار سراسری تغییرات و لوگوها در پایگاه داده سرور مرکزی"
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50 relative overflow-hidden"
              >
                {isSyncingServer && (
                  <div 
                    className="absolute inset-0 bg-emerald-700/50 transition-all duration-300 z-0"
                    style={{ width: `${syncProgress}%` }}
                  />
                )}
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncingServer ? 'animate-spin' : ''} relative z-10`} />
                <span className="relative z-10">{isSyncingServer ? `${syncProgress}% - ${syncMessage}` : '🚀 انتشار سراسری تغییرات و لوگوها در سرور'}</span>
              </button>
            </div>

            <div className="relative inline-flex items-center">
              <button
                type="button"
                onClick={handleForceRefresh}
                disabled={isForceRefreshing || isSyncingServer}
                title={`نوسازی اجباری اطلاعات: فراخوانی مستقیم fetchAndMergeServerStore و بارگیری تازه‌ترین نسخه از سرور${lastSyncTime ? `\nآخرین همگام‌سازی موفق: ${new Date(lastSyncTime).toLocaleTimeString('fa-IR')} (${new Date(lastSyncTime).toLocaleDateString('fa-IR')})` : ''}`}
                aria-label="نوسازی اجباری و دریافت آخرین نسخه اطلاعات از سرور مرکزی"
                className="px-3.5 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-sky-400/30 cursor-pointer disabled:opacity-50 active:scale-95 shadow-sm relative"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isForceRefreshing ? 'animate-spin text-sky-300' : 'text-sky-300'}`} />
                <span>{isForceRefreshing ? 'در حال نوسازی...' : '🔄 نوسازی اجباری (Force Refresh)'}</span>
                
                {/* Pending Unsynced Badge */}
                {pendingSyncCount > 0 && (
                  <span
                    className="mr-1 px-1.5 py-0.2 bg-amber-500 text-slate-950 font-black rounded-full text-[10px] leading-tight shadow-md border border-amber-300 animate-pulse"
                    title={`${toPersianDigits(pendingSyncCount)} تغییر ذخیره‌نشده روی سرور`}
                    aria-label={`${toPersianDigits(pendingSyncCount)} مورد تغییر ذخیره‌نشده روی سرور`}
                  >
                    {toPersianDigits(pendingSyncCount)}
                  </span>
                )}
              </button>

              {/* Visual Indicator of Last Successful Sync Timestamp */}
              {lastSyncTime && (
                <span 
                  className="hidden xl:inline-flex items-center gap-1 text-[11px] text-sky-300/80 mr-2 bg-sky-950/40 border border-sky-800/40 px-2 py-1 rounded-lg font-mono"
                  title="زمان دقیق آخرین اتصال و همگام‌سازی موفق با سرور مرکزی"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="text-[10px] text-slate-400">آخرین همگام‌سازی:</span>
                  <span className="font-bold text-sky-200" dir="ltr">{new Date(lastSyncTime).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}</span>
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={handlePullFromServer}
              disabled={isSyncingServer || isForceRefreshing}
              title="دریافت آخرین لوگوها و اطلاعات از سرور"
              aria-label="بروزرسانی و دریافت آخرین اطلاعات از سرور مرکزی"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              <span>بروزرسانی از سرور</span>
            </button>

            <button
              type="button"
              onClick={handleRunVideoCleanup}
              title="بررسی و حذف خودکار ویدیوهای معیوب یا پیوندهای ناشناخته برای تمیزسازی پنل تیم‌ها"
              aria-label="بررسی و پاکسازی ویدیوهای معیوب یا نامعتبر"
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-amber-400/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>🧹 پاکسازی ویدیوهای معیوب</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              aria-label="مشاهده سایت اصلی باشگاه جوانان محاش"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>مشاهده سایت اصلی</span>
            </button>

            <button
              onClick={handleLogout}
              aria-label="خروج از پنل مدیریت"
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-400/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از مدیریت</span>
            </button>
          </div>
        </div>

        {/* Stats KPIs row */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-3 border-t border-white/10 text-xs">
          <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
            <span className="text-blue-200 block text-[11px]">مجموع گزارش‌ها</span>
            <span className="text-xl font-black text-white">{allReports.length.toLocaleString('fa-IR')}</span>
          </div>
          <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
            <span className="text-sky-300 block text-[11px] font-bold flex items-center gap-1">
              <Eye className="w-3 h-3" />
              <span>مجموع بازدید ویدیوها</span>
            </span>
            <span className="text-xl font-black text-sky-300 font-mono">{toPersianDigits(totalViewsCount)}</span>
          </div>
          <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
            <span className="text-blue-200 block text-[11px]">تیم‌های فعال</span>
            <span className="text-xl font-black text-white">{Object.keys(teams).length.toLocaleString('fa-IR')}</span>
          </div>
          <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
            <span className="text-blue-200 block text-[11px]">ویدیوهای ذخیره شده</span>
            <span className="text-xl font-black text-white">{storageStats.count.toLocaleString('fa-IR')}</span>
          </div>
          <div className="bg-black/20 p-3 rounded-2xl border border-white/10">
            <span className="text-blue-200 block text-[11px]">حجم حافظه محلی</span>
            <span className="text-xl font-black text-white">
              {(storageStats.totalSizeBytes / (1024 * 1024)).toFixed(1)} MB
            </span>
          </div>
          <div
            onClick={() => setActiveTab('mysql')}
            className="bg-emerald-900/30 hover:bg-emerald-900/50 p-3 rounded-2xl border border-emerald-400/30 cursor-pointer transition flex flex-col justify-between"
            title="کلیک برای مشاهده داشبورد و مدیریت پشتیبان‌گیری‌های MySQL"
          >
            <div className="flex items-center justify-between">
              <span className="text-emerald-300 block text-[11px] font-bold">پشتیبان‌گیری MySQL</span>
              <Database className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="mt-1">
              <span className="text-lg font-black font-mono text-white">
                {backupSummary.totalBackups.toLocaleString('fa-IR')} <span className="text-[10px] font-normal text-emerald-200">نسخه</span>
              </span>
              <span className="text-[10px] text-emerald-300/90 block truncate mt-0.5" title={backupSummary.lastSuccessDate}>
                آخرین: {backupSummary.lastSuccessDate}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time High Priority Consultation Alert Banner (Task 4) */}
      {unreadConsultationCount > 0 && !hasDismissedAlertBanner && (
        <div className="bg-gradient-to-r from-amber-500/20 via-rose-500/15 to-indigo-500/20 border border-amber-400/50 rounded-3xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg shadow-amber-950/10 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/25 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 animate-bounce text-amber-400" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-900 dark:text-amber-200 flex items-center gap-2 flex-wrap">
                <span>درخواست مشاوره جدید با اولویت بالا دریافت شد</span>
                <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white text-[10px] font-mono">
                  {toPersianDigits(unreadConsultationCount)} مورد منتظر اقدام
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                {highPriorityConsultations[0]?.details || 'درخواست مشاوره تخصصی در پایگاه داده MySQL ثبت شده است.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
            <button
              onClick={() => {
                setActiveTab('mysql_logs');
                setHasDismissedAlertBanner(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <span>مشاهده و بررسی در لاگ‌ها</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setHasDismissedAlertBanner(true)}
              className="px-2.5 py-2 text-slate-400 hover:text-slate-600 dark:hover:text-white text-xs cursor-pointer rounded-xl"
              title="بستن موقت اعلان"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats Summary Card for Today's Activity (Task 5) */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0d1b2a] to-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-blue-900/60 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <h3 className="font-black text-sm text-amber-300">
              خلاصه وضعیت و آمار سریع امروز (Quick Stats Summary - MySQL Live Activity)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
              (آخرین بروزرسانی: {todayLogsStats.lastUpdated})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => refreshQuickStatsAndAlerts(true)}
              disabled={isRefreshingQuickStats}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingQuickStats ? 'animate-spin' : ''}`} />
              <span>{isRefreshingQuickStats ? 'در حال بروزرسانی...' : 'بروزرسانی آمار'}</span>
            </button>

            <button
              onClick={() => setIsArchiveModalOpen(true)}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Archive className="w-3.5 h-3.5" />
              <span>بایگانی و پاک‌سازی لاگ‌ها</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-black/30 p-3 rounded-2xl border border-white/10">
            <span className="text-slate-400 text-[11px] block">کل عملیات ثبت‌شده امروز</span>
            <div className="text-xl font-black text-white font-mono mt-0.5">
              {toPersianDigits(todayLogsStats.total)}
            </div>
            <span className="text-[10px] text-slate-400">تراکنش در پایگاه داده</span>
          </div>

          <div className="bg-emerald-950/40 p-3 rounded-2xl border border-emerald-500/30">
            <div className="flex items-center justify-between text-emerald-300 text-[11px] font-bold">
              <span>تراکنش‌های موفق</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-emerald-300 font-mono mt-0.5">
              {toPersianDigits(todayLogsStats.success)}
            </div>
            <span className="text-[10px] text-emerald-400/80">
              نرخ پایداری: {toPersianDigits(todayLogsStats.rate)}٪
            </span>
          </div>

          <div className={`p-3 rounded-2xl border ${
            todayLogsStats.failed > 0
              ? 'bg-rose-950/50 border-rose-500/40 text-rose-300 ring-2 ring-rose-500/20'
              : 'bg-black/30 border-white/10 text-slate-400'
          }`}>
            <div className="flex items-center justify-between text-[11px] font-bold">
              <span>خطاها و هشدارهای امروز</span>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div className={`text-xl font-black font-mono mt-0.5 ${todayLogsStats.failed > 0 ? 'text-rose-300' : 'text-slate-300'}`}>
              {toPersianDigits(todayLogsStats.failed)}
            </div>
            <span className="text-[10px] text-rose-400/80">
              {todayLogsStats.failed > 0 ? 'نیاز به بازبینی لاگ‌ها' : 'عملکرد بدون خطا'}
            </span>
          </div>

          <div className="bg-indigo-950/40 p-3 rounded-2xl border border-indigo-500/30">
            <div className="flex items-center justify-between text-indigo-300 text-[11px] font-bold">
              <span>مشاوره‌های ثبت‌شده</span>
              <Bell className="w-3.5 h-3.5" />
            </div>
            <div className="text-xl font-black text-indigo-300 font-mono mt-0.5">
              {toPersianDigits(unreadConsultationCount)}
            </div>
            <span className="text-[10px] text-indigo-400/80">درخواست‌های اولویت‌دار</span>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab('members_dashboard')}
            className="bg-purple-950/40 hover:bg-purple-950/60 p-3 rounded-2xl border border-purple-500/30 text-right cursor-pointer transition transform hover:scale-[1.02] active:scale-[0.98]"
            aria-label="ورود به داشبورد جامع اعضا و پایش فعالیت‌های باشگاه"
          >
            <div className="flex items-center justify-between text-purple-300 text-[11px] font-bold">
              <span>داشبورد اعضا و فعالیت‌ها</span>
              <Users className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-black text-purple-200 font-mono mt-0.5 flex items-center justify-between">
              <span>مدیریت متقاضیان</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 font-bold">ورود 👥</span>
            </div>
            <span className="text-[10px] text-purple-300/80">پایش تیم‌ها و درخواست‌ها</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold" role="tablist" aria-label="تب‌های پنل مدیریت محاش">
        <button
          id="admin-tab-members-dashboard"
          role="tab"
          aria-selected={activeTab === 'members_dashboard'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('members_dashboard')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'members_dashboard'
              ? 'bg-gradient-to-l from-indigo-700 via-blue-700 to-emerald-700 text-white shadow-sm ring-2 ring-indigo-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="داشبورد جامع اعضا، مدیریت درخواست‌های عضویت و پایش فعالیت‌ها"
        >
          <Users className="w-4 h-4 text-emerald-400" />
          <span>👥 داشبورد جامع اعضا و پایش فعالیت‌ها</span>
        </button>
        <button
          id="admin-tab-create"
          role="tab"
          aria-selected={activeTab === 'create'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="ثبت گزارش یا ویدیوی جدید"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{editingReportId ? 'ویرایش گزارش جاری' : '➕ ثبت گزارش و ویدیوی جدید'}</span>
        </button>

        <button
          id="admin-tab-reports"
          role="tab"
          aria-selected={activeTab === 'reports'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label={`مشاهده لیست گزارش‌های منتشرشده (${allReports.length} مورد)`}
        >
          <Film className="w-4 h-4" />
          <span>لیست گزارش‌های منتشرشده ({allReports.length})</span>
        </button>

        <button
          id="admin-tab-drafts"
          role="tab"
          aria-selected={activeTab === 'drafts'}
          aria-controls="admin-panel-content"
          onClick={() => {
            setSavedDraftsList(getSavedDrafts());
            setActiveTab('drafts');
          }}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'drafts'
              ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="مشاهده و مدیریت پیش‌نویس‌ها"
        >
          <FileText className="w-4 h-4 text-amber-400" />
          <span>پیش‌نویس‌ها</span>
          {savedDraftsList.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono border border-amber-500/30">
              {toPersianDigits(savedDraftsList.length)}
            </span>
          )}
        </button>

        <button
          id="admin-tab-repair"
          role="tab"
          aria-selected={activeTab === 'repair'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('repair')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'repair'
              ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="تعمیر رسانه‌ها و آزادسازی حافظه"
        >
          <Wrench className="w-4 h-4 text-indigo-400" />
          <span>🔧 تعمیر رسانه‌ها و آزادسازی حافظه</span>
        </button>

        <button
          id="admin-tab-gallery"
          role="tab"
          aria-selected={activeTab === 'gallery'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('gallery')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'gallery'
              ? 'bg-cyan-700 text-white shadow-sm ring-2 ring-cyan-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="نگارخانه ویدیوهای باشگاه"
        >
          <Film className="w-4 h-4 text-cyan-400" />
          <span>🎬 نگارخانه ویدیوها</span>
        </button>

        <button
          id="admin-tab-analytics"
          role="tab"
          aria-selected={activeTab === 'analytics'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-sky-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="آمار و تحلیل بازدید ویدیوها"
        >
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span>آمار و تحلیل بازدید ویدیوها ({toPersianDigits(totalViewsCount)})</span>
        </button>

        <button
          id="admin-tab-monthly"
          role="tab"
          aria-selected={activeTab === 'monthly'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('monthly')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'monthly'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-sky-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="گزارش‌های ماهانه موسسه"
        >
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>گزارش‌های ماهانه</span>
        </button>

        <button
          id="admin-tab-teams"
          role="tab"
          aria-selected={activeTab === 'teams'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'teams'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="مدیریت تیم‌ها و اعضای باشگاه"
        >
          <Users className="w-4 h-4" />
          <span>مدیریت تیم‌ها و اعضا</span>
        </button>

        <button
          id="admin-tab-logos"
          role="tab"
          aria-selected={activeTab === 'logos'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('logos')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'logos'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-amber-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="مدیریت نشان‌ها و لوگوهای محاش و حلقوی"
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>🎨 مدیریت نشان‌ها و لوگوهای محاش و حلقوی</span>
        </button>

        <button
          id="admin-tab-media"
          role="tab"
          aria-selected={activeTab === 'media'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'media'
              ? 'bg-gradient-to-l from-indigo-800 to-blue-700 text-white shadow-sm ring-2 ring-cyan-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="مدیریت تصاویر و مدیا"
        >
          <ImageIcon className="w-4 h-4 text-cyan-400" />
          <span>🖼️ مدیریت تصاویر و مدیا (WebP & MySQL)</span>
        </button>

        <button
          id="admin-tab-video-manager"
          role="tab"
          aria-selected={activeTab === 'video_manager'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('video_manager')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'video_manager'
              ? 'bg-gradient-to-l from-indigo-700 via-blue-700 to-indigo-900 text-white shadow-sm ring-2 ring-indigo-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="مدیریت ویدیوها و نمایش عمومی در پایگاه داده"
        >
          <Film className="w-4 h-4 text-indigo-400" />
          <span>🎥 مدیریت ویدیوها و نمایش عمومی (MySQL)</span>
        </button>

        <button
          id="admin-tab-video-errors"
          role="tab"
          aria-selected={activeTab === 'video_errors'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('video_errors')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'video_errors'
              ? 'bg-gradient-to-l from-rose-700 via-rose-600 to-rose-800 text-white shadow-sm ring-2 ring-rose-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="مانیتورینگ خطاهای پخش ویدیو در مرورگرها"
        >
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span>⚠️ مانیتورینگ خطاهای ویدیو</span>
        </button>

        <button
          id="admin-tab-scores"
          role="tab"
          aria-selected={activeTab === 'scores'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('scores')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'scores'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label={`ویرایش امتیازات تیم‌ها (${scoresList.length} مورد)`}
        >
          <Award className="w-4 h-4" />
          <span>ویرایش امتیازات ({scoresList.length})</span>
        </button>

        <button
          id="admin-tab-events"
          role="tab"
          aria-selected={activeTab === 'events'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'events'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label={`رویدادها و کارگاه‌های آموزشی (${eventsList.length} مورد)`}
        >
          <Calendar className="w-4 h-4" />
          <span>رویدادها و کارگاه‌ها ({eventsList.length})</span>
        </button>

        <button
          id="admin-tab-health"
          role="tab"
          aria-selected={activeTab === 'health'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'health'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="تست سلامت لینک‌ها و فایل‌های سامانه"
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>🔍 تست سلامت لینک‌ها و فایل‌ها</span>
        </button>

        <button
          id="admin-tab-storage"
          role="tab"
          aria-selected={activeTab === 'storage'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'storage'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label={`حافظه ویدیوها (${storageStats.count} مورد)`}
        >
          <HardDrive className="w-4 h-4" />
          <span>حافظه ویدیوها ({storageStats.count})</span>
        </button>

        <button
          id="admin-tab-wordpress"
          role="tab"
          aria-selected={activeTab === 'wordpress'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('wordpress')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'wordpress'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="همگام‌سازی وردپرس و دیتابیس MySQL"
        >
          <Database className="w-4 h-4 text-blue-400" />
          <span>وردپرس و دیتابیس MySQL</span>
        </button>

        <button
          id="admin-tab-mysql"
          role="tab"
          aria-selected={activeTab === 'mysql'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('mysql')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'mysql'
              ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="داشبورد و عملیات دیتابیس MySQL"
        >
          <Database className="w-4 h-4 text-emerald-400" />
          <span>داشبورد و CRUD دیتابیس MySQL</span>
        </button>

        <button
          id="admin-tab-mysql-logs"
          role="tab"
          aria-selected={activeTab === 'mysql_logs'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('mysql_logs')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'mysql_logs'
              ? 'bg-teal-700 text-white shadow-sm ring-2 ring-teal-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="مانیتورینگ زنده رویدادهای MySQL"
        >
          <Activity className="w-4 h-4 text-teal-400" />
          <span>📡 مانیتورینگ زنده رویدادهای MySQL</span>
        </button>

        <button
          id="admin-tab-audit-logs"
          role="tab"
          aria-selected={activeTab === 'audit_logs'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('audit_logs')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'audit_logs'
              ? 'bg-gradient-to-l from-rose-700 to-indigo-800 text-white shadow-sm ring-2 ring-rose-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="ردگیری حذفیات و لاگ‌های نظارتی"
        >
          <Shield className="w-4 h-4 text-rose-400" />
          <span>🛡️ ردگیری حذفیات و لاگ‌های نظارتی (Audit Logs)</span>
        </button>

        <button
          id="admin-tab-db-audit"
          role="tab"
          aria-selected={activeTab === 'db_audit'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('db_audit')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'db_audit'
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="دیباگ و بررسی تطبیق استیت و پایگاه داده"
        >
          <Database className="w-4 h-4 text-blue-400" />
          <span>🔍 دیباگ و تطبیق پایگاه داده با کلاینت</span>
        </button>

        <button
          id="admin-tab-settings"
          role="tab"
          aria-selected={activeTab === 'settings'}
          aria-controls="admin-panel-content"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          aria-label="تنظیمات سامانه و امنیت کلمه عبور"
        >
          <Sliders className="w-4 h-4" />
          <span>تنظیمات و امنیت</span>
        </button>
      </div>

      {/* Quick Edit Report Number & Title Modal */}
      {/* ==================================================== */}
      {editingNumReport && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-indigo-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  ویرایش سریع شماره و عنوان گزارش
                </h3>
              </div>
              <button
                onClick={() => setEditingNumReport(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                تیم: <span className="font-bold text-slate-800 dark:text-slate-200">{teams[editingNumReport.teamSlug]?.name || editingNumReport.teamSlug}</span>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    شماره یا نوع گزارش
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const next = getNextReportNumberForTeam(editingNumReport.teamSlug);
                      setCustomNumInput(next);
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    🔄 شماره بعدی خودکار
                  </button>
                </div>
                <input
                  type="text"
                  value={customNumInput}
                  onChange={(e) => setCustomNumInput(e.target.value)}
                  placeholder="مثلاً: گزارش ۱، گزارش ۲ یا پیام ویدئویی"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                />

                {/* Quick Number Selector Chips */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {['گزارش ۱', 'گزارش ۲', 'گزارش ۳', 'گزارش ۴', 'گزارش ۵', 'گزارش ۶'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCustomNumInput(preset)}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition cursor-pointer ${
                        customNumInput === preset
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  عنوان کامل گزارش
                </label>
                <input
                  type="text"
                  value={customTitleInput}
                  onChange={(e) => setCustomTitleInput(e.target.value)}
                  placeholder="عنوان گزارش..."
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                />
              </div>
            </div>

            {saveSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs">
                <Check className="w-4 h-4" />
                <span>شماره و عنوان با موفقیت ذخیره شد!</span>
              </div>
            )}

            <button
              disabled={isSaving}
              onClick={async () => {
                const targetTeam = teams[editingNumReport.teamSlug] || getAllTeams()[editingNumReport.teamSlug];
                if (!targetTeam) return;
                const reportToEdit = targetTeam.reports.find((r) => r.id === editingNumReport.id);
                if (!reportToEdit) return;

                const trimmedNum = customNumInput.trim();
                const finalNum = trimmedNum ? formatReportNumberDisplay(trimmedNum) : reportToEdit.reportNum;
                const updatedReport = {
                  ...reportToEdit,
                  reportNum: finalNum,
                  title: customTitleInput.trim() || reportToEdit.title
                };

                await syncReportData(updatedReport, editingNumReport.teamSlug, (freshReports, freshTeams) => {
                  setAllReports(freshReports);
                  setTeams(freshTeams);
                });

                showToast(`شماره و عنوان گزارش به «${finalNum}» تغییر یافت.`);
                setTimeout(() => setEditingNumReport(null), 800);
              }}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-sm font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>در حال ذخیره‌سازی...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تغییرات شماره و عنوان</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Quick Edit Date Modal */}
      {/* ==================================================== */}
      {editingDateReport && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  ویرایش سریع تاریخ گزارش
                </h3>
              </div>
              <button
                onClick={() => setEditingDateReport(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                شما در حال ویرایش تاریخ برای گزارش زیر هستید:
              </p>
              <p className="font-bold text-sm text-slate-900 dark:text-slate-200 line-clamp-2">
                {editingDateReport.title}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تاریخ جدید
              </label>
              <div className="relative" dir="rtl">
                <DatePicker
                  value={customDateInput ? new DateObject({ date: customDateInput, format: 'YYYY/MM/DD', calendar: persian, locale: persian_fa }) : null}
                  onChange={(date: any) => {
                    if (date) {
                      // Format to match old output "۱۴۰۵/۰۶/۱۵"
                      setCustomDateInput(date.format('YYYY/MM/DD'));
                    } else {
                      setCustomDateInput('');
                    }
                  }}
                  format="DD MMMM YYYY"
                  calendar={persian}
                  locale={persian_fa}
                  calendarPosition="bottom-right"
                  inputClass="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-orange-500 focus:outline-none dark:text-white"
                  placeholder="مثلاً ۲۰ مرداد ۱۴۰۵"
                  containerClassName="w-full"
                />
              </div>
            </div>
            
            {saveSuccess && (
              <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 p-2.5 rounded-xl font-bold flex items-center justify-center gap-2 text-xs">
                <Check className="w-4 h-4" />
                <span>تاریخ با موفقیت بروزرسانی شد!</span>
              </div>
            )}

            <button
              disabled={isSaving}
              onClick={async () => {
                const targetTeam = teams[editingDateReport.teamSlug] || getAllTeams()[editingDateReport.teamSlug];
                if (!targetTeam) return;
                const reportToEdit = targetTeam.reports.find(r => r.id === editingDateReport.id);
                if (!reportToEdit) return;

                const updatedReport = { ...reportToEdit, date: customDateInput.trim() };
                
                await syncReportData(updatedReport, editingDateReport.teamSlug, (freshReports, freshTeams) => {
                  setAllReports(freshReports);
                  setTeams(freshTeams);
                });
                
                // Close after brief success
                setTimeout(() => setEditingDateReport(null), 1000);
              }}
              className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white rounded-xl text-sm font-bold transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>در حال ذخیره‌سازی...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>ذخیره تاریخ جدید</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 1: Create or Edit Report Form */}
      {/* ==================================================== */}
      {activeTab === 'create' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#173b82] dark:text-blue-400 flex items-center gap-2">
                <Video className="w-5 h-5" />
                <span>{editingReportId ? 'ویرایش و بازنشر گزارش' : 'فرم ثبت و انتشار ویدیوی جدید در سایت'}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                اطلاعات گزارش، ویدیو و زیرنویس فارسی را مشخص کنید تا فوراً در صفحه تیم مربوطه قرار گیرد.
              </p>
            </div>

            {editingReportId && (
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition"
              >
                انصراف از ویرایش و فرم جدید
              </button>
            )}
          </div>

          {/* Restored Draft Alert Banner */}
          {!editingReportId && hasRestoredDraft && (
            <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>پیش‌نویس ذخیره‌شده از ورود قبلی شما به‌طور خودکار بازیابی گردید تا اطلاعات ثبت شده از بین نرود.</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  clearFormDraft();
                  resetForm();
                  showToast('پیش‌نویس پاک شد و فرم مجدداً خالی گردید.');
                }}
                className="px-3 py-1 bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-800 text-amber-900 dark:text-amber-100 rounded-lg font-bold text-[11px] transition shrink-0 cursor-pointer"
              >
                پاکسازی پیش‌نویس
              </button>
            </div>
          )}

          <form onSubmit={handleSubmitReport} className="space-y-6">
            {/* Report Format Selection (Video / Text / Hybrid) */}
            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <span>نوع و ساختار رسانه‌ای گزارش:</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">
                    (مشخص کنید گزارش فقط ویدیویی، فقط متنی و اسنادی، یا ترکیبی است)
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Hybrid */}
                <button
                  type="button"
                  onClick={() => setReportFormat('hybrid')}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-start gap-2.5 ${
                    reportFormat === 'hybrid'
                      ? 'bg-blue-50/90 dark:bg-blue-950/70 border-blue-500 dark:border-blue-400 shadow-xs ring-2 ring-blue-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    reportFormat === 'hybrid' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>گزارش ترکیبی (متن + ویدیو)</span>
                      {reportFormat === 'hybrid' && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      حاوی فایل ویدیویی، زیرنویس همگام، توضیحات متنی و فایل‌های پیوست
                    </div>
                  </div>
                </button>

                {/* Text Only */}
                <button
                  type="button"
                  onClick={() => {
                    setReportFormat('text');
                    if (videoPreviewUrl || videoFile) {
                      showToast('حالت گزارش متنی انتخاب شد. در صورت تمایل دکمه حذف ویدیو را بزنید یا با ذخیره گزارش، ویدیو حذف خواهد شد.');
                    }
                  }}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-start gap-2.5 ${
                    reportFormat === 'text'
                      ? 'bg-amber-50/90 dark:bg-amber-950/70 border-amber-500 dark:border-amber-400 shadow-xs ring-2 ring-amber-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    reportFormat === 'text' ? 'bg-amber-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>گزارش متنی و اسنادی (بدون ویدیو)</span>
                      {reportFormat === 'text' && <Check className="w-3 h-3 text-amber-600 dark:text-amber-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      مناسب اسناد PDF، صورتجلسات، تصاویر و گزارش‌های مکتوب بدون فیلم
                    </div>
                  </div>
                </button>

                {/* Video Only */}
                <button
                  type="button"
                  onClick={() => setReportFormat('video')}
                  className={`p-3 rounded-xl border text-right transition cursor-pointer flex items-start gap-2.5 ${
                    reportFormat === 'video'
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/70 border-emerald-500 dark:border-emerald-400 shadow-xs ring-2 ring-emerald-500/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    reportFormat === 'video' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}>
                    <Film className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>گزارش تصویری (ویدیومحور)</span>
                      {reportFormat === 'video' && <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                      تمرکز بر پخش فیلم، زیرنویس فارسی و نکات خلاصه
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Top Grid: Team, Number, Date, Status */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Target Team */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  تیم مقصد
                </label>
                <select
                  value={selectedTeamSlug}
                  onChange={(e) => handleTeamChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                >
                  {(Object.entries(teams) as [string, TeamData][]).map(([slug, team]) => (
                    <option key={slug} value={slug}>
                      {team.icon} {team.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Report Number */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    شماره یا نوع گزارش
                  </label>
                  <button
                    type="button"
                    onClick={() => setReportNum(getNextReportNumberForTeam(selectedTeamSlug))}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                    title="محاسبه خودکار شماره گزارش بعدی برای این تیم"
                  >
                    🔄 شماره بعدی خودکار
                  </button>
                </div>
                <input
                  type="text"
                  value={reportNum}
                  onChange={(e) => setReportNum(e.target.value)}
                  placeholder="مثلاً: گزارش ۲ یا پیام ویدئویی"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  required
                />
              </div>

              {/* Date */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    تاریخ انتشار (شمسی)
                  </label>
                  <button
                    type="button"
                    onClick={() => setReportDate(getSmartCurrentDate())}
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                  >
                    📅 درج تاریخ امروز
                  </button>
                </div>
                <div className="relative">
                  <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  placeholder="مثال: ۱۴۰۵/۰۵/۲۶ یا ۲۶ مرداد ۱۴۰۵"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white pl-24"
                  required
                />
                {saveSuccess && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-emerald-600 dark:text-emerald-400 animate-in fade-in zoom-in duration-300 bg-emerald-50 dark:bg-emerald-900/50 px-2 py-1 rounded-md">
                    <Check className="w-3.5 h-3.5" />
                    <span className="text-[10px] font-bold">ذخیره شد</span>
                  </div>
                )}
                {isSaving && (
                  <div className="absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 text-blue-600 dark:text-blue-400 animate-in fade-in zoom-in duration-300 bg-blue-50 dark:bg-blue-900/50 px-2 py-1 rounded-md">
                    <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></span>
                    <span className="text-[10px] font-bold">در حال ذخیره...</span>
                  </div>
                )}
              </div>
            </div>

              {/* Publication Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  وضعیت انتشار
                </label>
                <select
                  value={reportStatus}
                  onChange={(e) => setReportStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                >
                  <option value="published">🟢 منتشر شده در سایت</option>
                  <option value="draft">🟡 پیش‌نویس (مخفی)</option>
                </select>
              </div>
            </div>

            {/* Report Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                عنوان اصلی گزارش
              </label>
              <input
                type="text"
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                placeholder="مثلاً: پیام ویدیویی؛ شروع کار طراحی انیمیشن و اعلام همکاری با سایر تیم‌ها"
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                required
              />
            </div>

            {/* Gemini AI Assistant Box for Admin */}
            <div className="bg-gradient-to-br from-blue-50/80 via-slate-50 to-indigo-50/60 dark:from-slate-800/90 dark:via-slate-850 dark:to-indigo-950/40 rounded-2xl p-4 sm:p-5 border border-blue-200 dark:border-blue-900/60 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-blue-100 dark:border-blue-900/40">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#173b82] to-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <span>دستیار هوشمند نگارش و ویراستاری گزارش (Gemini)</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-[#173b82] dark:text-blue-300 font-black px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">ویژه پنل مدیریت</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      بازنویسی متن، بهینه‌سازی لحن و استخراج محورهای کلیدی فعالیت
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-slate-500 font-bold hidden sm:inline">لحن:</span>
                  {[
                    { id: 'official', label: 'رسمی و اداری' },
                    { id: 'motivational', label: 'انگیزشی' },
                    { id: 'brief', label: 'موجز و خبری' },
                    { id: 'educational', label: 'آموزشی' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setAdminGeminiTone(t.id as any)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                        adminGeminiTone === t.id
                          ? 'bg-[#173b82] text-white shadow-2xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons & Custom Prompt */}
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={adminGeminiCustomPrompt}
                  onChange={(e) => setAdminGeminiCustomPrompt(e.target.value)}
                  placeholder="دستور یا متن ورودی اختیاری (مثلاً: تأکید روی نقش اعضا، کارگاه یا نتایج آزمون)..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRequestAdminGemini('polish')}
                    disabled={isAdminGeminiLoading || (!reportSummary.trim() && !reportTitle.trim() && !adminGeminiCustomPrompt.trim())}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isAdminGeminiLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>ویراستاری متن</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestAdminGemini('bullets')}
                    disabled={isAdminGeminiLoading || (!reportSummary.trim() && !reportTitle.trim() && !adminGeminiCustomPrompt.trim())}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>استخراج محورها و نکات</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestAdminGemini('summary')}
                    disabled={isAdminGeminiLoading || (!reportSummary.trim() && !reportTitle.trim() && !adminGeminiCustomPrompt.trim())}
                    className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>چکیده اجرایی</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestAdminGemini('subtitles')}
                    disabled={isAdminGeminiLoading || (!reportSummary.trim() && !reportTitle.trim() && !adminGeminiCustomPrompt.trim())}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <Film className="w-3.5 h-3.5" />
                    <span>سناریوی زیرنویس</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestAdminGemini('normalize')}
                    disabled={isAdminGeminiLoading || (!reportSummary.trim() && !reportTitle.trim() && !adminGeminiCustomPrompt.trim())}
                    className="px-3 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                    <span>پاکسازی نیم‌فاصله</span>
                  </button>
                </div>
              </div>

              {/* Suggestion Output */}
              {adminGeminiSuggestion && (
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>نتیجه پردازش هوش مصنوعی:</span>
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleApplyGeminiToSummary}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="درج مستقیم در کادر توضیحات گزارش"
                      >
                        <Save className="w-3 h-3" />
                        <span>درج در توضیحات</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleApplyGeminiToKeyPoints}
                        className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                        title="استخراج و درج در کادر محورهای کلیدی"
                      >
                        <CheckCircle2 className="w-3 h-3" />
                        <span>درج در محورهای کلیدی</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCopyAdminGemini}
                        className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                      >
                        {copiedAdminGemini ? <Check className="w-3 h-3 text-emerald-500" /> : <Paperclip className="w-3 h-3" />}
                        <span>{copiedAdminGemini ? 'کپی شد' : 'کپی'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line max-h-48 overflow-y-auto p-1 bg-slate-50/50 dark:bg-slate-850/50 rounded-lg">
                    {adminGeminiSuggestion}
                  </div>
                </div>
              )}
            </div>

            {/* Summary Rich Text Editor */}
            <RichTextEditor
              value={reportSummary}
              onChange={setReportSummary}
              label="خلاصه و توضیحات متن گزارش"
              placeholder="توضیحاتی در خصوص دستاوردها، اهداف و موضوع گزارش ارائه دهید (امکان استفاده از پررنگ، سرتیتر، لیست و پیش‌نمایش زنده)..."
              minHeight="150px"
            />

            {/* Video File Upload Box */}
            <div className={`rounded-2xl p-5 border-2 border-dashed space-y-3 transition-colors ${
              reportFormat === 'text'
                ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'
                : 'bg-blue-50/50 dark:bg-slate-800/50 border-blue-200 dark:border-blue-900/60'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 shadow-md ${
                    reportFormat === 'text' ? 'bg-amber-600' : 'bg-blue-600'
                  }`}>
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                      {reportFormat === 'text'
                        ? 'بخش ویدیو (در حالت گزارش متنی غیرفعال است)'
                        : 'بارگذاری مستقیم فایل ویدیو (MP4 / WebM)'}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {reportFormat === 'text'
                        ? 'این گزارش به عنوان گزارش متنی ذخیره می‌شود. در صورت انتخاب فایل ویدیو، نوع گزارش خودکار به ترکیبی تغییر می‌کند.'
                        : (videoPreviewUrl
                          ? 'ویدیوی گزارش آماده پخش است. برای تغییر یا حذف از دکمه‌های روبرو استفاده کنید.'
                          : 'فایل ویدیو اختیاری است و برای گزارش‌های دارای فیلم در حافظه ذخیره و پخش می‌گردد.')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{videoPreviewUrl ? 'تغییر فایل ویدیو' : 'انتخاب فایل از سیستم'}</span>
                  </button>

                  {videoPreviewUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                      title="حذف و پاکسازی کامل ویدیو از این گزارش"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف کامل ویدیو</span>
                    </button>
                  )}
                </div>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleVideoFileChange}
                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                className="hidden"
              />

              {videoPreviewUrl ? (
                <div className="space-y-3 pt-2">
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-bold shrink-0">
                        {videoFile ? 'فایل انتخاب شده:' : 'ویدیوی بارگذاری شده:'}
                      </span>
                      <span className="font-mono truncate">
                        {videoFile ? videoFile.name : 'ویدیوی فعال گزارش'}
                      </span>
                      {videoFile && (
                        <span className="text-slate-500 shrink-0">
                          ({(videoFile.size / (1024 * 1024)).toFixed(1)} MB)
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveVideo}
                      className="text-rose-600 hover:text-rose-800 dark:text-rose-400 font-bold shrink-0 flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف و جداسازی ویدیو</span>
                    </button>
                  </div>

                  {/* Live Video Upload Progress Indicator */}
                  {isSubmitting && videoFile && (
                    <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-blue-900 dark:text-blue-200 flex items-center gap-2">
                          <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                          <span>وضعیت آپلود ویدیو: {submitStageText}</span>
                        </span>
                        <span className="font-mono font-black text-blue-700 dark:text-blue-300">
                          {toPersianDigits(submitProgress)}٪
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-blue-100 dark:bg-blue-900/60 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${submitProgress}%` }}
                        />
                      </div>
                      {submitProgressDetails && (
                        <div className="flex items-center justify-between text-[11px] text-blue-700 dark:text-blue-300">
                          <span>حجم منتقل‌شده:</span>
                          <span className="font-mono font-bold">
                            {submitProgressDetails.loadedFormatted} از {submitProgressDetails.totalFormatted}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Explicit Keep Video Attachment Toggle */}
                  <div className="p-3.5 rounded-2xl bg-blue-50/80 dark:bg-slate-800/90 border border-blue-200 dark:border-slate-700 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Film className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                          <span>نگهداری فایل ویدیو در بایگانی (Keep Video Attachment)</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-normal ${
                            keepVideoAttachment 
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300' 
                              : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                          }`}>
                            {keepVideoAttachment ? 'فعال (حفظ امن در حافظه)' : 'غیرفعال (حذف در تبدیل متنی)'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          در صورت فعال بودن، در صورت تغییر نوع گزارش به «متنی»، ویدیو از حافظه پاک نشده و در صورت نیاز مجدداً قابل دسترس است.
                        </div>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={keepVideoAttachment}
                        onChange={(e) => setKeepVideoAttachment(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {/* Video Live Preview if selected */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video max-h-56 mx-auto flex items-center justify-center shadow-inner">
                    <video
                      src={videoPreviewUrl}
                      controls
                      playsInline
                      preload="metadata"
                      onLoadedData={() => setPreviewVideoLoaded(true)}
                      onCanPlay={() => setPreviewVideoLoaded(true)}
                      onLoadStart={() => setPreviewVideoLoaded(false)}
                      className={`w-full h-full object-contain transition-opacity duration-300 ${
                        previewVideoLoaded ? 'opacity-100' : 'opacity-0'
                      }`}
                    />
                    {!previewVideoLoaded && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 text-white gap-2 p-4 text-center select-none z-10">
                        <div className="w-10 h-10 rounded-full border-2 border-blue-500/30 border-t-blue-500 animate-spin flex items-center justify-center">
                          <Film className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-xs font-bold text-slate-200">در حال بارگذاری فایل ویدیو از سرور...</span>
                        <span className="text-[10px] text-slate-400">تا زمان تکمیل بارگذاری، جهت جلوگیری از خطا محتوا نمایش داده نمی‌شود</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="py-4 px-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>
                    {reportFormat === 'text'
                      ? '📄 گزارش در حالت متنی است؛ هیچ ویدیویی ذخیره یا نمایش داده نخواهد شد.'
                      : 'هیچ فایلی برای ویدیو انتخاب نشده است. (برای گزارش‌های متنی و اسنادی این بخش خالی می‌ماند)'}
                  </span>
                </div>
              )}
            </div>

            {/* Attachments Upload Box (JPG, PNG, PDF, Word, Excel, ZIP, etc.) */}
            <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-2xl p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#173b82] text-white flex items-center justify-center shrink-0 shadow-md">
                    <Paperclip className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 block">
                      پیوست‌ها و فایل‌های ضمیمه گزارش (JPG, PNG, PDF, Word و...)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      بارگذاری همزمان چندین فایل تصویری، اسناد رسمی PDF، کاربرگ‌ها و فایل‌های گزارش
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => attachmentInputRef.current?.click()}
                    disabled={isUploadingAttachment}
                    className="px-4 py-2 bg-[#173b82] hover:bg-blue-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isUploadingAttachment ? 'در حال پردازش...' : 'افزودن فایل‌های ضمیمه'}</span>
                  </button>
                </div>
              </div>

              <input
                type="file"
                ref={attachmentInputRef}
                onChange={handleAttachmentFilesChange}
                accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf,.doc,.docx,.xls,.xlsx,.zip,.rar,.txt"
                multiple
                className="hidden"
              />

              {/* Supported format badges */}
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-slate-600 dark:text-slate-400">
                <span className="text-slate-400 dark:text-slate-500">فرمت‌های مجاز:</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  🖼️ تصاویر (JPG, PNG, WebP)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-red-100 dark:bg-red-950/70 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800">
                  📄 اسناد PDF
                </span>
                <span className="px-2 py-0.5 rounded-md bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                  📝 ورد (DOCX, DOC)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  📊 اکسل (XLSX, XLS)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  🗜️ فشرده (ZIP, RAR)
                </span>
              </div>

              {/* Uploaded attachments list */}
              {attachments.length > 0 ? (
                <div className="space-y-2.5 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>لیست فایل‌های پیوست شده ({toPersianDigits(attachments.length)} فایل):</span>
                    <button
                      type="button"
                      onClick={() => setAttachments([])}
                      className="text-rose-500 hover:text-rose-700 text-[11px] font-bold"
                    >
                      حذف همه فایل‌ها
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {attachments.map((att) => (
                      <div
                        key={att.id}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 flex flex-col gap-2 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {att.type === 'image' && att.dataUrl ? (
                              <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-100">
                                <img
                                  src={att.dataUrl}
                                  alt={att.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-11 h-11 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                                {att.type === 'pdf' ? (
                                  <FileText className="w-6 h-6 text-red-600 dark:text-red-400" />
                                ) : att.type === 'word' ? (
                                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                ) : att.type === 'excel' ? (
                                  <FileSpreadsheet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                ) : att.type === 'archive' ? (
                                  <FileArchive className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                                ) : (
                                  <FileIcon className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                                )}
                              </div>
                            )}

                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate" title={att.name}>
                                {att.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                                <span className="font-bold uppercase text-slate-700 dark:text-slate-300">
                                  {att.extension}
                                </span>
                                <span>•</span>
                                <span>{att.sizeFormatted}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {att.dataUrl && (
                              <a
                                href={att.dataUrl}
                                download={att.name}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                                title="پیش‌نمایش / دانلود"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveAttachment(att.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition"
                              title="حذف این پیوست"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Optional Caption input */}
                        <div>
                          <input
                            type="text"
                            value={att.caption || ''}
                            onChange={(e) => handleUpdateAttachmentCaption(att.id, e.target.value)}
                            placeholder="توضیح یا عنوان اختصاصی برای این فایل (اختیاری)..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-[11px] font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none dark:text-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-5 bg-white/60 dark:bg-slate-900/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    هنوز فایلی ضمیمه نشده است. برای پیوست تصاویر، اسناد PDF یا گزارش‌ها روی دکمه بالا کلیک کنید.
                  </p>
                </div>
              )}
            </div>

            {/* Transcript & Subtitles Editor */}
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">💬</span>
                  <h3 className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                    تنظیم متن دیالوگ‌ها و زیرنویس همگام ویدیو
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleAddTranscriptLine}
                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>افزودن دیالوگ جدید</span>
                </button>
              </div>

              <div className="space-y-3">
                {transcriptLines.map((line, idx) => (
                  <div
                    key={idx}
                    className="bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-start md:items-center gap-2.5 text-xs shadow-xs"
                  >
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-slate-400 text-[11px] w-4">
                        {(idx + 1).toLocaleString('fa-IR')}
                      </span>
                      <input
                        type="text"
                        value={line.avatar}
                        onChange={(e) => handleUpdateTranscriptLine(idx, 'avatar', e.target.value)}
                        placeholder="آیکون"
                        className="w-10 px-1 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-center font-bold"
                        title="ایموجی یا آیکون گوینده"
                      />
                      <input
                        type="text"
                        value={line.speaker}
                        onChange={(e) => handleUpdateTranscriptLine(idx, 'speaker', e.target.value)}
                        placeholder="نام گوینده (رضا زنگنه)"
                        className="w-28 sm:w-32 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold"
                      />
                      <input
                        type="text"
                        value={line.role}
                        onChange={(e) => handleUpdateTranscriptLine(idx, 'role', e.target.value)}
                        placeholder="سمت (مدیر تیم)"
                        className="w-24 px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-500"
                      />
                    </div>

                    <input
                      type="text"
                      value={line.text}
                      onChange={(e) => handleUpdateTranscriptLine(idx, 'text', e.target.value)}
                      placeholder="متن سخنان گوینده در ویدیو..."
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-medium"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveTranscriptLine(idx)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/60 rounded-lg transition shrink-0"
                      title="حذف این سطر"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Key points */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                نکات کلیدی گزارش (هر نکته در یک سطر جدید)
              </label>
              <textarea
                rows={3}
                value={keyPointsText}
                onChange={(e) => setKeyPointsText(e.target.value)}
                placeholder="نکته ۱: آغاز پروژه طراحی انیمیشن&#10;نکته ۲: پیام رشد همگانی و منتظر خبرهای خوب باشید"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>

            {/* Live Submission Progress Card */}
            {isSubmitting && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800/90 dark:to-indigo-950/60 border-2 border-blue-300 dark:border-blue-700 rounded-2xl p-5 shadow-md space-y-3.5 animate-fadeIn">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-blue-950 dark:text-blue-100 flex items-center gap-2">
                        <span>{submitStageText || 'در حال پردازش و ذخیره‌سازی گزارش...'}</span>
                      </h4>
                      <p className="text-[11px] text-blue-700 dark:text-blue-300 mt-0.5">
                        لطفاً تا اتمام فرآیند صفحه را نبندید. اطلاعات به صورت خودکار محافظت می‌شود.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {submitProgressDetails && (
                      <span className="text-[11px] font-mono font-bold px-2.5 py-1 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200">
                        {submitProgressDetails.loadedFormatted} / {submitProgressDetails.totalFormatted}
                      </span>
                    )}
                    <span className="text-sm font-mono font-black px-3 py-1 rounded-xl bg-blue-600 text-white shadow-xs">
                      {toPersianDigits(submitProgress)}٪
                    </span>
                  </div>
                </div>

                {/* Animated Progress Bar */}
                <div className="w-full h-3 bg-blue-200/80 dark:bg-slate-700 rounded-full overflow-hidden p-0.5 shadow-inner">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full transition-all duration-300 ease-out shadow-sm"
                    style={{ width: `${Math.max(5, submitProgress)}%` }}
                  />
                </div>

                {/* Workflow Milestones */}
                <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] font-bold text-center">
                  <div className={`p-1.5 rounded-lg border transition ${
                    submitProgress >= 15
                      ? 'bg-blue-100/80 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800'
                      : 'bg-white/50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    ۱. اعتبارسنجی
                  </div>
                  <div className={`p-1.5 rounded-lg border transition ${
                    submitProgress >= 80
                      ? 'bg-indigo-100/80 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border-indigo-300 dark:border-indigo-800'
                      : submitProgress >= 20
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800 animate-pulse'
                      : 'bg-white/50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    ۲. آپلود رسانه و پیوست‌ها
                  </div>
                  <div className={`p-1.5 rounded-lg border transition ${
                    submitProgress >= 100
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : submitProgress >= 85
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-800 animate-pulse'
                      : 'bg-white/50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    ۳. ذخیره و انتشار نهایی
                  </div>
                </div>
              </div>
            )}

            {/* Error Banner with Immediate Retry Button */}
            {submitErrorMessage && !isSubmitting && (
              <div className="bg-rose-50 dark:bg-rose-950/60 border-2 border-rose-300 dark:border-rose-800 rounded-2xl p-5 shadow-md space-y-3.5 animate-fadeIn">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-rose-900 dark:text-rose-100 flex items-center gap-2">
                        <span>خطا در ثبت یا بارگذاری گزارش</span>
                      </h4>
                      <p className="text-xs text-rose-700 dark:text-rose-300 mt-1 font-medium leading-relaxed">
                        {submitErrorMessage}
                      </p>
                      <p className="text-[11px] text-emerald-700 dark:text-emerald-300 mt-1 font-bold">
                        ✓ تمام اطلاعات وارد شده در فرم (متن، ویدیو و فایل‌های پیوست) حفظ شده‌اند و نیازی به وارد کردن مجدد ندارید.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSubmitErrorMessage(null)}
                    className="text-rose-500 hover:text-rose-700 dark:text-rose-400 p-1.5 rounded-lg transition"
                    title="بستن این پیام"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-rose-200 dark:border-rose-900">
                  <button
                    type="button"
                    onClick={() => handleSubmitReport()}
                    className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition shadow-md flex items-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>تلاش مجدد برای ذخیره و انتشار (Retry)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveDraftAction}
                    className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4" />
                    <span>ذخیره در پیش‌نویس‌های آفلاین</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSubmitErrorMessage(null)}
                    className="px-3.5 py-2.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    ادامه ویرایش فرم
                  </button>
                </div>
              </div>
            )}

            {/* Submit & Draft Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                disabled={isSubmitting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                پاک کردن فرم
              </button>

              <div className="flex items-center gap-2.5">
                <button
                  id="save-report-draft-btn"
                  type="button"
                  onClick={handleSaveDraftAction}
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="ذخیره تغییرات در پیش‌نویس‌ها بدون انتشار در صفحه اصلی"
                >
                  <FileText className="w-4 h-4" />
                  <span>ذخیره به عنوان پیش‌نویس</span>
                </button>

                <button
                  id="publish-report-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? `در حال ذخیره‌سازی (${toPersianDigits(submitProgress)}٪)...`
                      : editingReportId
                      ? 'ذخیره تغییرات و بازنشر'
                      : 'ذخیره و انتشار رسمی در سایت'}
                  </span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 2: Manage All Reports List */}
      {/* ==================================================== */}
      {activeTab === 'reports' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Film className="w-5 h-5 text-blue-600" />
                <span>لیست تمامی گزارش‌ها و ویدیوهای ثبت‌شده</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                مشاهده، ویرایش سریع، پیش‌نمایش در صفحه اختصاصی و مدیریت وضعیت انتشار
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={async () => {
                  try {
                    const res = await restoreAllOfficialReportsAndPublish();
                    showToast(res.message, 'success');
                    triggerGlobalCacheBust();
                  } catch (err: any) {
                    showToast('خطا در بازگردانی گزارش‌ها: ' + (err?.message || 'نامشخص'), 'error');
                  }
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                title="بازگردانی کلیه گزارش‌های ویدیویی رسمی با پیوندهای سالم و انتشار سراسری در وبسایت"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>✨ بازگردانی و انتشار گزارش‌های ویدیویی سالم در سایت عمومی</span>
              </button>

              <button
                onClick={() => handleTransferApprovedReportsToPublicGroup()}
                className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shrink-0 cursor-pointer"
                title="انتقال سریع و نمایش تمام گزارش‌های تایید شده به صفحه عمومی گروه من"
              >
                <Send className="w-4 h-4" />
                <span>🚀 انتقال گزارش‌های تایید شده به صفحه عمومی «گروه من»</span>
              </button>

              <button
                onClick={() => {
                  resetForm();
                  setActiveTab('create');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>افزودن گزارش جدید</span>
              </button>
            </div>
          </div>

          {/* Filters & Sorting Bar */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              {/* Search text */}
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجو در عنوان، شماره یا متن..."
                  className="w-full pl-3 pr-10 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                />
              </div>

              {/* Team Filter */}
              <div>
                <select
                  value={filterTeam}
                  onChange={(e) => setFilterTeam(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">همه تیم‌ها ({allReports.length})</option>
                  {(Object.entries(teams) as [string, TeamData][]).map(([slug, team]) => (
                    <option key={slug} value={slug}>
                      {team.name} ({team.reports?.length || 0})
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">همه وضعیت‌ها</option>
                  <option value="published">🟢 تایید شده / منتشر شده</option>
                  <option value="draft">🟡 پیش‌نویس / در انتظار</option>
                </select>
              </div>

              {/* Media Type Filter (Video vs Text Only) */}
              <div>
                <select
                  value={filterMediaType}
                  onChange={(e) => setFilterMediaType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">🎬 نوع رسانه (همه گزارش‌ها)</option>
                  <option value="video">🎥 دارای ویدیو ({allReports.filter(r => Boolean(r.videoSrc && r.videoSrc !== '#' && r.videoSrc.trim() !== '')).length})</option>
                  <option value="text-only">📄 فقط متنی / بدون ویدیو ({allReports.filter(r => !r.videoSrc || r.videoSrc === '#' || r.videoSrc.trim() === '').length})</option>
                </select>
              </div>
            </div>

            {/* Custom Date Input (conditional) & Sort + Active Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={filterDatePeriod}
                  onChange={(e) => setFilterDatePeriod(e.target.value as any)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">📅 همه تاریخ‌ها</option>
                  <option value="1405">📅 سال ۱۴۰۵</option>
                  <option value="1404">📅 سال ۱۴۰۴</option>
                  <option value="custom">🔍 تاریخ خاص...</option>
                </select>

                {filterDatePeriod === 'custom' && (
                  <input
                    type="text"
                    value={customDateQuery}
                    onChange={(e) => setCustomDateQuery(e.target.value)}
                    placeholder="مثلاً: مرداد ۱۴۰۵ یا ۰۵/۲۶"
                    className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg font-bold text-xs focus:outline-none"
                  />
                )}

                <span className="text-slate-500 font-bold">
                  نمایش {toPersianDigits(filteredReports.length)} از {toPersianDigits(allReports.length)} گزارش
                </span>

                {(filterTeam !== 'all' || filterStatus !== 'all' || filterMediaType !== 'all' || filterDatePeriod !== 'all' || searchQuery !== '' || customDateQuery !== '') && (
                  <button
                    onClick={() => {
                      setFilterTeam('all');
                      setFilterStatus('all');
                      setFilterMediaType('all');
                      setFilterDatePeriod('all');
                      setCustomDateQuery('');
                      setSearchQuery('');
                      setReportsSortBy('views-desc');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-bold hover:bg-rose-200 transition cursor-pointer text-[11px]"
                  >
                    ✕ پاک کردن همه فیلترها
                  </button>
                )}
              </div>

              {/* Sort selector */}
              <div className="flex items-center gap-2">
                <span className="text-slate-500 font-bold hidden sm:inline">مرتب‌سازی:</span>
                <select
                  value={reportsSortBy}
                  onChange={(e) => setReportsSortBy(e.target.value as any)}
                  className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg font-bold text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="views-desc">🔥 بیشترین بازدید ویدیو</option>
                  <option value="views-asc">📉 کمترین بازدید ویدیو</option>
                  <option value="num-desc">🔢 شماره گزارش (از بزرگ به کوچک)</option>
                  <option value="num-asc">🔢 شماره گزارش (از ۱ به بعد - ترتیبی صعودی)</option>
                  <option value="date-desc">📅 جدیدترین تاریخ</option>
                  <option value="date-asc">📅 قدیمی‌ترین تاریخ</option>
                  <option value="title">🔤 بر اساس عنوان</option>
                </select>
              </div>
            </div>
          </div>

          {/* Reports Table */}
          {filteredReports.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-3">
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">گزارشی با فیلترهای انتخابی یافت نشد.</p>
              <button
                onClick={() => {
                  setFilterTeam('all');
                  setFilterStatus('all');
                  setFilterDatePeriod('all');
                  setCustomDateQuery('');
                  setSearchQuery('');
                  setReportsSortBy('views-desc');
                }}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-bold">
                    <th className="pb-3 pr-2">تیم</th>
                    <th className="pb-3">شماره و عنوان گزارش</th>
                    <th className="pb-3 text-center">بازدید ویدیو</th>
                    <th className="pb-3">تاریخ</th>
                    <th className="pb-3 text-center">وضعیت</th>
                    <th className="pb-3 text-left pl-2">عملیات مدیریت</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredReports.map((report, idx) => {
                    const views = reportViews[report.id] ?? 0;
                    return (
                      <tr key={report.id} className={`${idx % 2 === 0 ? 'bg-white dark:bg-slate-900' : 'bg-slate-50/50 dark:bg-slate-800/30'} hover:bg-slate-100 dark:hover:bg-slate-800/60 transition group`}>
                        <td className="py-3.5 pr-2 font-bold text-[#173b82] dark:text-blue-400 whitespace-nowrap">
                          {report.teamName}
                        </td>
                        <td className="py-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingNumReport({
                                  id: report.id,
                                  teamSlug: report.teamSlug,
                                  title: report.title,
                                  reportNum: report.reportNum || ''
                                });
                                setCustomNumInput(report.reportNum || '');
                                setCustomTitleInput(report.title || '');
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs transition cursor-pointer shrink-0"
                              title="برای ویرایش سریع شماره یا عنوان گزارش کلیک کنید"
                            >
                              <span>{formatReportNumberDisplay(report.reportNum)}</span>
                              <Edit3 className="w-2.5 h-2.5 opacity-60" />
                            </button>

                            {/* Media Status Pill Indicator */}
                            {report.videoSrc && report.videoSrc !== '#' && report.videoSrc.trim() !== '' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 font-bold text-[10px] shrink-0" title="دارای فایل ویدیویی و زیرنویس آماده">
                                <Film className="w-2.5 h-2.5 text-blue-500" />
                                <span>گزارش تصویری</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 font-bold text-[10px] shrink-0" title="این گزارش فقط متنی است و فایل ویدیویی آپلود نشده">
                                <FileText className="w-2.5 h-2.5 text-amber-500" />
                                <span>گزارش متنی</span>
                              </span>
                            )}

                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {report.title}
                            </div>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md mt-0.5">
                            {report.summary}
                          </div>
                        </td>
                        <td className="py-3.5 text-center whitespace-nowrap">
                          <button
                            onClick={() => {
                              setEditingViewsReport({
                                id: report.id,
                                title: report.title,
                                currentViews: views
                              });
                              setCustomViewsInput(views);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 dark:bg-sky-950/60 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800/80 text-sky-700 dark:text-sky-300 font-bold transition cursor-pointer"
                            title="برای ویرایش دستی و تغییر تعداد بازدید کلیک کنید"
                          >
                            <Eye className="w-3.5 h-3.5 text-sky-500" />
                            <span className="font-mono text-xs font-black">{toPersianDigits(views)}</span>
                            <Edit3 className="w-2.5 h-2.5 opacity-50 ml-0.5" />
                          </button>
                        </td>
                        <td className="py-3.5 whitespace-nowrap text-center">
                          <button
                            onClick={() => {
                              setEditingDateReport({
                                id: report.id,
                                teamSlug: report.teamSlug,
                                title: report.title,
                                currentDate: report.date || ''
                              });
                              setCustomDateInput(report.date || '');
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900 border border-orange-200 dark:border-orange-800/80 text-orange-700 dark:text-orange-300 font-bold transition cursor-pointer"
                            title="برای ویرایش تاریخ گزارش کلیک کنید"
                          >
                            <span className="font-mono text-xs font-black">{toPersianDigits(report.date || '')}</span>
                            <Edit3 className="w-2.5 h-2.5 opacity-50 ml-0.5" />
                          </button>
                        </td>
                        <td className="py-3.5 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => {
                              const newStatus: 'published' | 'draft' = report.status === 'draft' ? 'published' : 'draft';
                              const updated: ActivityReport = { ...report, status: newStatus };
                              saveReport(updated, report.teamSlug);
                              setAllReports(getAllReports());
                              setTeams(getAllTeams());
                              showToast(
                                newStatus === 'published'
                                  ? `گزارش «${report.title}» تایید و در صفحه عمومی منتشر شد.`
                                  : `گزارش «${report.title}» به حالت پیش‌نویس تغییر یافت.`
                              );
                            }}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition shadow-xs hover:scale-105 ${
                              report.status === 'draft'
                                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                            title="برای تغییر وضعیت (پیش‌نویس / منتشر شده) کلیک کنید"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                            <span>{report.status === 'draft' ? 'پیش‌نویس' : 'منتشر شده'}</span>
                          </button>
                        </td>
                        <td className="py-3.5 pl-2 text-left whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 opacity-100 sm:opacity-50 group-hover:opacity-100 transition-opacity">
                            {/* Fast Video Preview if available */}
                            {report.videoSrc && report.videoSrc !== '#' && report.videoSrc.trim() !== '' && (
                              <button
                                onClick={() => setVideoPreviewUrl(report.videoSrc || null)}
                                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg transition cursor-pointer"
                                title="پیش‌نمایش سریع ویدیوی گزارش"
                              >
                                <Film className="w-4 h-4" />
                              </button>
                            )}

                            {/* View Full Details Button */}
                            <button
                              type="button"
                              onClick={() => handleEditReport(report, report.teamSlug)}
                              className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg transition cursor-pointer"
                              title="نمایش جزئیات و ویرایش کامل گزارش"
                              aria-label={`نمایش/ویرایش کامل گزارش ${report.title}`}
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Print / Export PDF */}
                            <PrintReportButton
                              report={report}
                              teamName={report.teamName}
                              variant="minimal"
                            />

                            {/* Transfer & View in Public Group Page */}
                            <button
                              onClick={() => {
                                const updated = { ...report, status: 'published' as const };
                                saveReport(updated, report.teamSlug);
                                setAllReports(getAllReports());
                                setTeams(getAllTeams());
                                showToast(`گزارش «${report.title}» با تایید فوری در صفحه عمومی گروه من منتشر شد.`);
                                onNavigate(report.teamSlug as PageId);
                              }}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg transition cursor-pointer"
                              title="انتشار و نمایش فوری این گزارش در صفحه عمومی «گروه من»"
                            >
                              <Send className="w-4 h-4" />
                            </button>

                            {/* Detach Video Quick Action */}
                            {report.videoSrc && report.videoSrc !== '#' && report.videoSrc.trim() !== '' && report.reportType !== 'text' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setVideoRemovalModal({
                                    isOpen: true,
                                    reportId: report.id,
                                    teamSlug: report.teamSlug,
                                    reportTitle: report.title,
                                    fileName: 'ویدیوی پیوست شده به گزارش'
                                  });
                                }}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg transition cursor-pointer"
                                title="حذف فایل ویدیویی و تبدیل به گزارش متنی"
                              >
                                <Film className="w-4 h-4" />
                              </button>
                            )}

                            {/* View in Team Page */}
                            <button
                              onClick={() => onNavigate(report.teamSlug as PageId)}
                              className="p-1.5 hover:bg-blue-50 dark:hover:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg transition cursor-pointer"
                              title="مشاهده در صفحه اختصاصی تیم و پخش ویدیو"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>

                            {/* Edit Report */}
                            <button
                              onClick={() => handleEditReport(report, report.teamSlug)}
                              className="p-1.5 hover:bg-emerald-50 dark:hover:bg-slate-800 text-emerald-600 dark:text-emerald-400 rounded-lg transition cursor-pointer"
                              title="ویرایش مشخصات و ویدیو"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Delete Report */}
                            <button
                              onClick={() => handleOpenDeleteReportModal(report.id, report.teamSlug, report.title, report.teamName)}
                              className="p-1.5 hover:bg-rose-50 dark:hover:bg-slate-800 text-rose-600 dark:text-rose-400 rounded-lg transition cursor-pointer"
                              title="حذف گزارش"
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
      )}

      {/* ==================================================== */}
      {/* TAB: Drafts Management */}
      {/* ==================================================== */}
      {activeTab === 'drafts' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span>مدیریت پیش‌نویس‌های ذخیره‌شده</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold border border-amber-300 dark:border-amber-800">
                  {toPersianDigits(savedDraftsList.length)} پیش‌نویس
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                گزارش‌های در دست نگارش و پیش‌نویس‌های بدون انتشار عمومی را مشاهده، ویرایش یا منتشر کنید.
              </p>
            </div>

            <button
              onClick={() => {
                resetForm();
                setActiveTab('create');
              }}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>ایجاد پیش‌نویس جدید</span>
            </button>
          </div>

          {savedDraftsList.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                در حال حاضر هیچ پیش‌نویسی ذخیره نشده است
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                هنگام تکمیل فرم در برگه «ثبت گزارش»، با کلیک روی دکمه «ذخیره به عنوان پیش‌نویس» می‌توانید متن را بدون انتشار در سایت ذخیره کنید.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedDraftsList.map((draft) => {
                const draftTeam = teams[draft.teamSlug || 'team-angels'] || getAllTeams()[draft.teamSlug || 'team-angels'];
                return (
                  <div
                    key={draft.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex flex-col justify-between gap-4 shadow-xs hover:border-amber-400 transition"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          <span>{draftTeam?.icon || '👥'}</span>
                          <span>{draftTeam?.name || 'تیم'}</span>
                        </span>

                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          draft.reportFormat === 'text'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300'
                            : draft.reportFormat === 'video'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300'
                        }`}>
                          {draft.reportFormat === 'text' ? '📄 متنی' : draft.reportFormat === 'video' ? '🎥 ویدیویی' : '✨ ترکیبی'}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2">
                        {draft.title || 'پیش‌نویس بدون عنوان'}
                      </h4>

                      {draft.summary && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                          {draft.summary}
                        </p>
                      )}

                      <div className="flex items-center gap-2 text-[10px] text-slate-400 pt-1">
                        <span>تاریخ: {toPersianDigits(draft.date || '')}</span>
                        {draft.keepVideoAttachment && (
                          <span className="text-blue-500 font-bold">• ویدیو بایگانی شده</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-slate-200 dark:border-slate-700">
                      <button
                        onClick={() => handleLoadDraft(draft)}
                        className="flex-1 py-2 bg-[#173b82] hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>ادامه ویرایش</span>
                      </button>

                      <button
                        onClick={() => handleDeleteDraftAction(draft.id)}
                        className="p-2 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 dark:text-rose-400 rounded-xl transition"
                        title="حذف پیش‌نویس"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Orphan Media & Storage Repair Utility */}
      {/* ==================================================== */}
      {activeTab === 'repair' && (
        <OrphanMediaRepairUtility
          onRepaired={() => {
            setAllReports(getAllReports());
            setTeams(getAllTeams());
          }}
        />
      )}

      {/* ==================================================== */}
      {/* TAB: Video Gallery View */}
      {/* ==================================================== */}
      {activeTab === 'gallery' && (
        <VideoGalleryView
          reports={allReports}
          teams={teams}
          onSelectReport={(report, teamSlug) => {
            handleEditReport(report, teamSlug);
          }}
        />
      )}
      {activeTab === 'monthly' && (
        <MonthlyReports allReports={allReports} />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-600" />
                  <span>داشبورد آمار و تحلیل محبوبیت ویدیوهای گزارش</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  پایش برخط تعداد بازدیدها، شناسایی ویدیوهای پرطرفدار و ارزیابی تعامل مخاطبان با تیم‌ها
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const views = getAllReportViews();
                    setReportViewsState(views);
                    showToast('آمار بازدیدها با موفقیت به‌روزرسانی شد.');
                  }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                  <span>بروزرسانی آمار</span>
                </button>
              </div>
            </div>

            {/* 4 Summary KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Views */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-slate-800/80 dark:to-slate-800/40 p-5 rounded-2xl border border-blue-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 dark:text-blue-300">مجموع کل بازدیدها</span>
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
                    <Eye className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-900 dark:text-white font-mono">
                  {toPersianDigits(totalViewsCount)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  در {toPersianDigits(allReports.length)} گزارش ویدیویی منتشرشده
                </div>
              </div>

              {/* Most Popular Video */}
              <div className="bg-gradient-to-br from-amber-50 to-orange-50/50 dark:from-slate-800/80 dark:to-slate-800/40 p-5 rounded-2xl border border-amber-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-800 dark:text-amber-300">محبوب‌ترین ویدیو</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                    <Flame className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white truncate" title={topReport?.title}>
                  {topReport ? topReport.title : '—'}
                </div>
                <div className="text-[11px] text-amber-700 dark:text-amber-400 font-bold flex items-center gap-1">
                  <span>{toPersianDigits(topReport?.views || 0)} بازدید</span>
                  <span className="text-slate-400 font-normal">({topReport?.teamName})</span>
                </div>
              </div>

              {/* Average Views */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-slate-800/80 dark:to-slate-800/40 p-5 rounded-2xl border border-emerald-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">میانگین بازدید هر ویدیو</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-900 dark:text-white font-mono">
                  {toPersianDigits(avgViewsPerReport)}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  شاخص میانگین جذب مخاطب در محاش
                </div>
              </div>

              {/* Leading Team */}
              <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50/50 dark:from-slate-800/80 dark:to-slate-800/40 p-5 rounded-2xl border border-purple-100 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-purple-800 dark:text-purple-300">تیم پیشرو در بازدید</span>
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md">
                    <Award className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                  {topTeam ? `${topTeam.icon} ${topTeam.name}` : '—'}
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-400 font-bold">
                  {toPersianDigits(topTeam?.totalViews || 0)} بازدید ({toPersianDigits(topTeam?.percentage || 0)}٪ سهم کل)
                </div>
              </div>
            </div>

            {/* Video Popularity Leaderboard */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span>جدول رتبه‌بندی محبوبیت ویدیوهای گزارش</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    رده‌بندی گزارش‌ها بر اساس میزان بازدید و درصد استقبال اعضا
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {rankedReports.map((report, idx) => {
                  const views = report.views;
                  const ratio = maxViews > 0 ? (views / maxViews) * 100 : 0;
                  
                  let rankBadge = (
                    <span className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs flex items-center justify-center shrink-0 font-mono">
                      {toPersianDigits(idx + 1)}
                    </span>
                  );
                  if (idx === 0) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-xl bg-amber-400/20 text-amber-600 border border-amber-400/40 font-black text-sm flex items-center justify-center shrink-0" title="رتبه اول (محبوب‌ترین)">
                        🥇
                      </span>
                    );
                  } else if (idx === 1) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-xl bg-slate-300/30 text-slate-600 border border-slate-400/40 font-black text-sm flex items-center justify-center shrink-0" title="رتبه دوم">
                        🥈
                      </span>
                    );
                  } else if (idx === 2) {
                    rankBadge = (
                      <span className="w-7 h-7 rounded-xl bg-amber-700/20 text-amber-800 border border-amber-700/30 font-black text-sm flex items-center justify-center shrink-0" title="رتبه سوم">
                        🥉
                      </span>
                    );
                  }

                  return (
                    <div
                      key={report.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 hover:border-blue-300 dark:hover:border-blue-700 transition space-y-2.5"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          {rankBadge}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 dark:text-white text-xs sm:text-sm truncate">
                                {formatReportNumberDisplay(report.reportNum)}: {report.title}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                                {report.teamName}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              تاریخ انتشار: {report.date}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                          {/* Views Number */}
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-sm font-black text-slate-900 dark:text-white font-mono">
                              <Eye className="w-4 h-4 text-sky-500" />
                              <span>{toPersianDigits(views)}</span>
                              <span className="text-[11px] text-slate-400 font-sans font-normal">بازدید</span>
                            </div>
                          </div>

                          {/* Quick Adjust Button */}
                          <button
                            onClick={() => {
                              setEditingViewsReport({
                                id: report.id,
                                title: report.title,
                                currentViews: views
                              });
                              setCustomViewsInput(views);
                            }}
                            className="p-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-200 rounded-lg border border-slate-200 dark:border-slate-600 transition cursor-pointer"
                            title="تنظیم یا اصلاح تعداد بازدید"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Watch & Jump to page */}
                          <button
                            onClick={() => onNavigate(report.teamSlug as PageId)}
                            className="px-3 py-1.5 bg-[#173b82] hover:bg-blue-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs"
                            title="مشاهده گزارش و تماشای ویدیو"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span className="hidden xs:inline">پخش</span>
                          </button>
                        </div>
                      </div>

                      {/* Visual Bar */}
                      <div className="space-y-1">
                        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              idx === 0
                                ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                                : idx === 1
                                ? 'bg-gradient-to-r from-slate-400 to-slate-300'
                                : idx === 2
                                ? 'bg-gradient-to-r from-amber-700 to-amber-600'
                                : 'bg-gradient-to-r from-blue-600 to-cyan-500'
                            }`}
                            style={{ width: `${Math.max(ratio, 3)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team Views Breakdown */}
            <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>سهم و توزیع بازدید ویدیوها بر اساس تیم‌های پنج‌گانه محاش</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  تفکیک مجموع بازدیدهای تجمعی و مقایسه عملکرد هر تیم
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {teamViewsStats.map((item) => (
                  <div
                    key={item.slug}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{item.icon}</span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</div>
                          <div className="text-[10px] text-slate-400">{item.reportsCount} گزارش ویدیویی</div>
                        </div>
                      </div>
                      <span className="text-xs font-black text-blue-600 dark:text-blue-400 font-mono">
                        {toPersianDigits(item.percentage)}٪
                      </span>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">مجموع بازدیدها:</span>
                        <span className="font-black text-slate-800 dark:text-slate-200 font-mono">
                          {toPersianDigits(item.totalViews)}
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all duration-700"
                          style={{ width: `${Math.max(item.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* Quick Edit Views Modal */}
      {/* ==================================================== */}
      {editingViewsReport && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-sky-500" />
                <h3 className="font-black text-slate-900 dark:text-white text-sm">
                  تنظیم دستی تعداد بازدید ویدیو
                </h3>
              </div>
              <button
                onClick={() => setEditingViewsReport(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-slate-600 dark:text-slate-300 font-bold truncate">
                گزارش: {editingViewsReport.title}
              </p>
              <p className="text-[11px] text-slate-500">
                می‌توانید تعداد بازدیدهای ثبت‌شده برای این گزارش ویدیویی را مطابق با نیاز خود تغییر دهید:
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                تعداد بازدید جدید
              </label>
              <input
                type="number"
                min={0}
                value={customViewsInput}
                onChange={(e) => setCustomViewsInput(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-mono font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs font-bold">
              <button
                onClick={() => setEditingViewsReport(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl transition cursor-pointer"
              >
                انصراف
              </button>
              <button
                onClick={() => {
                  setReportViews(editingViewsReport.id, customViewsInput);
                  setReportViewsState(getAllReportViews());
                  showToast(`تعداد بازدید برای «${editingViewsReport.title}» به ${customViewsInput} تغییر یافت.`);
                  setEditingViewsReport(null);
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition cursor-pointer"
              >
                ذخیره تغییرات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Comprehensive Memberships & Club Monitoring Dashboard */}
      {/* ==================================================== */}
      {activeTab === 'members_dashboard' && (
        <MembershipsManagementDashboard />
      )}

      {/* ==================================================== */}
      {/* TAB 3: Manage Teams & Members */}
      {/* ==================================================== */}
      {activeTab === 'teams' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span>مدیریت تیم‌ها، مدیران و اسامی اعضا</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              امکان ویرایش مشخصات تیم‌ها، تغییر مدیر و به‌روزرسانی لیست اعضای فعال
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(Object.entries(teams) as [string, TeamData][]).map(([slug, team]) => (
              <div
                key={slug}
                className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 space-y-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-lg shadow-xs">
                      {team.icon}
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{team.name}</h3>
                      <span className="text-[11px] text-slate-500">مدیر: {team.manager}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate(slug as PageId)}
                    className="text-xs text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1"
                  >
                    <span>صفحه تیم</span>
                    <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {/* Team Logo & Upload */}
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 shrink-0">
                      <img
                        src={team.logo || getTeamLogoPlaceholder(team.id, team.name)}
                        alt={team.name}
                        className="w-full h-full object-contain rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(team.id, team.name);
                        }}
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                          لوگو / تصویر نشان تیم:
                        </span>
                        {team.logo && (
                          <button
                            type="button"
                            onClick={() => {
                              resetTeamLogo(slug);
                              showToast(`لوگوی تیم «${team.name}» به حالت پیش‌فرض وکتور بازگشت.`);
                            }}
                            className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
                          >
                            بازنشانی به وکتور پیش‌فرض
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-300 rounded-lg text-[11px] font-bold cursor-pointer border border-blue-200/60 dark:border-blue-800 transition shrink-0">
                          <Upload className="w-3 h-3 inline-block ml-1" />
                          <span>انتخاب عکس از کامپیوتر</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  showToast('در حال بارگذاری و ذخیره لوگوی تیم...', 'info');
                                  const finalLogo = await uploadAndProcessImageFile(file, 512, 0.88);
                                  saveTeamLogo(slug, finalLogo);
                                  setTeams(getAllTeams());
                                  showToast(`لوگوی جدید تیم «${team.name}» با موفقیت بارگذاری و ذخیره شد.`);
                                } catch (err) {
                                  console.warn(err);
                                  showToast('خطا در ذخیره‌سازی لوگوی تیم', 'error');
                                }
                              }
                            }}
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      شعار تیم
                    </label>
                    <input
                      type="text"
                      defaultValue={team.slogan}
                      onBlur={(e) => updateTeamDetails(slug, { slogan: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      نام مدیر تیم
                    </label>
                    <input
                      type="text"
                      defaultValue={team.manager}
                      onBlur={(e) => updateTeamDetails(slug, { manager: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      توضیحات و اهداف تیم
                    </label>
                    <textarea
                      rows={2}
                      defaultValue={team.description}
                      onBlur={(e) => {
                        updateTeamDetails(slug, { description: e.target.value });
                        showToast(`توضیحات تیم «${team.name}» به‌روزرسانی شد.`);
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-600 dark:text-slate-400 mb-1">
                      اسامی اعضا (با کاما یا خط بعد جدا کنید)
                    </label>
                    <textarea
                      rows={2}
                      defaultValue={team.members.join('\n')}
                      onBlur={(e) => {
                        const list = e.target.value
                          .split(/[\n,]+/)
                          .map((s) => s.trim())
                          .filter((s) => s.length > 0);
                        updateTeamDetails(slug, { members: list });
                        showToast(`اعضای تیم «${team.name}» به‌روزرسانی شدند.`);
                      }}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium leading-relaxed"
                    />
                  </div>

                  {/* Member Avatars Management */}
                  {team.members && team.members.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block">
                        📸 تصاویر پروفایل / آواتار اعضای تیم:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {team.members.map((member, mIdx) => {
                          const currentAvatar = getMemberAvatar(slug, member);
                          const isCustomPhoto = currentAvatar && (currentAvatar.startsWith('data:image') || currentAvatar.startsWith('http') || currentAvatar.startsWith('/'));

                          return (
                            <div
                              key={mIdx}
                              className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-2"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-8 h-8 rounded-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                                  {isCustomPhoto ? (
                                    <img
                                      src={currentAvatar}
                                      alt={member}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <span className="text-sm">{currentAvatar || '👤'}</span>
                                  )}
                                </div>
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                                  {member}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <label className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 rounded-lg text-[10px] font-bold cursor-pointer transition flex items-center gap-1 shadow-2xs">
                                  <Upload className="w-3 h-3" />
                                  <span>عکس</span>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const finalAvatar = await uploadAndProcessImageFile(file, 256, 0.85);
                                          saveMemberAvatar(slug, member, finalAvatar);
                                          setMemberAvatars(getMemberAvatars());
                                          showToast(`عکس پروفایل «${member}» با موفقیت ذخیره شد.`);
                                        } catch {
                                          showToast('خطا در پردازش تصویر عضو تیم', 'error');
                                        }
                                      }
                                    }}
                                  />
                                </label>
                                {isCustomPhoto && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      resetMemberAvatar(slug, member);
                                      setMemberAvatars(getMemberAvatars());
                                      showToast(`عکس پروفایل «${member}» بازنشانی شد.`);
                                    }}
                                    className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-[10px] font-bold transition cursor-pointer"
                                    title="بازنشانی آواتار به پیش‌فرض"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Logos & Circular Badges Management Center */}
      {/* ==================================================== */}
      {activeTab === 'logos' && (
        <div className="space-y-8">
          {/* Header Banner */}
          <div className="bg-gradient-to-l from-[#173b82] via-[#1e4da1] to-[#0d2352] rounded-3xl p-6 sm:p-8 text-white shadow-lg space-y-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs text-amber-300 font-bold border border-white/10">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>مرکز هویت بصری و مدیریت نشان‌های گرافیکی</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                  مدیریت، حذف و اضافه لوگوهای محاش و نشان‌های حلقوی
                </h2>
                <p className="text-xs sm:text-sm text-blue-100/80 max-w-2xl leading-relaxed">
                  کنترل کامل بر لوگوی رسمی سربرگ، فوتر، نشان مدور باشگاه جوانان و نشان‌های حلقوی ۵ تیم پنج‌گانه به صورت زنده و پایدار
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('media')}
                  className="px-4 py-2 bg-gradient-to-l from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>فرم بهینه‌سازی WebP و دیتابیس MySQL</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleResetMahashLogoAction();
                    handleResetYouthClubBadgeAction();
                    Object.keys(teams).forEach((slug) => handleResetTeamLogo(slug));
                    showToast('تمامی لوگوها و نشان‌های سایت به حالت‌های وکتور اولیه بازنشانی شدند.');
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer backdrop-blur-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>بازنشانی کامل به پیش‌فرض</span>
                </button>
              </div>
            </div>
          </div>

          {/* Section 1 & 2: Institutional Logo & Youth Club Badge */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 1. Official Mahash Institution Logo */}
            <div className="space-y-4">
              <AdminLogoManager
                id="admin-mahash-official-logo"
                assetId="mahash_official_logo"
                category="logo"
                title="لوگوی رسمی مؤسسه محاش"
                description="این لوگو در بالای تمامی صفحات، هدر اصلی، کارنامه‌ها و فوتر رسمی سیستم به کار می‌رود."
                defaultSvg={MAHESH_LOGO_SVG}
                badgeText="هدر، فوتر و اسناد"
                maxFileSizeMB={5}
                maxDimension={512}
                onSyncSuccess={(newLogo) => {
                  setMahashLogo(newLogo);
                  setMahashLogoSrc(newLogo);
                  showToast('لوگوی رسمی مؤسسه محاش با موفقیت در دیتابیس ابری ثبت و همگام شد.');
                }}
              />

              {/* Quick Presets for Mahash */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  انتخاب سریع از الگوهای رسمی محاش:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CIRCULAR_BADGE_PRESETS.filter((p) => p.category === 'سازمانی' || p.category === 'mahash' || p.id === 'preset-mahash-official').map((badge) => (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => handleApplyLogoToMahash(badge.svg || badge.svgDataUri || '', badge.name || badge.title)}
                      className="p-2 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 text-right cursor-pointer text-xs"
                    >
                      <div className="w-8 h-8 rounded-full p-0.5 border border-slate-200 dark:border-slate-600 bg-white shrink-0">
                        <img loading="lazy" src={badge.svg || badge.svgDataUri} alt={badge.name || badge.title} className="w-full h-full object-contain rounded-full" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                        {badge.name || badge.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Mahash Youth Club Emblem */}
            <div className="space-y-4">
              <AdminLogoManager
                id="admin-youth-club-emblem"
                assetId="mahash_youth_club_emblem"
                category="badge"
                title="نشان و مدال رسمی باشگاه جوانان"
                description="این نشان در مدال‌های افتخار، صفحه اصلی، بنرهای باشگاهی و کارت‌های عضویت نمایش داده می‌شود."
                defaultSvg={MAHESH_CLUB_EMBLEM_SVG}
                badgeText="افتخارات و باشگاه جوانان"
                maxFileSizeMB={5}
                maxDimension={512}
                onSyncSuccess={(newBadge) => {
                  setYouthClubBadge(newBadge);
                  setYouthClubBadgeSrc(newBadge);
                  showToast('نشان رسمی باشگاه جوانان محاش با موفقیت در دیتابیس ابری ثبت و همگام شد.');
                }}
              />

              {/* Quick Presets for Club Badge */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  انتخاب سریع از مدال‌ها و نشان‌های افتخار:
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CIRCULAR_BADGE_PRESETS.filter((p) => p.category === 'باشگاهی' || p.category === 'ویژه' || p.id === 'preset-club-official').slice(0, 3).map((badge) => (
                    <button
                      key={badge.id}
                      type="button"
                      onClick={() => handleApplyBadgeToYouthClub(badge.svg || badge.svgDataUri || '', badge.name || badge.title)}
                      className="p-2 bg-slate-50 hover:bg-amber-50 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-2 text-right cursor-pointer text-xs"
                    >
                      <div className="w-8 h-8 rounded-full p-0.5 border border-slate-200 dark:border-slate-600 bg-white shrink-0">
                        <img loading="lazy" src={badge.svg || badge.svgDataUri} alt={badge.name || badge.title} className="w-full h-full object-contain rounded-full" />
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                        {badge.name || badge.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: 5 Teams Circular Logos Interactive Manager */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <span>تغییر و انتساب نشان‌های حلقوی برای تیم‌های ۵ گانه</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  تیم مورد نظر خود را انتخاب کرده و هر نشان دلخواه از کتابخانه را با یک کلیک به آن نسبت دهید یا عکس جدید آپلود نمایید.
                </p>
              </div>

              {/* Team Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                {(Object.entries(teams) as [string, TeamData][]).map(([slug, team]) => (
                  <button
                    key={slug}
                    type="button"
                    onClick={() => setSelectedTargetTeamForBadge(slug)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 cursor-pointer ${
                      selectedTargetTeamForBadge === slug
                        ? 'bg-[#173b82] text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                    }`}
                  >
                    <span>{team.icon}</span>
                    <span>{team.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Current Active Team Card Banner */}
            {teams[selectedTargetTeamForBadge] && (
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 border-2 border-blue-500/30 p-1 shadow-sm shrink-0">
                    <img
                      src={teams[selectedTargetTeamForBadge].logo || getTeamLogoPlaceholder(teams[selectedTargetTeamForBadge].id, teams[selectedTargetTeamForBadge].name)}
                      alt={teams[selectedTargetTeamForBadge].name}
                      className="w-full h-full object-contain rounded-full"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = getTeamLogoPlaceholder(teams[selectedTargetTeamForBadge].id, teams[selectedTargetTeamForBadge].name);
                      }}
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-black text-slate-900 dark:text-white text-base">
                        {teams[selectedTargetTeamForBadge].name}
                      </h4>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
                        مدیر: {teams[selectedTargetTeamForBadge].manager}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {teams[selectedTargetTeamForBadge].slogan}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                    <Upload className="w-3.5 h-3.5" />
                    <span>آپلود تصویر برای این تیم</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => {
                            const base64 = reader.result as string;
                            handleAssignBadgeToTeam(selectedTargetTeamForBadge, base64, file.name);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => handleResetTeamLogo(selectedTargetTeamForBadge)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 dark:bg-slate-800 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>بازنشانی به وکتور پیش‌فرض</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick 1-Click Assignment Grid for the Active Team */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-700 dark:text-slate-300">
                  انتخاب نشان حلقوی برای تیم «{teams[selectedTargetTeamForBadge]?.name}»:
                </span>
                <span className="text-[11px] text-slate-400">
                  برای اعمال فوری، روی نشان مورد نظر کلیک کنید
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {allAvailableBadges.map((badge) => {
                  const badgeData = badge.svg || badge.svgDataUri || '';
                  const badgeLabel = badge.name || badge.title || '';
                  const isCurrent = teams[selectedTargetTeamForBadge]?.logo === badgeData;
                  return (
                    <div
                      key={badge.id}
                      onClick={() => handleAssignBadgeToTeam(selectedTargetTeamForBadge, badgeData, badgeLabel)}
                      className={`p-3 rounded-2xl border transition text-center cursor-pointer flex flex-col items-center gap-2 group relative ${
                        isCurrent
                          ? 'border-blue-600 bg-blue-50/60 dark:bg-blue-950/40 ring-2 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/40 hover:border-blue-400 hover:bg-blue-50/30'
                      }`}
                    >
                      {isCurrent && (
                        <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </div>
                      )}
                      <div className="w-14 h-14 rounded-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-center group-hover:scale-105 transition">
                        <img loading="lazy" src={badgeData} alt={badgeLabel} className="w-full h-full object-contain rounded-full" />
                      </div>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {badgeLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 4: Circular Badges Repository & Add New Badge */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Add New Custom Badge Form */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 lg:col-span-1">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
                <PlusCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  افزودن نشان حلقوی جدید
                </h3>
              </div>

              <form onSubmit={handleAddNewCustomBadge} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان و نام نشان *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBadgeTitle}
                    onChange={(e) => setNewBadgeTitle(e.target.value)}
                    placeholder="مثلاً: مدال افتخار تابستانه محاش..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    توضیح کوتاه نشان
                  </label>
                  <input
                    type="text"
                    value={newBadgeDescription}
                    onChange={(e) => setNewBadgeDescription(e.target.value)}
                    placeholder="توضیح مربوط به تیم یا کاربرد..."
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    فایل تصویر یا لوگوی مدور (SVG / PNG / JPG) *
                  </label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold cursor-pointer text-center border border-dashed border-slate-300 dark:border-slate-700 transition">
                      <span>{newBadgeFileBase64 ? '✓ فایل انتخاب شد (کلیک برای تغییر)' : '📁 انتخاب فایل عکس یا وکتور'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              const processed = await uploadAndProcessImageFile(file, 512, 0.88);
                              setNewBadgeFileBase64(processed);
                            } catch {
                              const reader = new FileReader();
                              reader.onload = () => {
                                setNewBadgeFileBase64(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }
                          }
                        }}
                      />
                    </label>

                    {newBadgeFileBase64 && (
                      <div className="w-10 h-10 rounded-full border border-slate-300 p-0.5 bg-white shrink-0">
                        <img loading="lazy" src={newBadgeFileBase64} alt="پیش‌نمایش" className="w-full h-full object-contain rounded-full" />
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition shadow-sm cursor-pointer flex items-center justify-center gap-1.5 mt-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>ذخیره در کتابخانه نشان‌ها</span>
                </button>
              </form>
            </div>

            {/* Badges Gallery & Filter Repository */}
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-purple-600" />
                    <span>مخزن و گالری نشان‌های فعال ({allAvailableBadges.length})</span>
                  </h3>
                  <span className="text-[11px] text-slate-500">نشان‌های پیش‌فرض و نشان‌های افزوده شده توسط مدیر</span>
                </div>

                {/* Filter categories */}
                <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
                  {[
                    { id: 'all', label: 'همه نشان‌ها' },
                    { id: 'mahash', label: 'محاش و باشگاه' },
                    { id: 'teams', label: 'نشان تیم‌ها' },
                    { id: 'specialty', label: 'افتخارات' },
                    { id: 'custom', label: 'سفارشی مدیر' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveBadgeCategoryFilter(tab.id as any)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer shrink-0 ${
                        activeBadgeCategoryFilter === tab.id
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {filteredBadges.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs font-bold">
                  هیچ نشانی در این دسته‌بندی یافت نشد.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[480px] overflow-y-auto pr-1">
                  {filteredBadges.map((badge) => {
                    const badgeData = badge.svg || badge.svgDataUri || '';
                    const badgeLabel = badge.name || badge.title || '';
                    const badgeDesc = badge.description || (badge.category === 'سازمانی' ? 'لوگوی رسمی سازمانی محاش' : badge.category === 'تیمی' ? 'نشان اختصاصی تیم‌های پنج‌گانه' : 'نشان افتخار و مدال ویژه');
                    return (
                      <div
                        key={badge.id}
                        className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full p-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-xs shrink-0 flex items-center justify-center">
                            <img loading="lazy" src={badgeData} alt={badgeLabel} className="w-full h-full object-contain rounded-full" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-black text-xs text-slate-900 dark:text-white">
                              {badgeLabel}
                            </h4>
                            <p className="text-[10px] text-slate-500 line-clamp-1">
                              {badgeDesc}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <button
                            type="button"
                            onClick={() => handleApplyLogoToMahash(badgeData, badgeLabel)}
                            className="text-[10px] px-2 py-0.5 rounded bg-cyan-50 hover:bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 font-bold transition cursor-pointer"
                          >
                            ثبت برای محاش
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAssignBadgeToTeam(selectedTargetTeamForBadge, badgeData, badgeLabel)}
                            className="text-[10px] px-2 py-0.5 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 font-bold transition cursor-pointer"
                          >
                            ثبت برای {teams[selectedTargetTeamForBadge]?.name.slice(0, 10)}
                          </button>
                          {badge.category === 'custom' && (
                            <button
                              type="button"
                              onClick={() => handleDeleteCustomBadge(badge.id, badgeLabel)}
                              className="text-[10px] px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold transition cursor-pointer mt-0.5"
                            >
                              حذف نشان
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Section 4: Consultants Photos & Profiles Management */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold text-lg shadow-2xs">
                  👨‍⚕️
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    مدیریت تصاویر و اطلاعات مشاوران مؤسسه محاش
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    بارگذاری، بروزرسانی و بازنشانی عکس‌ها و مشخصات مشاوران و روانشناسان مؤسسه محاش
                  </p>
                </div>
              </div>
            </div>

            {/* Consultants Cards List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {consultantsList.map((consultant, cIdx) => {
                const defaultAvatar = cIdx === 0 ? NAZI_AVATAR_SVG : (consultant.image || RADIN_AVATAR_SVG);
                const currentPhoto = getConsultantPhoto(consultant.name, consultant.image || defaultAvatar);
                const isCustomPhoto = currentPhoto !== defaultAvatar && currentPhoto !== consultant.image;
                const cPreview = consultantPreviews[consultant.name];
                const displayPhoto = cPreview || currentPhoto;
                const isSaving = consultantSavingMap[consultant.name] || false;
                const syncStatus = consultantSyncStatusMap[consultant.name] || 'idle';
                const lastSynced = consultantLastSyncedMap[consultant.name] || null;

                return (
                  <div
                    key={consultant.name}
                    className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850/60 flex flex-col sm:flex-row items-center gap-5 space-y-3 sm:space-y-0"
                  >
                    {/* Photo & Actions */}
                    <div className="relative group/avatar w-24 h-24 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border-2 border-teal-500/30 shadow-md flex items-center justify-center shrink-0">
                      <ResponsiveImage
                        src={displayPhoto}
                        alt={consultant.name}
                        sizes="96px"
                        className="w-full h-full object-cover"
                        containerClassName="w-full h-full"
                        priority={true}
                        showSkeleton={true}
                      />
                    </div>

                    <div className="flex-1 min-w-0 text-center sm:text-right space-y-1.5 w-full">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-base font-black text-slate-900 dark:text-white truncate">
                          {consultant.name}
                        </h4>
                        <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-full">
                          {consultant.role}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        {consultant.specialty}
                      </p>

                      <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                        <SyncStatusBadge
                          status={syncStatus}
                          lastSyncedAt={lastSynced}
                          onRetry={async () => {
                            if (currentPhoto && isCustomImageDataUrlOrUrl(currentPhoto)) {
                              setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'syncing' }));
                              const ok = await saveConsultantPhotoToFirestore(consultant.name, currentPhoto);
                              if (ok) {
                                setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'synced' }));
                                setConsultantLastSyncedMap((prev) => ({ ...prev, [consultant.name]: new Date() }));
                                showToast(`عکس مشاور «${consultant.name}» در پایگاه ابری همگام‌سازی شد.`);
                              } else {
                                setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'error' }));
                                showToast('خطا در اتصال به پایگاه ابری', 'error');
                              }
                            }
                          }}
                        />
                      </div>

                      {cPreview ? (
                        <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={async () => {
                              const file = consultantSelectedFiles[consultant.name];
                              if (!file) return;
                              setConsultantSavingMap((prev) => ({ ...prev, [consultant.name]: true }));
                              setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'syncing' }));
                              
                              const previousPhoto = currentPhoto;
                              try {
                                showToast('در حال پردازش و بهینه‌سازی تصویر...', 'info');
                                
                                if (file.size > 5 * 1024 * 1024) {
                                  throw new Error('حجم تصویر بیش از ۵ مگابایت است. لطفاً فایل کم‌حجم‌تری انتخاب فرمایید.');
                                }

                                const finalPhoto = await uploadAndProcessImageFile(file, 400, 0.85);
                                
                                // Optimistic local save
                                saveConsultantPhoto(consultant.name, finalPhoto);
                                setConsultantPhotos(getConsultantPhotos());
                                setConsultantsList(getAllConsultants());

                                // Persist to Firestore with timeout & diagnostic logging
                                const ok = await saveConsultantPhotoToFirestore(consultant.name, finalPhoto);
                                if (ok) {
                                  setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'synced' }));
                                  setConsultantLastSyncedMap((prev) => ({ ...prev, [consultant.name]: new Date() }));
                                  showToast(`عکس مشاور «${consultant.name}» با موفقیت در دیتابیس ابری ذخیره و پایدار گردید.`);
                                } else {
                                  setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'synced' }));
                                  showToast(`عکس مشاور «${consultant.name}» در حافظه پایدار ثبت شد.`);
                                }

                                if (cPreview) URL.revokeObjectURL(cPreview);
                                setConsultantPreviews((prev) => {
                                  const copy = { ...prev };
                                  delete copy[consultant.name];
                                  return copy;
                                });
                                setConsultantSelectedFiles((prev) => {
                                  const copy = { ...prev };
                                  delete copy[consultant.name];
                                  return copy;
                                });
                              } catch (err: any) {
                                // Rollback to previous persistent photo on catastrophic failure
                                console.error('Error uploading consultant photo:', err);
                                saveConsultantPhoto(consultant.name, previousPhoto);
                                setConsultantPhotos(getConsultantPhotos());
                                setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'error' }));
                                showToast(err?.message || 'خطا در پردازش و ذخیره تصویر', 'error');
                              } finally {
                                setConsultantSavingMap((prev) => ({ ...prev, [consultant.name]: false }));
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isSaving ? 'در حال ذخیره...' : 'تأیید و ذخیره در پایگاه داده'}</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSaving}
                            onClick={() => {
                              if (cPreview) URL.revokeObjectURL(cPreview);
                              setConsultantPreviews((prev) => {
                                const copy = { ...prev };
                                delete copy[consultant.name];
                                return copy;
                              });
                              setConsultantSelectedFiles((prev) => {
                                const copy = { ...prev };
                                delete copy[consultant.name];
                                return copy;
                              });
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>لغو</span>
                          </button>
                        </div>
                      ) : (
                        <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                          <label className="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-2xs">
                            <Upload className="w-3.5 h-3.5" />
                            <span>تغییر / آپلود عکس</span>
                            <input
                              type="file"
                              accept="image/png, image/jpeg, image/jpg, image/webp"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  if (file.size > 5 * 1024 * 1024) {
                                    showToast('حجم تصویر بیش از ۵ مگابایت است.', 'error');
                                    return;
                                  }
                                  const preview = URL.createObjectURL(file);
                                  setConsultantPreviews((prev) => ({ ...prev, [consultant.name]: preview }));
                                  setConsultantSelectedFiles((prev) => ({ ...prev, [consultant.name]: file }));
                                }
                              }}
                            />
                          </label>

                          {isCustomPhoto && (
                            <button
                              type="button"
                              onClick={async () => {
                                resetConsultantPhoto(consultant.name);
                                setConsultantPhotos(getConsultantPhotos());
                                setConsultantsList(getAllConsultants());
                                await deleteConsultantPhotoFromFirestore(consultant.name).catch(() => {});
                                setConsultantSyncStatusMap((prev) => ({ ...prev, [consultant.name]: 'idle' }));
                                showToast(`عکس مشاور «${consultant.name}» به حالت پیش‌فرض بازنشانی شد.`);
                              }}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>بازنشانی</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Add New Consultant Collapsible/Form */}
            <div className="p-5 bg-teal-50/50 dark:bg-teal-950/20 rounded-2xl border border-teal-100 dark:border-teal-900/40 space-y-4">
              <h4 className="text-sm font-bold text-teal-900 dark:text-teal-200 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-teal-600" />
                <span>افزودن مشاور یا کارشناس جدید به سیستم</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام و نام خانوادگی
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً خانم دکتر سارا محمدی"
                    value={newConsultantName}
                    onChange={(e) => setNewConsultantName(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان و سمت
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً مشاور خانواده و مدرس زبان اشاره"
                    value={newConsultantRole}
                    onChange={(e) => setNewConsultantRole(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تخصص‌ها
                  </label>
                  <input
                    type="text"
                    placeholder="مثلاً مشاوره فردی، پذیرش کم‌شنوایی"
                    value={newConsultantSpecialty}
                    onChange={(e) => setNewConsultantSpecialty(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (!newConsultantName.trim()) {
                      showToast('لطفاً نام مشاور را وارد فرمایید.', 'error');
                      return;
                    }
                    addConsultant({
                      name: newConsultantName.trim(),
                      title: newConsultantRole.trim() || 'مشاور مؤسسه محاش',
                      role: newConsultantRole.trim() || 'مشاور مؤسسه محاش',
                      avatar: '👨‍⚕️',
                      image: '',
                      specialty: newConsultantSpecialty.trim() || 'مشاوره عمومی و روانشناسی',
                      bio: newConsultantBio.trim() || 'عضو هیئت مشاوران مؤسسه محاش',
                      availableDays: ['شنبه تا چهارشنبه']
                    });
                    setNewConsultantName('');
                    setNewConsultantRole('');
                    setNewConsultantSpecialty('');
                    setNewConsultantBio('');
                    setConsultantsList(getAllConsultants());
                    showToast(`مشاور «${newConsultantName}» با موفقیت اضافه شد.`);
                  }}
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d645e] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>ثبت و ذخیره مشاور جدید</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: WebP Media & MySQL Content Management */}
      {/* ==================================================== */}
      {activeTab === 'media' && (
        <MediaContentManager
          onRefreshAll={() => {
            setConsultantPhotos(getConsultantPhotos());
            setConsultantsList(getAllConsultants());
            setTeams(getAllTeams());
          }}
        />
      )}

      {/* ==================================================== */}
      {/* TAB: MySQL Video Content & Public/Private Visibility Manager */}
      {/* ==================================================== */}
      {activeTab === 'video_manager' && (
        <MySQLVideoManager
          onNavigateToReport={(repId) => {
            if (onNavigate) {
              onNavigate('team-detail');
            }
          }}
        />
      )}

      {/* ==================================================== */}
      {/* TAB: Real-time Video Error & Stalled Monitor */}
      {/* ==================================================== */}
      {activeTab === 'video_errors' && (
        <AdminVideoMonitorTab
          onNavigateToReport={(repId, teamSlug) => {
            if (teamSlug) {
              setSelectedTeamSlug(teamSlug);
            }
            setEditingReportId(repId);
            setActiveTab('create');
          }}
        />
      )}

      {/* ==================================================== */}
      {/* TAB 4: Media & Storage Cache Manager */}
      {/* ==================================================== */}
      {activeTab === 'storage' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-blue-600" />
                <span>مدیریت فایل‌های ذخیره شده در حافظه پایدار</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                فایل‌های ویدیویی آپلود شده در پایگاه داده محلی IndexedDB مرورگر به تفکیک گزارش
              </p>
            </div>

            <div className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl font-bold">
              مجموع: {(storageStats.totalSizeBytes / (1024 * 1024)).toFixed(1)} مگابایت ({storageStats.count} فایل)
            </div>
          </div>

          {cachedVideos.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 space-y-2">
              <HardDrive className="w-8 h-8 text-slate-400 mx-auto" />
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                در حال حاضر فایل ویدیویی محلی ذخیره نشده است یا از ویدیوهای ابری استفاده می‌شود.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cachedVideos.map((video) => (
                <div
                  key={video.reportId}
                  className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                      {video.name}
                    </span>
                    <span className="text-[11px] text-slate-500 font-mono">
                      {(video.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400">
                    شناسه گزارش: <span className="font-mono text-blue-600">{video.reportId}</span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">

                    <button
                      onClick={() => handleTransferToMySQL(video)}
                      disabled={uploadingVideoId === video.reportId}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      {uploadingVideoId === video.reportId ? (
                        <div className="w-3.5 h-3.5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CloudUpload className="w-3.5 h-3.5" />
                      )}
                      <span>انتقال به MySQL</span>
                    </button>
                    <button
                      onClick={async () => {
                        await deleteVideoFromCache(video.reportId);
                        const list = await getAllCachedVideos();
                        setCachedVideos(list);
                        const stats = await getStorageStats();
                        setStorageStats(stats);
                        showToast('فایل ویدیو از حافظه حذف شد.');
                      }}
                      className="px-3 py-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف فایل</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Scores Management */}
      {/* ==================================================== */}
      {activeTab === 'scores' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>مدیریت امتیازات و لوگوی نشان تیم‌های پنج‌گانه</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                تغییرات ثبت شده در این بخش فوراً در صفحه «جمع‌بندی امتیازات»، هدر تیم‌ها و داشبورد اصلی منعکس می‌شود.
              </p>
            </div>
            <span className="text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-bold px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
              ۵ تیم اصلی باشگاه جوانان
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {scoresList.map((item) => {
              const fullSlug = item.id.startsWith('team-') ? item.id : `team-${item.id}`;
              const shortId = item.id.replace(/^team-/, '');
              const teamData = teams[fullSlug] || teams[shortId] || teams[item.id];
              return (
                <div
                  key={item.id}
                  className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-4 hover:border-blue-300 dark:hover:border-blue-700 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 flex items-center justify-center text-base shadow-2xs">
                        {teamData?.icon || '🏆'}
                      </span>
                      <div>
                        <div className="font-bold text-sm text-slate-900 dark:text-white">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          مدیر: <span className="text-slate-600 dark:text-slate-300 font-bold">{teamData?.manager || 'نامشخص'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Score Input */}
                    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                      <input
                        type="number"
                        defaultValue={item.score}
                        onBlur={(e) => {
                          const val = Number(e.target.value);
                          if (!isNaN(val)) {
                            updateTeamScore(item.id, val);
                            showToast(`امتیاز ${item.name} به ${val} تغییر یافت.`);
                          }
                        }}
                        className="w-14 bg-transparent text-center font-black text-sm text-blue-600 dark:text-blue-400 focus:outline-none font-mono"
                      />
                      <span className="text-[11px] font-bold text-slate-400">امتیاز</span>
                    </div>
                  </div>

                  {/* Integrated ImageUploader for Team Logo */}
                  <div className="pt-2 border-t border-slate-200/80 dark:border-slate-700/80">
                    <ImageUploader
                      teamIdOrSlug={fullSlug}
                      teamName={item.name}
                      currentLogo={teamData?.logo}
                      onSaved={(newLogoUrl) => {
                        saveTeamLogo(fullSlug, newLogoUrl);
                        showToast(`لوگوی تیم «${item.name}» با موفقیت ذخیره شد.`);
                      }}
                      onReset={() => {
                        resetTeamLogo(fullSlug);
                        showToast(`لوگوی تیم «${item.name}» به حالت پیش‌فرض بازنشانی شد.`);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Events & Workshops Management */}
      {/* ==================================================== */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Create or Edit Event Form */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarPlus className="w-5 h-5 text-blue-600" />
                  <span>{editingEventId ? 'ویرایش رویداد جاری' : '➕ ثبت رویداد یا کارگاه جدید'}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  رویدادهای ثبت‌شده در تقویم رویدادها، همایش‌ها و بخش ثبت‌نام سراسری نمایش داده می‌شوند.
                </p>
              </div>

              {editingEventId && (
                <button
                  onClick={() => {
                    setEditingEventId(null);
                    setEventTitle('');
                    setEventDesc('');
                  }}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-xs font-bold"
                >
                  انصراف از ویرایش
                </button>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!eventTitle.trim()) {
                  showToast('لطفاً عنوان رویداد را وارد نمایید.', 'error');
                  return;
                }

                const evId = editingEventId || `ev-${Date.now()}`;
                
                // Parse date digits to extract year, month, day
                const engDate = (eventDateJalali || '۱۴۰۵/۰۶/۱۵').replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);
                const dateParts = engDate.split(/[\/\-\.]/).map((p) => parseInt(p, 10)).filter((n) => !isNaN(n));
                const evYear = dateParts[0] || 1405;
                const evMonth = dateParts[1] || 6;
                const evDay = dateParts[2] || 15;
                const computedDayOfWeek = getJalaliDayOfWeek(evYear, evMonth, evDay);

                const newEvent: EventItem = {
                  id: evId,
                  title: eventTitle.trim(),
                  category: eventCategory,
                  categoryLabel: eventCategoryLabel,
                  dateJalali: eventDateJalali || '۱۴۰۵/۰۶/۱۵',
                  jalaliYear: evYear,
                  jalaliMonth: evMonth,
                  jalaliDay: evDay,
                  dayOfWeek: computedDayOfWeek,
                  time: eventTime || '۱۶:۰۰ الی ۱۸:۳۰',
                  locationType: 'in-person',
                  location: eventLocation || 'سالن همایش‌های موسسه محاش',
                  organizer: eventOrganizer || 'باشگاه جوانان محاش',
                  instructor: eventInstructor.trim() || undefined,
                  description: eventDesc.trim() || 'رویداد و کارگاه تخصصی باشگاه جوانان محاش.',
                  agenda: ['سخنرانی و ارائه مطالب کلیدی', 'کارگاه عملی و پرسش و پاسخ', 'شبکه‌سازی و جمع‌بندی'],
                  registrationOpen: true,
                  accessibilityFeatures: [
                    'مترجم همزمان زبان اشاره فارسی',
                    'سیستم شنوایی القایی T-Coil',
                    'زیرنویس همزمان متنی'
                  ],
                  cost: eventCost || 'رایگان برای اعضای محاش'
                };

                saveEvent(newEvent);
                showToast(editingEventId ? 'رویداد با موفقیت بروزرسانی شد.' : 'رویداد جدید با موفقیت اضافه و در تقویم ثبت شد.');
                setEditingEventId(null);
                setEventTitle('');
                setEventDesc('');
                setEventInstructor('');
              }}
              className="space-y-4 text-xs"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    عنوان رویداد / همایش *
                  </label>
                  <input
                    type="text"
                    required
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="مثال: کارگاه آموزش مهارت‌های دیجیتال"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    دسته‌بندی رویداد
                  </label>
                  <select
                    value={eventCategory}
                    onChange={(e) => {
                      setEventCategory(e.target.value);
                      if (e.target.value === 'workshop') setEventCategoryLabel('کارگاه آموزشی');
                      else if (e.target.value === 'conference') setEventCategoryLabel('همایش سراسری');
                      else if (e.target.value === 'youth-club') setEventCategoryLabel('گردهمایی باشگاه');
                      else if (e.target.value === 'webinar') setEventCategoryLabel('وبینار آنلاین');
                      else setEventCategoryLabel('فرهنگی و ورزشی');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  >
                    <option value="workshop">کارگاه آموزشی</option>
                    <option value="conference">همایش سراسری</option>
                    <option value="youth-club">گردهمایی باشگاه</option>
                    <option value="webinar">وبینار آنلاین</option>
                    <option value="cultural-sports">فرهنگی و ورزشی</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تاریخ شمسی (مانند ۱۴۰۵/۰۶/۱۵)
                  </label>
                  <input
                    type="text"
                    value={eventDateJalali}
                    onChange={(e) => setEventDateJalali(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    زمان برگزاری (ساعت)
                  </label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="مثال: ۱۶:۰۰ الی ۱۸:۳۰"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    محل برگزاری
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="مثال: سالن شماره ۱ محاش"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    مدرس / ارائه‌دهنده
                  </label>
                  <input
                    type="text"
                    value={eventInstructor}
                    onChange={(e) => setEventInstructor(e.target.value)}
                    placeholder="نام مدرس یا سخنران"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  توضیحات و اهداف رویداد
                </label>
                <textarea
                  rows={3}
                  value={eventDesc}
                  onChange={(e) => setEventDesc(e.target.value)}
                  placeholder="توضیح مختصر درباره موضوع رویداد و دستاوردها..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#173b82] hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md transition"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingEventId ? 'ذخیره تغییرات رویداد' : 'انتشار رویداد جدید'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Events List Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>لیست رویدادها و کارگاه‌های فعال ({eventsList.length})</span>
            </h3>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {eventsList.map((ev) => (
                <div key={ev.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{ev.title}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300">
                        {ev.categoryLabel}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex flex-wrap gap-3">
                      <span>📅 {ev.dateJalali}</span>
                      <span>⏰ {ev.time}</span>
                      <span>📍 {ev.location}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => {
                        setEditingEventId(ev.id);
                        setEventTitle(ev.title);
                        setEventCategory(ev.category);
                        setEventCategoryLabel(ev.categoryLabel);
                        setEventDateJalali(ev.dateJalali);
                        setEventTime(ev.time);
                        setEventLocation(ev.location);
                        setEventOrganizer(ev.organizer);
                        setEventInstructor(ev.instructor || '');
                        setEventDesc(ev.description);
                        setEventCost(ev.cost || 'رایگان برای اعضای محاش');
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 text-blue-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>ویرایش</span>
                    </button>

                    <button
                      onClick={() => handleOpenDeleteEventModal(ev)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 text-rose-600 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB 5: Settings & Security */}
      {/* ==================================================== */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Change Username & Password Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
            {/* Username Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-blue-600" />
                  <h2 className="text-base font-black text-slate-900 dark:text-white">
                    نام کاربری مدیریت
                  </h2>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-mono text-xs font-bold rounded-lg flex items-center gap-1.5">
                    <span>فعلی: {showAdminUsername ? adminUsername : '••••••••'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAdminUsername(!showAdminUsername)}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition cursor-pointer"
                    title={showAdminUsername ? 'مخفی کردن نام کاربری' : 'نمایش نام کاربری'}
                  >
                    {showAdminUsername ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <form onSubmit={handleChangeUsername} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    نام کاربری جدید
                  </label>
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="نام کاربری جدید را وارد فرمایید..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                    required
                  />
                </div>

                {usernameChangeSuccess && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 p-2.5 rounded-xl font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>نام کاربری مدیر با موفقیت بروزرسانی شد.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  ثبت نام کاربری جدید
                </button>
              </form>
            </div>

            {/* Password Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 pb-2">
                <Key className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  تغییر کلمه عبور مدیر ارشد
                </h2>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    کلمه عبور جدید
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="حداقل ۳ کاراکتر..."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                      title={showNewPassword ? 'مخفی کردن کلمه عبور' : 'نمایش کلمه عبور'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    تکرار کلمه عبور جدید
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="تکرار رمز عبور..."
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-1"
                      title={showConfirmPassword ? 'مخفی کردن کلمه عبور' : 'نمایش کلمه عبور'}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {passwordChangeSuccess && (
                  <div className="bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 p-2.5 rounded-xl font-bold flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>رمز عبور با موفقیت بروزرسانی شد.</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer"
                >
                  ثبت رمز عبور جدید
                </button>
              </form>
            </div>
          </div>

          {/* Backup & Data Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <Database className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                پشتیبان‌گیری و بازیابی اطلاعات
              </h2>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              امکان دانلود فایل نسخه پشتیبان (JSON) از تمامی گزارش‌ها و تنظیمات و بازیابی آن در هر زمان
            </p>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                onClick={() => {
                  const data = exportBackupJSON();
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `mahash-backup-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                  showToast('فایل نسخه پشتیبان با موفقیت دانلود شد.');
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <FolderDown className="w-4 h-4 text-blue-600" />
                <span>دانلود نسخه پشتیبان کامل داده‌ها (JSON)</span>
              </button>

              <a
                href="/mahash-production-dist.zip"
                download="mahash-production-dist.zip"
                className="w-full py-2.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>دانلود پکیج خروجی کامل سایت برای Netlify (ZIP)</span>
              </a>

              <button
                onClick={handleForceRefresh}
                disabled={isForceRefreshing || isSyncingServer}
                className="w-full py-2.5 bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 relative"
              >
                <RefreshCw className={`w-4 h-4 text-sky-600 ${isForceRefreshing ? 'animate-spin' : ''}`} />
                <span>{isForceRefreshing ? 'در حال نوسازی اجباری از سرور...' : 'نوسازی اجباری اطلاعات از سرور مرکزی (Force Refresh)'}</span>
                {pendingSyncCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500 text-slate-950 font-black rounded-full text-[10px] shadow-sm">
                    {pendingSyncCount} ذخیره‌نشده
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowResetAllConfirmModal(true)}
                className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <RefreshCw className="w-4 h-4" />
                <span>بازنشانی به داده‌های اولیه سامانه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: WordPress & MySQL Database Manager */}
      {/* ==================================================== */}
      {activeTab === 'wordpress' && (
        <div className="space-y-6">
          <RecentSyncLogs
            logs={syncLogsList}
            lastSyncedTimestamp={lastSyncTime}
            onRefreshNow={handleForceRefresh}
            isRefreshing={isForceRefreshing}
          />
          <WordPressCMSPanel />
          <SyncLogger />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: MySQL Admin Dashboard & CRUD */}
      {/* ==================================================== */}
      {activeTab === 'mysql' && (
        <MySQLAdminDashboard />
      )}

      {/* ==================================================== */}
      {/* TAB: Real-Time MySQL Activity & Action Logs Monitor */}
      {/* ==================================================== */}
      {activeTab === 'mysql_logs' && (
        <div className="space-y-6">
          <RecentSyncLogs
            logs={syncLogsList}
            lastSyncedTimestamp={lastSyncTime}
            onRefreshNow={handleForceRefresh}
            isRefreshing={isForceRefreshing}
          />
          <MySQLLiveLogsMonitor />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Audit Logs & Deletion Tracking System */}
      {/* ==================================================== */}
      {activeTab === 'audit_logs' && (
        <div className="space-y-6">
          <AuditLogsTab
            showToast={showToast}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Database vs Client State Audit & Debug Tool */}
      {/* ==================================================== */}
      {activeTab === 'db_audit' && (
        <div className="space-y-6">
          <DatabaseStateAuditTool
            onRefreshParentState={(reports, teamsData) => {
              setAllReports(reports);
              setTeams(teamsData);
            }}
          />
        </div>
      )}

      {/* ==================================================== */}
      {/* TAB: Link & File Health Diagnostics Auditor */}
      {/* ==================================================== */}
      {activeTab === 'health' && (
        <IntegrityAuditorTab
          onNavigate={onNavigate}
          onEditReport={(rep, teamSlug) => {
            handleEditReport(rep, teamSlug);
            setActiveTab('create');
          }}
          showToast={showToast}
        />
      )}

      {/* ==================================================== */}
      {/* PROTECTIVE CONFIRMATION MODAL: Permanent Report Purge */}
      {/* ==================================================== */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-rose-200 dark:border-rose-900/60 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            {/* Header Alert */}
            <div className="flex items-center gap-3.5 pb-2 border-b border-rose-100 dark:border-rose-900/40">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-800 flex items-center justify-center shrink-0 text-rose-600">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  تأیید حفاظتی: حذف قطعی و پاکسازی کامل گزارش
                </h3>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1 mt-0.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  این عملیات غیرقابل بازگشت است و در سامانه نظارتی ثبت می‌شود
                </span>
              </div>
            </div>

            {/* Report Information Card */}
            <div className="bg-slate-50 dark:bg-slate-800/90 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="font-black text-slate-900 dark:text-white text-sm leading-snug">
                  «{reportToDelete.title}»
                </div>
                <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 rounded-md text-[10px] font-mono shrink-0 font-bold">
                  {reportToDelete.id}
                </span>
              </div>

              {reportToDelete.teamName && (
                <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5 font-medium">
                  <span>تیم منتسب:</span>
                  <span className="font-bold text-blue-600 dark:text-blue-400">{reportToDelete.teamName}</span>
                  {reportToDelete.teamSlug && (
                    <span className="text-slate-400 text-[10px]">({reportToDelete.teamSlug})</span>
                  )}
                </div>
              )}

              <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="font-bold text-slate-700 dark:text-slate-300">مؤلفه‌های تحت تأثیر این پاکسازی:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 dark:text-slate-400">
                  <li>حذف کامل رکورد از پایگاه داده اصلی و MySQL</li>
                  <li>پاکسازی فایل‌های ویدیویی و پیوست‌ها از حافظه مرورگر و کش</li>
                  <li>حذف نسخه‌های پیشین و جلوگیری از بارگذاری مجدد فایل‌های پیش‌فرض</li>
                </ul>
              </div>
            </div>

            {/* Operator and Reason Inputs for Audit Logging */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  نام شخص/مدیر اقدام‌کننده (ثبت در لاگ نظارتی):
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={deleteOperatorName}
                    onChange={(e) => setDeleteOperatorName(e.target.value)}
                    placeholder="نام مدیر یا اپراتور..."
                    className="w-full pr-9 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  علت حذف گزارش:
                </label>
                <select
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden dark:text-white cursor-pointer"
                >
                  <option value="درخواست حذف نهایی توسط مدیر">درخواست حذف نهایی توسط مدیر</option>
                  <option value="گزارش تکراری یا آزمایشی">گزارش تکراری یا آزمایشی</option>
                  <option value="منسوخ شدن محتوا">منسوخ شدن محتوا</option>
                  <option value="اصلاحیه و بارگذاری مجدد گزارش">اصلاحیه و بارگذاری مجدد گزارش</option>
                  <option value="other">سایر دلایل (توضیح دستی)...</option>
                </select>
              </div>

              {deleteReason === 'other' && (
                <div>
                  <input
                    type="text"
                    value={deleteReasonCustom}
                    onChange={(e) => setDeleteReasonCustom(e.target.value)}
                    placeholder="توضیح دلیل حذف را وارد فرمایید..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                انصراف و بازگشت
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteReport}
                disabled={isDeleting || !deleteOperatorName.trim()}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md cursor-pointer ${
                  !deleteOperatorName.trim()
                    ? 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                    : 'bg-rose-600 hover:bg-rose-700 text-white active:scale-95'
                }`}
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال پاکسازی امن و ثبت در لاگ نظارتی...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>تأیید نهایی و پاکسازی پایگاه داده</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CONFIRMATION MODAL: Delete Event */}
      {/* ==================================================== */}
      {eventToDelete && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف رویداد یا کارگاه
                </h3>
                <span className="text-xs text-rose-500 font-bold">
                  حذف رویداد از تقویم سراسری
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">
                «{eventToDelete.title}»
              </div>
              <div className="text-slate-500 flex items-center gap-2">
                <span>دسته‌بندی: {eventToDelete.categoryLabel}</span>
                <span>•</span>
                <span>تاریخ: {eventToDelete.dateJalali}</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setEventToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteEvent}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>تأیید و حذف رویداد</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CONFIRMATION MODAL: Reset All Data to Defaults */}
      {/* ==================================================== */}
      {showResetAllConfirmModal && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  بازنشانی کل پایگاه داده
                </h3>
                <span className="text-xs text-rose-500 font-bold">
                  تمام تغییرات سفارشی به حالت پیش‌فرض برمی‌گردد
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              آیا اطمینان دارید که می‌خواهید تمام داده‌های گزارش‌ها، تیم‌ها، نشان‌ها و رویدادها را به داده‌های اولیه بازنشانی کنید؟
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowResetAllConfirmModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleConfirmResetAllData}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>بله، بازنشانی داده‌ها</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CONFIRMATION MODAL: MySQL Archive & Clear Logs (Task 3) */}
      {/* ==================================================== */}
      {isArchiveModalOpen && (
        <div className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-teal-600 dark:text-teal-400">
              <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/80 flex items-center justify-center shrink-0 border border-teal-500/20">
                <Archive className="w-6 h-6 text-teal-600 dark:text-teal-400" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  بایگانی ایمن و پاک‌سازی لاگ‌های MySQL
                </h3>
                <span className="text-xs text-teal-600 dark:text-teal-400 font-bold">
                  تخلیه حجم پایگاه داده همراه با دانلود خودکار فایل پشتیبان JSON
                </span>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>حفاظت از داده‌ها در برابر حذف ناخواسته</span>
              </div>
              <p className="leading-relaxed">
                قبل از حذف لاگ‌ها از دیتابیس فعال، تمامی سوابق انتخاب‌شده در یک فایل استاندارد JSON گردآوری شده و بلافاصله بر روی سیستم شما دانلود خواهد شد.
              </p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  بازه زمانی لاگ‌ها جهت بایگانی:
                </label>
                <select
                  value={archiveOlderThanDays}
                  onChange={(e) => setArchiveOlderThanDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none dark:text-white"
                >
                  <option value={0}>تمام لاگ‌ها و سوابق موجود در سامانه (تخلیه کامل)</option>
                  <option value={7}>لاگ‌های قدیمی‌تر از ۷ روز</option>
                  <option value={14}>لاگ‌های قدیمی‌تر از ۱۴ روز</option>
                  <option value={30}>لاگ‌های قدیمی‌تر از ۳۰ روز (یک ماه)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  جهت تأیید، عبارت <span className="text-rose-600 font-black font-mono">بایگانی</span> را در کادر زیر تایپ کنید:
                </label>
                <input
                  type="text"
                  value={archiveConfirmInput}
                  onChange={(e) => setArchiveConfirmInput(e.target.value)}
                  placeholder="بایگانی"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-teal-500 focus:outline-none dark:text-white text-center font-mono font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsArchiveModalOpen(false);
                  setArchiveConfirmInput('');
                }}
                disabled={isArchivingLogs}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleArchiveAndClearLogs}
                disabled={
                  isArchivingLogs ||
                  (archiveConfirmInput.trim() !== 'بایگانی' && archiveConfirmInput.trim().toUpperCase() !== 'ARCHIVE')
                }
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isArchivingLogs ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>در حال بایگانی و دانلود...</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5" />
                    <span>تأیید بایگانی و پاک‌سازی لاگ‌ها</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* GLOBAL LOADING / SYNC OVERLAY: Prevents Concurrent Writes */}
      {/* ==================================================== */}
      {(isSyncingServer || Object.values(consultantSavingMap).some(Boolean)) && (
        <div className="fixed inset-0 z-[99998] bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center gap-4 max-w-xs text-center">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isSyncingServer ? 'در حال انتشار سراسری در سرور...' : 'در حال ذخیره‌سازی و همگام‌سازی ابری...'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                لطفاً شکیبا باشید؛ اطلاعات در حال پردازش و ثبت پایدار است.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CONFIRMATION MODAL: Force Refresh Overwrite Warning */}
      {/* ==================================================== */}
      {showForceRefreshConfirmModal && (
        <div 
          className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby="force-refresh-modal-title"
          aria-describedby="force-refresh-modal-desc"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full space-y-5">
            <div className="flex items-start gap-3.5">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900/60 rounded-2xl text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6" aria-hidden="true" />
              </div>
              <div className="space-y-1 min-w-0">
                <h3 id="force-refresh-modal-title" className="text-base font-black text-slate-900 dark:text-white">
                  هشدار: تغییرات ذخیره‌نشده روی سرور
                </h3>
                <p id="force-refresh-modal-desc" className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  تعداد <span className="font-bold text-amber-600 dark:text-amber-400">{toPersianDigits(pendingSyncCount)} مورد</span> تغییر محلی (گزارش جدید، لوگو یا تصویر) در مرورگر شما وجود دارد که هنوز با دکمه سبز «انتشار سراسری» در پایگاه داده سرور ذخیره نشده است.
                </p>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 text-xs text-amber-800 dark:text-amber-300 space-y-2">
              <p className="font-bold">آیا مایلید نوسازی اجباری انجام شود؟</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                انجام نوسازی اجباری (Force Refresh) آخرین اطلاعات سرور را فراخوانی کرده و ممکن است تغییرات ارسال‌نشده محلی شما بازنویسی شوند.
              </p>
            </div>

            <div className="flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowForceRefreshConfirmModal(false)}
                aria-label="انصراف و حفظ تغییرات محلی"
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                انصراف (حفظ تغییرات محلی)
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowForceRefreshConfirmModal(false);
                  handleSyncToServer();
                }}
                aria-label="ذخیره تغییرات در سرور و سپس نوسازی اطلاعات"
                className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>🚀 اول ذخیره در سرور (پیشنهادی)</span>
              </button>

              <button
                type="button"
                onClick={executeForceRefresh}
                aria-label="نوسازی اجباری بدون ذخیره تغییرات محلی"
                className="w-full sm:w-auto px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <span>نوسازی بدون ذخیره</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* CONFIRMATION MODAL: Video Removal from Report */}
      {/* ==================================================== */}
      <VideoRemovalConfirmModal
        isOpen={videoRemovalModal.isOpen}
        reportTitle={videoRemovalModal.reportTitle}
        videoFileName={videoRemovalModal.fileName}
        fileName={videoRemovalModal.fileName}
        onCancel={() => setVideoRemovalModal({ isOpen: false, reportTitle: '' })}
        onClose={() => setVideoRemovalModal({ isOpen: false, reportTitle: '' })}
        onConfirm={() => performConfirmedVideoRemoval({ keepInStorage: false })}
        onConfirmRemove={(options) => performConfirmedVideoRemoval(options)}
      />
    </div>
  );
};

export default AdminPage;
