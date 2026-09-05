import { UserPreferences } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage } from './storage';
import { globalEventBus } from './eventBus';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

// Quota exceeded flags (Always false in MySQL mode - unlimited capacity)
export let firestoreReadQuotaExceeded = false;
export let firestoreWriteQuotaExceeded = false;

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export interface FirestoreDiagnosticLog {
  timestamp: string;
  operation: string;
  targetPath: string;
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT';
  latencyMs: number;
  dataSizeBytes?: number;
  rawResponse?: string;
  error?: string;
}

const diagnosticLogs: FirestoreDiagnosticLog[] = [];

/**
 * Diagnostic utility function to log and track storage operations in real time.
 */
export function logFirestoreDiagnostic(
  operation: string,
  targetPath: string,
  status: 'SUCCESS' | 'ERROR' | 'TIMEOUT',
  latencyMs: number,
  dataSizeBytes?: number,
  rawResponse?: unknown,
  error?: unknown
): FirestoreDiagnosticLog {
  const logItem: FirestoreDiagnosticLog = {
    timestamp: new Date().toISOString(),
    operation,
    targetPath,
    status,
    latencyMs,
    dataSizeBytes,
    rawResponse: rawResponse ? JSON.stringify(rawResponse) : undefined,
    error: error instanceof Error ? error.message : error ? String(error) : undefined,
  };

  diagnosticLogs.unshift(logItem);
  if (diagnosticLogs.length > 50) diagnosticLogs.pop();

  if (status === 'SUCCESS') {
    console.log(
      `%c[MySQL Storage: ${operation}] %cSUCCESS in ${latencyMs}ms -> ${targetPath} (${dataSizeBytes || 0} bytes)`,
      'color: #10b981; font-weight: bold;',
      'color: #059669;'
    );
  } else if (status === 'TIMEOUT') {
    console.warn(
      `%c[MySQL Storage: ${operation}] %cTIMEOUT after ${latencyMs}ms -> ${targetPath}`,
      'color: #f59e0b; font-weight: bold;',
      'color: #d97706;'
    );
  } else {
    console.warn(
      `%c[MySQL Storage: ${operation}] %cNOTICE in ${latencyMs}ms -> ${targetPath}:`,
      'color: #f59e0b; font-weight: bold;',
      'color: #d97706;',
      error
    );
  }

  return logItem;
}

export function getRecentFirestoreDiagnostics(): FirestoreDiagnosticLog[] {
  return [...diagnosticLogs];
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): FirestoreErrorInfo {
  const errorMessage = error instanceof Error ? error.message : String(error);

  const errInfo: FirestoreErrorInfo = {
    error: errorMessage,
    authInfo: {
      userId: 'mysql_admin',
      email: 'admin@mahash.ir',
      emailVerified: true,
      isAnonymous: false,
      tenantId: null,
      providerInfo: [{ providerId: 'mysql_auth', email: 'admin@mahash.ir' }]
    },
    operationType,
    path
  };
  console.warn('[MySQL Storage Notice]:', JSON.stringify(errInfo));
  return errInfo;
}

export function sanitizeDocId(id: string): string {
  return String(id || 'default').replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 120);
}

// ----------------------------------------------------
// Dedicated MySQL 'assets' Collection / Table Storage
// ----------------------------------------------------

export interface AssetItemPayload {
  assetId: string;
  category: 'logo' | 'badge' | 'consultant_photo' | 'graphic' | 'icon';
  name: string;
  data: string;
  mimeType?: string;
  sizeBytes?: number;
  updatedAt: string;
}

/**
 * Saves any media asset directly and permanently to MySQL mahash_assets table
 */
export async function saveAssetToFirestore(
  assetId: string,
  category: 'logo' | 'badge' | 'consultant_photo' | 'graphic' | 'icon',
  name: string,
  data: string,
  mimeType = 'image/webp'
): Promise<{ success: boolean; error?: string; latencyMs: number; rawResult?: unknown }> {
  if (!assetId || !data) {
    return { success: false, error: 'شناسه یا دیتای فایل نامعتبر است', latencyMs: 0 };
  }

  const cleanId = sanitizeDocId(assetId);
  const path = `mysql/assets/${cleanId}`;
  const start = performance.now();
  const sizeBytes = data.length;

  // 1. Immediately cache in local storage for instant zero-latency UI display
  safeSetLocalStorage(`mahash_asset_${cleanId}`, data);

  // 2. Persist directly and permanently in MySQL database
  try {
    const res = await fetch('/api/mysql/assets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId: cleanId,
        category,
        name: name || cleanId,
        data,
        mimeType
      })
    });
    const latency = Math.round(performance.now() - start);

    if (res.status === 200 || res.status === 201) {
      logFirestoreDiagnostic('saveToMySQL(assets)', path, 'SUCCESS', latency, sizeBytes, { status: 'saved_to_mysql', docId: cleanId });
      return { success: true, latencyMs: latency, rawResult: { docId: cleanId, status: 'committed_to_mysql' } };
    } else {
      const errJson = await res.json().catch(() => ({}));
      const errMsg = errJson.error || `خطای سرور (${res.status}) در ثبت فایل در دیتابیس MySQL`;
      logFirestoreDiagnostic('saveToMySQL(assets)', path, 'ERROR', latency, sizeBytes, undefined, errMsg);
      globalEventBus.emit('DATABASE_WRITE_ERROR', {
        title: 'خطا در ثبت رسانه در پایگاه داده MySQL',
        message: errMsg
      });
      return { success: false, error: errMsg, latencyMs: latency, rawResult: { warning: errMsg } };
    }
  } catch (err: unknown) {
    const latency = Math.round(performance.now() - start);
    const errMsg = err instanceof Error ? err.message : String(err);
    logFirestoreDiagnostic('saveToMySQL(assets)', path, 'ERROR', latency, sizeBytes, undefined, err);
    globalEventBus.emit('DATABASE_WRITE_ERROR', {
      title: 'خطای شبکه در ذخیره رسانه در MySQL',
      message: errMsg
    });
    return {
      success: false,
      error: errMsg,
      latencyMs: latency,
      rawResult: { error: errMsg }
    };
  }
}

/**
 * Retrieves a media asset directly from MySQL mahash_assets table
 */
export async function getAssetFromFirestore(assetId: string): Promise<string | null> {
  if (!assetId) return null;
  const cleanId = sanitizeDocId(assetId);

  // 1. Fast local cache access
  const localCached = safeGetLocalStorage(`mahash_asset_${cleanId}`);
  if (localCached && typeof localCached === 'string' && localCached.length > 20) {
    return localCached;
  }

  const path = `mysql/assets/${cleanId}`;
  const start = performance.now();

  // 2. Fetch directly from MySQL
  try {
    const res = await fetch(`/api/mysql/assets/${encodeURIComponent(cleanId)}`);
    const latency = Math.round(performance.now() - start);

    if (res.ok) {
      const json = await res.json();
      if (json?.asset?.data) {
        logFirestoreDiagnostic('getFromMySQL(assets)', path, 'SUCCESS', latency, json.asset.data.length);
        safeSetLocalStorage(`mahash_asset_${cleanId}`, json.asset.data);
        return json.asset.data;
      }
    }
    logFirestoreDiagnostic('getFromMySQL(assets)', path, 'SUCCESS', latency, 0, { exists: false });
    return null;
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    logFirestoreDiagnostic('getFromMySQL(assets)', path, 'ERROR', latency, 0, undefined, err);
    return null;
  }
}

/**
 * Deletes an asset directly from MySQL mahash_assets table
 */
export async function deleteAssetFromFirestore(assetId: string): Promise<boolean> {
  if (!assetId) return false;
  const cleanId = sanitizeDocId(assetId);
  safeRemoveLocalStorage(`mahash_asset_${cleanId}`);

  try {
    const res = await fetch(`/api/mysql/assets/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE'
    });
    return res.ok;
  } catch (err) {
    console.warn('[MySQL Assets] Error deleting asset:', err);
    return false;
  }
}

// ----------------------------------------------------
// Team & Organization Logos (Direct MySQL)
// ----------------------------------------------------

export function resolveCanonicalTeamShortId(input: string): string {
  if (!input) return 'thinker';
  const raw = String(input).trim().toLowerCase();
  if (raw.includes('angel') || raw.includes('فرشتگان') || raw.includes('fereshte')) return 'angels';
  if (raw.includes('ghorban') || raw.includes('قربان') || raw.includes('قربونی') || raw.includes('خادم')) return 'ghorbani';
  if (raw.includes('silence') || raw.includes('سکوت') || raw.includes('آوا') || raw.includes('یاوران')) return 'silence';
  if (raw.includes('tomorrow') || raw.includes('فردا') || raw.includes('سازندگان')) return 'tomorrow';
  if (raw.includes('think') || raw.includes('متفکر') || raw.includes('تفکر')) return 'thinker';
  return raw.replace(/^team-/, '');
}

/**
 * Directly saves a team logo to MySQL database (mahash_assets table)
 */
export async function saveLogoToFirestore(teamIdOrSlug: string, logoData: string): Promise<boolean> {
  if (!teamIdOrSlug || !logoData) return false;
  const shortId = resolveCanonicalTeamShortId(teamIdOrSlug);
  const docId = sanitizeDocId(shortId);

  // Save to MySQL
  const assetRes = await saveAssetToFirestore(`team_${docId}_logo`, 'logo', `لوگوی تیم ${teamIdOrSlug}`, logoData);

  safeSetLocalStorage(`mahash_team_logo_${teamIdOrSlug}`, logoData);
  safeSetLocalStorage(`mahash_team_logo_${shortId}`, logoData);
  return assetRes.success;
}

/**
 * Retrieves a team logo directly from MySQL database
 */
export async function getLogoFromFirestore(teamIdOrSlug: string): Promise<string | null> {
  if (!teamIdOrSlug) return null;
  const shortId = resolveCanonicalTeamShortId(teamIdOrSlug);
  const docId = sanitizeDocId(shortId);

  // Fast local storage cache check
  const local = safeGetLocalStorage(`mahash_team_logo_${teamIdOrSlug}`) || safeGetLocalStorage(`mahash_team_logo_${shortId}`);
  if (local && typeof local === 'string' && local.length > 20) {
    return local;
  }

  // Fetch from MySQL
  const assetData = await getAssetFromFirestore(`team_${docId}_logo`);
  if (assetData) {
    safeSetLocalStorage(`mahash_team_logo_${teamIdOrSlug}`, assetData);
    safeSetLocalStorage(`mahash_team_logo_${shortId}`, assetData);
    return assetData;
  }

  return null;
}

/**
 * Removes a logo from MySQL database
 */
export async function deleteLogoFromFirestore(teamIdOrSlug: string): Promise<boolean> {
  if (!teamIdOrSlug) return false;
  const shortId = resolveCanonicalTeamShortId(teamIdOrSlug);
  const docId = sanitizeDocId(shortId);

  safeRemoveLocalStorage(`mahash_team_logo_${teamIdOrSlug}`);
  safeRemoveLocalStorage(`mahash_team_logo_${shortId}`);
  return deleteAssetFromFirestore(`team_${docId}_logo`);
}

// ----------------------------------------------------
// Official Mahash Logo & Youth Club Emblem (Direct MySQL)
// ----------------------------------------------------

export async function saveMahashLogoToFirestore(logoData: string): Promise<boolean> {
  const res = await saveAssetToFirestore('mahash_official_logo', 'logo', 'لوگوی رسمی کانون ماهش', logoData);
  safeSetLocalStorage('mahash_official_logo', logoData);
  return res.success;
}

export async function getMahashLogoFromFirestore(): Promise<string | null> {
  const local = safeGetLocalStorage('mahash_official_logo');
  if (local && typeof local === 'string' && local.length > 20) return local;
  return getAssetFromFirestore('mahash_official_logo');
}

export async function saveYouthClubEmblemToFirestore(emblemData: string): Promise<boolean> {
  const res = await saveAssetToFirestore('mahash_youth_club_emblem', 'badge', 'مدال و نشان رسمی باشگاه جوانان', emblemData);
  safeSetLocalStorage('mahash_youth_club_emblem', emblemData);
  return res.success;
}

export async function getYouthClubEmblemFromFirestore(): Promise<string | null> {
  const local = safeGetLocalStorage('mahash_youth_club_emblem');
  if (local && typeof local === 'string' && local.length > 20) return local;
  return getAssetFromFirestore('mahash_youth_club_emblem');
}

// ----------------------------------------------------
// Consultant Photos (Direct MySQL)
// ----------------------------------------------------

export function getCanonicalConsultantDocId(consultantName: string): string {
  if (!consultantName) return 'consultant_unknown';
  const lower = consultantName.toLowerCase();

  if (consultantName.includes('نازی') || consultantName.includes('نزی') || lower.includes('nazi')) {
    return 'consultant_nazi_abbasian';
  }
  if (consultantName.includes('رادین') || consultantName.includes('اورومی') || consultantName.includes('ارومی') || lower.includes('radin')) {
    return 'consultant_radin_oroumi';
  }

  const sanitized = consultantName
    .replace(/[\u200c\s]+/g, '_')
    .replace(/[^a-zA-Z0-9_\-]/g, '');
  return `consultant_${sanitized || 'custom'}`.slice(0, 120);
}

/**
 * Saves a consultant photo directly to MySQL mahash_assets table
 */
export async function saveConsultantPhotoToFirestore(consultantName: string, photoData: string): Promise<boolean> {
  if (!consultantName || !photoData) return false;
  const docId = getCanonicalConsultantDocId(consultantName);

  const assetRes = await saveAssetToFirestore(docId, 'consultant_photo', `عکس مشاور ${consultantName}`, photoData);

  safeSetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(consultantName.trim())}`, photoData);
  safeSetLocalStorage(`mahash_consultant_photo_${docId}`, photoData);

  return assetRes.success;
}

/**
 * Retrieves a consultant photo directly from MySQL
 */
export async function getConsultantPhotoFromFirestore(consultantName: string): Promise<string | null> {
  if (!consultantName) return null;
  const docId = getCanonicalConsultantDocId(consultantName);

  // Fast local storage cache check
  const local = safeGetLocalStorage(`mahash_consultant_photo_${docId}`) ||
                safeGetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(consultantName.trim())}`);
  if (local && typeof local === 'string' && local.length > 20) {
    return local;
  }

  const asset = await getAssetFromFirestore(docId);
  if (asset) {
    safeSetLocalStorage(`mahash_consultant_photo_${docId}`, asset);
    safeSetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(consultantName.trim())}`, asset);
    return asset;
  }
  return null;
}

export async function deleteConsultantPhotoFromFirestore(consultantName: string): Promise<boolean> {
  if (!consultantName) return false;
  const docId = getCanonicalConsultantDocId(consultantName);

  safeRemoveLocalStorage(`mahash_consultant_photo_${docId}`);
  safeRemoveLocalStorage(`mahash_consultant_photo_${encodeURIComponent(consultantName.trim())}`);
  return deleteAssetFromFirestore(docId);
}

// ----------------------------------------------------
// User Preferences (Direct MySQL)
// ----------------------------------------------------

export async function savePreferencesToFirestore(prefs: UserPreferences): Promise<boolean> {
  try {
    const res = await fetch('/api/mysql/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: prefs.theme || 'system',
        highContrast: Boolean(prefs.highContrast),
        textSize: prefs.textSize || 'normal',
        updatedAt: new Date().toISOString()
      })
    });
    return res.ok;
  } catch (error) {
    console.warn('[MySQL Preferences] Failed to save preferences to MySQL:', error);
    return false;
  }
}

export async function getPreferencesFromFirestore(): Promise<UserPreferences | null> {
  try {
    const res = await fetch('/api/mysql/preferences');
    if (res.ok) {
      const json = await res.json();
      if (json && json.preferences) {
        return {
          theme: json.preferences.theme || 'system',
          highContrast: Boolean(json.preferences.highContrast),
          textSize: json.preferences.textSize || 'normal'
        };
      }
    }
  } catch (error) {
    console.warn('[MySQL Preferences] Failed to fetch preferences from MySQL:', error);
  }
  return null;
}
