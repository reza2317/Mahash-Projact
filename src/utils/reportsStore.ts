import { ActivityReport, TeamData, ScoreItem, EventItem, PageId, TranscriptScene } from '../types';
import { TEAMS_DATA, SCORES_DATA } from '../data/mahashData';
import { EVENTS_DATA } from '../data/eventsData';
import { parseReportTimestamp, formatReportNumberDisplay, toPersianDigits } from './persianDate';
import { toEnglishDigits } from './persianDigitsHandler';
import { MAHESH_LOGO_SVG, MAHESH_CLUB_EMBLEM_SVG } from './assets';

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
const ADMIN_SESSION_KEY = 'mahash_admin_session_v1';
const ADMIN_USERNAME_KEY = 'mahash_admin_username_v1';
const ADMIN_PASSWORD_KEY = 'mahash_admin_password_v1';
const DEFAULT_ADMIN_USERNAME = 'Admin';
const DEFAULT_ADMIN_PASSWORD = 'GIta11649@';

export function isCustomImageDataUrlOrUrl(val: unknown): boolean {
  if (typeof val !== 'string' || !val.trim()) return false;
  const s = val.trim();
  if (s.startsWith('data:image/')) {
    // Treat as custom user image if it is image/png, image/jpeg, image/webp, etc. or non-default svg
    if (s.startsWith('data:image/png') || s.startsWith('data:image/jpeg') || s.startsWith('data:image/jpg') || s.startsWith('data:image/webp')) {
      return true;
    }
    // Check if it is a custom SVG
    if (!s.includes('TEAM_THINKER_LOGO_SVG') && !s.includes('TEAM_TOMORROW_LOGO_SVG') && !s.includes('TEAM_ANGELS_LOGO_SVG') && !s.includes('TEAM_GHORBANI_LOGO_SVG') && !s.includes('TEAM_SILENCE_LOGO_SVG')) {
      return true;
    }
  }
  if (s.startsWith('http://') || s.startsWith('https://') || s.startsWith('/img/') || s.startsWith('blob:')) {
    return true;
  }
  return false;
}

let hasAutoRecoveredLogos = false;

export function autoRecoverAllSavedLogos(): void {
  if (typeof window === 'undefined') return;

  try {
    const rawOverrides = localStorage.getItem(TEAM_OVERRIDES_KEY);
    let overrides: Record<string, Partial<TeamData>> = rawOverrides ? JSON.parse(rawOverrides) : {};
    let overridesModified = false;

    // 1. Recover from legacy overrides key
    try {
      const legacyRaw = localStorage.getItem(TEAM_OVERRIDES_LEGACY_KEY);
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
        const rawMap = localStorage.getItem(mapKey);
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
        `team_logo_${slug}`
      ];

      for (const candKey of candidateKeys) {
        try {
          const val = localStorage.getItem(candKey);
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
        const rawScores = localStorage.getItem(sKey);
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
      localStorage.setItem(TEAM_OVERRIDES_KEY, JSON.stringify(overrides));
    }

    // 5. Recover Mahash Institution Logo
    const currentMahash = localStorage.getItem(MAHASH_LOGO_KEY);
    if (!currentMahash || !isCustomImageDataUrlOrUrl(currentMahash)) {
      for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
        const legacyLogo = localStorage.getItem(mKey);
        if (legacyLogo && isCustomImageDataUrlOrUrl(legacyLogo)) {
          localStorage.setItem(MAHASH_LOGO_KEY, legacyLogo);
          break;
        }
      }
    }

    // 6. Recover Youth Club Emblem
    const currentClub = localStorage.getItem(CLUB_EMBLEM_KEY);
    if (!currentClub || !isCustomImageDataUrlOrUrl(currentClub)) {
      for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
        const legacyEmblem = localStorage.getItem(cKey);
        if (legacyEmblem && isCustomImageDataUrlOrUrl(legacyEmblem)) {
          localStorage.setItem(CLUB_EMBLEM_KEY, legacyEmblem);
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
  const val = localStorage.getItem(CACHE_VERSION_KEY);
  return val ? parseInt(val, 10) || 1 : 1;
}

export function triggerGlobalCacheBust(): number {
  if (typeof window === 'undefined') return 1;
  const newVer = Date.now();
  localStorage.setItem(CACHE_VERSION_KEY, String(newVer));
  triggerStoreUpdate();
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
    return localStorage.getItem(ADMIN_USERNAME_KEY) || DEFAULT_ADMIN_USERNAME;
  } catch {
    return DEFAULT_ADMIN_USERNAME;
  }
}

export function setAdminUsername(newUsername: string): boolean {
  if (!newUsername || newUsername.trim().length < 2) return false;
  try {
    localStorage.setItem(ADMIN_USERNAME_KEY, newUsername.trim());
    return true;
  } catch {
    return false;
  }
}

export function getAdminPassword(): string {
  if (typeof window === 'undefined') return DEFAULT_ADMIN_PASSWORD;
  try {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  } catch {
    return DEFAULT_ADMIN_PASSWORD;
  }
}

export function setAdminPassword(newPassword: string): boolean {
  if (!newPassword || newPassword.trim().length < 3) return false;
  try {
    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword.trim());
    return true;
  } catch {
    return false;
  }
}

export function resetAdminCredentialsToDefault(): { username: string; password: string } {
  try {
    localStorage.setItem(ADMIN_USERNAME_KEY, DEFAULT_ADMIN_USERNAME);
    localStorage.setItem(ADMIN_PASSWORD_KEY, DEFAULT_ADMIN_PASSWORD);
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
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true' || localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
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
          localStorage.setItem(ADMIN_SESSION_KEY, 'true');
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
        localStorage.setItem(ADMIN_SESSION_KEY, 'true');
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
    localStorage.removeItem(ADMIN_SESSION_KEY);
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
    const raw = localStorage.getItem(CUSTOM_REPORTS_KEY);
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
    localStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(cleanMap));
  } catch (err) {
    console.warn('Initial save to localStorage had quota issue, compressing data:', err);
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
      localStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(slimMap));
    } catch (e2) {
      console.warn('localStorage completely full, keeping in memory and sessionStorage:', e2);
      try {
        sessionStorage.setItem(CUSTOM_REPORTS_KEY, JSON.stringify(map));
      } catch {}
    }
  }
  triggerStoreUpdate();
}

function getDeletedReportsList(): string[] {
  try {
    const raw = localStorage.getItem(DELETED_REPORTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDeletedReportsList(list: string[]) {
  localStorage.setItem(DELETED_REPORTS_KEY, JSON.stringify(list));
  triggerStoreUpdate();
}

export function getTeamOverrides(): Record<string, Partial<TeamData>> {
  autoRecoverAllSavedLogos();
  try {
    const raw = localStorage.getItem(TEAM_OVERRIDES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveTeamOverrides(map: Record<string, Partial<TeamData>>) {
  localStorage.setItem(TEAM_OVERRIDES_KEY, JSON.stringify(map));
  // Keep legacy key in sync for backwards-compatibility
  try {
    localStorage.setItem(TEAM_OVERRIDES_LEGACY_KEY, JSON.stringify(map));
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
      const savedLast = localStorage.getItem('mahash_last_activity_date');
      if (savedLast) return savedLast;
    } catch {}
  }
  return '۱۴۰۵/۰۵/۲۶';
}


export function getAllTeams(): Record<string, TeamData> {
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
        const indVal = localStorage.getItem(`mahash_team_logo_${shortId}`) || localStorage.getItem(`mahash_team_logo_${slug}`) || localStorage.getItem(`team_logo_${shortId}`);
        if (indVal && isCustomImageDataUrlOrUrl(indVal)) {
          effectiveLogo = indVal;
        }
      } catch {}
    }
    if (!effectiveLogo) {
      try {
        const rawScores = localStorage.getItem(SCORES_KEY);
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

    // Sort reports inside each team: newest first (index 0)
    const sortedReports = Array.from(mergedReportsMap.values()).sort((a, b) => {
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

export function getAllReports(): (ActivityReport & { teamName: string; teamSlug: string })[] {
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
      localStorage.setItem('mahash_last_activity_date', report.date);
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
      localStorage.setItem('mahash_last_activity_date', remainingReports[0].date);
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

export function updateTeamDetails(teamSlugOrId: string, updates: Partial<TeamData>): void {
  const normSlug = teamSlugOrId.startsWith('team-') ? teamSlugOrId : `team-${teamSlugOrId}`;
  const shortId = teamSlugOrId.replace(/^team-/, '');

  const overrides = getTeamOverrides();
  overrides[normSlug] = {
    ...(overrides[normSlug] || {}),
    ...(overrides[shortId] || {}),
    ...updates
  };
  // Also keep shortId in sync
  overrides[shortId] = {
    ...(overrides[normSlug] || {})
  };
  saveTeamOverrides(overrides);
  triggerGlobalCacheBust();
}

export function saveTeamLogo(teamSlugOrId: string, logoDataUrl: string): void {
  if (!teamSlugOrId || !logoDataUrl) return;
  const normSlug = teamSlugOrId.startsWith('team-') ? teamSlugOrId : `team-${teamSlugOrId}`;
  const shortId = teamSlugOrId.replace(/^team-/, '');

  // 1. Update team overrides
  updateTeamDetails(normSlug, { logo: logoDataUrl });

  // 2. Direct individual keys persistence for ultimate safety
  try {
    localStorage.setItem(`mahash_team_logo_${shortId}`, logoDataUrl);
    localStorage.setItem(`mahash_team_logo_${normSlug}`, logoDataUrl);
    localStorage.setItem(`team_logo_${shortId}`, logoDataUrl);
  } catch {}

  // 3. Team logos map persistence
  try {
    const rawMap = localStorage.getItem(TEAM_LOGOS_MAP_KEY);
    const parsedMap = rawMap ? JSON.parse(rawMap) : {};
    parsedMap[normSlug] = logoDataUrl;
    parsedMap[shortId] = logoDataUrl;
    localStorage.setItem(TEAM_LOGOS_MAP_KEY, JSON.stringify(parsedMap));
  } catch {}

  // 4. Keep scores list logo property updated as well
  try {
    const rawScores = getAllScores();
    const updatedScores = rawScores.map((s) => {
      if (s.id === shortId || s.id === normSlug) {
        return { ...s, logo: logoDataUrl };
      }
      return s;
    });
    saveAllScores(updatedScores);
  } catch {}

  triggerGlobalCacheBust();
}

export function resetTeamLogo(teamSlugOrId: string): void {
  if (!teamSlugOrId) return;
  const normSlug = teamSlugOrId.startsWith('team-') ? teamSlugOrId : `team-${teamSlugOrId}`;
  const shortId = teamSlugOrId.replace(/^team-/, '');

  const overrides = getTeamOverrides();
  if (overrides[normSlug]) {
    delete overrides[normSlug].logo;
  }
  if (overrides[shortId]) {
    delete overrides[shortId].logo;
  }
  saveTeamOverrides(overrides);

  try {
    localStorage.removeItem(`mahash_team_logo_${shortId}`);
    localStorage.removeItem(`mahash_team_logo_${normSlug}`);
    localStorage.removeItem(`team_logo_${shortId}`);
    localStorage.removeItem(`team_logo_${normSlug}`);
  } catch {}

  try {
    const rawMap = localStorage.getItem(TEAM_LOGOS_MAP_KEY);
    if (rawMap) {
      const parsedMap = JSON.parse(rawMap);
      delete parsedMap[normSlug];
      delete parsedMap[shortId];
      localStorage.setItem(TEAM_LOGOS_MAP_KEY, JSON.stringify(parsedMap));
    }
  } catch {}

  // Restore default logo in scores
  try {
    const baseDefault = SCORES_DATA.find((s) => s.id === shortId || s.id === normSlug);
    const rawScores = getAllScores();
    const updatedScores = rawScores.map((s) => {
      if (s.id === shortId || s.id === normSlug) {
        return { ...s, logo: baseDefault?.logo };
      }
      return s;
    });
    saveAllScores(updatedScores);
  } catch {}

  triggerGlobalCacheBust();
}

// ----------------------------------------------------
// Scores Management
// ----------------------------------------------------

export function getAllScores(): ScoreItem[] {
  autoRecoverAllSavedLogos();
  let list: ScoreItem[] = SCORES_DATA;
  try {
    const raw = localStorage.getItem(SCORES_KEY);
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
      const indVal = localStorage.getItem(`mahash_team_logo_${shortId}`) || localStorage.getItem(`mahash_team_logo_${normSlug}`);
      if (indVal && isCustomImageDataUrlOrUrl(indVal)) {
        return { ...item, logo: indVal };
      }
    } catch {}
    return item;
  });
}

export function saveAllScores(scores: ScoreItem[]): void {
  localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
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
    const raw = localStorage.getItem(EVENTS_KEY);
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
  localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
  triggerStoreUpdate();
}

export function deleteEvent(eventId: string): void {
  const currentEvents = getAllEvents();
  const updated = currentEvents.filter((e) => e.id !== eventId);
  localStorage.setItem(EVENTS_KEY, JSON.stringify(updated));
  triggerStoreUpdate();
}

// ----------------------------------------------------
// Video Views & Analytics Management
// ----------------------------------------------------

export function getAllReportViews(): Record<string, number> {
  try {
    const raw = localStorage.getItem(VIEWS_KEY);
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
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
  triggerStoreUpdate();
  return next;
}

export function setReportViews(reportId: string, count: number): void {
  if (!reportId) return;
  const views = getAllReportViews();
  views[reportId] = Math.max(0, count);
  localStorage.setItem(VIEWS_KEY, JSON.stringify(views));
  triggerStoreUpdate();
}

export function resetReportViews(): void {
  localStorage.removeItem(VIEWS_KEY);
  triggerStoreUpdate();
}

// ----------------------------------------------------
// Mahash Institution & Youth Club Badges
// ----------------------------------------------------

export function getMahashLogo(): string {
  if (typeof window === 'undefined') return MAHESH_LOGO_SVG;
  autoRecoverAllSavedLogos();
  const saved = localStorage.getItem(MAHASH_LOGO_KEY);
  if (saved && isCustomImageDataUrlOrUrl(saved)) return saved;
  for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
    const legacy = localStorage.getItem(mKey);
    if (legacy && isCustomImageDataUrlOrUrl(legacy)) return legacy;
  }
  return saved || MAHESH_LOGO_SVG;
}

export function setMahashLogo(logo: string): void {
  if (typeof window === 'undefined') return;
  if (!logo) {
    localStorage.removeItem(MAHASH_LOGO_KEY);
    for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
      try { localStorage.removeItem(mKey); } catch {}
    }
  } else {
    localStorage.setItem(MAHASH_LOGO_KEY, logo);
    for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
      try { localStorage.setItem(mKey, logo); } catch {}
    }
  }
  triggerGlobalCacheBust();
}

export function resetMahashLogo(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(MAHASH_LOGO_KEY);
  for (const mKey of MAHASH_LOGO_LEGACY_KEYS) {
    try { localStorage.removeItem(mKey); } catch {}
  }
  triggerGlobalCacheBust();
}

export function getYouthClubBadge(): string {
  if (typeof window === 'undefined') return MAHESH_CLUB_EMBLEM_SVG;
  autoRecoverAllSavedLogos();
  const saved = localStorage.getItem(CLUB_EMBLEM_KEY);
  if (saved && isCustomImageDataUrlOrUrl(saved)) return saved;
  for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
    const legacy = localStorage.getItem(cKey);
    if (legacy && isCustomImageDataUrlOrUrl(legacy)) return legacy;
  }
  return saved || MAHESH_CLUB_EMBLEM_SVG;
}

export function setYouthClubBadge(badge: string): void {
  if (typeof window === 'undefined') return;
  if (!badge) {
    localStorage.removeItem(CLUB_EMBLEM_KEY);
    for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
      try { localStorage.removeItem(cKey); } catch {}
    }
  } else {
    localStorage.setItem(CLUB_EMBLEM_KEY, badge);
    for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
      try { localStorage.setItem(cKey, badge); } catch {}
    }
  }
  triggerStoreUpdate();
}

export function resetYouthClubBadge(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(CLUB_EMBLEM_KEY);
  for (const cKey of CLUB_EMBLEM_LEGACY_KEYS) {
    try { localStorage.removeItem(cKey); } catch {}
  }
  triggerStoreUpdate();
}

export function resetAllDataToDefault(): void {
  localStorage.removeItem(CUSTOM_REPORTS_KEY);
  localStorage.removeItem(DELETED_REPORTS_KEY);
  localStorage.removeItem(TEAM_OVERRIDES_KEY);
  localStorage.removeItem(SCORES_KEY);
  localStorage.removeItem(EVENTS_KEY);
  localStorage.removeItem(VIEWS_KEY);
  localStorage.removeItem(MAHASH_LOGO_KEY);
  localStorage.removeItem(CLUB_EMBLEM_KEY);
  localStorage.removeItem('mahash_last_activity_date');
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

  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
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
    if (data.events) localStorage.setItem(EVENTS_KEY, JSON.stringify(data.events));
    if (data.views) localStorage.setItem(VIEWS_KEY, JSON.stringify(data.views));
    if (data.mahashLogo) setMahashLogo(data.mahashLogo);
    if (data.youthClubBadge) setYouthClubBadge(data.youthClubBadge);
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

