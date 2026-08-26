import React, { useState, useEffect, useRef } from 'react';
import { PageId, ActivityReport, TeamData, ScoreItem, EventItem, ReportAttachment } from '../types';
import {
  getAllTeams,
  getAllReports,
  saveReport,
  deleteReport,
  getNextReportNumberForTeam,
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
  fetchAndMergeServerStore
} from '../utils/reportsStore';
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
import { getSmartCurrentDate, toPersianDigits, formatReportNumberDisplay } from '../utils/persianDate';
import {
  getTeamLogoPlaceholder,
  CIRCULAR_BADGE_PRESETS,
  CircularBadgePreset,
  MAHESH_LOGO_SVG,
  MAHESH_CLUB_EMBLEM_SVG
} from '../utils/assets';
import { IntegrityAuditorTab } from '../components/admin/IntegrityAuditorTab';
import { ImageUploader } from '../components/ImageUploader';
import { RichTextEditor } from '../components/admin/RichTextEditor';
import { PrintReportButton } from '../components/PrintReportButton';
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
  Upload,
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
  AlertCircle,
  Radio,
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
  Wrench
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: (page: PageId) => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
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
  const [activeTab, setActiveTab] = useState<'create' | 'reports' | 'teams' | 'scores' | 'events' | 'analytics' | 'logos' | 'health' | 'storage' | 'settings'>('create');

  // Store data
  const [teams, setTeams] = useState<Record<string, TeamData>>(getAllTeams());
  const [allReports, setAllReports] = useState(getAllReports());
  const [scoresList, setScoresList] = useState<ScoreItem[]>(getAllScores());
  const [eventsList, setEventsList] = useState<EventItem[]>(getAllEvents());
  const [reportViews, setReportViewsState] = useState<Record<string, number>>(() => getAllReportViews());
  const [storageStats, setStorageStats] = useState<{ count: number; totalSizeBytes: number }>({ count: 0, totalSizeBytes: 0 });
  const [cachedVideos, setCachedVideos] = useState<any[]>([]);

  // Logos and Circular Badges Management State
  const [mahashLogoSrc, setMahashLogoSrc] = useState<string>(() => getMahashLogo());
  const [youthClubBadgeSrc, setYouthClubBadgeSrc] = useState<string>(() => getYouthClubBadge());
  const [activeBadgeCategoryFilter, setActiveBadgeCategoryFilter] = useState<'all' | 'mahash' | 'teams' | 'specialty' | 'custom'>('all');
  const [selectedTargetTeamForBadge, setSelectedTargetTeamForBadge] = useState<string>('team-thinker');
  const [newBadgeTitle, setNewBadgeTitle] = useState<string>('');
  const [newBadgeDescription, setNewBadgeDescription] = useState<string>('');
  const [newBadgeFileBase64, setNewBadgeFileBase64] = useState<string | null>(null);
  const [customBadgesList, setCustomBadgesList] = useState<CircularBadgePreset[]>(() => {
    try {
      const saved = localStorage.getItem('mahash_custom_badges_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Search & Filters in Reports table
  const [filterTeam, setFilterTeam] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterDatePeriod, setFilterDatePeriod] = useState<'all' | '1405' | '1404' | 'custom'>('all');
  const [customDateQuery, setCustomDateQuery] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [reportsSortBy, setReportsSortBy] = useState<'date-desc' | 'views-desc' | 'views-asc' | 'title'>('views-desc');

  // Quick edit views modal / state
  const [editingViewsReport, setEditingViewsReport] = useState<{ id: string; title: string; currentViews: number } | null>(null);
  const [customViewsInput, setCustomViewsInput] = useState<number>(0);

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
  const [reportNum, setReportNum] = useState<string>(() => getNextReportNumberForTeam('team-angels'));
  const [reportTitle, setReportTitle] = useState<string>('');
  const [reportDate, setReportDate] = useState<string>(getSmartCurrentDate());
  const [reportSummary, setReportSummary] = useState<string>('');
  const [reportStatus, setReportStatus] = useState<'published' | 'draft'>('published');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [keyPointsText, setKeyPointsText] = useState<string>('');
  
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
      const savedDraft = localStorage.getItem(DRAFT_KEY);
      if (savedDraft && !editingReportId) {
        const draft = JSON.parse(savedDraft);
        if (draft.reportTitle || draft.reportSummary || draft.keyPointsText) {
          if (draft.selectedTeamSlug) setSelectedTeamSlug(draft.selectedTeamSlug);
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

  // Auto-save draft changes to localStorage when creating a new report
  useEffect(() => {
    if (editingReportId) return; // do not overwrite draft when editing existing report
    const hasData = reportTitle.trim() || reportSummary.trim() || keyPointsText.trim();
    if (hasData) {
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({
            selectedTeamSlug,
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
    }
  }, [selectedTeamSlug, reportNum, reportTitle, reportDate, reportSummary, reportStatus, keyPointsText, editingReportId]);

  const clearFormDraft = () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
      setHasRestoredDraft(false);
    } catch {}
  };

  // Run script to clean corrupt/unknown video entries
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

  // Operations feedback
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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
  const handleRequestAdminGemini = async (mode: 'polish' | 'bullets' | 'summary' | 'custom' = 'polish') => {
    const textToAnalyze = reportSummary.trim() || reportTitle.trim();
    if (!textToAnalyze) {
      showToast('لطفاً ابتدا بخشی از متن گزارش یا عنوان را وارد نمایید تا هوش مصنوعی آن را تحلیل کند.', 'error');
      return;
    }

    setIsAdminGeminiLoading(true);
    setAdminGeminiSuggestion(null);

    const targetTeam = teams[selectedTeamSlug] || getAllTeams()[selectedTeamSlug];
    const teamName = targetTeam?.name || 'باشگاه جوانان محاش';

    try {
      const res = await fetch('/api/gemini/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText: textToAnalyze,
          teamName: teamName,
          tone: adminGeminiTone,
          customPrompt: adminGeminiCustomPrompt || (mode === 'bullets' ? 'استخراج نکات کلیدی و محورهای اصلی' : mode === 'summary' ? 'تهیه خلاصه کوتاه و شفاف' : undefined),
          mode: mode
        })
      });

      if (!res.ok) throw new Error('Gemini API error');
      const data = await res.json();
      setAdminGeminiSuggestion(data.suggestion || 'پاسخی دریافت نشد.');
      showToast('پیشنهاد هوش مصنوعی Gemini با موفقیت آماده شد.');
    } catch (err) {
      console.warn('Gemini request failed:', err);
      // Fallback structured generation
      let fallbackText = '';
      if (mode === 'bullets') {
        fallbackText = `🎯 **محورهای کلیدی گزارش ${teamName}:**\n• ${reportTitle || 'گزارش فعالیت'}\n• اجرای برنامه‌های توانمندسازی و کارگاهی\n• استمرار مستندسازی و اشتراک تجارب اعضا`;
      } else {
        fallbackText = `📝 **متن بازنویسی‌شده و ویراستاری رسمی:**\n\n«${reportTitle || 'گزارش فعالیت کارگروه'}»\n\nدر راستای اهداف و مأموریت‌های تعالی ${teamName}، این گزارش فعالیت به شرح زیر تدوین گردیده است:\n\n${reportSummary || 'فعالیت‌های تیم با موفقیت اجرا شد.'}\n\nاین برنامه گامی مؤثر در مسیر توانمندسازی، خودباوری و رشد مهارتی اعضا به شمار می‌رود.`;
      }
      setAdminGeminiSuggestion(fallbackText);
      showToast('متن هوشمند با الگوی استاندارد آماده گردید.');
    } finally {
      setIsAdminGeminiLoading(false);
    }
  };

  const handleApplyGeminiToSummary = () => {
    if (!adminGeminiSuggestion) return;
    setReportSummary(adminGeminiSuggestion);
    showToast('متن پیشنهادی Gemini با موفقیت در فیلد توضیحات گزارش درج گردید.');
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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
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
  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Advanced Validation (MIME type, extension, size limit)
    const validation = validateVideoFile(file);
    if (!validation.isValid) {
      showToast(validation.errorMessage || 'فایل ویدیویی انتخاب شده نامعتبر است.', 'error');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setVideoFile(file);
    const url = URL.createObjectURL(file);
    setVideoPreviewUrl(url);
    showToast(`فایل ویدیو «${file.name}» تأیید شد (${(file.size / (1024 * 1024)).toFixed(1)} مگابایت)`);
  };

  // Handle Video Removal
  const handleRemoveVideo = async () => {
    setVideoFile(null);
    setVideoPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (editingReportId) {
      try {
        await deleteVideoFromCache(editingReportId);
      } catch (err) {
        console.warn('Could not delete video cache:', err);
      }
    }
    showToast('ویدیو با موفقیت از این گزارش حذف گردید.');
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

        const dataUrl = await readFileAsDataURL(file);
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
    const currentTeam = teams[teamSlug] || getAllTeams()[teamSlug];
    const teamReports = currentTeam?.reports || [];
    const nextNum = teamReports.length + 1;
    return `گزارش ${toPersianDigits(nextNum)}`;
  };

  const handleTeamChange = (newSlug: string) => {
    setSelectedTeamSlug(newSlug);
    if (!editingReportId) {
      setReportNum(getNextReportNumForTeam(newSlug));
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
    setReportNum(getNextReportNumForTeam('team-angels'));
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
    setReportNum(formatReportNumberDisplay(report.reportNum));
    setReportTitle(report.title);
    setReportDate(report.date);
    setReportSummary(report.summary);
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

    const cached = await getVideoFromCache(report.id);
    if (cached && cached.blob) {
      const url = URL.createObjectURL(cached.blob);
      setVideoPreviewUrl(url);
    } else if (report.videoSrc && !report.videoSrc.startsWith('indexeddb:') && !report.videoSrc.startsWith('blob:') && report.videoSrc !== '#') {
      setVideoPreviewUrl(report.videoSrc);
    } else {
      setVideoPreviewUrl(null);
    }

    setActiveTab('create');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`در حال ویرایش گزارش «${report.title}»`);
  };

  // Submit Form (Save or Update Report)
  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Advanced Full Report Submission Validation
    const validation = validateFullReportSubmission(reportTitle, videoFile, attachments);
    if (!validation.isValid) {
      showToast(validation.errorMessage || 'لطفاً خطاهای فرم را برطرف نمایید.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const reportId = editingReportId || `report-${Date.now()}`;
      const targetTeam = teams[selectedTeamSlug] || getAllTeams()[selectedTeamSlug];

      // 1. Save video file to cache if uploaded, or remove if cleared
      let videoSrc: string | undefined = undefined;
      if (videoFile) {
        try {
          await saveVideoToCache(reportId, videoFile, videoFile.name);
          videoSrc = `indexeddb:${reportId}`;
        } catch (vErr) {
          console.warn('Video cache warning:', vErr);
          videoSrc = `indexeddb:${reportId}`;
        }
      } else if (videoPreviewUrl) {
        if (videoPreviewUrl.startsWith('http://') || videoPreviewUrl.startsWith('https://')) {
          videoSrc = videoPreviewUrl;
        } else {
          // Cached video in IndexedDB
          videoSrc = `indexeddb:${reportId}`;
        }
      } else {
        videoSrc = undefined;
        try {
          await deleteVideoFromCache(reportId);
        } catch (vErr) {
          console.warn('Delete video cache warning:', vErr);
        }
      }

      // 2. Save attachments to IndexedDB
      if (attachments && attachments.length > 0) {
        for (const att of attachments) {
          try {
            await saveAttachmentRecord(reportId, att);
          } catch (attErr) {
            console.warn('Attachment cache warning:', attErr);
          }
        }
      } else {
        try {
          await deleteAllAttachmentsForReport(reportId);
        } catch (attErr) {
          console.warn('Attachment delete warning:', attErr);
        }
      }

      // 3. Parse key points from textarea
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
      const finalReportNum = formatReportNumberDisplay(reportNum) || getNextReportNumForTeam(selectedTeamSlug);

      const reportObject: ActivityReport = {
        id: reportId,
        reportNum: finalReportNum,
        title: reportTitle.trim(),
        date: reportDate.trim() || getSmartCurrentDate(),
        datetimeIso: new Date().toISOString(),
        summary: reportSummary.trim() || 'گزارش رسمی فعالیت تیم در باشگاه جوانان محاش.',
        status: reportStatus,
        videoSrc: videoSrc || undefined,
        posterSrc: targetTeam?.logo || undefined,
        keyPoints: parsedKeyPoints.length > 0 ? parsedKeyPoints : undefined,
        transcript: validTranscript,
        attachments: attachments.length > 0 ? attachments : undefined
      };

      // 5. Save to store
      saveReport(reportObject, selectedTeamSlug);

      // Clear local draft upon successful submission
      clearFormDraft();
      triggerGlobalCacheBust();

      // Immediate cache sync for UI
      setAllReports(getAllReports());
      setTeams(getAllTeams());

      showToast(
        editingReportId
          ? 'گزارش با موفقیت بروزرسانی و منتشر گردید.'
          : 'گزارش و محتوای ویدیو با موفقیت ذخیره و در سایت منتشر شد.'
      );

      resetForm();
      setActiveTab('reports');
    } catch (err: any) {
      console.error('Error saving report:', err);
      showToast(`خطا در ذخیره‌سازی اطلاعات گزارش: ${err?.message || 'لطفاً مجدداً بررسی فرمایید.'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Report Handlers
  const handleOpenDeleteReportModal = (reportId: string, teamSlug: string, title: string, teamName?: string) => {
    setReportToDelete({ id: reportId, teamSlug, title, teamName });
  };

  const handleConfirmDeleteReport = async () => {
    if (!reportToDelete) return;
    setIsDeleting(true);
    try {
      const targetId = reportToDelete.id;
      const targetSlug = reportToDelete.teamSlug;

      // 1. Delete from store
      deleteReport(targetId, targetSlug);

      // 2. Clean binary caches from IndexedDB
      await Promise.allSettled([
        deleteVideoFromCache(targetId),
        deleteAllAttachmentsForReport(targetId)
      ]);

      triggerGlobalCacheBust();

      // 3. Immediately refresh state & cache
      setAllReports(getAllReports());
      setTeams(getAllTeams());
      setReportViewsState(getAllReportViews());

      // 4. Dispatch global update
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('mahash_store_updated', { detail: { deletedId: targetId } }));
      }

      showToast(`گزارش «${reportToDelete.title}» با موفقیت حذف و حافظه کش بازنشانی گردید.`);
      setReportToDelete(null);
    } catch (err) {
      console.error('Error deleting report:', err);
      showToast('خطا در حذف گزارش.', 'error');
    } finally {
      setIsDeleting(false);
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

  const allAvailableBadges: CircularBadgePreset[] = [
    ...CIRCULAR_BADGE_PRESETS,
    ...customBadgesList
  ];

  const filteredBadges = allAvailableBadges.filter((b) => {
    if (activeBadgeCategoryFilter === 'all') return true;
    return b.category === activeBadgeCategoryFilter;
  });

  const handleApplyLogoToMahash = (logoData: string, title?: string) => {
    setMahashLogo(logoData);
    setMahashLogoSrc(logoData);
    showToast(`لوگوی اصلی مؤسسه محاش به «${title || 'طرح انتخابی'}» تغییر یافت.`);
  };

  const handleResetMahashLogoAction = () => {
    resetMahashLogo();
    setMahashLogoSrc(MAHESH_LOGO_SVG);
    showToast('لوگوی مؤسسه محاش به نشان وکتور استاندارد بازنشانی شد.');
  };

  const handleApplyBadgeToYouthClub = (badgeData: string, title?: string) => {
    setYouthClubBadge(badgeData);
    setYouthClubBadgeSrc(badgeData);
    showToast(`نشان اختصاصی باشگاه جوانان به «${title || 'طرح انتخابی'}» تغییر یافت.`);
  };

  const handleResetYouthClubBadgeAction = () => {
    resetYouthClubBadge();
    setYouthClubBadgeSrc(MAHESH_CLUB_EMBLEM_SVG);
    showToast('نشان باشگاه جوانان به طرح اصلی بازنشانی گردید.');
  };

  const [isSyncingServer, setIsSyncingServer] = useState(false);

  const handleSyncToServer = async () => {
    setIsSyncingServer(true);
    try {
      const ok = await syncLocalDataToServer();
      if (ok) {
        showToast('تمامی لوگوها، گزارش‌ها، امتیازات و تنظیمات با موفقیت روی سرور مرکزی منتشر و ذخیره شد.');
      } else {
        showToast('خطا در انتشار روی سرور مرکزی. لطفاً اتصال اینترنت را بررسی کنید.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setIsSyncingServer(false);
    }
  };

  const handlePullFromServer = async () => {
    setIsSyncingServer(true);
    try {
      const ok = await fetchAndMergeServerStore();
      if (ok) {
        showToast('اطلاعات و لوگوها با موفقیت از سرور مرکزی دریافت و اعمال گردید.');
      } else {
        showToast('دریافت اطلاعات از سرور انجام نشد.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setIsSyncingServer(false);
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
    localStorage.setItem('mahash_custom_badges_v1', JSON.stringify(updated));

    setNewBadgeTitle('');
    setNewBadgeDescription('');
    setNewBadgeFileBase64(null);
    showToast(`نشان جدید «${newBadgeItem.name}» با موفقیت به کتابخانه افزوده شد.`);
  };

  const handleDeleteCustomBadge = (badgeId: string, badgeTitle: string) => {
    const updated = customBadgesList.filter((b) => b.id !== badgeId);
    setCustomBadgesList(updated);
    localStorage.setItem('mahash_custom_badges_v1', JSON.stringify(updated));
    showToast(`نشان «${badgeTitle}» با موفقیت از کتابخانه حذف شد.`);
  };

  // Filtered & Sorted reports list for table
  const filteredReports = allReports
    .filter((r) => {
      // 1. Team filter
      const matchesTeam = filterTeam === 'all' || r.teamSlug === filterTeam;

      // 2. Status filter
      const rStatus = r.status || 'published';
      const matchesStatus =
        filterStatus === 'all' ||
        (filterStatus === 'published' && rStatus === 'published') ||
        (filterStatus === 'draft' && rStatus === 'draft');

      // 3. Date period filter
      let matchesDate = true;
      if (filterDatePeriod === '1405') {
        matchesDate = r.date.includes('۱۴۰۵') || r.date.includes('1405');
      } else if (filterDatePeriod === '1404') {
        matchesDate = r.date.includes('۱۴۰۴') || r.date.includes('1404');
      } else if (filterDatePeriod === 'custom' && customDateQuery.trim() !== '') {
        const q = customDateQuery.trim();
        matchesDate = r.date.includes(q) || (r.datetimeIso && r.datetimeIso.includes(q));
      }

      // 4. Search query
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.reportNum.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.teamName && r.teamName.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesTeam && matchesStatus && matchesDate && matchesSearch;
    })
    .sort((a, b) => {
      const viewsA = reportViews[a.id] ?? 0;
      const viewsB = reportViews[b.id] ?? 0;
      if (reportsSortBy === 'views-desc') return viewsB - viewsA;
      if (reportsSortBy === 'views-asc') return viewsA - viewsB;
      if (reportsSortBy === 'title') return a.title.localeCompare(b.title, 'fa');
      return b.date.localeCompare(a.date);
    });

  // Calculate high-level video popularity metrics
  const totalViewsCount: number = (Object.values(reportViews) as number[]).reduce((acc: number, v: number) => acc + (Number(v) || 0), 0);
  const reportsWithViews = allReports.map((r) => ({
    ...r,
    views: Number(reportViews[r.id]) || 0
  }));
  const rankedReports = [...reportsWithViews].sort((a, b) => b.views - a.views);
  const topReport = rankedReports.length > 0 ? rankedReports[0] : null;
  const maxViews = rankedReports.length > 0 ? Math.max(...rankedReports.map((r) => r.views), 1) : 1;
  const avgViewsPerReport: number = allReports.length > 0 ? Math.round(totalViewsCount / allReports.length) : 0;

  // Team views statistics
  const teamViewsStats = (Object.entries(teams) as [string, TeamData][])
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
              : 'bg-rose-600 text-white border-rose-500'
          }`}
        >
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
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
            <button
              type="button"
              onClick={handleSyncToServer}
              disabled={isSyncingServer}
              title="ارسال و ذخیره‌سازی دائمی تمامی لوگوها و گزارش‌ها در سرور مرکزی تا در تمام سیستم‌ها و دامنه عمومی دقیقاً یکسان نمایش داده شود"
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingServer ? 'animate-spin' : ''}`} />
              <span>{isSyncingServer ? 'در حال انتشار...' : '🚀 انتشار سراسری تغییرات و لوگوها در سرور'}</span>
            </button>

            <button
              type="button"
              onClick={handlePullFromServer}
              disabled={isSyncingServer}
              title="دریافت آخرین لوگوها و اطلاعات از سرور"
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className="w-3 h-3" />
              <span>بروزرسانی از سرور</span>
            </button>

            <button
              type="button"
              onClick={handleRunVideoCleanup}
              title="بررسی و حذف خودکار ویدیوهای معیوب یا پیوندهای ناشناخته برای تمیزسازی پنل تیم‌ها"
              className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-amber-400/30 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>🧹 پاکسازی ویدیوهای معیوب</span>
            </button>

            <button
              onClick={() => onNavigate('home')}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/10 cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>مشاهده سایت اصلی</span>
            </button>

            <button
              onClick={handleLogout}
              className="px-3.5 py-2 bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-400/30 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج از مدیریت</span>
            </button>
          </div>
        </div>

        {/* Stats KPIs row */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t border-white/10 text-xs">
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
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-1.5 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('create')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'create'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>{editingReportId ? 'ویرایش گزارش جاری' : '➕ ثبت گزارش و ویدیوی جدید'}</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'reports'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Film className="w-4 h-4" />
          <span>لیست گزارش‌های منتشرشده ({allReports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-sky-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span>آمار و تحلیل بازدید ویدیوها ({toPersianDigits(totalViewsCount)})</span>
        </button>

        <button
          onClick={() => setActiveTab('teams')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'teams'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>مدیریت تیم‌ها و اعضا</span>
        </button>

        <button
          onClick={() => setActiveTab('logos')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'logos'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-amber-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>🎨 مدیریت نشان‌ها و لوگوهای محاش و حلقوی</span>
        </button>

        <button
          onClick={() => setActiveTab('scores')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'scores'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>ویرایش امتیازات ({scoresList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'events'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>رویدادها و کارگاه‌ها ({eventsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'health'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-emerald-400/40'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4 text-emerald-400" />
          <span>🔍 تست سلامت لینک‌ها و فایل‌ها</span>
        </button>

        <button
          onClick={() => setActiveTab('storage')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'storage'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>حافظه ویدیوها ({storageStats.count})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#173b82] text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>تنظیمات و امنیت</span>
        </button>
      </div>

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
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  شماره یا نوع گزارش
                </label>
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
                <input
                  type="text"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  placeholder="مثال: ۱۴۰۵/۰۵/۲۶ یا ۲۶ مرداد ۱۴۰۵"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white"
                  required
                />
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  value={adminGeminiCustomPrompt}
                  onChange={(e) => setAdminGeminiCustomPrompt(e.target.value)}
                  placeholder="دستور ویژه اختیاری (مثلاً: تأکید روی نقش اعضا، کارگاه یا نتایج آزمون)..."
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                />

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRequestAdminGemini('polish')}
                    disabled={isAdminGeminiLoading || (!reportSummary.trim() && !reportTitle.trim())}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    {isAdminGeminiLoading ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>ویراستاری متن با Gemini</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRequestAdminGemini('bullets')}
                    disabled={isAdminGeminiLoading || (!reportSummary.trim() && !reportTitle.trim())}
                    className="px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>استخراج محورها</span>
                  </button>
                </div>
              </div>

              {/* Suggestion Output */}
              {adminGeminiSuggestion && (
                <div className="p-3.5 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>متن پیشنهادی هوش مصنوعی:</span>
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleApplyGeminiToSummary}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-2xs"
                      >
                        <Save className="w-3 h-3" />
                        <span>درج مستقیم در متن گزارش</span>
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

                  <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium whitespace-pre-line max-h-48 overflow-y-auto p-1">
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
            <div className="bg-blue-50/50 dark:bg-slate-800/50 rounded-2xl p-5 border-2 border-dashed border-blue-200 dark:border-blue-900/60 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                    <Film className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 dark:text-slate-100 block">
                      بارگذاری مستقیم فایل ویدیو (MP4 / WebM)
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {videoPreviewUrl
                        ? 'ویدیوی گزارش آماده پخش است. برای تغییر یا حذف از دکمه‌های روبرو استفاده کنید.'
                        : 'فایل ویدیو اختیاری است و برای گزارش‌های دارای فیلم در حافظه ذخیره و پخش می‌گردد.'}
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
                      title="حذف ویدیوی این گزارش"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>حذف ویدیو</span>
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
                      <span>حذف</span>
                    </button>
                  </div>

                  {/* Video Live Preview if selected */}
                  <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black aspect-video max-h-56 mx-auto flex items-center justify-center shadow-inner">
                    <video
                      src={videoPreviewUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>
              ) : (
                <div className="py-4 px-3 bg-white/70 dark:bg-slate-900/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-500 dark:text-slate-400">
                  <span>هیچ فایلی برای ویدیو انتخاب نشده است. (این بخش برای گزارش‌های متنی و اسنادی خالی می‌ماند)</span>
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

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={resetForm}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                پاک کردن فرم
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-7 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs sm:text-sm font-black transition shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSubmitting ? 'در حال ذخیره‌سازی...' : editingReportId ? 'ذخیره تغییرات و بازنشر' : 'ذخیره و انتشار فوری در سایت'}</span>
              </button>
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

              {/* Date Filter */}
              <div>
                <select
                  value={filterDatePeriod}
                  onChange={(e) => setFilterDatePeriod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none dark:text-white cursor-pointer"
                >
                  <option value="all">📅 همه تاریخ‌ها</option>
                  <option value="1405">📅 گزارش‌های سال ۱۴۰۵</option>
                  <option value="1404">📅 گزارش‌های سال ۱۴۰۴</option>
                  <option value="custom">🔍 جستجوی تاریخ خاص...</option>
                </select>
              </div>
            </div>

            {/* Custom Date Input (conditional) & Sort + Active Info */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-slate-700/80 text-xs">
              <div className="flex flex-wrap items-center gap-2">
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

                {(filterTeam !== 'all' || filterStatus !== 'all' || filterDatePeriod !== 'all' || searchQuery !== '' || customDateQuery !== '') && (
                  <button
                    onClick={() => {
                      setFilterTeam('all');
                      setFilterStatus('all');
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
                  <option value="date-desc">📅 جدیدترین تاریخ</option>
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
                  {filteredReports.map((report) => {
                    const views = reportViews[report.id] ?? 0;
                    return (
                      <tr key={report.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition">
                        <td className="py-3.5 pr-2 font-bold text-[#173b82] dark:text-blue-400 whitespace-nowrap">
                          {report.teamName}
                        </td>
                        <td className="py-3.5">
                          <div className="font-bold text-slate-800 dark:text-slate-200">
                            {formatReportNumberDisplay(report.reportNum)}: {report.title}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 max-w-md">
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
                        <td className="py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap font-bold text-[11px]">
                          {toPersianDigits(report.date || '')}
                        </td>
                        <td className="py-3.5 text-center whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                              report.status === 'draft'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                            }`}
                          >
                            {report.status === 'draft' ? 'پیش‌نویس' : 'منتشر شده'}
                          </span>
                        </td>
                        <td className="py-3.5 pl-2 text-left whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Print / Export PDF */}
                            <PrintReportButton
                              report={report}
                              teamName={report.teamName}
                              variant="minimal"
                            />

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
      {/* TAB: Video Analytics & Popularity Dashboard */}
      {/* ==================================================== */}
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
                                {report.reportNum}: {report.title}
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
                                  const compressedDataUrl = await compressImageToDataUrl(file, 512, 0.88);
                                  saveTeamLogo(slug, compressedDataUrl);
                                  showToast(`لوگوی جدید تیم «${team.name}» با موفقیت بارگذاری و ذخیره شد.`);
                                } catch (err) {
                                  console.error(err);
                                  showToast('خطا در پردازش تصویر لوگو');
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

              <div className="flex items-center gap-3">
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 flex items-center justify-center font-bold">
                    🏛️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      لوگوی رسمی مؤسسه محاش
                    </h3>
                    <span className="text-[11px] text-slate-500">نمایش در هدر، فوتر و گزارش‌های رسمی</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetMahashLogoAction}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی وکتور</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 border-4 border-cyan-500/20 shadow-md p-1.5 flex items-center justify-center shrink-0">
                  <img
                    src={mahashLogoSrc}
                    alt="لوگوی مؤسسه محاش"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-right flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    وضعیت: {mahashLogoSrc.startsWith('data:image/svg') ? 'وکتور اختصاصی SVG (کیفیت بی‌نهایت)' : 'تصویر سفارشی بارگذاری‌شده'}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    این لوگو در بالای تمامی صفحات، منوی اصلی و فوتر پایانی به صورت خودکار با پس‌زمینه شفاف قرار می‌گیرد.
                  </p>

                  <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <label className="px-3 py-1.5 bg-[#173b82] hover:bg-[#1f4da7] text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>بارگذاری عکس جدید (PNG / JPG / SVG)</span>
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
                              handleApplyLogoToMahash(base64, file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Quick Presets for Mahash */}
              <div className="space-y-2">
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
                        <img src={badge.svg || badge.svgDataUri} alt={badge.name || badge.title} className="w-full h-full object-contain rounded-full" />
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
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center font-bold">
                    🎖️
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      نشان حلقوی باشگاه جوانان محاش
                    </h3>
                    <span className="text-[11px] text-slate-500">مدال افتخار، کارنامه‌ها و بنرهای باشگاهی</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleResetYouthClubBadgeAction}
                  className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>بازنشانی نشان</span>
                </button>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-5 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className="w-24 h-24 rounded-full bg-white dark:bg-slate-900 border-4 border-amber-500/30 shadow-md p-1 flex items-center justify-center shrink-0">
                  <img
                    src={youthClubBadgeSrc}
                    alt="نشان باشگاه جوانان محاش"
                    className="w-full h-full object-contain rounded-full"
                  />
                </div>

                <div className="space-y-2 text-center sm:text-right flex-1">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    نشان طلایی و مدرج باشگاه جوانان
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    این نشان در صفحه اصلی، بخش افتخارات و کارت‌های شناسایی اعضای باشگاه جوانان به کار می‌رود.
                  </p>

                  <div className="pt-1 flex flex-wrap gap-2 justify-center sm:justify-start">
                    <label className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer transition flex items-center gap-1.5 shadow-sm">
                      <Upload className="w-3.5 h-3.5" />
                      <span>بارگذاری نشان اختصاصی (تصویر / وکتور)</span>
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
                              handleApplyBadgeToYouthClub(base64, file.name);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* Quick Presets for Club Badge */}
              <div className="space-y-2">
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
                        <img src={badge.svg || badge.svgDataUri} alt={badge.name || badge.title} className="w-full h-full object-contain rounded-full" />
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
                        <img src={badgeData} alt={badgeLabel} className="w-full h-full object-contain rounded-full" />
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
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => {
                              setNewBadgeFileBase64(reader.result as string);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>

                    {newBadgeFileBase64 && (
                      <div className="w-10 h-10 rounded-full border border-slate-300 p-0.5 bg-white shrink-0">
                        <img src={newBadgeFileBase64} alt="پیش‌نمایش" className="w-full h-full object-contain rounded-full" />
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
                            <img src={badgeData} alt={badgeLabel} className="w-full h-full object-contain rounded-full" />
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
        </div>
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
                const newEvent: EventItem = {
                  id: evId,
                  title: eventTitle.trim(),
                  category: eventCategory,
                  categoryLabel: eventCategoryLabel,
                  dateJalali: eventDateJalali || '۱۴۰۵/۰۶/۱۵',
                  jalaliYear: 1405,
                  jalaliMonth: 6,
                  jalaliDay: 15,
                  dayOfWeek: 'پنج‌شنبه',
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
                <span>دانلود نسخه پشتیبان کامل (JSON)</span>
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
      {/* CONFIRMATION MODAL: Delete Report */}
      {/* ==================================================== */}
      {reportToDelete && (
        <div className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/80 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  حذف قطعی گزارش
                </h3>
                <span className="text-xs text-rose-500 font-bold">
                  این عملیات غیرقابل بازگشت است
                </span>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="font-bold text-slate-900 dark:text-white">
                «{reportToDelete.title}»
              </div>
              {reportToDelete.teamName && (
                <div className="text-slate-500">
                  تیم: <span className="font-bold text-blue-600 dark:text-blue-400">{reportToDelete.teamName}</span>
                </div>
              )}
              <div className="text-[11px] text-slate-400">
                فایل ویدیویی ذخیره شده در حافظه مرورگر و تمامی اسناد پیوست این گزارش نیز حذف خواهند شد.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setReportToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                انصراف
              </button>

              <button
                type="button"
                onClick={handleConfirmDeleteReport}
                disabled={isDeleting}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'در حال حذف...' : 'تأیید و حذف نهایی گزارش'}</span>
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
    </div>
  );
};
