import { runGarbageCollection } from './cleanupUtils';
import { globalEventBus } from './eventBus';
import { saveToFirebaseStore, loadFromFirebaseStore } from './firebaseSync';
import { ActivityReport, TeamData, ScoreItem, EventItem, PageId, TranscriptScene, Consultant } from '../types';
import { TEAMS_DATA, SCORES_DATA, CONSULTANTS } from '../data/mahashData';
import { EVENTS_DATA } from '../data/eventsData';
import { parseReportTimestamp, formatReportNumberDisplay, toPersianDigits } from './persianDate';
import { toEnglishDigits } from './persianDigitsHandler';
import { MAHESH_LOGO_SVG, MAHESH_CLUB_EMBLEM_SVG, NAZI_AVATAR_SVG, RADIN_AVATAR_SVG } from './assets';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage, freeUpLocalStorageQuota } from './storage';

const CUSTOM_REPORTS_KEY = 'mahash_custom_reports_v1';
const DELETED_REPORTS_KEY = 'mahash_deleted_reports_v1';
const TEAM_OVERRIDES_KEY = 'mahash_team_overrides_v1';
const TEAM_OVERRIDES_LEGACY_KEY = 'mahash_team_overrides';
const SCORES_KEY = 'mahash_scores_v1';
const SCORES_LEGACY_KEY = 'mahash_scores';
const EVENTS_KEY = 'mahash_events_v1';
const VIEWS_KEY = 'mahash_report_views_v1';
const MAHASH_LOGO_KEY = 'mahash_custom_logo_v1';
const MAHASH_LOGO_LEGACY_KEYS = ['mahash_custom_logo', 'mahash_logo', 'mahash_logo_url'];
const CLUB_EMBLEM_KEY = 'mahash_custom_club_emblem_v1';
const CLUB_EMBLEM_LEGACY_KEYS = ['mahash_custom_club_emblem', 'mahash_club_emblem'];
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

export function autoRecoverAllSavedLogos(): void {
  if (typeof window === 'undefined') return;

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

export function triggerGlobalCacheBust(): number {
  if (typeof window === 'undefined') return 1;
  const newVer = Date.now();
  safeSetLocalStorage(CACHE_VERSION_KEY, String(newVer));
  triggerStoreUpdate();
  syncLocalDataToServer().catch(console.error);
  return newVer;
}

function triggerStoreUpdate() {
  if (typeof window !== 'undefined') {
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
              caption: a.caption
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
}

function getDeletedReportsList(): string[] {
  try {
    const raw = safeGetLocalStorage(DELETED_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDeletedReportsList(list: string[]) {
  safeSetLocalStorage(DELETED_REPORTS_KEY, JSON.stringify(list));
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

    // Sort reports inside each team: newest first (index 0)
    const sortedReports = Array.from(mergedReportsMap.values())
      .filter((r) => isAdmin || r.status !== 'draft')
      .sort((a, b) => {
        return parseReportTimestamp(b) - parseReportTimestamp(a);
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

  // Sort by date / recency descending: newest registered reports first
  return all.sort((a, b) => {
    return parseReportTimestamp(b) - parseReportTimestamp(a);
  });
}

// ----------------------------------------------------
// Report Modification Actions
// ----------------------------------------------------

export function saveReport(report: ActivityReport, teamSlug: string): void {
  const customMap = getCustomReportsMap();
  const deletedList = getDeletedReportsList();

  // If it was previously marked as deleted, unmark it
  if (deletedList.includes(report.id)) {
    saveDeletedReportsList(deletedList.filter((id) => id !== report.id));
  }

  const teamReports = customMap[teamSlug] || [];
  const existingIdx = teamReports.findIndex((r) => r.id === report.id);

  // Only auto-generate Persian subtitles if transcript is undefined AND video is attached on creation
  let transcript = report.transcript;
  if (transcript === undefined && report.videoSrc && report.videoSrc.trim() !== '' && report.videoSrc !== '#') {
    const baseTeam = TEAMS_DATA[teamSlug];
    transcript = generatePersianSubtitlesForReport(report, baseTeam?.name);
  }

  const reportToSave: ActivityReport = {
    ...report,
    teamSlug,
    transcript: transcript !== undefined ? transcript : [],
    status: report.status || 'published',
    isCustom: true
  };

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
}

export function deleteReport(reportId: string, teamSlug?: string): void {
  const customMap = getCustomReportsMap();
  const deletedList = getDeletedReportsList();
  let modifiedCustom = false;

  // Remove from custom reports for all teams
  for (const slug of Object.keys(customMap)) {
    if (Array.isArray(customMap[slug])) {
      const beforeLen = customMap[slug].length;
      customMap[slug] = customMap[slug].filter((r) => r.id !== reportId);
      if (customMap[slug].length !== beforeLen) {
        modifiedCustom = true;
      }
    }
  }

  if (modifiedCustom) {
    saveCustomReportsMap(customMap);
  }

  // Also add to deleted list to suppress default base report if any
  if (!deletedList.includes(reportId)) {
    deletedList.push(reportId);
    saveDeletedReportsList(deletedList);
  }

  // Clean attachments & video cache in background if in browser
  if (typeof window !== 'undefined') {
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
    // 1. Check reportNum string
    if (rep.reportNum) {
      const repNumNorm = rep.reportNum
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
      const numMatch = repNumNorm.match(/\d+/);
      if (numMatch) {
        const parsed = parseInt(numMatch[0], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    // 2. Check title string for patterns like "گزارش ۳" or "گزارش شماره ۴"
    if (rep.title) {
      const titleNorm = rep.title
        .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
        .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));
      const matchTitle = titleNorm.match(/گزارش\s*(?:شماره\s*)?(\d+)/);
      if (matchTitle && matchTitle[1]) {
        const parsed = parseInt(matchTitle[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
    }

    // 3. Check report ID suffix like "angels-03" -> 3
    if (rep.id) {
      const idMatch = rep.id.match(/[-_]0*(\d+)$/);
      if (idMatch && idMatch[1]) {
        const parsed = parseInt(idMatch[1], 10);
        if (!isNaN(parsed) && parsed > maxNum) {
          maxNum = parsed;
        }
      }
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
  return name
    .trim()
    .replace(/^خانم\s+دکتر\s+/g, '')
    .replace(/^دکتر\s+/g, '')
    .replace(/^آقای\s+/g, '')
    .replace(/^خانم\s+/g, '')
    .replace(/[\u200c\s]+/g, ' ')
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

  // 3. Keep scores list logo property updated as well
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

  // 4. In-memory update of base TEAMS_DATA
  try {
    if (TEAMS_DATA[normSlug]) {
      TEAMS_DATA[normSlug].logo = logoDataUrl;
    }
  } catch {}

  triggerGlobalCacheBust();
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

  triggerGlobalCacheBust();
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
// Consultants Management
// ----------------------------------------------------

export function getConsultantPhotos(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = safeGetLocalStorage(CONSULTANT_PHOTOS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function getConsultantPhoto(consultantName: string, defaultAvatar?: string): string {
  if (!consultantName) return defaultAvatar || '';
  const trimmed = consultantName.trim();
  const normalized = normalizeConsultantKey(trimmed);
  const photos = getConsultantPhotos();

  if (photos[trimmed] && isCustomImageDataUrlOrUrl(photos[trimmed])) return photos[trimmed];
  if (normalized && photos[normalized] && isCustomImageDataUrlOrUrl(photos[normalized])) return photos[normalized];

  try {
    const direct1 = safeGetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(trimmed)}`);
    if (direct1 && isCustomImageDataUrlOrUrl(direct1)) return direct1;
    if (normalized) {
      const direct2 = safeGetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(normalized)}`);
      if (direct2 && isCustomImageDataUrlOrUrl(direct2)) return direct2;
    }
  } catch {}

  const match = Object.keys(photos).find((k) => {
    const normK = normalizeConsultantKey(k);
    return k.includes(trimmed) || trimmed.includes(k) || (normalized && normK && (normK.includes(normalized) || normalized.includes(normK)));
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

  const photos = getConsultantPhotos();
  photos[trimmed] = photoDataUrl;
  if (normalized) {
    photos[normalized] = photoDataUrl;
  }

  try {
    safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(photos));
  } catch (err) {
    console.warn('Failed to save consultant photo:', err);
  }

  // Also update in consultants storage list
  try {
    const list = getAllConsultants();
    const updated = list.map((c) => {
      const cNorm = normalizeConsultantKey(c.name);
      if (c.name.trim() === trimmed || (normalized && cNorm === normalized)) {
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

  const photos = getConsultantPhotos();
  delete photos[trimmed];
  if (normalized) delete photos[normalized];

  try {
    safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(photos));
    safeRemoveLocalStorage(`mahash_consultant_photo_${encodeURIComponent(trimmed)}`);
    if (normalized) {
      safeRemoveLocalStorage(`mahash_consultant_photo_${encodeURIComponent(normalized)}`);
    }
  } catch {}

  triggerGlobalCacheBust();
}

export function getAllConsultants(): Consultant[] {
  if (typeof window === 'undefined') return CONSULTANTS;
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
    return baseList.map((c, idx) => {
      const defaultImg = idx === 0 ? NAZI_AVATAR_SVG : (c.image || RADIN_AVATAR_SVG);
      return {
        ...c,
        image: photos[c.name.trim()] || c.image || defaultImg
      };
    });
  } catch {
    return CONSULTANTS;
  }
}

export function saveAllConsultants(consultants: Consultant[]): void {
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

export async function fetchAndMergeServerStore(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const keys = [
      'teamLogos', 'teamOverrides', 'mahashLogo', 'clubEmblem', 
      'customReports', 'deletedReports', 'scores', 'events', 
      'customBadges', 'consultantPhotos', 'consultantsList', 'memberAvatars'
    ];
    
    let serverData: any = {};
    const results = await Promise.all(keys.map(k => loadFromFirebaseStore(k)));

    let needsPushToServer = false;

    keys.forEach((k, idx) => {
      if (results[idx]) {
        if (results[idx].__corrupt) {
          needsPushToServer = true;
        } else {
          serverData[k] = results[idx];
        }
      }
    });

    let modified = false;

    // Auto-restore from admin browser if server is wiped (Serverless container restart recovery)
    if (Object.keys(serverData.teamLogos || {}).length === 0) {
      const localLogos = safeGetLocalStorage('mahash_team_logos_map');
      if (localLogos && Object.keys(JSON.parse(localLogos)).length > 0) {
        needsPushToServer = true;
      }
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

    // Replace other top-level simple lists if they have content
    if (serverData.customReports && Array.isArray(serverData.customReports) && serverData.customReports.length > 0) {
      const grouped: Record<string, any[]> = {};
      serverData.customReports.forEach((r: any) => {
        if (r.teamSlug) {
          if (!grouped[r.teamSlug]) grouped[r.teamSlug] = [];
          grouped[r.teamSlug].push(r);
        }
      });
      safeSetLocalStorage(CUSTOM_REPORTS_KEY, JSON.stringify(grouped));
      modified = true;
    }

    if (serverData.deletedReports && Array.isArray(serverData.deletedReports) && serverData.deletedReports.length > 0) {
      safeSetLocalStorage(DELETED_REPORTS_KEY, JSON.stringify(serverData.deletedReports));
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
      safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(serverData.consultantPhotos));
      modified = true;
    }

    if (serverData.consultantsList && Array.isArray(serverData.consultantsList) && serverData.consultantsList.length > 0) {
      safeSetLocalStorage(CONSULTANTS_STORAGE_KEY, JSON.stringify(serverData.consultantsList));
      modified = true;
    }

    if (serverData.memberAvatars && Object.keys(serverData.memberAvatars).length > 0) {
      safeSetLocalStorage(MEMBER_AVATARS_KEY, JSON.stringify(serverData.memberAvatars));
      modified = true;
    }

    if (serverData.mahashLogo) {
      safeSetLocalStorage(MAHASH_LOGO_KEY, serverData.mahashLogo);
      modified = true;
    }
    
    if (serverData.clubEmblem) {
      safeSetLocalStorage(CLUB_EMBLEM_KEY, serverData.clubEmblem);
      modified = true;
    }

    if (modified) {
      triggerStoreUpdate();
    }
    
    if (needsPushToServer) {
      console.log('Server is empty, but local data exists. Pushing recovery data to Firebase...');
      setTimeout(() => syncLocalDataToServer(), 1000);
    }

    return true;
  } catch (err) {
    console.warn('[reportsStore] Could not fetch Firebase store:', err);
    return false;
  }
}


let syncTimeout: any = null;
let pendingResolvers: Array<(val: boolean) => void> = [];

const yieldToMain = () => new Promise(r => setTimeout(r, 10));

export async function syncLocalDataToServer(onProgress?: (progress: number, step: string) => void): Promise<boolean> {
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
        const profile = (name) => {
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
          scores,
          events,
          customBadges,
          consultantPhotos,
          consultantsList,
          memberAvatars
        };

        profile('Assemble Payload');
        if (onProgress) onProgress(40, 'شروع ارتباط با سرور ابری Firebase...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 40, message: 'شروع ارتباط با سرور ابری Firebase...' });
        await yieldToMain();
        const keys = Object.keys(payload);
        
        let completed = 0;
        const total = keys.length;
        
        const uploadStart = performance.now();
        
        // Process uploads with a concurrency queue (e.g. 3 at a time) to prevent blocking
        const MAX_CONCURRENCY = 2;
        let currentIndex = 0;
        
        const worker = async () => {
            while (currentIndex < keys.length) {
                const i = currentIndex++;
                const k = keys[i];
                const dataToSave = (payload as any)[k];
                
                await yieldToMain();
                const chunkStart = performance.now();
                
                const p = 40 + Math.round((completed / total) * 50);
                if (onProgress) onProgress(p, `در حال پردازش ${k} (${completed} از ${total})...`);
                globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: p, message: `در حال پردازش ${k} (${completed} از ${total})...` });
                
                const result = await saveToFirebaseStore(k, dataToSave);
                
                console.log(`[Profile] Upload chunk ${k}: ${(performance.now() - chunkStart).toFixed(2)}ms`);
                completed++;
                if (onProgress) onProgress(40 + Math.round((completed / total) * 50), `بسته ${k} با موفقیت ارسال شد.`);
            }
        };
        
        const workers = Array(Math.min(MAX_CONCURRENCY, keys.length)).fill(null).map(() => worker());
        await Promise.all(workers);
        
        console.log(`[Profile] Total Upload Data time: ${(performance.now() - uploadStart).toFixed(2)}ms`);
        console.log(`[Profile] Total Sync time: ${(performance.now() - pStart).toFixed(2)}ms`);
        if (onProgress) onProgress(100, 'عملیات با موفقیت به پایان رسید.');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 100, message: 'عملیات با موفقیت به پایان رسید.' });
        await yieldToMain();
        setTimeout(() => globalEventBus.emit('SYNC_PROGRESS', { visible: false }), 2000);
        resolversToCall.forEach(res => res(true));
      } catch (err) {
        console.warn('[reportsStore] Failed to sync data to Firebase:', err);
        globalEventBus.emit('SYNC_PROGRESS', { visible: false });
        resolversToCall.forEach(res => res(false));
      }
    }, 1500); // 1.5 seconds debounce
  });
}

// Auto-fetch on client boot
if (typeof window !== 'undefined') {
  setTimeout(() => {
    fetchAndMergeServerStore();
  }, 100);
}

export function resetReportViews(): void {
  safeRemoveLocalStorage(VIEWS_KEY);
  triggerStoreUpdate();
}

// ----------------------------------------------------
// Mahash Institution & Youth Club Badges
// ----------------------------------------------------

export function getMahashLogo(): string {
  if (typeof window === 'undefined') return MAHESH_LOGO_SVG;
  autoRecoverAllSavedLogos();
  const saved = safeGetLocalStorage(MAHASH_LOGO_KEY);
  if (saved && isCustomImageDataUrlOrUrl(saved)) return saved;
  for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
    const legacy = safeGetLocalStorage(mKey);
    if (legacy && isCustomImageDataUrlOrUrl(legacy)) return legacy;
  }
  return saved || MAHESH_LOGO_SVG;
}

export function setMahashLogo(logo: string): void {
  if (typeof window === 'undefined') return;
  if (!logo) {
    safeRemoveLocalStorage(MAHASH_LOGO_KEY);
    for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
      safeRemoveLocalStorage(mKey);
    }
  } else {
    safeSetLocalStorage(MAHASH_LOGO_KEY, logo);
  }
  triggerGlobalCacheBust();
}

export function resetMahashLogo(): void {
  if (typeof window === 'undefined') return;
  safeRemoveLocalStorage(MAHASH_LOGO_KEY);
  for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
    safeRemoveLocalStorage(mKey);
  }
  triggerGlobalCacheBust();
}

export function getYouthClubBadge(): string {
  if (typeof window === 'undefined') return MAHESH_CLUB_EMBLEM_SVG;
  autoRecoverAllSavedLogos();
  const saved = safeGetLocalStorage(CLUB_EMBLEM_KEY);
  if (saved && isCustomImageDataUrlOrUrl(saved)) return saved;
  for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
    const legacy = safeGetLocalStorage(cKey);
    if (legacy && isCustomImageDataUrlOrUrl(legacy)) return legacy;
  }
  return saved || MAHESH_CLUB_EMBLEM_SVG;
}

export function setYouthClubBadge(badge: string): void {
  if (typeof window === 'undefined') return;
  if (!badge) {
    safeRemoveLocalStorage(CLUB_EMBLEM_KEY);
    for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
      safeRemoveLocalStorage(cKey);
    }
  } else {
    safeSetLocalStorage(CLUB_EMBLEM_KEY, badge);
  }
  triggerStoreUpdate();
}

export function resetYouthClubBadge(): void {
  if (typeof window === 'undefined') return;
  safeRemoveLocalStorage(CLUB_EMBLEM_KEY);
  for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
    safeRemoveLocalStorage(cKey);
  }
  triggerStoreUpdate();
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
    console.error('Import error:', err);
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

