/**
 * MySQL Logger Utility
 * Handles persisting user interactions, consultation requests, team registrations,
 * report submissions, and platform events directly to MySQL database in real-time.
 */

export type MySQLActionType =
  | 'consultation_request'
  | 'team_join'
  | 'report_create'
  | 'report_update'
  | 'report_delete'
  | 'comment_post'
  | 'comment_delete'
  | 'score_update'
  | 'event_create'
  | 'contact_message'
  | 'system_sync'
  | 'user_action'
  | string;

export interface LogReportPayload {
  actionType: MySQLActionType;
  title: string;
  details?: string;
  userName?: string;
  userContact?: string;
  teamSlug?: string;
  reportId?: string;
  metadata?: Record<string, any>;
  status?: 'success' | 'warning' | 'error' | 'pending';
  timestamp?: string;
}

export interface MySQLLogItem {
  id: string;
  action_type: MySQLActionType;
  title: string;
  details?: string;
  user_name?: string;
  user_contact?: string;
  team_slug?: string;
  report_id?: string;
  metadata?: Record<string, any>;
  status: 'success' | 'warning' | 'error' | 'pending';
  created_at: string;
}

const LOCAL_LOGS_CACHE_KEY = 'mahash_offline_mysql_logs_queue';

function getOfflineQueue(): LogReportPayload[] {
  try {
    const raw = localStorage.getItem(LOCAL_LOGS_CACHE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addToOfflineQueue(payload: LogReportPayload) {
  try {
    const queue = getOfflineQueue();
    queue.unshift(payload);
    if (queue.length > 100) queue.length = 100;
    localStorage.setItem(LOCAL_LOGS_CACHE_KEY, JSON.stringify(queue));
  } catch {}
}

/**
 * Persists an action or report event to MySQL database via the backend API.
 */
export async function logReportToMySQL(
  payload: LogReportPayload
): Promise<{ success: boolean; logId?: string; message?: string; error?: string }> {
  try {
    const enrichedPayload = {
      ...payload,
      timestamp: payload.timestamp || new Date().toISOString()
    };

    const response = await fetch('/api/mysql/log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(enrichedPayload)
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        logId: data.logId,
        message: data.message || 'ثبت در MySQL با موفقیت انجام شد.'
      };
    } else {
      addToOfflineQueue(enrichedPayload);
      return {
        success: false,
        error: `خطای سرور (${response.status})`
      };
    }
  } catch (err: any) {
    addToOfflineQueue(payload);
    return {
      success: false,
      error: err?.message || 'عدم دسترسی به سرور API'
    };
  }
}

/**
 * Fetches recent logs from the MySQL database.
 */
export async function fetchMySQLLogs(
  limit: number = 50,
  actionType: string = 'all'
): Promise<{
  success: boolean;
  logs: MySQLLogItem[];
  count: number;
  source?: string;
  mysqlConnected?: boolean;
  error?: string;
}> {
  try {
    const params = new URLSearchParams();
    params.set('limit', String(limit));
    if (actionType && actionType !== 'all') {
      params.set('actionType', actionType);
    }

    const response = await fetch(`/api/mysql/logs?${params.toString()}`, {
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        logs: Array.isArray(data.logs) ? data.logs : [],
        count: data.count || 0,
        source: data.source || 'mysql_live_table',
        mysqlConnected: data.mysqlConnected ?? true
      };
    }

    return {
      success: false,
      logs: [],
      count: 0,
      error: `Server responded with status ${response.status}`
    };
  } catch (err: any) {
    return {
      success: false,
      logs: [],
      count: 0,
      error: err?.message || 'Failed to fetch MySQL logs'
    };
  }
}

/**
 * Deletes a single log entry from MySQL.
 */
export async function deleteMySQLLog(logId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/mysql/logs/${encodeURIComponent(logId)}`, {
      method: 'DELETE'
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Clears all activity logs from MySQL database.
 */
export async function clearAllMySQLLogs(): Promise<boolean> {
  try {
    const response = await fetch('/api/mysql/logs', {
      method: 'DELETE'
    });
    return response.ok;
  } catch {
    return false;
  }
}

export interface ArchiveLogsResult {
  success: boolean;
  totalArchived: number;
  clearedCount: number;
  archiveFileName?: string;
  error?: string;
}

/**
 * Safely archives and clears old logs from MySQL with optional JSON backup download.
 */
export async function archiveAndClearLogsAPI(
  olderThanDays: number = 0,
  clearAfterArchive: boolean = true,
  autoDownloadJSON: boolean = true
): Promise<ArchiveLogsResult> {
  try {
    const response = await fetch('/api/mysql/logs/archive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        olderThanDays,
        clearAfterArchive
      })
    });

    if (!response.ok) {
      throw new Error(`Server returned status ${response.status}`);
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to archive MySQL logs');
    }

    // Auto-trigger client-side file download of the JSON snapshot if requested
    if (autoDownloadJSON && Array.isArray(data.logs) && data.logs.length > 0 && typeof window !== 'undefined') {
      try {
        const jsonStr = JSON.stringify(
          {
            exportedAt: new Date().toISOString(),
            totalLogs: data.logs.length,
            archiveFileName: data.archiveFileName,
            logs: data.logs
          },
          null,
          2
        );
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = data.archiveFileName || `mahash_mysql_logs_backup_${Date.now()}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } catch (dlErr) {
        console.warn('Could not auto-download JSON archive file:', dlErr);
      }
    }

    return {
      success: true,
      totalArchived: data.totalArchived || 0,
      clearedCount: data.clearedCount || 0,
      archiveFileName: data.archiveFileName
    };
  } catch (err: any) {
    return {
      success: false,
      totalArchived: 0,
      clearedCount: 0,
      error: err?.message || 'Archive failed'
    };
  }
}

