import { syncToWordPressAPI } from "./syncService";
import { runGarbageCollection } from './cleanupUtils';
import { globalEventBus } from './eventBus';
import { indexedDBService } from './indexedDBService';
import {
  saveLogoToFirestore,
  deleteLogoFromFirestore,
  saveMahashLogoToFirestore,
  saveYouthClubEmblemToFirestore,
  saveConsultantPhotoToFirestore,
  getConsultantPhotoFromFirestore,
  deleteConsultantPhotoFromFirestore,
  getCanonicalConsultantDocId
} from './firestorePersistence';
import { ActivityReport, TeamData, ScoreItem, EventItem, PageId, TranscriptScene, Consultant, ReportDraft, ReportType } from '../types';
import { TEAMS_DATA, SCORES_DATA, CONSULTANTS } from '../data/mahashData';
import { EVENTS_DATA } from '../data/eventsData';
import { parseReportTimestamp, formatReportNumberDisplay, toPersianDigits, extractReportSequenceNumber } from './persianDate';
import { toEnglishDigits } from './persianDigitsHandler';
import { MAHESH_LOGO_SVG, MAHESH_CLUB_EMBLEM_SVG, NAZI_AVATAR_SVG, RADIN_AVATAR_SVG } from './assets';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage, freeUpLocalStorageQuota } from './storage';

const CUSTOM_REPORTS_KEY = 'mahash_custom_reports_v1';
const DELETED_REPORTS_KEY = 'mahash_deleted_reports_v1';
const TRASH_BIN_KEY = 'mahash_trash_bin_v1';
const DRAFTS_KEY = 'mahash_report_drafts_v1';
const TEAM_OVERRIDES_KEY = 'mahash_team_overrides_v1';
const TEAM_OVERRIDES_LEGACY_KEY = 'mahash_team_overrides';
const SCORES_KEY = 'mahash_scores_v1';
const SCORES_LEGACY_KEY = 'mahash_scores';
const EVENTS_KEY = 'mahash_events_v1';
const VIEWS_KEY = 'mahash_report_views_v1';
const MAHASH_LOGO_KEY = 'mahash_custom_logo_v1';
const MAHASH_LOGO_LEGACY_KEYS = ['mahash_site_logo', 'mahash_custom_logo', 'mahash_logo', 'mahash_logo_url'];
const CLUB_EMBLEM_KEY = 'mahash_custom_club_emblem_v1';
const CLUB_EMBLEM_LEGACY_KEYS = ['mahash_custom_club_emblem', 'mahash_club_emblem', 'youth_club_badge'];
const TEAM_LOGOS_MAP_KEY = 'mahash_team_logos_v1';
const TEAM_LOGOS_MAP_LEGACY_KEYS = ['mahash_team_logos', 'mahash_logos', 'team_logos'];
const MEMBER_AVATARS_KEY = 'mahash_member_avatars_v1';
const CONSULTANTS_STORAGE_KEY = 'mahash_consultants_list_v1';
const CONSULTANT_PHOTOS_KEY = 'mahash_consultant_custom_photos_v1';
const ADMIN_SESSION_KEY = 'mahash_admin_session_v1';
const ADMIN_USERNAME_KEY = 'mahash_admin_username_v1';
const ADMIN_PASSWORD_KEY = 'mahash_admin_password_v1';
const DEFAULT_ADMIN_USERNAME = 'Admin';
const DEFAULT_ADMIN_PASSWORD = 'GIta11649@';

export function isCustomImageDataUrlOrUrl(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  const s = val.trim();
  if (s.startsWith('data:image/')) {
    return true;
  }
  if (s.startsWith('<svg') && s.includes('</svg>')) {
    return true;
  }
  if (
    s.startsWith('http://') ||
    s.startsWith('https://') ||
    s.startsWith('/img/') ||
    s.startsWith('/uploads/') ||
    s.startsWith('blob:') ||
    s.startsWith('indexeddb:') ||
    s.startsWith('/')
  ) {
    return true;
  }
  return false;
}

let hasAutoRecoveredLogos = false;

export function autoRecoverAllSavedLogos(force = false): void {
  if (typeof window === 'undefined') return;
  if (hasAutoRecoveredLogos && !force) return;
  hasAutoRecoveredLogos = true;

  try {
    const rawOverrides = safeGetLocalStorage(TEAM_OVERRIDES_KEY);
    let overrides: Record<string, Partial<TeamData>> = rawOverrides ? JSON.parse(rawOverrides) : {};
    let overridesModified = false;

    // 1. Recover from legacy overrides key
    try {
      const legacyRaw = safeGetLocalStorage(TEAM_OVERRIDES_LEGACY_KEY);
      if (legacyRaw) {
        const parsed = JSON.parse(legacyRaw);
        if (parsed && typeof parsed === 'object') {
          Object.entries(parsed).forEach(([key, data]: [string, any]) => {
            if (data && data.logo && isCustomImageDataUrlOrUrl(data.logo)) {
              const normSlug = key.startsWith('team-') ? key : `team-${key}`;
              const shortId = key.replace(/^team-/, '');
              if (!overrides[normSlug]?.logo) {
                overrides[normSlug] = { ...(overrides[normSlug] || {}), ...data };
                overridesModified = true;
              }
              if (!overrides[shortId]?.logo) {
                overrides[shortId] = { ...(overrides[shortId] || {}), ...data };
                overridesModified = true;
              }
            }
          });
        }
      }

    } catch {}
    // 2. Recover from team logo maps
    [TEAM_LOGOS_MAP_KEY, ...TEAM_LOGOS_MAP_LEGACY_KEYS].forEach((mapKey) => {
      try {
        const rawMap = safeGetLocalStorage(mapKey);
        if (rawMap) {
          const parsed = JSON.parse(rawMap);
          if (parsed && typeof parsed === 'object') {
            Object.entries(parsed).forEach(([key, logo]: [string, any]) => {
              if (typeof logo === 'string' && isCustomImageDataUrlOrUrl(logo)) {
                const normSlug = key.startsWith('team-') ? key : `team-${key}`;
                const shortId = key.replace(/^team-/, '');
                if (!overrides[normSlug]?.logo) {
                  overrides[normSlug] = { ...(overrides[normSlug] || {}), logo };
                  overridesModified = true;
                }
                if (!overrides[shortId]?.logo) {
                  overrides[shortId] = { ...(overrides[shortId] || {}), logo };
                  overridesModified = true;
                }
              }
            });
          }
        }

      } catch {}
    });

    // 3. Recover from individual team logo keys
    const officialShortIds = ['thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'];
    officialShortIds.forEach((shortId) => {
      const slug = `team-${shortId}`;
      const candidateKeys = [
        `mahash_team_logo_${shortId}`,
        `mahash_team_logo_${slug}`,
        `team_logo_${shortId}`,
        `team_logo_${slug}`,
        // Specific aliases for angels, ghorbani, silence
        ...(shortId === 'angels' ? ['mahash_team_logo_fereshtegan', 'team_logo_fereshtegan', 'mahash_team_logo_fereshteha'] : []),
        ...(shortId === 'ghorbani' ? ['mahash_team_logo_ghorbanikhani', 'team_logo_ghorbanikhani', 'mahash_team_logo_ghorbooni', 'team_logo_ghorbooni', 'mahash_team_logo_khadem', 'team_logo_khadem'] : []),
        ...(shortId === 'silence' ? ['mahash_team_logo_yavaran', 'team_logo_yavaran', 'mahash_team_logo_sokoot', 'team_logo_sokoot', 'mahash_team_logo_avaye_sokoot'] : [])
      ];

      for (const candKey of candidateKeys) {
        try {
          const val = safeGetLocalStorage(candKey);
          if (val && isCustomImageDataUrlOrUrl(val)) {
            if (!overrides[slug]?.logo) {
              overrides[slug] = { ...(overrides[slug] || {}), logo: val };
              overridesModified = true;
            }
            if (!overrides[shortId]?.logo) {
              overrides[shortId] = { ...(overrides[shortId] || {}), logo: val };
              overridesModified = true;
            }
          }
        } catch {}
      }

    });

    // 4. Recover from stored scores arrays
    [SCORES_KEY, SCORES_LEGACY_KEY].forEach((sKey) => {
      try {
        const rawScores = safeGetLocalStorage(sKey);
        if (rawScores) {
          const parsedScores = JSON.parse(rawScores);
          if (Array.isArray(parsedScores)) {
            parsedScores.forEach((item: any) => {
              if (item && item.id && item.logo && isCustomImageDataUrlOrUrl(item.logo)) {
                const shortId = item.id.replace(/^team-/, '');
                const slug = `team-${shortId}`;
                if (!overrides[slug]?.logo) {
                  overrides[slug] = { ...(overrides[slug] || {}), logo: item.logo };
                  overridesModified = true;
                }
                if (!overrides[shortId]?.logo) {
                  overrides[shortId] = { ...(overrides[shortId] || {}), logo: item.logo };
                  overridesModified = true;
                }
              }
            });
          }
        }

      } catch {}
    });

    if (overridesModified) {
      safeSetLocalStorage(TEAM_OVERRIDES_KEY, JSON.stringify(overrides));
    }

    // 5. Recover Mahash Institution Logo
    const currentMahash = safeGetLocalStorage(MAHASH_LOGO_KEY);
    if (!currentMahash || !isCustomImageDataUrlOrUrl(currentMahash)) {
      for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
        const legacyLogo = safeGetLocalStorage(mKey);
        if (legacyLogo && isCustomImageDataUrlOrUrl(legacyLogo)) {
          safeSetLocalStorage(MAHASH_LOGO_KEY, legacyLogo);
          break;
        }
      }
    }

    // 6. Recover Youth Club Emblem
    const currentClub = safeGetLocalStorage(CLUB_EMBLEM_KEY);
    if (!currentClub || !isCustomImageDataUrlOrUrl(currentClub)) {
      for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
        const legacyEmblem = safeGetLocalStorage(cKey);
        if (legacyEmblem && isCustomImageDataUrlOrUrl(legacyEmblem)) {
          safeSetLocalStorage(CLUB_EMBLEM_KEY, legacyEmblem);
          break;
        }
      }
    }

    hasAutoRecoveredLogos = true;
  } catch (e) {
    console.warn('Auto recover logos error:', e);
  }
}

// Initial baseline realistic view counts for predefined reports

const DEFAULT_VIEWS: Record<string, number> = {
  'thinker-01': 485,
  'thinker-02': 620,
  'club-01': 390,
  'angels-01': 575,
  'ghorbani-01': 410,
  'ghorbani-02': 345,
  'silence-01': 510,
};

// Event for notifying subscribers of reports/teams changes
const STORE_CHANGE_EVENT = 'mahash_store_updated';

const CACHE_VERSION_KEY = 'mahash_cache_version_v1';

export function getGlobalCacheVersion(): number {
  if (typeof window === 'undefined') return 1;
  const val = safeGetLocalStorage(CACHE_VERSION_KEY);
  return val ? parseInt(val, 10) || 1 : 1;
}

export function triggerGlobalCacheBust(syncToServer = false): number {
  if (typeof window === 'undefined') return 1;
  const newVer = Date.now();
  safeSetLocalStorage(CACHE_VERSION_KEY, String(newVer));
  triggerStoreUpdate();
  if (syncToServer) {
    syncLocalDataToServer().catch(console.warn);
  }
  return newVer;
}

function triggerStoreUpdate() {
  _memoizedTeamsCache = null;
  _lastTeamsCacheVersion = -1;
  _memoizedReportsCache = null;
  _lastReportsCacheVersion = -1;
  if (typeof window !== 'undefined') {
    const newVer = Date.now();
    try {
      safeSetLocalStorage(CACHE_VERSION_KEY, String(newVer));
    } catch {}
    window.dispatchEvent(new CustomEvent(STORE_CHANGE_EVENT));
  }

}

export function subscribeToStoreUpdates(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener(STORE_CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(STORE_CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

// ----------------------------------------------------
// Admin Authentication & Password Recovery Methods
// ----------------------------------------------------

export function normalizeAuthInput(val: string): string {
  if (!val) return '';
  return toEnglishDigits(val.trim());
}

export function getAdminUsername(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_USERNAME;
  try {
    return safeGetLocalStorage(ADMIN_USERNAME_KEY) || DEFAULT_ADMIN_USERNAME;
  } catch {
    return DEFAULT_ADMIN_USERNAME;
  }
}

export function setAdminUsername(newUsername: string): boolean {
  if (!newUsername || newUsername.trim().length < 2) return false;
  try {
    return safeSetLocalStorage(ADMIN_USERNAME_KEY, newUsername.trim());
  } catch {
    return false;
  }
}

export function getAdminPassword(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PASSWORD;
  try {
    return safeGetLocalStorage(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function setAdminPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.trim().length < 3) return false;
  try {
    return safeSetLocalStorage(ADMIN_PASSWORD_KEY, newPassword.trim());
  } catch {
    return false;
  }
}

export function resetAdminCredentialsToDefault(): { username: string; password: string } {
  try {
    safeSetLocalStorage(ADMIN_USERNAME_KEY, DEFAULT_ADMIN_USERNAME);
    safeSetLocalStorage(ADMIN_PASSWORD_KEY, DEFAULT_ADMIN_PASSWORD);
  } catch {}
  triggerStoreUpdate();
  return { username: DEFAULT_ADMIN_USERNAME, password: DEFAULT_ADMIN_PASSWORD };
}


export function recoverAdminPassword(
  securityKeyOrAnswer: string,
  newPassword?: string
): { success: boolean; message: string; tempPassword?: string } {
  const normKey = normalizeAuthInput(securityKeyOrAnswer).toLowerCase();
  
  // Valid master recovery keys and phrases
  const validKeys = [
    '11649',
    'gita11649@',
    'gita11649',
    'mahash',
    'mahash2026',
    'admin',
    'محاش',
    'موسسه محاش',
    'مؤسسه محاش'
  ];

  const isKeyValid = validKeys.includes(normKey);
  if (!isKeyValid) {
    return {
      success: false,
      message: 'کلید بازیابی یا پاسخ امنیتی وارد شده نادرست است. لطفاً کلید معتبر (مانند کد ۱۱۶۴۹ یا mahash) را وارد نمایید.'
    };
  }

  if (newPassword && newPassword.trim().length >= 4) {
    setAdminPassword(newPassword.trim());
    setAdminUsername(DEFAULT_ADMIN_USERNAME);
    return {
      success: true,
      message: 'کلمه عبور جدید مدیر با موفقیت ذخیره گردید. اکنون می‌توانید با نام کاربری Admin و کلمه عبور جدید وارد شوید.'
    };
  }

  // If no new password provided, reset to standard default credentials
  resetAdminCredentialsToDefault();
  return {
    success: true,
    message: 'اطلاعات ورود مدیر با موفقیت به مقادیر پیش‌فرض اولیه بازنشانی گردید.',
    tempPassword: DEFAULT_ADMIN_PASSWORD
  };
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true' || safeGetLocalStorage(ADMIN_SESSION_KEY) === 'true';
  } catch {
    return false;
  }
}

export function loginAdmin(usernameOrPass: string, password?: string, rememberMe = true): boolean {
  const currentUsername = getAdminUsername();
  const currentPass = getAdminPassword();

  const normInputUsername = normalizeAuthInput(usernameOrPass).toLowerCase();
  const normCurrentUsername = normalizeAuthInput(currentUsername).toLowerCase();
  const normDefaultUsername = normalizeAuthInput(DEFAULT_ADMIN_USERNAME).toLowerCase();

  // If both username and password provided:
  if (password !== undefined) {
    const rawInputPass = password.trim();
    const normInputPass = normalizeAuthInput(password);
    const normCurrentPass = normalizeAuthInput(currentPass);
    const normDefaultPass = normalizeAuthInput(DEFAULT_ADMIN_PASSWORD);

    // Accept username if matches current username, default 'Admin', or common aliases ('admin', 'مدیر', 'ادمین')
    const isUsernameMatch =
      normInputUsername === normCurrentUsername ||
      normInputUsername === normDefaultUsername ||
      normInputUsername === 'admin' ||
      normInputUsername === 'ادمین' ||
      normInputUsername === 'مدیر' ||
      usernameOrPass.trim() === currentUsername;

    // Accept password if matches current password, default password, with or without Persian digits
    const isPasswordMatch =
      rawInputPass === currentPass ||
      normInputPass === normCurrentPass ||
      rawInputPass === DEFAULT_ADMIN_PASSWORD ||
      normInputPass === normDefaultPass;

    if (isUsernameMatch && isPasswordMatch) {
      try {
        if (rememberMe) {
          safeSetLocalStorage(ADMIN_SESSION_KEY, 'true');
        }
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
      } catch {}
      triggerStoreUpdate();
      return true;
    }

    return false;
  }

  // Fallback if only password was passed
  const rawPassOnly = usernameOrPass.trim();
  const normPassOnly = normalizeAuthInput(usernameOrPass);
  if (
    rawPassOnly === currentPass ||
    normPassOnly === normalizeAuthInput(currentPass) ||
    rawPassOnly === DEFAULT_ADMIN_PASSWORD ||
    normPassOnly === normalizeAuthInput(DEFAULT_ADMIN_PASSWORD)
  ) {
    try {
      if (rememberMe) {
        safeSetLocalStorage(ADMIN_SESSION_KEY, 'true');
      }
      sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
    } catch {}
    triggerStoreUpdate();
    return true;
  }


  return false;
}

export function logoutAdmin(): void {
  try {
    safeRemoveLocalStorage(ADMIN_SESSION_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
  triggerStoreUpdate();
}

// ----------------------------------------------------
// Custom Reports & Overrides
// ----------------------------------------------------


let memoryFallbackMap: Record<string, ActivityReport[]> = {};

function sanitizeReportForLocalStorage(report: ActivityReport): ActivityReport {
  if (!report) return report;
  const sanitized: ActivityReport = { ...report };

  // Strip massive base64 dataUrls from attachments before storing in localStorage
  // The full dataUrl / Blob is securely kept in IndexedDB via saveAttachmentRecord
  if (sanitized.attachments && Array.isArray(sanitized.attachments)) {
    sanitized.attachments = sanitized.attachments.map((att) => {
      if (att.dataUrl && att.dataUrl.length > 512 && att.dataUrl.startsWith('data:')) {
        const { dataUrl, ...rest } = att;
        return rest;
      }
      return att;
    });
  }

  return sanitized;
}

function getCustomReportsMap(): Record<string, ActivityReport[]> {
  try {
    const raw = safeGetLocalStorage(CUSTOM_REPORTS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return { ...parsed, ...memoryFallbackMap };
  } catch {
    return { ...memoryFallbackMap };
  }
}

function saveCustomReportsMap(map: Record<string, ActivityReport[]>) {
  memoryFallbackMap = { ...map };
  try {
    const cleanMap: Record<string, ActivityReport[]> = {};
    for (const [slug, reports] of Object.entries(map)) {
      if (Array.isArray(reports)) {
        cleanMap[slug] = reports.map(sanitizeReportForLocalStorage);
      }
    }
    safeSetLocalStorage(CUSTOM_REPORTS_KEY, JSON.stringify(cleanMap));
  } catch (err) {
    console.warn('Initial save to storage had quota issue, compressing data:', err);
    try {
      const slimMap: Record<string, ActivityReport[]> = {};
      for (const [slug, reports] of Object.entries(map)) {
        if (Array.isArray(reports)) {
          slimMap[slug] = reports.map((r) => {
            const { attachments, ...rest } = r;
            const slimAtts = attachments?.map((a) => ({
              id: a.id,
              name: a.name,
              type: a.type,
              extension: a.extension,
              sizeFormatted: a.sizeFormatted,
              caption: a.caption,
              dataUrl: a.dataUrl // Keep the URL since it's no longer a massive base64
            }));
            return { ...rest, attachments: slimAtts };
          });
        }
      }
      safeSetLocalStorage(CUSTOM_REPORTS_KEY, JSON.stringify(slimMap));
    } catch (e2) {
      console.warn('Storage full, keeping in memory and sessionStorage:', e2);
      try {
        sessionStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(map));
      } catch {}
    }

  }
  triggerStoreUpdate();
  // Automatically sync to persistent server store and Firebase
  if (typeof window !== 'undefined') {
    syncLocalDataToServer().catch(console.warn);
  }
}

export interface TrashBinItem {
  id: string;
  originalType: 'report' | 'post' | 'media' | 'comment' | 'team';
  itemId: string;
  title: string;
  teamSlug?: string;
  data: any;
  deletedBy?: string;
  deletedAt: string;
}

export function getDeletedReportsList(): string[] {
  try {
    const raw = safeGetLocalStorage(DELETED_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveDeletedReportsList(list: string[]) {
  safeSetLocalStorage(DELETED_REPORTS_KEY, JSON.stringify(list));
  triggerStoreUpdate();
}

export function getTrashBinList(): TrashBinItem[] {
  try {
    const raw = safeGetLocalStorage(TRASH_BIN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveTrashBinList(list: TrashBinItem[]) {
  safeSetLocalStorage(TRASH_BIN_KEY, JSON.stringify(list));
  triggerStoreUpdate();
}

export function getTeamOverrides(): Record<string, Partial<TeamData>> {
  autoRecoverAllSavedLogos();
  try {
    const raw = safeGetLocalStorage(TEAM_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTeamOverrides(map: Record<string, Partial<TeamData>>) {
  safeSetLocalStorage(TEAM_OVERRIDES_KEY, JSON.stringify(map));
  // Keep legacy key in sync for backwards-compatibility safely
  try {
    safeSetLocalStorage(TEAM_OVERRIDES_LEGACY_KEY, JSON.stringify(map));
  } catch {}
  triggerStoreUpdate();
  syncLocalDataToServer().catch(console.warn);
}

// ----------------------------------------------------
// Live Ticker & Real-Time Latest Reports Feed
// ----------------------------------------------------


export interface LiveTickerItem {
  text: string;
  target: PageId;
  date?: string;
  reportId?: string;
}

/**
 * Generates accurate, synchronized Persian subtitles and transcript scenes for any video report.
 * Automatically aligns with the report's title, key points, summary, and team identity.
 */
export function generatePersianSubtitlesForReport(
  report: Partial<ActivityReport>,
  teamName?: string
): TranscriptScene[] {
  const teamTitle = teamName || 'تیم باشگاه جوانان محاش';
  const repTitle = report.title || 'گزارش فعالیت ویدیویی';
  const repNum = report.reportNum ? `${formatReportNumberDisplay(report.reportNum)}` : 'گزارش رسمی';
  const points = report.keyPoints || [];
  const summaryText = report.summary || 'ارائه اقدامات، دستاوردها و برنامه‌های مصوب کارگروه تخصصی.';

  const scenes: TranscriptScene[] = [
    {
      speaker: 'مجری و سرپرست تیم',
      role: `ارائه‌دهنده ${teamTitle}`,
      text: `سلام و درود به همراهان گرامی مؤسسه محاش. ${repNum} با عنوان «${repTitle}» تقدیم نگاه پرمهر شما می‌شود.`
    },
    {
      speaker: 'گزارشگر فعالیت‌ها',
      role: 'کارشناس اجرایی',
      text: `در این دوره، ${summaryText}`
    }
  ];

  if (points.length > 0) {
    scenes.push({
      speaker: 'دبیر کارگروه',
      role: 'هماهنگ‌کننده برنامه',
      text: `مهم‌ترین محورهای اجرا شده: ${points.slice(0, 3).join('؛ ')}.`
    });
  }

  scenes.push({
    speaker: 'سخنگوی تیم',
    role: `روابط عمومی ${teamTitle}`,
    text: `از تمامی اعضا و حامیان محترم کمال تشکر را داریم. گام‌های بعدی و گزارش‌های تکمیلی به‌زودی منتشر خواهد شد.`
  });

  return scenes;
}

/**
 * Returns dynamic live ticker items generated from all registered reports across teams.
 * Newly registered reports in any team will automatically appear on top of this live stream.
 */
export function getLiveTickerItems(): LiveTickerItem[] {
  const allReports = getAllReports();
  
  if (allReports.length === 0) {
    return [
      {
        text: 'باشگاه جوانان محاش: در انتظار انتشار نخستین گزارش‌های ویدیویی تیم‌ها',
        target: 'home'
      }
    ];
  }

  // Map each report to an informative, live ticker news item
  const dynamicItems: LiveTickerItem[] = allReports.slice(0, 10).map((report) => {
    let summaryText = report.summary ? ` (${report.summary.slice(0, 75)}...)` : '';
    const reportLabel = report.reportNum ? `${formatReportNumberDisplay(report.reportNum)} - ` : '';
    // Cleanly format team display name to avoid "تیم تیم ..." duplication
    const cleanTeamName = report.teamName.startsWith('تیم ')
      ? report.teamName
      : `تیم ${report.teamName}`;
    const cleanSlug = (report.teamSlug.startsWith('team-') ? report.teamSlug : `team-${report.teamSlug}`) as PageId;

    return {
      text: `${cleanTeamName}: «${reportLabel}${report.title}»${summaryText}`,
      target: cleanSlug,
      date: report.date,
      reportId: report.id
    };
  });

  return dynamicItems;
}

/**
 * Returns the most recent update date across all reports in the entire system.
 * Dynamically prioritizes the date of the latest registered report so updates reflect immediately.
 */
export function getLatestReportUpdateDate(): string {
  const allReports = getAllReports();
  if (allReports.length > 0 && allReports[0].date) {
    return allReports[0].date;
  }
  if (typeof window !== 'undefined') {
    try {
      const savedLast = safeGetLocalStorage('mahash_last_activity_date');
      if (savedLast) return savedLast;
    } catch {}
  }

  return '۱۴۰۵/۰۵/۲۶';
}


let _memoizedTeamsCache: Record<string, TeamData> | null = null;
let _lastTeamsCacheVersion: number = -1;

export function getAllTeams(): Record<string, TeamData> {
  const currentVersion = getGlobalCacheVersion();
  if (_memoizedTeamsCache && _lastTeamsCacheVersion === currentVersion) {
    return _memoizedTeamsCache;
  }
  
  autoRecoverAllSavedLogos();
  const customMap = getCustomReportsMap();
  const deletedList = getDeletedReportsList();
  const teamOverrides = getTeamOverrides();

  const result: Record<string, TeamData> = {};

  Object.keys(TEAMS_DATA).forEach((slug) => {
    const baseTeam = TEAMS_DATA[slug];
    const shortId = slug.replace(/^team-/, '');
    const overrides = {
      ...(teamOverrides[shortId] || {}),
      ...(teamOverrides[slug] || {})
    };

    // Determine effective team logo:
    // 1. Explicit override logo (from teamOverrides)
    // 2. Individual persistent key in localStorage
    // 3. Stored score logo if it's a custom image
    // 4. Default vector SVG from baseTeam
    let effectiveLogo = overrides.logo;
    if (!effectiveLogo) {
      try {
        const indVal = safeGetLocalStorage(`mahash_team_logo_${shortId}`) || safeGetLocalStorage(`mahash_team_logo_${slug}`) || safeGetLocalStorage(`team_logo_${shortId}`);
        if (indVal && isCustomImageDataUrlOrUrl(indVal)) {
          effectiveLogo = indVal;
        }
      } catch {}
    }

    if (!effectiveLogo) {
      try {
        const rawScores = safeGetLocalStorage(SCORES_KEY);
        if (rawScores) {
          const parsedScores = JSON.parse(rawScores);
          if (Array.isArray(parsedScores)) {
            const sc = parsedScores.find((s) => s.id === shortId || s.id === slug);
            if (sc && sc.logo && isCustomImageDataUrlOrUrl(sc.logo)) {
              effectiveLogo = sc.logo;
            }
          }
        }
      } catch {}
    }

    if (!effectiveLogo) {
      effectiveLogo = baseTeam.logo;
    }

    // Filter out deleted base reports
    const activeBaseReports = baseTeam.reports.filter((r) => !deletedList.includes(r.id));
    const customReportsForTeam = customMap[slug] || customMap[shortId] || [];

    // Merge reports: custom reports that have matching ID override base reports, others are prepended
    const mergedReportsMap = new Map<string, ActivityReport>();
    
    // First custom reports (higher priority)
    customReportsForTeam.forEach((r) => {
      if (!deletedList.includes(r.id)) {
        mergedReportsMap.set(r.id, { ...r, teamSlug: slug });
      }
    });

    // Then active base reports if not already overridden
    activeBaseReports.forEach((r) => {
      if (!mergedReportsMap.has(r.id)) {
        mergedReportsMap.set(r.id, { ...r, teamSlug: slug });
      }
    });

    const isAdmin = isAdminAuthenticated();

    // Sort reports inside each team: newest first (index 0), tie-break by report sequence
    const sortedReports = Array.from(mergedReportsMap.values())
      .filter((r) => isAdmin || r.status !== 'draft')
      .sort((a, b) => {
        const timeDiff = parseReportTimestamp(b) - parseReportTimestamp(a);
        if (timeDiff !== 0) return timeDiff;
        const seqDiff = extractReportSequenceNumber(b) - extractReportSequenceNumber(a);
        if (seqDiff !== 0) return seqDiff;
        return (b.id || '').localeCompare(a.id || '');
      });

    result[slug] = {
      ...baseTeam,
      ...overrides,
      logo: effectiveLogo,
      reports: sortedReports
    };
  });

  return result;
}

/**
 * Returns the timestamp of the latest report in a team, or 0 if no reports.
 */
export function getTeamLatestActivityTimestamp(team: TeamData): number {
  if (!team || !team.reports || team.reports.length === 0) return 0;
  return Math.max(...team.reports.map((r) => parseReportTimestamp(r)));
}

/**
 * Returns all teams sorted by their latest registered activity/report.
 * The team with the most recent report appears in the FIRST position (Index 0 / Row 1).
 */
export function getAllTeamsList(): TeamData[] {
  const teams = Object.values(getAllTeams());
  return teams.sort((a, b) => {
    const timeA = getTeamLatestActivityTimestamp(a);
    const timeB = getTeamLatestActivityTimestamp(b);
    if (timeA !== timeB) {
      return timeB - timeA; // Newest report on top (Row 1)
    }
    // Fallback tie-breaker: number of reports, then team name
    if ((b.reports?.length || 0) !== (a.reports?.length || 0)) {
      return (b.reports?.length || 0) - (a.reports?.length || 0);
    }
    return a.name.localeCompare(b.name, 'fa');
  });
}

export function getTeam(slug: string): TeamData | undefined {
  const teams = getAllTeams();
  return teams[slug];
}

let _memoizedReportsCache: (ActivityReport & { teamName: string; teamSlug: string })[] | null = null;
let _lastReportsCacheVersion: number = -1;

export function getAllReports(): (ActivityReport & { teamName: string; teamSlug: string })[] {
  const currentVersion = getGlobalCacheVersion();
  if (_memoizedReportsCache && _lastReportsCacheVersion === currentVersion) {
    return _memoizedReportsCache;
  }
  const teams = getAllTeams();
  const all: (ActivityReport & { teamName: string; teamSlug: string })[] = [];

  Object.entries(teams).forEach(([slug, team]) => {
    team.reports.forEach((report) => {
      all.push({
        ...report,
        teamName: team.name,
        teamSlug: slug
      });
    });
  });

  // Sort by date / recency descending: newest registered reports first, tie-break by report sequence number
  return all.sort((a, b) => {
    const timeDiff = parseReportTimestamp(b) - parseReportTimestamp(a);
    if (timeDiff !== 0) return timeDiff;
    const seqDiff = extractReportSequenceNumber(b) - extractReportSequenceNumber(a);
    if (seqDiff !== 0) return seqDiff;
    return (b.id || '').localeCompare(a.id || '');
  });
}

// ----------------------------------------------------
// Draft Management Helpers
// ----------------------------------------------------

export function getSavedDrafts(): ReportDraft[] {
  try {
    const raw = safeGetLocalStorage(DRAFTS_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveDraft(draft: ReportDraft): void {
  const drafts = getSavedDrafts().filter((d) => d.id !== draft.id);
  drafts.unshift({
    ...draft,
    status: 'draft',
    updatedAt: Date.now()
  });
  safeSetLocalStorage(DRAFTS_KEY, JSON.stringify(drafts));
  triggerStoreUpdate();
}

export function deleteDraft(draftId: string): void {
  const drafts = getSavedDrafts().filter((d) => d.id !== draftId);
  safeSetLocalStorage(DRAFTS_KEY, JSON.stringify(drafts));
  triggerStoreUpdate();
}

export function getDraftById(draftId: string): ReportDraft | null {
  const drafts = getSavedDrafts();
  return drafts.find((d) => d.id === draftId) || null;
}

// ----------------------------------------------------
// Report Schema Validators
// ----------------------------------------------------

export function validateAndFormatReport(
  report: Partial<ActivityReport>,
  teamSlug: string,
  options?: { keepVideoAttachment?: boolean }
): ActivityReport {
  const format: ReportType = report.reportType || 'hybrid';
  const keepVideo = options?.keepVideoAttachment ?? report.keepVideoAttachment ?? false;
  const now = Date.now();

  const isText = format === 'text';
  const hasVideo = Boolean(report.videoSrc && report.videoSrc.trim() !== '' && report.videoSrc !== '#');

  const base: ActivityReport = {
    id: report.id || `report-${teamSlug}-${Date.now()}`,
    reportNum: report.reportNum || 'گزارش',
    title: report.title || 'گزارش فعالیت',
    date: report.date || '۱۴۰۵/۰۶/۰۸',
    datetimeIso: report.datetimeIso || new Date().toISOString(),
    summary: report.summary || '',
    teamSlug,
    status: report.status || 'published',
    isCustom: true,
    subhead: report.subhead,
    keyPoints: report.keyPoints || [],
    pdfUrl: report.pdfUrl,
    pdfLabel: report.pdfLabel,
    images: report.images || [],
    attachments: report.attachments || [],
    updatedAt: report.updatedAt || now,
    keepVideoAttachment: keepVideo
  };

  if (isText) {
    base.reportType = 'text';
    if (keepVideo && hasVideo) {
      base.videoSrc = report.videoSrc;
      base.videoHint = report.videoHint;
      base.posterSrc = report.posterSrc;
      base.transcript = report.transcript;
    } else {
      delete base.videoSrc;
      delete base.videoHint;
      delete base.posterSrc;
      delete base.transcript;
    }
  } else if (format === 'video') {
    base.reportType = 'video';
    base.videoSrc = report.videoSrc || '';
    base.videoHint = report.videoHint;
    base.posterSrc = report.posterSrc;
    base.transcript = report.transcript || [];
  } else {
    // Hybrid
    base.reportType = 'hybrid';
    base.videoSrc = hasVideo ? report.videoSrc : undefined;
    base.videoHint = hasVideo ? report.videoHint : undefined;
    base.posterSrc = report.posterSrc;
    base.transcript = report.transcript || [];
  }

  return base;
}

// ----------------------------------------------------
// Report Modification Actions
// ----------------------------------------------------

export function saveReport(
  report: ActivityReport, 
  teamSlug: string, 
  options?: { keepVideoAttachment?: boolean }
): void {
  const customMap = getCustomReportsMap();
  const deletedList = getDeletedReportsList();

  // If it was previously marked as deleted, unmark it
  if (deletedList.includes(report.id)) {
    saveDeletedReportsList(deletedList.filter((id) => id !== report.id));
  }

  // Remove from other teams in customMap if team was changed during edit
  for (const [slug, list] of Object.entries(customMap)) {
    if (slug !== teamSlug && Array.isArray(list)) {
      customMap[slug] = list.filter((r) => r.id !== report.id);
    }
  }

  const teamReports = customMap[teamSlug] || [];
  const existingIdx = teamReports.findIndex((r) => r.id === report.id);

  const keepVideo = options?.keepVideoAttachment ?? report.keepVideoAttachment ?? false;
  const isExplicitText = report.reportType === 'text';
  const hasValidVideo = Boolean(report.videoSrc && report.videoSrc.trim() !== '' && report.videoSrc !== '#' && (!isExplicitText || keepVideo));

  // Only auto-generate Persian subtitles if transcript is undefined AND video is attached on creation
  let transcript = report.transcript;
  if (transcript === undefined && hasValidVideo && !isExplicitText) {
    const baseTeam = TEAMS_DATA[teamSlug];
    transcript = generatePersianSubtitlesForReport(report, baseTeam?.name);
  }

  const now = Date.now();
  const reportToSave: ActivityReport = {
    ...report,
    teamSlug,
    reportType: isExplicitText ? 'text' : (report.reportType || (hasValidVideo ? (report.summary && report.summary.length > 50 ? 'hybrid' : 'video') : 'text')),
    transcript: transcript !== undefined ? transcript : [],
    status: report.status || 'published',
    isCustom: true,
    updatedAt: report.updatedAt || now,
    keepVideoAttachment: keepVideo
  };

  if (isExplicitText && !keepVideo) {
    delete reportToSave.videoSrc;
    delete reportToSave.videoHint;
    delete reportToSave.posterSrc;
    if (typeof window !== 'undefined') {
      import('./videoCache').then((m) => m.deleteVideoFromCache(report.id)).catch(() => {});
    }
  } else if (hasValidVideo) {
    reportToSave.videoSrc = report.videoSrc;
    reportToSave.videoHint = report.videoHint;
  }

  if (existingIdx >= 0) {
    teamReports[existingIdx] = reportToSave;
  } else {
    // Check if it exists in TEAMS_DATA
    const baseTeam = TEAMS_DATA[teamSlug];
    const existsInBase = baseTeam?.reports.some((r) => r.id === report.id);
    if (existsInBase) {
      teamReports.push(reportToSave);
    } else {
      // Put new reports on top
      teamReports.unshift(reportToSave);
    }
  }

  customMap[teamSlug] = teamReports;
  if (report.date) {
    try {
      safeSetLocalStorage('mahash_last_activity_date', report.date);
    } catch {}
  }

  saveCustomReportsMap(customMap);

  // Asynchronously mirror into dedicated IndexedDB service without locking UI
  if (typeof window !== 'undefined') {
    indexedDBService.saveReport(reportToSave, teamSlug).catch((e) => {
      console.warn('[IndexedDB Sync Warning] Could not persist report to IndexedDB:', e);
    });
  }
}

/**
 * Detaches / removes video from any report (custom or base) and converts it to a clean text-only report.
 */
export function removeVideoFromReport(reportId: string, teamSlug?: string): boolean {
  const customMap = getCustomReportsMap();
  const now = Date.now();
  let found = false;
  let updatedReportObj: ActivityReport | null = null;
  let resolvedTeamSlug = teamSlug || 'team-thinker';

  // 1. Search in customMap across all slugs
  for (const [slug, list] of Object.entries(customMap)) {
    if (Array.isArray(list)) {
      const idx = list.findIndex((r) => r.id === reportId);
      if (idx >= 0) {
        const rep = list[idx];
        const updated: ActivityReport = {
          ...rep,
          reportType: 'text',
          isCustom: true,
          updatedAt: now,
          keepVideoAttachment: false
        };
        delete updated.videoSrc;
        delete updated.videoHint;
        delete updated.posterSrc;
        list[idx] = updated;
        updatedReportObj = updated;
        resolvedTeamSlug = rep.teamSlug || slug || resolvedTeamSlug;
        found = true;
        break;
      }
    }
  }

  // 2. If not in customMap, search in TEAMS_DATA
  if (!found) {
    // Search in provided teamSlug first, or across all TEAMS_DATA
    const candidateSlugs = teamSlug ? [teamSlug, ...Object.keys(TEAMS_DATA)] : Object.keys(TEAMS_DATA);
    for (const s of candidateSlugs) {
      const baseTeam = TEAMS_DATA[s];
      const baseRep = baseTeam?.reports?.find((r) => r.id === reportId);
      if (baseRep) {
        resolvedTeamSlug = s;
        const updated: ActivityReport = {
          ...baseRep,
          teamSlug: s,
          reportType: 'text',
          isCustom: true,
          updatedAt: now,
          keepVideoAttachment: false
        };
        delete updated.videoSrc;
        delete updated.videoHint;
        delete updated.posterSrc;
        if (!customMap[s]) customMap[s] = [];
        customMap[s].push(updated);
        updatedReportObj = updated;
        found = true;
        break;
      }
    }
  }

  if (found) {
    saveCustomReportsMap(customMap);
    if (typeof window !== 'undefined') {
      try {
        import('./videoCache').then((m) => m.deleteVideoFromCache(reportId)).catch(() => {});
      } catch {}
      if (updatedReportObj) {
        indexedDBService.saveReport(updatedReportObj, resolvedTeamSlug).catch(() => {});
      }
      syncLocalDataToServer().catch(console.warn);
    }

    triggerStoreUpdate();
  }

  return found;
}

// ----------------------------------------------------
// Video Gallery Helper
// ----------------------------------------------------

export function getAllVideoReports(): (ActivityReport & { teamName: string; teamSlug: string })[] {
  const all = getAllReports();
  return all.filter((r) => 
    (r.status === 'published' || !r.status) && 
    r.reportType !== 'text' && 
    Boolean(r.videoSrc && r.videoSrc !== '#' && r.videoSrc.trim() !== '')
  );
}

// ----------------------------------------------------
// Orphaned Media & Storage Health Repair Utility
// ----------------------------------------------------

export interface OrphanScanResult {
  orphanedVideos: { id: string; name: string; size: number; updatedAt: string }[];
  brokenReports: { id: string; title: string; teamSlug: string; videoSrc: string }[];
  staleTextReports: { id: string; title: string; teamSlug: string }[];
  totalScannedReports: number;
  totalCachedVideos: number;
}

export async function scanForOrphanedMedia(): Promise<OrphanScanResult> {
  const allReps = getAllReports();
  const drafts = getSavedDrafts();
  const { getAllCachedVideos } = await import('./videoCache');
  const cachedList = await getAllCachedVideos();

  const activeReportIds = new Set<string>();
  const textReportIds = new Set<string>();

  allReps.forEach((r) => {
    activeReportIds.add(r.id);
    if (r.reportType === 'text' && !r.keepVideoAttachment) {
      textReportIds.add(r.id);
    }
  });

  drafts.forEach((d) => {
    if (d.reportId) activeReportIds.add(d.reportId);
    activeReportIds.add(d.id);
  });

  const orphanedVideos: { id: string; name: string; size: number; updatedAt: string }[] = [];
  const staleTextReports: { id: string; title: string; teamSlug: string }[] = [];

  for (const cv of cachedList) {
    if (!activeReportIds.has(cv.reportId)) {
      orphanedVideos.push({
        id: cv.reportId,
        name: cv.name || `video_${cv.reportId}`,
        size: cv.size || 0,
        updatedAt: cv.updatedAt || ''
      });
    } else if (textReportIds.has(cv.reportId)) {
      const rep = allReps.find((r) => r.id === cv.reportId);
      staleTextReports.push({
        id: cv.reportId,
        title: rep?.title || 'گزارش متنی',
        teamSlug: rep?.teamSlug || 'team-thinker'
      });
    }
  }

  const brokenReports: { id: string; title: string; teamSlug: string; videoSrc: string }[] = [];
  for (const r of allReps) {
    if (r.reportType !== 'text' && r.videoSrc) {
      if (r.videoSrc.startsWith('blob:') || r.videoSrc.startsWith('indexeddb:')) {
        const hasCache = cachedList.some((c) => c.reportId === r.id);
        if (!hasCache) {
          brokenReports.push({
            id: r.id,
            title: r.title,
            teamSlug: r.teamSlug || 'team-thinker',
            videoSrc: r.videoSrc
          });
        }
      }
    }
  }

  return {
    orphanedVideos,
    brokenReports,
    staleTextReports,
    totalScannedReports: allReps.length,
    totalCachedVideos: cachedList.length
  };
}

export async function repairOrphanedMedia(options: {
  deleteOrphans?: boolean;
  clearStaleTextBlobs?: boolean;
  fixBrokenReports?: boolean;
}): Promise<{ deletedCount: number; repairedCount: number }> {
  const { deleteVideoFromCache } = await import('./videoCache');
  const scan = await scanForOrphanedMedia();
  let deletedCount = 0;
  let repairedCount = 0;

  if (options.deleteOrphans) {
    for (const ov of scan.orphanedVideos) {
      await deleteVideoFromCache(ov.id);
      deletedCount++;
    }
  }

  if (options.clearStaleTextBlobs) {
    for (const st of scan.staleTextReports) {
      await deleteVideoFromCache(st.id);
      deletedCount++;
    }
  }

  if (options.fixBrokenReports) {
    for (const br of scan.brokenReports) {
      removeVideoFromReport(br.id, br.teamSlug);
      repairedCount++;
    }
  }

  triggerStoreUpdate();
  syncLocalDataToServer().catch(console.warn);
  return { deletedCount, repairedCount };
}

export function deleteReport(reportId: string, teamSlug?: string): void {
  const customMap = getCustomReportsMap();
  const deletedList = getDeletedReportsList();
  const trashBin = getTrashBinList();
  let modifiedCustom = false;
  let deletedReportObj: any = null;

  // 1. Find existing report to backup into TrashBin (حذف موقت / سطل بازیافت)
  for (const slug of Object.keys(customMap)) {
    if (Array.isArray(customMap[slug])) {
      const found = customMap[slug].find((r) => r.id === reportId);
      if (found) {
        deletedReportObj = { ...found, teamSlug: slug };
      }
      const beforeLen = customMap[slug].length;
      customMap[slug] = customMap[slug].filter((r) => r.id !== reportId);
      if (customMap[slug].length !== beforeLen) {
        modifiedCustom = true;
      }
    }
  }

  // If not found in custom map, search all reports
  if (!deletedReportObj) {
    try {
      const all = getAllReports();
      const match = all.find((r) => r.id === reportId);
      if (match) {
        deletedReportObj = { ...match, teamSlug: teamSlug || match.teamSlug };
      }
    } catch {}
  }

  // 2. Add to Trash Bin for safe soft-deletion recovery
  if (deletedReportObj) {
    const existingTrashIdx = trashBin.findIndex((t) => t.itemId === reportId || t.id === reportId);
    const trashItem: TrashBinItem = {
      id: `trash-${Date.now()}-${reportId}`,
      originalType: 'report',
      itemId: reportId,
      title: deletedReportObj.title || 'گزارش بدون عنوان',
      teamSlug: deletedReportObj.teamSlug || teamSlug,
      data: deletedReportObj,
      deletedBy: 'مدیر سامانه',
      deletedAt: new Date().toISOString()
    };
    if (existingTrashIdx !== -1) {
      trashBin[existingTrashIdx] = trashItem;
    } else {
      trashBin.unshift(trashItem);
    }
    saveTrashBinList(trashBin);
  }

  if (modifiedCustom) {
    saveCustomReportsMap(customMap);
  }

  // 3. Also add to deleted list to suppress default base report if any
  if (!deletedList.includes(reportId)) {
    deletedList.push(reportId);
    saveDeletedReportsList(deletedList);
  }

  // Mirror delete in dedicated IndexedDB service & clean attachments
  if (typeof window !== 'undefined') {
    indexedDBService.deleteReport(reportId).catch(() => {});
    try {
      import('./attachmentsStorage').then((m) => m.deleteAllAttachmentsForReport(reportId)).catch(() => {});
      import('./videoCache').then((m) => m.deleteVideoFromCache(reportId)).catch(() => {});
    } catch {}
  }

  // Reset last activity date if needed
  try {
    const remainingReports = getAllReports();
    if (remainingReports.length > 0 && remainingReports[0].date) {
      safeSetLocalStorage('mahash_last_activity_date', remainingReports[0].date);
    }
  } catch {}

  triggerStoreUpdate();
  syncLocalDataToServer().catch(console.warn);
}

/**
 * Restores a temporarily deleted report from the Trash Bin back to active database storage.
 */
export async function restoreReportFromTrash(reportId: string): Promise<boolean> {
  try {
    const deletedList = getDeletedReportsList();
    const trashBin = getTrashBinList();
    const updatedDeletedList = deletedList.filter((id) => id !== reportId);
    saveDeletedReportsList(updatedDeletedList);

    const trashIdx = trashBin.findIndex((t) => t.itemId === reportId || t.id === reportId);
    let restoredData: any = null;

    if (trashIdx !== -1) {
      const item = trashBin[trashIdx];
      restoredData = item.data;
      trashBin.splice(trashIdx, 1);
      saveTrashBinList(trashBin);

      if (restoredData && restoredData.id) {
        const teamSlug = restoredData.teamSlug || 'thinker';
        const customMap = getCustomReportsMap();
        if (!customMap[teamSlug]) {
          customMap[teamSlug] = [];
        }
        const exists = customMap[teamSlug].some((r) => r.id === restoredData.id);
        if (!exists) {
          customMap[teamSlug].unshift(restoredData);
          saveCustomReportsMap(customMap);
        }

        // Restore to IndexedDB
        if (typeof window !== 'undefined') {
          indexedDBService.saveReport(restoredData).catch(() => {});
        }
      }
    }

    // Call server to restore in MySQL table
    try {
      await fetch('/api/mysql/trash/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: reportId })
      });
    } catch {}

    triggerStoreUpdate();
    syncLocalDataToServer().catch(console.warn);
    return true;
  } catch (err) {
    console.error('Error restoring report from trash:', err);
    return false;
  }
}

/**
 * Permanently empties the Trash Bin in both local cache and MySQL database.
 */
export async function emptyTrashBin(): Promise<void> {
  try {
    saveTrashBinList([]);
    try {
      await fetch('/api/mysql/trash/empty', { method: 'POST' });
    } catch {}
    triggerStoreUpdate();
  } catch (err) {
    console.error('Error emptying trash bin:', err);
  }
}

/**
 * Automatically calculates the next report number for a given team based on the latest entries in the database.
 * Parses existing report titles, report numbers, and IDs to determine the highest existing sequential number.
 */

export function getNextReportNumberForTeam(teamSlug: string): string {
  const teams = getAllTeams();
  const team = teams[teamSlug];
  if (!team || !team.reports || team.reports.length === 0) {
    return 'گزارش ۱';
  }

  let maxNum = 0;
  for (const rep of team.reports) {
    const seq = extractReportSequenceNumber(rep);
    if (seq > maxNum) {
      maxNum = seq;
    }
  }

  const nextNum = maxNum > 0 ? maxNum + 1 : team.reports.length + 1;
  return `گزارش ${toPersianDigits(nextNum)}`;
}

/**
 * Resolves any team slug, ID, or Persian name into its official canonical slug, short ID, and all known aliases.
 */
export function resolveCanonicalTeamIdentifiers(input: string): { slug: string; shortId: string; aliases: string[] } {
  if (!input) return { slug: 'team-thinker', shortId: 'thinker', aliases: ['team-thinker', 'thinker'] };
  const raw = String(input).trim().toLowerCase();
  
  if (raw.includes('angel') || raw.includes('فرشتگان') || raw.includes('fereshte')) {
    return {
      slug: 'team-angels',
      shortId: 'angels',
      aliases: ['team-angels', 'angels', 'fereshtegan', 'fereshteha', 'team-fereshtegan', 'فرشتگان', 'تیم فرشتگان ناشنوایان']
    };
  }
  
  if (raw.includes('ghorban') || raw.includes('قربان') || raw.includes('قربونی') || raw.includes('خادم')) {
    return {
      slug: 'team-ghorbani',
      shortId: 'ghorbani',
      aliases: ['team-ghorbani', 'ghorbani', 'ghorbanikhani', 'ghorbooni', 'khadem', 'khademoshohada', 'team-khadem', 'قربانی', 'قربونی', 'تیم خادم الشهدا']
    };
  }
  
  if (raw.includes('silence') || raw.includes('سکوت') || raw.includes('آوا') || raw.includes('یاوران')) {
    return {
      slug: 'team-silence',
      shortId: 'silence',
      aliases: ['team-silence', 'silence', 'yavaran', 'sokoot', 'avaye-sokoot', 'team-yavaran', 'سکوت', 'آوای سکوت', 'تیم آوای سکوت', 'یاوران سکوت']
    };
  }
  
  if (raw.includes('tomorrow') || raw.includes('فردا') || raw.includes('سازندگان')) {
    return {
      slug: 'team-tomorrow',
      shortId: 'tomorrow',
      aliases: ['team-tomorrow', 'tomorrow', 'farda', 'team-farda', 'سازندگان فردا', 'باشگاه فردا']
    };
  }
  
  if (raw.includes('think') || raw.includes('متفکر') || raw.includes('تفکر')) {
    return {
      slug: 'team-thinker',
      shortId: 'thinker',
      aliases: ['team-thinker', 'thinker', 'moteffaker', 'team-moteffaker', 'مغز متفکر', 'اهل تفکر']
    };
  }
  
  const shortId = raw.replace(/^team-/, '');
  const slug = raw.startsWith('team-') ? raw : `team-${raw}`;
  return { slug, shortId, aliases: [slug, shortId] };
}

export function normalizeConsultantKey(name: string): string {
  if (!name) return '';
  const lower = name.toLowerCase().trim();
  if (name.includes('نازی') || name.includes('نزی') || lower.includes('nazi')) {
    return 'nazi_abbasian';
  }
  if (name.includes('رادین') || name.includes('اورومی') || name.includes('ارومی') || lower.includes('radin')) {
    return 'radin_oroumi';
  }
  return name
    .trim()
    .replace(/^خانم\s+دکتر\s+/g, '')
    .replace(/^دکتر\s+خانم\s+/g, '')
    .replace(/^دکتر\s+/g, '')
    .replace(/^آقای\s+/g, '')
    .replace(/^خانم\s+/g, '')
    .replace(/[\u200c\s]+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();
}

export function updateTeamDetails(teamSlugOrId: string, updates: Partial<TeamData>): void {
  const { slug: normSlug, shortId, aliases } = resolveCanonicalTeamIdentifiers(teamSlugOrId);

  const overrides = getTeamOverrides();
  overrides[normSlug] = {
    ...(overrides[normSlug] || {}),
    ...(overrides[shortId] || {}),
    ...updates
  };
  // Keep shortId and aliases in sync
  overrides[shortId] = {
    ...(overrides[normSlug] || {})
  };
  aliases.forEach((al) => {
    overrides[al] = { ...(overrides[normSlug] || {}) };
  });

  saveTeamOverrides(overrides);
  triggerGlobalCacheBust();
}

export function getTeamLogo(teamSlugOrId: string): string | null {
  if (!teamSlugOrId) return null;
  const { slug: normSlug, shortId, aliases } = resolveCanonicalTeamIdentifiers(teamSlugOrId);

  try {
    const overrides = getTeamOverrides();
    if (overrides[normSlug]?.logo && isCustomImageDataUrlOrUrl(overrides[normSlug].logo)) return overrides[normSlug].logo as string;
    if (overrides[shortId]?.logo && isCustomImageDataUrlOrUrl(overrides[shortId].logo)) return overrides[shortId].logo as string;
    for (const al of aliases) {
      if (overrides[al]?.logo && isCustomImageDataUrlOrUrl(overrides[al].logo)) return overrides[al].logo as string;
    }

    const rawMap = safeGetLocalStorage(TEAM_LOGOS_MAP_KEY);
    if (rawMap) {
      const parsedMap = JSON.parse(rawMap);
      if (parsedMap[normSlug] && isCustomImageDataUrlOrUrl(parsedMap[normSlug])) return parsedMap[normSlug];
      if (parsedMap[shortId] && isCustomImageDataUrlOrUrl(parsedMap[shortId])) return parsedMap[shortId];
      for (const al of aliases) {
        if (parsedMap[al] && isCustomImageDataUrlOrUrl(parsedMap[al])) return parsedMap[al];
      }
    }

    const keysToCheck = [
      `mahash_team_logo_${shortId}`,
      `mahash_team_logo_${normSlug}`,
      `team_logo_${shortId}`,
      `team_logo_${normSlug}`,
      ...aliases.map((al) => `mahash_team_logo_${al}`),
      ...aliases.map((al) => `team_logo_${al}`)
    ];

    for (const key of keysToCheck) {
      const val = safeGetLocalStorage(key);
      if (val && isCustomImageDataUrlOrUrl(val)) return val;
    }

  } catch {}
  return null;
}


export function isTeamLogoSaveRestricted(teamSlugOrId: string): boolean {
  // Allow all youth teams and workgroups to upload and save logos freely
  return false;
}

export function saveTeamLogo(teamSlugOrId: string, logoDataUrl: string): void {
  if (!teamSlugOrId || !logoDataUrl) return;
  if (isTeamLogoSaveRestricted(teamSlugOrId)) {
    console.info(`Saving logo for ${teamSlugOrId} is disabled by user policy.`);
    return;
  }
  const { slug: normSlug, shortId, aliases } = resolveCanonicalTeamIdentifiers(teamSlugOrId);

  // 1. Update team overrides (primary store)
  updateTeamDetails(normSlug, { logo: logoDataUrl });

  // 2. Team logos map persistence (clean single JSON entry)
  try {
    const rawMap = safeGetLocalStorage(TEAM_LOGOS_MAP_KEY);
    const parsedMap = rawMap ? JSON.parse(rawMap) : {};
    parsedMap[normSlug] = logoDataUrl;
    parsedMap[shortId] = logoDataUrl;
    aliases.forEach((al) => {
      parsedMap[al] = logoDataUrl;
    });
    safeSetLocalStorage(TEAM_LOGOS_MAP_KEY, JSON.stringify(parsedMap));

  } catch {}
  // 3. Keep individual localStorage keys in sync to prevent stale fallback recovery
  try {
    safeSetLocalStorage(`mahash_team_logo_${shortId}`, logoDataUrl);
    safeSetLocalStorage(`mahash_team_logo_${normSlug}`, logoDataUrl);
    safeSetLocalStorage(`team_logo_${shortId}`, logoDataUrl);
    safeSetLocalStorage(`team_logo_${normSlug}`, logoDataUrl);
    aliases.forEach((al) => {
      safeSetLocalStorage(`mahash_team_logo_${al}`, logoDataUrl);
      safeSetLocalStorage(`team_logo_${al}`, logoDataUrl);
    });

  } catch {}
  // 4. Keep scores list logo property updated as well
  try {
    const rawScores = getAllScores();
    const updatedScores = rawScores.map((s) => {
      if (s.id === shortId || s.id === normSlug || aliases.includes(s.id)) {
        return { ...s, logo: logoDataUrl };
      }
      return s;
    });
    saveAllScores(updatedScores);

  } catch {}
  // 5. In-memory update of base TEAMS_DATA
  try {
    if (TEAMS_DATA[normSlug]) {
      TEAMS_DATA[normSlug].logo = logoDataUrl;
    }

  } catch {}
  triggerGlobalCacheBust();
  try {
    saveLogoToFirestore(normSlug, logoDataUrl).catch(() => {});
  } catch {}
  try {
    syncLocalDataToServer().catch(() => {});
  } catch {}
}


export function resetTeamLogo(teamSlugOrId: string): void {
  if (!teamSlugOrId) return;
  const { slug: normSlug, shortId, aliases } = resolveCanonicalTeamIdentifiers(teamSlugOrId);

  const overrides = getTeamOverrides();
  if (overrides[normSlug]) {
    delete overrides[normSlug].logo;
  }
  if (overrides[shortId]) {
    delete overrides[shortId].logo;
  }
  aliases.forEach((al) => {
    if (overrides[al]) delete overrides[al].logo;
  });
  saveTeamOverrides(overrides);

  try {
    deleteLogoFromFirestore(normSlug).catch(() => {});

  } catch {}
  try {
    const keysToRemove = [
      `mahash_team_logo_${shortId}`,
      `mahash_team_logo_${normSlug}`,
      `team_logo_${shortId}`,
      `team_logo_${normSlug}`,
      ...aliases.map((al) => `mahash_team_logo_${al}`),
      ...aliases.map((al) => `team_logo_${al}`)
    ];
    keysToRemove.forEach((k) => {
      safeRemoveLocalStorage(k);
    });

  } catch {}
  try {
    const rawMap = safeGetLocalStorage(TEAM_LOGOS_MAP_KEY);
    if (rawMap) {
      const parsedMap = JSON.parse(rawMap);
      delete parsedMap[normSlug];
      delete parsedMap[shortId];
      aliases.forEach((al) => {
        delete parsedMap[al];
      });
      safeSetLocalStorage(TEAM_LOGOS_MAP_KEY, JSON.stringify(parsedMap));
    }

  } catch {}
  // Restore default logo in scores
  try {
    const baseDefault = SCORES_DATA.find((s) => s.id === shortId || s.id === normSlug);
    const rawScores = getAllScores();
    const updatedScores = rawScores.map((s) => {
      if (s.id === shortId || s.id === normSlug || aliases.includes(s.id)) {
        return { ...s, logo: baseDefault?.logo };
      }
      return s;
    });
    saveAllScores(updatedScores);

  } catch {}
  // Reset base TEAMS_DATA
  try {
    if (TEAMS_DATA[normSlug]) {
      TEAMS_DATA[normSlug].logo = TEAMS_DATA[normSlug].logo || '';
    }

  } catch {}
  triggerGlobalCacheBust();
  try {
    syncLocalDataToServer().catch(() => {});
  } catch {}
}

// ----------------------------------------------------
// Member Avatars Management
// ----------------------------------------------------


export function getMemberAvatars(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = safeGetLocalStorage(MEMBER_AVATARS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getMemberAvatar(teamSlugOrId: string, memberName: string, fallbackEmoji: string = '👤'): string {
  if (!memberName || typeof memberName !== 'string') return fallbackEmoji;
  const normSlug = teamSlugOrId ? (teamSlugOrId.startsWith('team-') ? teamSlugOrId : `team-${teamSlugOrId}`) : '';
  const shortId = teamSlugOrId ? teamSlugOrId.replace(/^team-/, '') : '';
  const avatars = getMemberAvatars();
  const trimmed = memberName.trim();
  
  return avatars[`${normSlug}_${trimmed}`] || avatars[`${shortId}_${trimmed}`] || avatars[trimmed] || fallbackEmoji;
}

export function saveMemberAvatar(teamSlugOrId: string, memberName: string, avatarDataUrlOrEmoji: string): void {
  if (!memberName || !avatarDataUrlOrEmoji) return;
  const normSlug = teamSlugOrId ? (teamSlugOrId.startsWith('team-') ? teamSlugOrId : `team-${teamSlugOrId}`) : '';
  const shortId = teamSlugOrId ? teamSlugOrId.replace(/^team-/, '') : '';
  const avatars = getMemberAvatars();
  const trimmed = memberName.trim();

  if (normSlug) avatars[`${normSlug}_${trimmed}`] = avatarDataUrlOrEmoji;
  if (shortId) avatars[`${shortId}_${trimmed}`] = avatarDataUrlOrEmoji;
  avatars[trimmed] = avatarDataUrlOrEmoji;

  try {
    safeSetLocalStorage(MEMBER_AVATARS_KEY, JSON.stringify(avatars));
  } catch (err) {
    console.warn('Failed to save member avatar:', err);
  }
  triggerGlobalCacheBust();
}

export function resetMemberAvatar(teamSlugOrId: string, memberName: string): void {
  if (!memberName) return;
  const normSlug = teamSlugOrId ? (teamSlugOrId.startsWith('team-') ? teamSlugOrId : `team-${teamSlugOrId}`) : '';
  const shortId = teamSlugOrId ? teamSlugOrId.replace(/^team-/, '') : '';
  const avatars = getMemberAvatars();
  const trimmed = memberName.trim();

  if (normSlug) delete avatars[`${normSlug}_${trimmed}`];
  if (shortId) delete avatars[`${shortId}_${trimmed}`];
  delete avatars[trimmed];

  try {
    safeSetLocalStorage(MEMBER_AVATARS_KEY, JSON.stringify(avatars));
  } catch {}
  triggerGlobalCacheBust();
}

// ----------------------------------------------------
// In-Memory Asset Caches for Lightning-Fast Access
// ----------------------------------------------------

let memoryConsultantPhotosCache: Record<string, string> | null = null;
let memoryMahashLogoCache: string | null = null;
let memoryYouthClubBadgeCache: string | null = null;
let memoryConsultantsListCache: Consultant[] | null = null;
let memoryTeamLogosCache: Record<string, string> | null = null;

// ----------------------------------------------------
// Consultants Management
// ----------------------------------------------------

export function getConsultantPhotos(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  if (memoryConsultantPhotosCache) return memoryConsultantPhotosCache;
  try {
    const raw = safeGetLocalStorage(CONSULTANT_PHOTOS_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    memoryConsultantPhotosCache = parsed;
    return parsed;
  } catch {
    return {};
  }
}

export function getConsultantPhoto(consultantName: string, defaultAvatar?: string): string {
  if (!consultantName) return defaultAvatar || '';
  const trimmed = consultantName.trim();
  const normalized = normalizeConsultantKey(trimmed);
  const docId = getCanonicalConsultantDocId(trimmed);
  const photos = getConsultantPhotos();

  if (photos[trimmed] && isCustomImageDataUrlOrUrl(photos[trimmed])) return photos[trimmed];
  if (normalized && photos[normalized] && isCustomImageDataUrlOrUrl(photos[normalized])) return photos[normalized];
  if (docId && photos[docId] && isCustomImageDataUrlOrUrl(photos[docId])) return photos[docId];

  // Check specific alias sets
  if (normalized === 'nazi_abbasian' || docId === 'consultant_nazi_abbasian') {
    const naziKeys = [
      'خانم دکتر نازی عباسیان',
      'دکتر خانم نزی عباسیان',
      'دکتر نازی عباسیان',
      'نازی عباسیان',
      'نزی عباسیان',
      'nazi_abbasian',
      'consultant_nazi_abbasian'
    ];
    for (const k of naziKeys) {
      if (photos[k] && isCustomImageDataUrlOrUrl(photos[k])) return photos[k];
    }
  }

  if (normalized === 'radin_oroumi' || docId === 'consultant_radin_oroumi') {
    const radinKeys = [
      'آقای رادین اورومی',
      'رادین اورومی',
      'رادین ارومی',
      'radin_oroumi',
      'consultant_radin_oroumi'
    ];
    for (const k of radinKeys) {
      if (photos[k] && isCustomImageDataUrlOrUrl(photos[k])) return photos[k];
    }
  }

  try {
    const direct1 = safeGetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(trimmed)}`);
    if (direct1 && isCustomImageDataUrlOrUrl(direct1)) return direct1;
    if (normalized) {
      const direct2 = safeGetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(normalized)}`);
      if (direct2 && isCustomImageDataUrlOrUrl(direct2)) return direct2;
    }
    if (docId) {
      const direct3 = safeGetLocalStorage(`mahash_consultant_photo_${docId}`);
      if (direct3 && isCustomImageDataUrlOrUrl(direct3)) return direct3;
    }

  } catch {}
  const match = Object.keys(photos).find((k) => {
    const normK = normalizeConsultantKey(k);
    return k.includes(trimmed) || trimmed.includes(k) || (normalized && normK && (normK === normalized || normK.includes(normalized) || normalized.includes(normK)));
  });
  if (match && photos[match] && isCustomImageDataUrlOrUrl(photos[match])) return photos[match];

  return defaultAvatar || '';
}


export function isConsultantPhotoSaveRestricted(consultantName?: string): boolean {
  return false;
}

export function saveConsultantPhoto(consultantName: string, photoDataUrl: string): void {
  if (!consultantName || !photoDataUrl) return;
  if (isConsultantPhotoSaveRestricted(consultantName)) {
    console.info(`Saving photo for consultant ${consultantName} is disabled by user policy.`);
    return;
  }
  const trimmed = consultantName.trim();
  const normalized = normalizeConsultantKey(trimmed);
  const docId = getCanonicalConsultantDocId(trimmed);

  const photos = { ...getConsultantPhotos() };
  photos[trimmed] = photoDataUrl;
  if (normalized) {
    photos[normalized] = photoDataUrl;
  }
  if (docId) {
    photos[docId] = photoDataUrl;
  }

  // Populate common aliases for complete resilience
  if (normalized === 'nazi_abbasian' || docId === 'consultant_nazi_abbasian') {
    photos['خانم دکتر نازی عباسیان'] = photoDataUrl;
    photos['دکتر خانم نزی عباسیان'] = photoDataUrl;
    photos['دکتر نازی عباسیان'] = photoDataUrl;
    photos['نازی عباسیان'] = photoDataUrl;
    photos['نزی عباسیان'] = photoDataUrl;
    photos['nazi_abbasian'] = photoDataUrl;
    photos['consultant_nazi_abbasian'] = photoDataUrl;
  } else if (normalized === 'radin_oroumi' || docId === 'consultant_radin_oroumi') {
    photos['آقای رادین اورومی'] = photoDataUrl;
    photos['رادین اورومی'] = photoDataUrl;
    photos['رادین ارومی'] = photoDataUrl;
    photos['radin_oroumi'] = photoDataUrl;
    photos['consultant_radin_oroumi'] = photoDataUrl;
  }

  // Update in-memory cache immediately
  memoryConsultantPhotosCache = photos;
  memoryConsultantsListCache = null;

  try {
    safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(photos));
    safeSetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(trimmed)}`, photoDataUrl);
    if (normalized) {
      safeSetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(normalized)}`, photoDataUrl);
    }
    if (docId) {
      safeSetLocalStorage(`mahash_consultant_photo_${docId}`, photoDataUrl);
    }
  } catch (err) {
    console.warn('Failed to save consultant photo locally:', err);
  }

  // Persist directly to Firestore asynchronously
  try {
    saveConsultantPhotoToFirestore(consultantName, photoDataUrl).catch((cloudErr) => {
      console.warn('Background Firestore save notice for consultant photo:', cloudErr);
    });

  } catch {}
  // Also update in consultants storage list
  try {
    const list = getAllConsultants();
    const updated = list.map((c) => {
      const cNorm = normalizeConsultantKey(c.name);
      if (c.name.trim() === trimmed || (normalized && cNorm === normalized) || getCanonicalConsultantDocId(c.name) === docId) {
        return { ...c, image: photoDataUrl };
      }
      return c;
    });
    saveAllConsultants(updated);

  } catch {}
  triggerGlobalCacheBust();
}


export function resetConsultantPhoto(consultantName: string): void {
  if (!consultantName) return;
  const trimmed = consultantName.trim();
  const normalized = normalizeConsultantKey(trimmed);
  const docId = getCanonicalConsultantDocId(trimmed);

  const photos = { ...getConsultantPhotos() };
  delete photos[trimmed];
  if (normalized) delete photos[normalized];
  if (docId) delete photos[docId];

  if (normalized === 'nazi_abbasian' || docId === 'consultant_nazi_abbasian') {
    delete photos['خانم دکتر نازی عباسیان'];
    delete photos['دکتر خانم نزی عباسیان'];
    delete photos['دکتر نازی عباسیان'];
    delete photos['نازی عباسیان'];
    delete photos['نزی عباسیان'];
    delete photos['nazi_abbasian'];
    delete photos['consultant_nazi_abbasian'];
  } else if (normalized === 'radin_oroumi' || docId === 'consultant_radin_oroumi') {
    delete photos['آقای رادین اورومی'];
    delete photos['رادین اورومی'];
    delete photos['رادین ارومی'];
    delete photos['radin_oroumi'];
    delete photos['consultant_radin_oroumi'];
  }

  memoryConsultantPhotosCache = photos;
  memoryConsultantsListCache = null;

  try {
    safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(photos));
    safeRemoveLocalStorage(`mahash_consultant_photo_${encodeURIComponent(trimmed)}`);
    if (normalized) {
      safeRemoveLocalStorage(`mahash_consultant_photo_${encodeURIComponent(normalized)}`);
    }
    if (docId) {
      safeRemoveLocalStorage(`mahash_consultant_photo_${docId}`);
    }

  } catch {}
  // Delete from Firestore
  try {
    deleteConsultantPhotoFromFirestore(consultantName).catch(() => {});

  } catch {}
  // Also reset in consultants storage list
  try {
    const list = getAllConsultants();
    const updated = list.map((c) => {
      const cNorm = normalizeConsultantKey(c.name);
      if (c.name.trim() === trimmed || (normalized && cNorm === normalized) || getCanonicalConsultantDocId(c.name) === docId) {
        const copy = { ...c };
        delete copy.image;
        return copy;
      }
      return c;
    });
    saveAllConsultants(updated);

  } catch {}
  triggerGlobalCacheBust();
}


export function getAllConsultants(): Consultant[] {
  if (typeof window === 'undefined') return CONSULTANTS;
  if (memoryConsultantsListCache) return memoryConsultantsListCache;
  try {
    const raw = safeGetLocalStorage(CONSULTANTS_STORAGE_KEY);
    const photos = getConsultantPhotos();
    let baseList = CONSULTANTS;
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        baseList = parsed;
      }
    }
    const result = baseList.map((c, idx) => {
      const defaultImg = idx === 0 ? NAZI_AVATAR_SVG : (c.image || RADIN_AVATAR_SVG);
      return {
        ...c,
        image: photos[c.name.trim()] || c.image || defaultImg
      };
    });
    memoryConsultantsListCache = result;
    return result;
  } catch {
    return CONSULTANTS;
  }
}

export function saveAllConsultants(consultants: Consultant[]): void {
  memoryConsultantsListCache = consultants;
  try {
    safeSetLocalStorage(CONSULTANTS_STORAGE_KEY, JSON.stringify(consultants));
  } catch {}
  triggerGlobalCacheBust();
}


export function updateConsultantInfo(consultantName: string, updates: Partial<Consultant>): void {
  const currentList = getAllConsultants();
  const trimmed = consultantName.trim();
  const updatedList = currentList.map((c) => {
    if (c.name.trim() === trimmed || c.name.includes(trimmed)) {
      return { ...c, ...updates };
    }
    return c;
  });
  saveAllConsultants(updatedList);
}

export function addConsultant(consultant: Consultant): void {
  const currentList = getAllConsultants();
  currentList.push(consultant);
  saveAllConsultants(currentList);
}

export function deleteConsultant(consultantName: string): void {
  const currentList = getAllConsultants();
  const trimmed = consultantName.trim();
  const updatedList = currentList.filter((c) => c.name.trim() !== trimmed);
  saveAllConsultants(updatedList);
  resetConsultantPhoto(consultantName);
}

// ----------------------------------------------------
// Scores Management
// ----------------------------------------------------

export function getAllScores(): ScoreItem[] {
  autoRecoverAllSavedLogos();
  let list: ScoreItem[] = SCORES_DATA;
  try {
    const raw = safeGetLocalStorage(SCORES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        list = parsed;
      }
    }

  } catch {}
  const overrides = getTeamOverrides();

  // Merge any custom team logo from overrides to ensure scores table always has latest photo/logo
  return list.map((item) => {
    const normSlug = item.id.startsWith('team-') ? item.id : `team-${item.id}`;
    const shortId = item.id.replace(/^team-/, '');
    const override = overrides[normSlug] || overrides[shortId];
    if (override?.logo && isCustomImageDataUrlOrUrl(override.logo)) {
      return { ...item, logo: override.logo };
    }
    try {
      const indVal = safeGetLocalStorage(`mahash_team_logo_${shortId}`) || safeGetLocalStorage(`mahash_team_logo_${normSlug}`);
      if (indVal && isCustomImageDataUrlOrUrl(indVal)) {
        return { ...item, logo: indVal };
      }
    } catch {}
    return item;

  });
}

export function saveAllScores(scores: ScoreItem[]): void {
  safeSetLocalStorage(SCORES_KEY, JSON.stringify(scores));
  triggerStoreUpdate();
}

export function updateTeamScore(teamId: string, newScore: number): void {
  const currentScores = getAllScores();
  const updated = currentScores.map((s) => (s.id === teamId ? { ...s, score: newScore } : s));
  // Keep sorted descending by score
  updated.sort((a, b) => b.score - a.score);
  saveAllScores(updated);
  triggerGlobalCacheBust();
}

// ----------------------------------------------------
// Events & Workshops Management
// ----------------------------------------------------

export function getAllEvents(): EventItem[] {
  try {
    const raw = safeGetLocalStorage(EVENTS_KEY);
    if (raw !== null) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return EVENTS_DATA;
}


export function saveEvent(event: EventItem): void {
  const currentEvents = getAllEvents();
  const idx = currentEvents.findIndex((e) => e.id === event.id);
  let updated: EventItem[];
  if (idx >= 0) {
    updated = [...currentEvents];
    updated[idx] = event;
  } else {
    updated = [event, ...currentEvents];
  }
  safeSetLocalStorage(EVENTS_KEY, JSON.stringify(updated));
  triggerStoreUpdate();
}

export function deleteEvent(eventId: string): void {
  const currentEvents = getAllEvents();
  const updated = currentEvents.filter((e) => e.id !== eventId);
  safeSetLocalStorage(EVENTS_KEY, JSON.stringify(updated));
  triggerStoreUpdate();
}

// ----------------------------------------------------
// Video Views & Analytics Management
// ----------------------------------------------------

export function getAllReportViews(): Record<string, number> {
  try {
    const raw = safeGetLocalStorage(VIEWS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_VIEWS, ...parsed };
    }
  } catch {}
  return { ...DEFAULT_VIEWS };
}


export function getReportViews(reportId: string): number {
  if (!reportId) return 0;
  const views = getAllReportViews();
  return views[reportId] ?? 0;
}

export function incrementReportViews(reportId: string): number {
  if (!reportId) return 0;
  const views = getAllReportViews();
  const current = views[reportId] ?? 0;
  const next = current + 1;
  views[reportId] = next;
  safeSetLocalStorage(VIEWS_KEY, JSON.stringify(views));
  triggerStoreUpdate();
  return next;
}

export function setReportViews(reportId: string, count: number): void {
  if (!reportId) return;
  const views = getAllReportViews();
  views[reportId] = Math.max(0, count);
  safeSetLocalStorage(VIEWS_KEY, JSON.stringify(views));
  triggerStoreUpdate();
}

// ----------------------------------------------------
// Server Store Synchronization & Cloud Persistence
// ----------------------------------------------------


let hasLoadedFromServer = false;
let lastStoreUpdatedAt: string | null = null;

export async function fetchAndMergeServerStore(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    let serverData: any = {};
    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 3500);

    const storeUrl = '/api/store' + (lastStoreUpdatedAt ? `?since=${encodeURIComponent(lastStoreUpdatedAt)}` : '');
    const apiStorePromise = fetch(storeUrl, { signal: controller.signal })
      .then(r => r.ok ? r.json() : null)
      .catch(() => null)
      .finally(() => clearTimeout(fetchTimeout));

    const apiStoreData = await apiStorePromise;

    // Fast-path: If server data has not changed since last poll, skip heavy parsing
    if (apiStoreData && apiStoreData.unchanged === true) {
      return false;
    }

    if (apiStoreData && typeof apiStoreData === 'object') {
      serverData = { ...apiStoreData };
      if (apiStoreData.updatedAt) {
        lastStoreUpdatedAt = apiStoreData.updatedAt;
      }
    } else {
      return false;
    }

    // Merge in server endpoint data as fallback or supplementary
    if (apiStoreData && typeof apiStoreData === 'object') {
      if (apiStoreData.teamLogos && (!serverData.teamLogos || Object.keys(serverData.teamLogos).length === 0)) {
        serverData.teamLogos = apiStoreData.teamLogos;
      }
      if (apiStoreData.teamOverrides && (!serverData.teamOverrides || Object.keys(serverData.teamOverrides).length === 0)) {
        serverData.teamOverrides = apiStoreData.teamOverrides;
      }
      if (apiStoreData.customReports && (!serverData.customReports || serverData.customReports.length === 0)) {
        serverData.customReports = apiStoreData.customReports;
      }
      if (apiStoreData.scores && (!serverData.scores || serverData.scores.length === 0)) {
        serverData.scores = apiStoreData.scores;
      }
      if (apiStoreData.events && (!serverData.events || serverData.events.length === 0)) {
        serverData.events = apiStoreData.events;
      }
      if (apiStoreData.mahashLogo && !serverData.mahashLogo) {
        serverData.mahashLogo = apiStoreData.mahashLogo;
      }
      if (apiStoreData.clubEmblem && !serverData.clubEmblem) {
        serverData.clubEmblem = apiStoreData.clubEmblem;
      }
      if (apiStoreData.consultantPhotos && (!serverData.consultantPhotos || Object.keys(serverData.consultantPhotos).length === 0)) {
        serverData.consultantPhotos = apiStoreData.consultantPhotos;
      }
      if (apiStoreData.consultantsList && (!serverData.consultantsList || serverData.consultantsList.length === 0)) {
        serverData.consultantsList = apiStoreData.consultantsList;
      }
      if (apiStoreData.memberAvatars && (!serverData.memberAvatars || Object.keys(serverData.memberAvatars).length === 0)) {
        serverData.memberAvatars = apiStoreData.memberAvatars;
      }
    }

    let modified = false;
    let needsPushToServer = false;

    // Auto-restore from admin browser if server is wiped (Serverless container restart recovery)
    if (Object.keys(serverData.teamLogos || {}).length === 0) {
      const localLogos = safeGetLocalStorage('mahash_team_logos_map');
      if (localLogos && Object.keys(JSON.parse(localLogos)).length > 0) {
        needsPushToServer = true;
      }
    }

    const currentMahash = safeGetLocalStorage(MAHASH_LOGO_KEY);
    if (currentMahash && isCustomImageDataUrlOrUrl(currentMahash) && (!serverData.mahashLogo || !isCustomImageDataUrlOrUrl(serverData.mahashLogo))) {
      needsPushToServer = true;
    }

    const currentClub = safeGetLocalStorage(CLUB_EMBLEM_KEY);
    if (currentClub && isCustomImageDataUrlOrUrl(currentClub) && (!serverData.clubEmblem || !isCustomImageDataUrlOrUrl(serverData.clubEmblem))) {
      needsPushToServer = true;
    }

    // Merge team logos
    if (serverData.teamLogos && typeof serverData.teamLogos === 'object' && Object.keys(serverData.teamLogos).length > 0) {
      const rawMap = safeGetLocalStorage(TEAM_LOGOS_MAP_KEY);
      const parsedMap = rawMap ? JSON.parse(rawMap) : {};
      Object.entries(serverData.teamLogos).forEach(([k, v]) => {
        if (typeof v === 'string' && v.trim()) {
          parsedMap[k] = v;
        }
      });
      safeSetLocalStorage(TEAM_LOGOS_MAP_KEY, JSON.stringify(parsedMap));
      modified = true;
    }

    // Merge team overrides
    if (serverData.teamOverrides && typeof serverData.teamOverrides === 'object' && Object.keys(serverData.teamOverrides).length > 0) {
      const rawOverrides = safeGetLocalStorage(TEAM_OVERRIDES_KEY);
      const parsedOverrides = rawOverrides ? JSON.parse(rawOverrides) : {};
      Object.entries(serverData.teamOverrides).forEach(([k, v]) => {
        parsedOverrides[k] = { ...(parsedOverrides[k] || {}), ...(v as any) };
      });
      safeSetLocalStorage(TEAM_OVERRIDES_KEY, JSON.stringify(parsedOverrides));
      modified = true;
    }

    // Merge deleted reports first so deleted items are known
    const currentDeleted = getDeletedReportsList();
    const activeDeletedSet = new Set<string>(currentDeleted);
    if (serverData.deletedReports && Array.isArray(serverData.deletedReports)) {
      serverData.deletedReports.forEach((id: string) => activeDeletedSet.add(id));
    }
    if (apiStoreData?.deletedReports && Array.isArray(apiStoreData.deletedReports)) {
      apiStoreData.deletedReports.forEach((id: string) => activeDeletedSet.add(id));
    }
    if (activeDeletedSet.size > currentDeleted.length) {
      safeSetLocalStorage(DELETED_REPORTS_KEY, JSON.stringify(Array.from(activeDeletedSet)));
      modified = true;
    }

    // Combine custom reports from both Firebase and the backend server /api/store
    const allCustomReportsRaw: any[] = [];
    if (serverData.customReports && Array.isArray(serverData.customReports)) {
      allCustomReportsRaw.push(...serverData.customReports);
    }
    if (apiStoreData && Array.isArray(apiStoreData.customReports)) {
      allCustomReportsRaw.push(...apiStoreData.customReports);
    }

    if (allCustomReportsRaw.length > 0) {
      const currentMap = getCustomReportsMap();
      const grouped: Record<string, any[]> = { ...currentMap };

      // Deduplicate server reports by selecting highest updatedAt or latest
      const serverReportsById = new Map<string, any>();
      allCustomReportsRaw.forEach((r: any) => {
        if (!r || !r.id || activeDeletedSet.has(r.id)) return;
        const existing = serverReportsById.get(r.id);
        if (!existing) {
          serverReportsById.set(r.id, r);
        } else {
          const existingTime = existing.updatedAt || 0;
          const currTime = r.updatedAt || 0;
          if (currTime >= existingTime) {
            serverReportsById.set(r.id, r);
          }
        }
      });

      serverReportsById.forEach((r) => {
        const rawSlug = r.teamSlug || (r.teamId ? (r.teamId.startsWith('team-') ? r.teamId : `team-${r.teamId}`) : (r.id ? `team-${r.id.split('-')[0]}` : 'team-thinker'));
        const teamSlug = rawSlug.startsWith('team-') ? rawSlug : `team-${rawSlug}`;
        
        const isTextReport = r.reportType === 'text' || !r.videoSrc || r.videoSrc === '#' || r.videoSrc.trim() === '';
        const sanitizedReport: ActivityReport & { teamSlug?: string } = {
          ...r,
          teamSlug,
          status: r.status || 'published',
          reportType: isTextReport ? 'text' : (r.reportType || 'video'),
          videoSrc: isTextReport ? undefined : ((r.videoSrc && !r.videoSrc.startsWith('blob:')) ? r.videoSrc : undefined),
          videoHint: isTextReport ? undefined : r.videoHint
        };
        if (isTextReport) {
          delete sanitizedReport.videoSrc;
          delete sanitizedReport.videoHint;
        }

        if (teamSlug) {
          if (!grouped[teamSlug]) grouped[teamSlug] = [];
          const existingIdx = grouped[teamSlug].findIndex((x: any) => x.id === sanitizedReport.id);
          if (existingIdx >= 0) {
            const localRep = grouped[teamSlug][existingIdx];
            const localUpdated = localRep.updatedAt || 0;
            const serverUpdated = sanitizedReport.updatedAt || 0;

            // If local report has newer changes, preserve local and schedule push to sync server
            if (localUpdated > serverUpdated) {
              needsPushToServer = true;
              return;
            }

            // Ensure local video and rich report content are permanently preserved unless server has explicit newer update WITH a valid video
            const hasLocalVideo = Boolean(localRep.videoSrc && localRep.videoSrc !== '#' && localRep.videoSrc.trim() !== '' && !localRep.videoSrc.startsWith('blob:'));
            const hasServerVideo = Boolean(sanitizedReport.videoSrc && sanitizedReport.videoSrc !== '#' && sanitizedReport.videoSrc.trim() !== '' && !sanitizedReport.videoSrc.startsWith('blob:'));

            grouped[teamSlug][existingIdx] = {
              ...sanitizedReport,
              ...localRep,
              videoSrc: hasLocalVideo ? localRep.videoSrc : (hasServerVideo ? sanitizedReport.videoSrc : localRep.videoSrc),
              videoHint: localRep.videoHint || sanitizedReport.videoHint,
              posterSrc: localRep.posterSrc || sanitizedReport.posterSrc,
              transcript: (localRep.transcript && localRep.transcript.length > 0) ? localRep.transcript : sanitizedReport.transcript,
              reportType: (hasLocalVideo || localRep.reportType === 'video' || localRep.reportType === 'hybrid') ? (localRep.reportType || 'video') : sanitizedReport.reportType
            };
          } else {
            grouped[teamSlug].push(sanitizedReport);
          }
          // Mirror to IndexedDB service for local offline persistence
          try {
            indexedDBService.saveReport(sanitizedReport, teamSlug).catch(() => {});
          } catch {}
        }

      });
      safeSetLocalStorage(CUSTOM_REPORTS_KEY, JSON.stringify(grouped));
      modified = true;
    }

    if (needsPushToServer && typeof window !== 'undefined') {
      setTimeout(() => {
        syncLocalDataToServer().catch(console.warn);
      }, 500);
    }

    if (serverData.deletedReports && Array.isArray(serverData.deletedReports) && serverData.deletedReports.length > 0) {
      safeSetLocalStorage(DELETED_REPORTS_KEY, JSON.stringify(serverData.deletedReports));
      modified = true;
    }

    if (serverData.trashBin && Array.isArray(serverData.trashBin)) {
      safeSetLocalStorage(TRASH_BIN_KEY, JSON.stringify(serverData.trashBin));
      modified = true;
    }

    if (serverData.scores && Array.isArray(serverData.scores) && serverData.scores.length > 0) {
      safeSetLocalStorage(SCORES_KEY, JSON.stringify(serverData.scores));
      modified = true;
    }

    if (serverData.events && Array.isArray(serverData.events) && serverData.events.length > 0) {
      safeSetLocalStorage(EVENTS_KEY, JSON.stringify(serverData.events));
      modified = true;
    }
    
    if (serverData.customBadges && Array.isArray(serverData.customBadges) && serverData.customBadges.length > 0) {
      safeSetLocalStorage('mahash_custom_badges_v1', JSON.stringify(serverData.customBadges));
      modified = true;
    }

    if (serverData.consultantPhotos && Object.keys(serverData.consultantPhotos).length > 0) {
      const currentPhotos = getConsultantPhotos();
      const mergedPhotos = { ...currentPhotos, ...serverData.consultantPhotos };
      safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(mergedPhotos));
      modified = true;
    }

    if (serverData.consultantsList && Array.isArray(serverData.consultantsList) && serverData.consultantsList.length > 0) {
      safeSetLocalStorage(CONSULTANTS_STORAGE_KEY, JSON.stringify(serverData.consultantsList));
      modified = true;
    }

    if (serverData.memberAvatars && Object.keys(serverData.memberAvatars).length > 0) {
      const currentAvatars = getMemberAvatars();
      const mergedAvatars = { ...currentAvatars, ...serverData.memberAvatars };
      safeSetLocalStorage(MEMBER_AVATARS_KEY, JSON.stringify(mergedAvatars));
      modified = true;
    }

    if (serverData.mahashLogo && isCustomImageDataUrlOrUrl(serverData.mahashLogo)) {
      safeSetLocalStorage(MAHASH_LOGO_KEY, serverData.mahashLogo);
      for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
        safeSetLocalStorage(mKey, serverData.mahashLogo);
      }
      modified = true;
    }
    
    if (serverData.clubEmblem && isCustomImageDataUrlOrUrl(serverData.clubEmblem)) {
      safeSetLocalStorage(CLUB_EMBLEM_KEY, serverData.clubEmblem);
      for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
        safeSetLocalStorage(cKey, serverData.clubEmblem);
      }
      modified = true;
    }

    if (modified) {
      triggerGlobalCacheBust(false);
    }
    
    if (needsPushToServer) {
      console.log('Server is empty, but local data exists. Pushing recovery data to MySQL...');
      setTimeout(() => syncLocalDataToServer(), 1000);
    }

    return true;
  } catch (err) {
    console.warn('[reportsStore] Could not fetch server store:', err);
    return false;
  }
}


let syncTimeout: any = null;
let pendingResolvers: Array<(val: boolean) => void> = [];

const yieldToMain = () => new Promise(r => setTimeout(r, 10));

export async function syncLocalDataToServer(
  onProgress?: (progress: number, step: string) => void,
  debounceMs = 200
): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  return new Promise((resolve) => {
    pendingResolvers.push(resolve);
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      const resolversToCall = [...pendingResolvers];
      pendingResolvers = [];
      try {
        const pStart = performance.now();
        let stepStart = performance.now();
        const profile = (name: string) => {
            const now = performance.now();
            console.log(`[Profile] ${name}: ${(now - stepStart).toFixed(2)}ms`);
            stepStart = now;
        };

        if (onProgress) onProgress(5, 'پاکسازی کش‌های قدیمی و بلااستفاده...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 5, message: 'پاکسازی کش‌های قدیمی و بلااستفاده...' });
        
        await runGarbageCollection();
        profile('Cache Cleanup');
        
        if (onProgress) onProgress(15, 'جمع‌آوری و تجمیع اطلاعات لوگوها و تصاویر تیم‌ها...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 15, message: 'جمع‌آوری و تجمیع اطلاعات لوگوها و تصاویر تیم‌ها...' });
        await yieldToMain();
        const rawMap = safeGetLocalStorage(TEAM_LOGOS_MAP_KEY);
        const parsedMap = rawMap ? JSON.parse(rawMap) : {};
        
        const officialShortIds = ['thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'];
        officialShortIds.forEach((shortId) => {
          const slug = `team-${shortId}`;
          const indVal = safeGetLocalStorage(`mahash_team_logo_${shortId}`) || 
                         safeGetLocalStorage(`mahash_team_logo_${slug}`) ||
                         safeGetLocalStorage(`team_logo_${shortId}`);
          if (indVal && isCustomImageDataUrlOrUrl(indVal)) {
            parsedMap[slug] = indVal;
            parsedMap[shortId] = indVal;
          }
        });

        const teamOverrides = getTeamOverrides();
        const mahashLogo = safeGetLocalStorage(MAHASH_LOGO_KEY);
        const clubEmblem = safeGetLocalStorage(CLUB_EMBLEM_KEY);
        
        if (onProgress) onProgress(25, 'آماده‌سازی گزارش‌ها و امتیازات...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 25, message: 'آماده‌سازی گزارش‌ها و امتیازات...' });

        await yieldToMain();
        const customReportsMap = getCustomReportsMap();
        const customReports = Object.values(customReportsMap).flat();
        
        const deletedReports = getDeletedReportsList();
        const trashBin = getTrashBinList();
        const scores = getAllScores();
        const events = getAllEvents();
        
        const customBadgesRaw = safeGetLocalStorage('mahash_custom_badges_v1');
        const customBadges = customBadgesRaw ? JSON.parse(customBadgesRaw) : [];

        const consultantPhotosRaw = safeGetLocalStorage(CONSULTANT_PHOTOS_KEY);
        const consultantPhotos = consultantPhotosRaw ? JSON.parse(consultantPhotosRaw) : {};

        const consultantsListRaw = safeGetLocalStorage(CONSULTANTS_STORAGE_KEY);
        const consultantsList = consultantsListRaw ? JSON.parse(consultantsListRaw) : [];

        const memberAvatarsRaw = safeGetLocalStorage(MEMBER_AVATARS_KEY);
        const memberAvatars = memberAvatarsRaw ? JSON.parse(memberAvatarsRaw) : {};

        profile('Processing Reports');
        if (onProgress) onProgress(35, 'فشرده‌سازی اطلاعات و آماده‌سازی برای ارسال شبکه...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 35, message: 'فشرده‌سازی اطلاعات و آماده‌سازی برای ارسال شبکه...' });

        await yieldToMain();
        const payload = {
          teamLogos: parsedMap,
          teamOverrides,
          mahashLogo,
          clubEmblem,
          customReports,
          deletedReports,
          trashBin,
          scores,
          events,
          customBadges,
          consultantPhotos,
          consultantsList,
          memberAvatars
        };

        profile('Assemble Payload');
        if (onProgress) onProgress(40, 'شروع ذخیره‌سازی مستقیم در پایگاه داده MySQL...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 40, message: 'شروع ذخیره‌سازی مستقیم در پایگاه داده MySQL...' });
        await yieldToMain();

        const uploadStart = performance.now();
        
        if (onProgress) onProgress(65, 'در حال نگارش و ثبت دائمی اطلاعات در جداول MySQL...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 65, message: 'در حال نگارش و ثبت دائمی اطلاعات در جداول MySQL...' });
        
        // Direct permanent write to MySQL database via /api/store
        let saveSuccess = false;
        try {
          const res = await fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
          if (res.ok) {
            saveSuccess = true;
          }
        } catch (postErr) {
          console.warn('[reportsStore] Direct MySQL save warning:', postErr);
        }

        try {
          await syncToWordPressAPI("FULL_SYNC", payload);
        } catch {}
        
        console.log(`[Profile] Total Direct MySQL Sync time: ${(performance.now() - uploadStart).toFixed(2)}ms`);
        if (onProgress) onProgress(100, 'اطلاعات با موفقیت در پایگاه داده MySQL ذخیره و ثبت دائم شد.');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 100, message: 'اطلاعات با موفقیت در پایگاه داده MySQL ذخیره و ثبت دائم شد.' });
        await yieldToMain();
        setTimeout(() => globalEventBus.emit('SYNC_PROGRESS', { visible: false }), 2000);
        resolversToCall.forEach(res => res(true));
      } catch (err) {
        console.warn('[reportsStore] Failed to sync data to MySQL:', err);
        globalEventBus.emit('SYNC_PROGRESS', { visible: false });
        resolversToCall.forEach(res => res(false));
      }
    }, debounceMs);
  });
}

// Reset report views
export function resetReportViews(): void {
  safeRemoveLocalStorage(VIEWS_KEY);
  triggerStoreUpdate();
}

// ----------------------------------------------------
// Mahash Institution & Youth Club Badges
// ----------------------------------------------------

export function getMahashLogo(): string {
  if (typeof window === 'undefined') return MAHESH_LOGO_SVG;
  if (memoryMahashLogoCache && isCustomImageDataUrlOrUrl(memoryMahashLogoCache)) {
    return memoryMahashLogoCache;
  }
  autoRecoverAllSavedLogos();
  const saved = safeGetLocalStorage(MAHASH_LOGO_KEY);
  if (saved && isCustomImageDataUrlOrUrl(saved)) {
    memoryMahashLogoCache = saved;
    return saved;
  }
  for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
    const legacy = safeGetLocalStorage(mKey);
    if (legacy && isCustomImageDataUrlOrUrl(legacy)) {
      memoryMahashLogoCache = legacy;
      return legacy;
    }
  }
  const fallback = saved || MAHESH_LOGO_SVG;
  memoryMahashLogoCache = fallback;
  return fallback;
}

export function setMahashLogo(logo: string): void {
  if (typeof window === 'undefined') return;
  memoryMahashLogoCache = logo || MAHESH_LOGO_SVG;
  if (!logo) {
    safeRemoveLocalStorage(MAHASH_LOGO_KEY);
    for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
      safeRemoveLocalStorage(mKey);
    }
  } else {
    safeSetLocalStorage(MAHASH_LOGO_KEY, logo);
    for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
      safeSetLocalStorage(mKey, logo);
    }
  }
  triggerGlobalCacheBust();
  try {
    saveMahashLogoToFirestore(logo || '').catch(() => {});
  } catch {}
  try {
    syncLocalDataToServer().catch(() => {});
  } catch {}
}


export function resetMahashLogo(): void {
  if (typeof window === 'undefined') return;
  memoryMahashLogoCache = MAHESH_LOGO_SVG;
  safeRemoveLocalStorage(MAHASH_LOGO_KEY);
  for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
    safeRemoveLocalStorage(mKey);
  }
  triggerGlobalCacheBust();
  try {
    saveMahashLogoToFirestore('').catch(() => {});
  } catch {}
  try {
    syncLocalDataToServer().catch(() => {});
  } catch {}
}


export function getYouthClubBadge(): string {
  if (typeof window === 'undefined') return MAHESH_CLUB_EMBLEM_SVG;
  if (memoryYouthClubBadgeCache && isCustomImageDataUrlOrUrl(memoryYouthClubBadgeCache)) {
    return memoryYouthClubBadgeCache;
  }
  autoRecoverAllSavedLogos();
  const saved = safeGetLocalStorage(CLUB_EMBLEM_KEY);
  if (saved && isCustomImageDataUrlOrUrl(saved)) {
    memoryYouthClubBadgeCache = saved;
    return saved;
  }
  for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
    const legacy = safeGetLocalStorage(cKey);
    if (legacy && isCustomImageDataUrlOrUrl(legacy)) {
      memoryYouthClubBadgeCache = legacy;
      return legacy;
    }
  }
  const fallback = saved || MAHESH_CLUB_EMBLEM_SVG;
  memoryYouthClubBadgeCache = fallback;
  return fallback;
}

export function setYouthClubBadge(badge: string): void {
  if (typeof window === 'undefined') return;
  memoryYouthClubBadgeCache = badge || MAHESH_CLUB_EMBLEM_SVG;
  if (!badge) {
    safeRemoveLocalStorage(CLUB_EMBLEM_KEY);
    for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
      safeRemoveLocalStorage(cKey);
    }
  } else {
    safeSetLocalStorage(CLUB_EMBLEM_KEY, badge);
    for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
      safeSetLocalStorage(cKey, badge);
    }
  }
  triggerGlobalCacheBust();
  try {
    saveYouthClubEmblemToFirestore(badge || '').catch(() => {});
  } catch {}
  try {
    syncLocalDataToServer().catch(() => {});
  } catch {}
}


export function resetYouthClubBadge(): void {
  if (typeof window === 'undefined') return;
  memoryYouthClubBadgeCache = MAHESH_CLUB_EMBLEM_SVG;
  safeRemoveLocalStorage(CLUB_EMBLEM_KEY);
  for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
    safeRemoveLocalStorage(cKey);
  }
  triggerGlobalCacheBust();
  try {
    saveYouthClubEmblemToFirestore('').catch(() => {});
  } catch {}
  try {
    syncLocalDataToServer().catch(() => {});
  } catch {}
}


export function resetAllDataToDefault(): void {
  safeRemoveLocalStorage(CUSTOM_REPORTS_KEY);
  safeRemoveLocalStorage(DELETED_REPORTS_KEY);
  safeRemoveLocalStorage(TEAM_OVERRIDES_KEY);
  safeRemoveLocalStorage(SCORES_KEY);
  safeRemoveLocalStorage(EVENTS_KEY);
  safeRemoveLocalStorage(VIEWS_KEY);
  safeRemoveLocalStorage(MAHASH_LOGO_KEY);
  safeRemoveLocalStorage(CLUB_EMBLEM_KEY);
  safeRemoveLocalStorage('mahash_last_activity_date');
  triggerStoreUpdate();
}

export function exportBackupJSON(): string {
  const customReports = getCustomReportsMap();
  const deletedReports = getDeletedReportsList();
  const teamOverrides = getTeamOverrides();
  const scores = getAllScores();
  const events = getAllEvents();
  const views = getAllReportViews();
  const mahashLogo = getMahashLogo();
  const youthClubBadge = getYouthClubBadge();
  const consultantPhotos = getConsultantPhotos();
  const consultantsList = getAllConsultants();
  const memberAvatars = getMemberAvatars();

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      consultantPhotos,
      consultantsList,
      memberAvatars,
      customReports,
      deletedReports,
      teamOverrides,
      scores,
      events,
      views,
      mahashLogo,
      youthClubBadge
    },
    null,
    2
  );
}

export function importBackupJSON(jsonStr: string): boolean {
  try {
    const data = JSON.parse(jsonStr);
    if (data.customReports) saveCustomReportsMap(data.customReports);
    if (data.deletedReports) saveDeletedReportsList(data.deletedReports);
    if (data.teamOverrides) saveTeamOverrides(data.teamOverrides);
    if (data.scores) saveAllScores(data.scores);
    if (data.events) safeSetLocalStorage(EVENTS_KEY, JSON.stringify(data.events));
    if (data.views) safeSetLocalStorage(VIEWS_KEY, JSON.stringify(data.views));
    if (data.mahashLogo) setMahashLogo(data.mahashLogo);
    if (data.youthClubBadge) setYouthClubBadge(data.youthClubBadge);
    if (data.consultantPhotos) safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(data.consultantPhotos));
    if (data.consultantsList) safeSetLocalStorage(CONSULTANTS_STORAGE_KEY, JSON.stringify(data.consultantsList));
    if (data.memberAvatars) safeSetLocalStorage(MEMBER_AVATARS_KEY, JSON.stringify(data.memberAvatars));
    triggerStoreUpdate();
    return true;
  } catch (err) {
    console.warn('Import error:', err);
    return false;
  }
}

export function cleanUnknownOrCorruptVideos(): { cleanedReportsCount: number; cleanedVideosCount: number } {
  if (typeof window === 'undefined') return { cleanedReportsCount: 0, cleanedVideosCount: 0 };
  
  let cleanedReportsCount = 0;
  let cleanedVideosCount = 0;
  const customMap = getCustomReportsMap();
  let modified = false;

  for (const slug of Object.keys(customMap)) {
    const list = customMap[slug];
    if (Array.isArray(list)) {
      for (const rep of list) {
        if (rep.videoSrc) {
          const v = rep.videoSrc.trim().toLowerCase();
          // Safely migrate old transient blob: URLs to permanent indexeddb: format
          if (v.startsWith('blob:')) {
            rep.videoSrc = `indexeddb:${rep.id}`;
            modified = true;
          } else if (v === 'undefined' || v === 'null' || v === '' || v === '#' || v.includes('corrupt') || v.includes('unknown')) {
            rep.videoSrc = undefined;
            cleanedVideosCount++;
            modified = true;
            try {
              import('./videoCache').then((m) => m.deleteVideoFromCache(rep.id)).catch(() => {});
            } catch {}
          }

        }
      }
      if (modified) {
        cleanedReportsCount++;
      }
    }
  }

  if (modified) {
    saveCustomReportsMap(customMap);
    triggerStoreUpdate();
  }

  return { cleanedReportsCount, cleanedVideosCount };
}

