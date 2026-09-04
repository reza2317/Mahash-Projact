// Audit Logger utility for Mahash Admin Operations
import { getSmartCurrentDate, toPersianDigits, gregorianToJalali } from './persianDate';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage } from './storage';

export type AuditActionType =
  | 'CREATE_REPORT'
  | 'UPDATE_REPORT'
  | 'DELETE_REPORT'
  | 'PERMANENT_DELETE_REPORT'
  | 'RESTORE_REPORT'
  | 'EMPTY_TRASH'
  | 'UPLOAD_VIDEO'
  | 'DELETE_VIDEO'
  | 'UPLOAD_ATTACHMENT'
  | 'DELETE_ATTACHMENT'
  | 'UPDATE_LOGO'
  | 'UPDATE_SCORE'
  | 'CREATE_EVENT'
  | 'DELETE_EVENT'
  | 'RESET_SYSTEM'
  | 'AUTH_LOGIN'
  | 'AUTH_LOGOUT'
  | 'CLEAN_CACHE';

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  persianDate: string;
  persianTime: string;
  actionType: AuditActionType;
  title: string;
  description: string;
  teamSlug?: string;
  actor: string;
  details?: Record<string, any>;
}

const AUDIT_LOGS_KEY = 'mahash_audit_logs_v1';
const MAX_LOGS = 120;

export async function fetchAuditLogs(): Promise<AuditLogEntry[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch('/api/mysql/logs');
    if (res.ok) {
      const data = await res.json();
      if (data.success && Array.isArray(data.logs)) {
        return data.logs.map((row: any) => {
          // Map MySQL mahash_activity_logs to AuditLogEntry format
          const date = new Date(row.created_at);
          const j = gregorianToJalali(date);
          const pDate = `${j.day} ${j.monthName} ${j.year}`;
          const pTime = `${toPersianDigits(String(date.getHours()).padStart(2, '0'))}:${toPersianDigits(String(date.getMinutes()).padStart(2, '0'))}:${toPersianDigits(String(date.getSeconds()).padStart(2, '0'))}`;
          return {
            id: row.id,
            timestamp: date.getTime(),
            persianDate: pDate,
            persianTime: pTime,
            actionType: row.action_type as AuditActionType,
            title: row.title,
            description: row.details,
            teamSlug: row.team_slug,
            actor: row.user_name || 'سیستم',
            details: row.metadata
          };
        });
      }
    }
  } catch (err) {
    console.error('Failed to fetch audit logs from MySQL, falling back to local', err);
  }
  return getAuditLogs();
}

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = safeGetLocalStorage(AUDIT_LOGS_KEY);
    if (!raw) return getDefaultAuditLogs();
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Error reading audit logs:', err);
    return getDefaultAuditLogs();
  }
}

export function getDeletionAuditLogs(): AuditLogEntry[] {
  const all = getAuditLogs();
  return all.filter(
    (log) =>
      log.actionType === 'DELETE_REPORT' ||
      log.actionType === 'PERMANENT_DELETE_REPORT' ||
      log.actionType === 'EMPTY_TRASH'
  );
}

export function logAuditEvent(
  actionType: AuditActionType,
  title: string,
  description: string,
  options?: {
    teamSlug?: string;
    actor?: string;
    details?: Record<string, any>;
  }
): AuditLogEntry {
  const now = new Date();
  const persianDate = getSmartCurrentDate();
  const persianTime = `${toPersianDigits(String(now.getHours()).padStart(2, '0'))}:${toPersianDigits(String(now.getMinutes()).padStart(2, '0'))}:${toPersianDigits(String(now.getSeconds()).padStart(2, '0'))}`;

  const entry: AuditLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    persianDate,
    persianTime,
    actionType,
    title,
    description,
    teamSlug: options?.teamSlug,
    actor: options?.actor || 'مدیر ارشد سامانه (Admin)',
    details: options?.details
  };

  if (typeof window !== 'undefined') {
    try {
      const logs = getAuditLogs();
      logs.unshift(entry);
      // Keep within max logs
      if (logs.length > MAX_LOGS) {
        logs.splice(MAX_LOGS);
      }
      safeSetLocalStorage(AUDIT_LOGS_KEY, JSON.stringify(logs));
      window.dispatchEvent(new CustomEvent('mahash_audit_logged', { detail: entry }));
    } catch (err) {
      console.error('Error saving audit log:', err);
    }
  }

  return entry;
}

export function clearAuditLogs(): void {
  if (typeof window === 'undefined') return;
  safeRemoveLocalStorage(AUDIT_LOGS_KEY);
  window.dispatchEvent(new CustomEvent('mahash_audit_logged'));
}

export function exportAuditLogsJson(): string {
  const logs = getAuditLogs();
  return JSON.stringify(logs, null, 2);
}

export function exportAuditLogsCsv(): string {
  const logs = getAuditLogs();
  const headers = ['شناسه', 'تاریخ شمسی', 'ساعت', 'نوع عملیات', 'عنوان', 'اپراتور/مدیر', 'تیم', 'توضیحات'];
  const rows = logs.map((l) => [
    l.id,
    l.persianDate,
    l.persianTime,
    l.actionType,
    `"${(l.title || '').replace(/"/g, '""')}"`,
    `"${(l.actor || '').replace(/"/g, '""')}"`,
    l.teamSlug || '',
    `"${(l.description || '').replace(/"/g, '""')}"`
  ]);
  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

function getDefaultAuditLogs(): AuditLogEntry[] {
  return [
    {
      id: 'init-1',
      timestamp: Date.now() - 3600000 * 24 * 3,
      persianDate: '۱۴۰۵/۰۵/۲۲',
      persianTime: '۱۰:۳۰:۰۰',
      actionType: 'UPDATE_SCORE',
      title: 'ثبت و همگام‌سازی اولیه امتیازات تیم‌ها',
      description: 'امتیازات تیم‌های پنج‌گانه باشگاه جوانان محاش در سامانه پایش محاسبه و ثبت گردید.',
      actor: 'سیستم خودکار محاش'
    },
    {
      id: 'init-2',
      timestamp: Date.now() - 3600000 * 24 * 2,
      persianDate: '۱۴۰۵/۰۵/۲۳',
      persianTime: '۱۴:۱۵:۰۰',
      actionType: 'UPDATE_LOGO',
      title: 'پیکربندی هویت بصری و لوگوهای رسمی',
      description: 'نشان طلایی باشگاه جوانان و لوگوی سازمانی موسسه محاش در سامانه تنظیم شدند.',
      actor: 'مدیر ارشد سامانه (Admin)'
    },
    {
      id: 'init-3',
      timestamp: Date.now() - 3600000 * 12,
      persianDate: '۱۴۰۵/۰۵/۲۵',
      persianTime: '۰۹:۴۰:۰۰',
      actionType: 'AUTH_LOGIN',
      title: 'ورود موفق به پنل مدیریت',
      description: 'مدیر سامانه با نام کاربری Admin با موفقیت وارد پنل شد.',
      actor: 'Admin'
    }
  ];
}

