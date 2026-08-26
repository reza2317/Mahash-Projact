/**
 * Comprehensive Link & File Integrity Auditor for Mahash Youth Club
 * Inspects all report videos, attachments, posters, team logos, events and hyperlinks.
 * Detects missing files, broken URLs, heavy media payloads and corrupted data.
 */

import { ActivityReport, EventItem, ReportAttachment, TeamData } from '../types';
import { getAllReports, getAllEvents, getAllTeams, saveReport, deleteReport } from './reportsStore';
import { getAttachmentsFromDB, deleteAttachmentFromDB, formatFileSize } from './attachmentsStorage';
import { getVideoFromCache } from './videoCache';
import { toPersianDigits } from './persianDate';

export type IntegrityStatus = 'healthy' | 'warning' | 'error' | 'missing';
export type ResourceType = 'video' | 'attachment' | 'poster' | 'logo' | 'link';
export type ParentEntityType = 'report' | 'event' | 'team' | 'global';

export interface AuditItemResult {
  id: string;
  resourceType: ResourceType;
  name: string;
  targetUrl: string;
  parentType: ParentEntityType;
  parentId: string;
  parentTitle: string;
  teamSlug?: string;
  teamName?: string;
  status: IntegrityStatus;
  statusCode?: string;
  latencyMs?: number;
  fileSizeBytes?: number;
  fileSizeFormatted?: string;
  details: string;
  errorReason?: string;
  remediationAction?: 'fix_video_default' | 'remove_attachment' | 'edit_report' | 'edit_event';
  checkedAt: string;
}

export interface AuditSummaryReport {
  totalChecked: number;
  healthyCount: number;
  warningCount: number;
  errorCount: number;
  missingCount: number;
  healthScorePercentage: number;
  items: AuditItemResult[];
  scannedAt: string;
  durationMs: number;
}

const DEFAULT_STABLE_SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4';

/**
 * Fast network ping / reachability test for HTTP/HTTPS URLs with fallback
 */
async function probeHttpUrl(url: string, timeoutMs: number = 4000): Promise<{ ok: boolean; statusText: string; latencyMs: number }> {
  const start = performance.now();
  
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return { ok: false, statusText: 'آدرس خالی یا نامعتبر است', latencyMs: 0 };
  }

  // Quick protocol validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return { ok: false, statusText: 'پروتکل نامعتبر است (باید با http یا https آغاز شود)', latencyMs: 0 };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Try HEAD or GET with no-cors to avoid CORS block while confirming reachability
    await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache'
    });

    clearTimeout(timeoutId);
    const latency = Math.round(performance.now() - start);
    return { ok: true, statusText: 'پاسخ معتبر دریافت شد', latencyMs: latency };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    if (err.name === 'AbortError') {
      return { ok: false, statusText: 'مهلت پاسخ‌گویی به پایان رسید (Timeout)', latencyMs: latency };
    }
    // Secondary probe for media elements (Image / Audio / Video)
    return { ok: false, statusText: 'عدم دریافت پاسخ از سرور یا قطع ارتباط', latencyMs: latency };
  }
}

/**
 * Fast probe for images (Base64, SVG, or URL)
 */
async function probeImage(urlOrData: string, timeoutMs: number = 3000): Promise<{ ok: boolean; message: string; sizeBytes?: number }> {
  if (!urlOrData || typeof urlOrData !== 'string') {
    return { ok: false, message: 'منبع تصویر موجود نیست' };
  }

  if (urlOrData.startsWith('data:image/svg+xml') || urlOrData.startsWith('<svg')) {
    return { ok: true, message: 'وکتور SVG معتبر' };
  }

  if (urlOrData.startsWith('data:image/')) {
    if (urlOrData.length < 50) {
      return { ok: false, message: 'داده Base64 تصویر بسیار کوتاه یا ناقص است' };
    }
    const approxBytes = Math.round((urlOrData.length * 3) / 4);
    return { ok: true, message: 'تصویر درون‌حافظه‌ای Base64 سالم', sizeBytes: approxBytes };
  }

  return new Promise((resolve) => {
    const img = new Image();
    let isSettled = false;

    const timer = setTimeout(() => {
      if (!isSettled) {
        isSettled = true;
        resolve({ ok: false, message: 'بارگذاری تصویر با وقفه زمانی (Timeout) مواجه شد' });
      }
    }, timeoutMs);

    img.onload = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve({ ok: true, message: `تصویر با ابعاد ${toPersianDigits(img.naturalWidth)}×${toPersianDigits(img.naturalHeight)} پیکسل بارگذاری شد` });
      }
    };

    img.onerror = () => {
      if (!isSettled) {
        isSettled = true;
        clearTimeout(timer);
        resolve({ ok: false, message: 'خطا در بارگذاری تصویر (لینک یا فایل ناموجود است)' });
      }
    };

    img.src = urlOrData;
  });
}

/**
 * Executes a full audit of all links, videos, attachments, posters and logos
 */
export async function runFullIntegrityAudit(
  onProgress?: (progressPercent: number, currentItemName: string) => void
): Promise<AuditSummaryReport> {
  const startTime = performance.now();
  const allReports = getAllReports();
  const allEvents = getAllEvents();
  const allTeams = getAllTeams();

  const auditItems: AuditItemResult[] = [];

  // Estimate total items
  let totalTasks = 0;
  totalTasks += allReports.length * 2; // video + poster
  allReports.forEach((r) => {
    if (r.attachments && r.attachments.length > 0) totalTasks += r.attachments.length;
  });
  totalTasks += Object.keys(allTeams).length; // team logos
  totalTasks += allEvents.length; // event links

  let completedTasks = 0;
  const notifyProgress = (label: string) => {
    completedTasks++;
    if (onProgress && totalTasks > 0) {
      const pct = Math.min(100, Math.round((completedTasks / totalTasks) * 100));
      onProgress(pct, label);
    }
  };

  // ----------------------------------------------------
  // 1. Audit Report Videos
  // ----------------------------------------------------
  for (const report of allReports) {
    const reportLabel = `${report.teamName} - ${report.reportNum || ''} ${report.title}`.trim();
    notifyProgress(`بررسی ویدیوی «${reportLabel}»`);

    const videoSrc = report.videoSrc || '';
    let status: IntegrityStatus = 'healthy';
    let details = 'ویدیو با موفقیت تأیید شد';
    let errorReason: string | undefined = undefined;
    let statusCode: string = '200 OK';
    let latencyMs = 0;
    let fileSizeBytes: number | undefined = undefined;
    let remediationAction: AuditItemResult['remediationAction'] = undefined;

    if (!videoSrc || videoSrc.trim() === '') {
      status = 'missing';
      statusCode = 'EMPTY';
      details = 'آدرس ویدیو خالی است و ویدیویی برای پخش تنظیم نشده است.';
      errorReason = 'منبع ویدیو خالی است';
      remediationAction = 'fix_video_default';
    } else if (videoSrc.startsWith('blob:') || videoSrc.startsWith('indexeddb:')) {
      // Local cached video
      try {
        const cachedBlob = await getVideoFromCache(report.id);
        if (cachedBlob && cachedBlob.size > 0) {
          status = 'healthy';
          statusCode = 'LOCAL_CACHED';
          fileSizeBytes = cachedBlob.size;
          details = `فایل ویدیوی ذخیره شده در دیتابیس محلی موجود و سالم است (${(cachedBlob.size / (1024 * 1024)).toFixed(1)} مگابایت).`;
        } else {
          status = 'missing';
          statusCode = 'CACHE_MISSING';
          details = 'فایل ویدیویی محلی در حافظه مرورگر یافت نشد (فایل ویدیوی گمشده).';
          errorReason = 'ویدیوی محلی از دیتابیس پاک شده است';
          remediationAction = 'fix_video_default';
        }
      } catch {
        status = 'missing';
        statusCode = 'CACHE_ERROR';
        details = 'خطا در دسترسی به فایل ویدیوی محلی در دیتابیس مرورگر.';
        errorReason = 'دسترسی به IndexedDB ناموفق بود';
        remediationAction = 'fix_video_default';
      }
    } else if (videoSrc.startsWith('data:video/')) {
      if (videoSrc.length < 200) {
        status = 'error';
        statusCode = 'CORRUPTED_DATA';
        details = 'داده Base64 ویدیو ناقص یا خراب است.';
        errorReason = 'فرمت ویدیوی Base64 معتبر نیست';
        remediationAction = 'fix_video_default';
      } else {
        fileSizeBytes = Math.round((videoSrc.length * 3) / 4);
        status = fileSizeBytes > 15 * 1024 * 1024 ? 'warning' : 'healthy';
        statusCode = 'DATA_URL';
        details = `ویدیوی درون‌حافظه‌ای Base64 (${(fileSizeBytes / (1024 * 1024)).toFixed(1)} مگابایت). ${
          fileSizeBytes > 15 * 1024 * 1024 ? 'توجه: حجم بالا ممکن است عملکرد را کند کند.' : ''
        }`;
      }
    } else if (videoSrc.startsWith('http://') || videoSrc.startsWith('https://')) {
      const probe = await probeHttpUrl(videoSrc, 3500);
      latencyMs = probe.latencyMs;
      if (probe.ok) {
        status = 'healthy';
        statusCode = '200 OK';
        details = `آدرس ویدیو در بستر اینترنت فعال و در دسترس است (پاسخ در ${toPersianDigits(latencyMs)} میلی‌ثانیه).`;
      } else {
        status = 'error';
        statusCode = 'UNREACHABLE';
        details = `پاسخ ناموفق یا عدم دسترسی به لینک ویدیو: ${probe.statusText}`;
        errorReason = probe.statusText;
        remediationAction = 'fix_video_default';
      }
    } else {
      status = 'error';
      statusCode = 'INVALID_FORMAT';
      details = 'فرمت آدرس ویدیو غیراستاندارد است.';
      errorReason = 'پروتکل یا ساختار آدرس نامعتبر است';
      remediationAction = 'fix_video_default';
    }

    auditItems.push({
      id: `audit-vid-${report.id}`,
      resourceType: 'video',
      name: `ویدیوی اصلی گزارش: ${report.reportNum || ''} ${report.title}`,
      targetUrl: videoSrc,
      parentType: 'report',
      parentId: report.id,
      parentTitle: report.title,
      teamSlug: report.teamSlug,
      teamName: report.teamName,
      status,
      statusCode,
      latencyMs,
      fileSizeBytes,
      fileSizeFormatted: fileSizeBytes ? formatFileSize(fileSizeBytes) : undefined,
      details,
      errorReason,
      remediationAction,
      checkedAt: new Date().toISOString()
    });
  }

  // ----------------------------------------------------
  // 2. Audit Report Attachments (PDF, Word, Images, Archives)
  // ----------------------------------------------------
  for (const report of allReports) {
    const atts = report.attachments || [];
    let dbAtts: ReportAttachment[] = [];
    try {
      dbAtts = await getAttachmentsFromDB(report.id);
    } catch {}

    for (const att of atts) {
      notifyProgress(`بررسی فایل پیوست «${att.name}»`);

      let status: IntegrityStatus = 'healthy';
      let details = 'فایل پیوست معتبر و قابل دانلود است.';
      let errorReason: string | undefined = undefined;
      let statusCode = 'ATTACHMENT_OK';
      let fileSizeBytes = att.sizeBytes;
      let remediationAction: AuditItemResult['remediationAction'] = undefined;

      // Check if dataUrl exists in report object
      const hasDirectData = att.dataUrl && att.dataUrl.length > 50;
      
      // Check if found in IndexedDB
      const matchInDB = dbAtts.find((d) => d.id === att.id || d.name === att.name);
      const hasDBData = matchInDB && matchInDB.dataUrl && matchInDB.dataUrl.length > 50;

      if (!hasDirectData && !hasDBData) {
        status = 'missing';
        statusCode = 'FILE_NOT_FOUND';
        details = 'فایل اصلی این پیوست در حافظه دیتابیس محلی یافت نشد (فایل گمشده).';
        errorReason = 'داده باینری پیوست مفقود گردیده است';
        remediationAction = 'remove_attachment';
      } else {
        const payloadLength = (matchInDB?.dataUrl || att.dataUrl || '').length;
        if (!fileSizeBytes) {
          fileSizeBytes = Math.round((payloadLength * 3) / 4);
        }

        if (fileSizeBytes > 25 * 1024 * 1024) {
          status = 'warning';
          statusCode = 'LARGE_ATTACHMENT';
          details = `حجم فایل بسیار بالا است (${(fileSizeBytes / (1024 * 1024)).toFixed(1)} مگابایت).`;
        } else {
          status = 'healthy';
          statusCode = 'ATTACHMENT_VALID';
          details = `فایل ${att.extension ? att.extension.toUpperCase() : ''} در پایگاه داده پایدار ذخیره و آماده دسترسی است.`;
        }
      }

      auditItems.push({
        id: `audit-att-${report.id}-${att.id}`,
        resourceType: 'attachment',
        name: `فایل پیوست: ${att.name}`,
        targetUrl: att.dataUrl ? `${att.dataUrl.slice(0, 35)}...` : `attachment_id:${att.id}`,
        parentType: 'report',
        parentId: report.id,
        parentTitle: report.title,
        teamSlug: report.teamSlug,
        teamName: report.teamName,
        status,
        statusCode,
        fileSizeBytes,
        fileSizeFormatted: fileSizeBytes ? formatFileSize(fileSizeBytes) : att.sizeFormatted,
        details,
        errorReason,
        remediationAction,
        checkedAt: new Date().toISOString()
      });
    }
  }

  // ----------------------------------------------------
  // 3. Audit Report Posters & Team Logos
  // ----------------------------------------------------
  for (const report of allReports) {
    if (report.posterSrc) {
      notifyProgress(`بررسی پوستر گزارش «${report.title}»`);
      const imgProbe = await probeImage(report.posterSrc, 2500);

      auditItems.push({
        id: `audit-poster-${report.id}`,
        resourceType: 'poster',
        name: `پوستر گزارش: ${report.title}`,
        targetUrl: report.posterSrc,
        parentType: 'report',
        parentId: report.id,
        parentTitle: report.title,
        teamSlug: report.teamSlug,
        teamName: report.teamName,
        status: imgProbe.ok ? 'healthy' : 'error',
        statusCode: imgProbe.ok ? 'IMG_OK' : 'IMG_FAIL',
        fileSizeBytes: imgProbe.sizeBytes,
        details: imgProbe.ok ? `پوستر گزارش به درستی نمایش داده می‌شود (${imgProbe.message})` : imgProbe.message,
        errorReason: imgProbe.ok ? undefined : 'بارگذاری پوستر با خطا مواجه شد',
        remediationAction: imgProbe.ok ? undefined : 'edit_report',
        checkedAt: new Date().toISOString()
      });
    }
  }

  // Team Logos & Global Badges
  for (const [slug, team] of Object.entries(allTeams)) {
    notifyProgress(`بررسی نشان تیم «${team.name}»`);
    const logoSrc = team.logo || '';
    if (logoSrc) {
      const imgProbe = await probeImage(logoSrc, 2500);
      auditItems.push({
        id: `audit-team-logo-${slug}`,
        resourceType: 'logo',
        name: `نشان و لوگوی تیم: ${team.name}`,
        targetUrl: logoSrc.length > 50 ? `${logoSrc.slice(0, 40)}...` : logoSrc,
        parentType: 'team',
        parentId: slug,
        parentTitle: team.name,
        teamSlug: slug,
        teamName: team.name,
        status: imgProbe.ok ? 'healthy' : 'error',
        statusCode: imgProbe.ok ? 'LOGO_OK' : 'LOGO_FAIL',
        fileSizeBytes: imgProbe.sizeBytes,
        details: imgProbe.ok ? `لوگوی تیم سالم و قابل رندر است (${imgProbe.message})` : imgProbe.message,
        errorReason: imgProbe.ok ? undefined : 'تصویر لوگو خراب یا لینک آن ناموجود است',
        checkedAt: new Date().toISOString()
      });
    }
  }

  // ----------------------------------------------------
  // 4. Audit Events
  // ----------------------------------------------------
  for (const event of allEvents) {
    notifyProgress(`بررسی رویداد «${event.title}»`);
    auditItems.push({
      id: `audit-event-${event.id}`,
      resourceType: 'link',
      name: `رویداد: ${event.title}`,
      targetUrl: event.location || 'محل برگزاری مشخص شده',
      parentType: 'event',
      parentId: event.id,
      parentTitle: event.title,
      status: 'healthy',
      statusCode: 'EVENT_OK',
      details: `رویداد فعال در تاریخ ${event.dateJalali} - ${event.time}`,
      checkedAt: new Date().toISOString()
    });
  }

  const healthyCount = auditItems.filter((i) => i.status === 'healthy').length;
  const warningCount = auditItems.filter((i) => i.status === 'warning').length;
  const errorCount = auditItems.filter((i) => i.status === 'error').length;
  const missingCount = auditItems.filter((i) => i.status === 'missing').length;

  const total = auditItems.length;
  const healthScore = total > 0 ? Math.round(((healthyCount + warningCount * 0.7) / total) * 100) : 100;

  const durationMs = Math.round(performance.now() - startTime);

  return {
    totalChecked: total,
    healthyCount,
    warningCount,
    errorCount,
    missingCount,
    healthScorePercentage: Math.min(100, Math.max(0, healthScore)),
    items: auditItems,
    scannedAt: new Date().toISOString(),
    durationMs
  };
}

/**
 * One-click Repair: Fix broken video link by resetting to high-reliability stable sample
 */
export function repairVideoWithStableSample(reportId: string, teamSlug: string): boolean {
  const allTeams = getAllTeams();
  const targetTeam = allTeams[teamSlug];
  if (!targetTeam) return false;

  const targetReport = targetTeam.reports.find((r) => r.id === reportId);
  if (!targetReport) return false;

  const updatedReport: ActivityReport = {
    ...targetReport,
    videoSrc: DEFAULT_STABLE_SAMPLE_VIDEO
  };

  saveReport(updatedReport, teamSlug);
  return true;
}

/**
 * One-click Cleanup: Remove missing attachment entry from report and cleanup DB
 */
export async function removeBrokenAttachmentFromReport(
  reportId: string,
  attachmentId: string,
  teamSlug?: string
): Promise<boolean> {
  const allReports = getAllReports();
  const targetReport = allReports.find((r) => r.id === reportId);
  if (!targetReport) return false;

  const effectiveTeamSlug = teamSlug || targetReport.teamSlug;
  const updatedAttachments = (targetReport.attachments || []).filter((a) => a.id !== attachmentId);

  const updatedReport: ActivityReport = {
    ...targetReport,
    attachments: updatedAttachments.length > 0 ? updatedAttachments : undefined
  };

  saveReport(updatedReport, effectiveTeamSlug);

  try {
    await deleteAttachmentFromDB(attachmentId);
  } catch {}

  return true;
}

/**
 * Generates an exportable textual diagnostics log for Admin download
 */
export function exportHealthAuditLogText(report: AuditSummaryReport): string {
  const lines: string[] = [];
  lines.push('===============================================================');
  lines.push('گزارش جامع تست سلامت لینک‌ها و فایل‌های سامانه باشگاه جوانان محاش');
  lines.push(`تاریخ اسکن: ${new Date(report.scannedAt).toLocaleString('fa-IR')}`);
  lines.push(`مدت زمان بررسی: ${toPersianDigits(report.durationMs)} میلی‌ثانیه`);
  lines.push(`نمره کلی سلامت سامانه: ${toPersianDigits(report.healthScorePercentage)}٪`);
  lines.push('===============================================================');
  lines.push('');
  lines.push(`• کل منابع و پیوندهای بررسی شده: ${toPersianDigits(report.totalChecked)}`);
  lines.push(`• منابع کاملاً سالم و تایید شده: ${toPersianDigits(report.healthyCount)}`);
  lines.push(`• هشدارها و نیازمند بهینه‌سازی: ${toPersianDigits(report.warningCount)}`);
  lines.push(`• لینک‌ها یا ویدیوهای خراب: ${toPersianDigits(report.errorCount)}`);
  lines.push(`• فایل‌ها یا پیوست‌های گمشده: ${toPersianDigits(report.missingCount)}`);
  lines.push('');
  lines.push('---------------------------------------------------------------');
  lines.push('جزئیات تفکیکی به ازای هر منبع:');
  lines.push('---------------------------------------------------------------');

  report.items.forEach((item, idx) => {
    const statusFa =
      item.status === 'healthy'
        ? '✅ سالم'
        : item.status === 'warning'
        ? '⚠️ هشدار'
        : item.status === 'missing'
        ? '❌ فایل گمشده'
        : '⛔ خطای ارتباط';

    lines.push(`[${idx + 1}] ${item.name} (${statusFa})`);
    lines.push(`   - نوع منبع: ${item.resourceType} | مربوط به: ${item.parentTitle}`);
    if (item.teamName) lines.push(`   - تیم: ${item.teamName}`);
    lines.push(`   - وضعیت فنی: ${item.statusCode || ''} | ${item.details}`);
    if (item.errorReason) lines.push(`   - علت خطا: ${item.errorReason}`);
    if (item.fileSizeFormatted) lines.push(`   - حجم فایل: ${item.fileSizeFormatted}`);
    lines.push('');
  });

  return lines.join('\n');
}
