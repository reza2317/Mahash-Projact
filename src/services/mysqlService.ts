import { ActivityReport, ScoreItem, UserPreferences } from '../types';
import { globalEventBus } from '../utils/eventBus';

export const DATABASE_WRITE_ERROR_EVENT = 'DATABASE_WRITE_ERROR';

export interface DatabaseErrorPayload {
  title?: string;
  operation: 'save_scores' | 'update_score' | 'save_report' | 'delete_report' | 'save_ugc' | 'save_preferences' | string;
  endpoint: string;
  status?: number;
  message: string;
  timestamp: string;
  dataSnippet?: any;
  originalError?: any;
}

let lastDatabaseWriteError: DatabaseErrorPayload | null = null;

/**
 * Triggers the standardized DATABASE_WRITE_ERROR event on both the global event bus
 * and window DOM events for maximum UI and component responsiveness.
 */
export function triggerDatabaseWriteError(payload: DatabaseErrorPayload): void {
  lastDatabaseWriteError = payload;
  console.error(`❌ [MySQL Service] ${DATABASE_WRITE_ERROR_EVENT}:`, payload);

  // 1. Emit via internal EventBus
  globalEventBus.emit(DATABASE_WRITE_ERROR_EVENT, payload);

  // 2. Dispatch via DOM CustomEvent for window listeners
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(
        new CustomEvent(DATABASE_WRITE_ERROR_EVENT, {
          detail: payload,
          bubbles: true,
          cancelable: false
        })
      );
    } catch (e) {
      console.warn('⚠️ Could not dispatch DOM CustomEvent for database write error:', e);
    }
  }
}

export function getLastDatabaseWriteError(): DatabaseErrorPayload | null {
  return lastDatabaseWriteError;
}

export function clearLastDatabaseWriteError(): void {
  lastDatabaseWriteError = null;
}

export function onDatabaseWriteError(callback: (error: DatabaseErrorPayload) => void): () => void {
  const handler = (err: any) => callback(err);
  globalEventBus.on(DATABASE_WRITE_ERROR_EVENT, handler);
  return () => globalEventBus.off(DATABASE_WRITE_ERROR_EVENT, handler);
}

// ----------------------------------------------------
// Performance Scores Persistence
// ----------------------------------------------------

/**
 * Fetches the latest team scores from MySQL backend.
 */
export async function fetchScoresFromMySQL(): Promise<{ success: boolean; scores: ScoreItem[]; source: string }> {
  try {
    const res = await fetch('/api/mysql/scores', {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      success: true,
      scores: Array.isArray(data.scores) ? data.scores : [],
      source: data.source || 'mysql'
    };
  } catch (err: any) {
    console.warn('⚠️ Could not fetch scores directly from MySQL API, falling back to client cache:', err);
    return { success: false, scores: [], source: 'fallback' };
  }
}

/**
 * Saves or replaces the full list of performance scores in MySQL with robust error tracking.
 */
export async function saveScoresToMySQL(
  scores: ScoreItem[]
): Promise<{ success: boolean; scores?: ScoreItem[]; error?: string }> {
  const endpoint = '/api/mysql/scores';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ scores })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      const errorPayload: DatabaseErrorPayload = {
        title: 'خطا در ثبت امتیازات در MySQL',
        operation: 'save_scores',
        endpoint,
        status: res.status,
        message: `خطای سرور در ذخیره امتیازات در MySQL (${res.status}): ${errText}`,
        timestamp: new Date().toISOString(),
        dataSnippet: { count: scores.length }
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    const result = await res.json();
    if (!result.success) {
      const errorPayload: DatabaseErrorPayload = {
        title: 'خطا در نگارش امتیازات تیم‌ها',
        operation: 'save_scores',
        endpoint,
        status: res.status,
        message: result.error || 'پایگاه داده قادر به ثبت تغییرات امتیازات نبود.',
        timestamp: new Date().toISOString()
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    return { success: true, scores: result.scores || scores };
  } catch (err: any) {
    const errorPayload: DatabaseErrorPayload = {
      title: 'خطای ارتباط با پایگاه داده امتیازات',
      operation: 'save_scores',
      endpoint,
      message: err?.message || 'خطای غیرمنتظره در ارتباط با پایگاه داده جهت ثبت امتیازات',
      timestamp: new Date().toISOString(),
      originalError: err
    };
    triggerDatabaseWriteError(errorPayload);
    return { success: false, error: errorPayload.message };
  }
}

/**
 * Updates a single team's score in MySQL.
 */
export async function updateTeamScoreInMySQL(
  teamId: string,
  score: number
): Promise<{ success: boolean; scores?: ScoreItem[]; error?: string }> {
  const endpoint = '/api/mysql/scores';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ teamId, score })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      const errorPayload: DatabaseErrorPayload = {
        title: `خطا در به‌روزرسانی امتیاز تیم ${teamId}`,
        operation: 'update_score',
        endpoint,
        status: res.status,
        message: `خطا در به‌روزرسانی امتیاز تیم ${teamId} در پایگاه داده (${res.status}): ${errText}`,
        timestamp: new Date().toISOString(),
        dataSnippet: { teamId, score }
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    const result = await res.json();
    return { success: true, scores: result.scores };
  } catch (err: any) {
    const errorPayload: DatabaseErrorPayload = {
      title: `خطای ذخیره امتیاز تیم ${teamId}`,
      operation: 'update_score',
      endpoint,
      message: err?.message || `خطای ارتباطی در به‌روزرسانی امتیاز تیم ${teamId}`,
      timestamp: new Date().toISOString(),
      dataSnippet: { teamId, score },
      originalError: err
    };
    triggerDatabaseWriteError(errorPayload);
    return { success: false, error: errorPayload.message };
  }
}

// ----------------------------------------------------
// User-Generated Content & Reports Persistence
// ----------------------------------------------------

/**
 * Persists comprehensive user-generated content payload (custom reports, overrides, scores, attachments)
 * into MySQL persistent storage.
 */
export async function saveUserGeneratedContent(
  payload: {
    customReports?: ActivityReport[];
    scores?: ScoreItem[];
    teamOverrides?: Record<string, any>;
    teamLogos?: Record<string, string>;
    deletedReports?: string[];
    [key: string]: any;
  }
): Promise<{ success: boolean; store?: any; error?: string }> {
  const endpoint = '/api/store';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      const errorPayload: DatabaseErrorPayload = {
        title: 'خطا در ثبت اطلاعات در پایگاه داده MySQL',
        operation: 'save_ugc',
        endpoint,
        status: res.status,
        message: `خطا در ذخیره‌سازی محتوای کاربر در سرور و پایگاه داده (${res.status}): ${errText}`,
        timestamp: new Date().toISOString()
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    const data = await res.json();
    if (!data.success) {
      const errorPayload: DatabaseErrorPayload = {
        title: 'پاسخ ناموفق پایگاه داده MySQL',
        operation: 'save_ugc',
        endpoint,
        status: res.status,
        message: data.error || 'سرور گزارش کرد که ذخیره محتوا در پایگاه داده ناموفق بوده است.',
        timestamp: new Date().toISOString()
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    return { success: true, store: data.store };
  } catch (err: any) {
    const errorPayload: DatabaseErrorPayload = {
      title: 'خطای قطعی ارتباط با دیتابیس MySQL',
      operation: 'save_ugc',
      endpoint,
      message: err?.message || 'خطای شبکه یا قطعی اتصال در ذخیره‌سازی محتوای کاربر در پایگاه داده',
      timestamp: new Date().toISOString(),
      originalError: err
    };
    triggerDatabaseWriteError(errorPayload);
    return { success: false, error: errorPayload.message };
  }
}

/**
 * Persists an individual activity report to MySQL.
 */
export async function saveReportToMySQL(
  report: ActivityReport
): Promise<{ success: boolean; report?: ActivityReport; error?: string }> {
  const endpoint = '/api/mysql/reports';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(report)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      const errorPayload: DatabaseErrorPayload = {
        title: `خطا در ذخیره گزارش «${report.title || report.id}»`,
        operation: 'save_report',
        endpoint,
        status: res.status,
        message: `خطای ذخیره‌سازی گزارش ${report.id} در پایگاه داده (${res.status}): ${errText}`,
        timestamp: new Date().toISOString(),
        dataSnippet: { reportId: report.id, title: report.title }
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    const data = await res.json();
    return { success: true, report: data.report || report };
  } catch (err: any) {
    const errorPayload: DatabaseErrorPayload = {
      title: `خطای ارتباطی در ذخیره گزارش «${report.title || report.id}»`,
      operation: 'save_report',
      endpoint,
      message: err?.message || `خطای اتصال هنگام ذخیره گزارش ${report.id}`,
      timestamp: new Date().toISOString(),
      dataSnippet: { reportId: report.id, title: report.title },
      originalError: err
    };
    triggerDatabaseWriteError(errorPayload);
    return { success: false, error: errorPayload.message };
  }
}

/**
 * Deletes a report from MySQL backend with error handling.
 */
export async function deleteReportFromMySQL(
  reportId: string,
  permanent: boolean = false
): Promise<{ success: boolean; error?: string }> {
  const endpoint = `/api/reports/${encodeURIComponent(reportId)}${permanent ? '?permanent=true' : ''}`;
  try {
    const res = await fetch(endpoint, {
      method: 'DELETE',
      headers: { 'Accept': 'application/json' }
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      const errorPayload: DatabaseErrorPayload = {
        title: 'خطا در حذف گزارش از MySQL',
        operation: 'delete_report',
        endpoint,
        status: res.status,
        message: `خطا در حذف گزارش ${reportId} از پایگاه داده (${res.status}): ${errText}`,
        timestamp: new Date().toISOString(),
        dataSnippet: { reportId, permanent }
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    return { success: true };
  } catch (err: any) {
    const errorPayload: DatabaseErrorPayload = {
      title: 'خطای شبکه در حذف گزارش',
      operation: 'delete_report',
      endpoint,
      message: err?.message || `خطای اتصال هنگام حذف گزارش ${reportId}`,
      timestamp: new Date().toISOString(),
      dataSnippet: { reportId, permanent },
      originalError: err
    };
    triggerDatabaseWriteError(errorPayload);
    return { success: false, error: errorPayload.message };
  }
}

// ----------------------------------------------------
// User Preferences Persistence
// ----------------------------------------------------

export async function savePreferencesToMySQL(
  preferences: UserPreferences
): Promise<{ success: boolean; error?: string }> {
  const endpoint = '/api/mysql/preferences';
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ preferences })
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      const errorPayload: DatabaseErrorPayload = {
        title: 'خطا در ذخیره تنظیمات در MySQL',
        operation: 'save_preferences',
        endpoint,
        status: res.status,
        message: `خطا در ذخیره تنظیمات در پایگاه داده (${res.status}): ${errText}`,
        timestamp: new Date().toISOString()
      };
      triggerDatabaseWriteError(errorPayload);
      return { success: false, error: errorPayload.message };
    }

    return { success: true };
  } catch (err: any) {
    const errorPayload: DatabaseErrorPayload = {
      title: 'خطای شبکه هنگام ذخیره تنظیمات کاربر',
      operation: 'save_preferences',
      endpoint,
      message: err?.message || 'خطای اتصال هنگام ذخیره تنظیمات در پایگاه داده',
      timestamp: new Date().toISOString(),
      originalError: err
    };
    triggerDatabaseWriteError(errorPayload);
    return { success: false, error: errorPayload.message };
  }
}

// ----------------------------------------------------
// Backend Diagnostics
// ----------------------------------------------------

export async function checkMySQLStatus(): Promise<{
  connected: boolean;
  status: string;
  latencyMs?: number;
  tables?: number;
}> {
  try {
    const startTime = Date.now();
    const res = await fetch('/api/mysql/status', {
      headers: { 'Accept': 'application/json' }
    });
    const latencyMs = Date.now() - startTime;
    if (!res.ok) {
      return { connected: false, status: 'error', latencyMs };
    }
    const data = await res.json();
    return {
      connected: Boolean(data.connected),
      status: data.status || (data.connected ? 'online' : 'offline'),
      latencyMs: data.latencyMs || latencyMs,
      tables: data.tables?.length || 0
    };
  } catch {
    return { connected: false, status: 'unreachable' };
  }
}
