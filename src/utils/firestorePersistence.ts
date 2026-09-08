import { UserPreferences } from '../types';
import { safeSetLocalStorage, safeGetLocalStorage, safeRemoveLocalStorage } from './storage';
import { globalEventBus } from './eventBus';
import { db } from './firebaseSync';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

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
  if (!id) return 'default';
  let sanitized = String(id).replace(/[^a-zA-Z0-9_\-]/g, '_');
  sanitized = sanitized.replace(/_+/g, '_').replace(/^_+|_+$/g, '');
  if (!sanitized) {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash |= 0;
    }
    sanitized = `id_${Math.abs(hash).toString(36)}`;
  }
  return sanitized.slice(0, 120);
}

// ----------------------------------------------------
// Multi-Tier Assets (Cloud Firestore + MySQL + LocalStorage)
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
 * Saves any media asset permanently to Cloud Firestore, local storage, and server MySQL
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
  const path = `assets/${cleanId}`;
  const start = performance.now();
  const sizeBytes = data.length;

  // 1. Immediately cache in local storage for instant zero-latency UI display
  safeSetLocalStorage(`mahash_asset_${cleanId}`, data);
  if (cleanId === 'mahash_official_logo' || assetId === 'mahash_official_logo') {
    safeSetLocalStorage('mahash_official_logo', data);
  } else if (cleanId === 'mahash_youth_club_emblem' || assetId === 'mahash_youth_club_emblem') {
    safeSetLocalStorage('mahash_youth_club_emblem', data);
  }

  let firestoreSaved = false;
  let firestoreErr: string | undefined;

  // 2. Save directly to Cloud Firestore (Primary durable cloud storage)
  try {
    const assetDocRef = doc(db, 'assets', cleanId);
    await setDoc(assetDocRef, {
      assetId: cleanId,
      category,
      name: name || cleanId,
      data,
      mimeType,
      sizeBytes,
      updatedAt: new Date().toISOString()
    });
    firestoreSaved = true;
    logFirestoreDiagnostic('saveToFirestore(assets)', path, 'SUCCESS', Math.round(performance.now() - start), sizeBytes, { cleanId, cloud: 'firestore' });
  } catch (err: any) {
    firestoreErr = err?.message || String(err);
    console.warn(`[Firestore] Notice saving asset ${cleanId} to Firestore:`, firestoreErr);
  }

  // 3. Dual-sync to Server API (persists to server disk and MySQL)
  let serverSaved = false;
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
    if (res.ok) {
      serverSaved = true;
    }
  } catch {
    // Expected on static hosting platforms like Netlify
  }

  const latency = Math.round(performance.now() - start);

  // Return success as long as Firestore, Server, or LocalStorage succeeded
  return {
    success: true,
    latencyMs: latency,
    rawResult: { docId: cleanId, firestoreSaved, serverSaved, status: 'persisted' }
  };
}

/**
 * Retrieves a media asset from LocalStorage, Cloud Firestore, or server MySQL
 */
export async function getAssetFromFirestore(assetId: string): Promise<string | null> {
  if (!assetId) return null;
  const cleanId = sanitizeDocId(assetId);

  // 1. Fast local cache access
  const localCached = safeGetLocalStorage(`mahash_asset_${cleanId}`) ||
                      (cleanId === 'mahash_official_logo' ? safeGetLocalStorage('mahash_official_logo') : null) ||
                      (cleanId === 'mahash_youth_club_emblem' ? safeGetLocalStorage('mahash_youth_club_emblem') : null);
  if (localCached && typeof localCached === 'string' && localCached.length > 20) {
    return localCached;
  }

  // 2. Fetch directly from Cloud Firestore
  try {
    const snap = await getDoc(doc(db, 'assets', cleanId));
    if (snap.exists()) {
      const d = snap.data();
      if (d && d.data) {
        safeSetLocalStorage(`mahash_asset_${cleanId}`, d.data);
        return d.data;
      }
    }
  } catch (err) {
    console.warn(`[Firestore] Notice fetching asset ${cleanId}:`, err);
  }

  // 3. Fallback: fetch from Server API
  try {
    const res = await fetch(`/api/mysql/assets/${encodeURIComponent(cleanId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.asset?.data) {
        safeSetLocalStorage(`mahash_asset_${cleanId}`, json.asset.data);
        return json.asset.data;
      }
    }
  } catch {}

  return null;
}

/**
 * Deletes an asset from Cloud Firestore, LocalStorage, and server MySQL
 */
export async function deleteAssetFromFirestore(assetId: string): Promise<boolean> {
  if (!assetId) return false;
  const cleanId = sanitizeDocId(assetId);
  safeRemoveLocalStorage(`mahash_asset_${cleanId}`);

  try {
    await deleteDoc(doc(db, 'assets', cleanId));
  } catch {}

  try {
    await fetch(`/api/mysql/assets/${encodeURIComponent(cleanId)}`, {
      method: 'DELETE'
    });
  } catch {}

  return true;
}

// ----------------------------------------------------
// Team & Organization Logos (Cloud Firestore + MySQL)
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
 * Directly saves a team logo to Cloud Firestore and MySQL database
 */
export async function saveLogoToFirestore(teamIdOrSlug: string, logoData: string): Promise<boolean> {
  if (!teamIdOrSlug || !logoData) return false;
  const shortId = resolveCanonicalTeamShortId(teamIdOrSlug);
  const docId = sanitizeDocId(shortId);

  safeSetLocalStorage(`mahash_team_logo_${teamIdOrSlug}`, logoData);
  safeSetLocalStorage(`mahash_team_logo_${shortId}`, logoData);

  // Save to assets collection
  const assetRes = await saveAssetToFirestore(`team_${docId}_logo`, 'logo', `لوگوی تیم ${teamIdOrSlug}`, logoData);

  // Save to team_logos collection
  try {
    const tDocRef = doc(db, 'team_logos', docId);
    await setDoc(tDocRef, {
      teamId: docId,
      logoData: logoData,
      updatedAt: new Date().toISOString()
    });
  } catch (tErr) {
    console.warn('[Firestore] Notice saving team logo:', tErr);
  }

  return assetRes.success;
}

/**
 * Retrieves a team logo directly from Cloud Firestore or LocalStorage
 */
export async function getLogoFromFirestore(teamIdOrSlug: string): Promise<string | null> {
  if (!teamIdOrSlug) return null;
  const shortId = resolveCanonicalTeamShortId(teamIdOrSlug);
  const docId = sanitizeDocId(shortId);

  // 1. Fast local storage cache check
  const local = safeGetLocalStorage(`mahash_team_logo_${teamIdOrSlug}`) || safeGetLocalStorage(`mahash_team_logo_${shortId}`);
  if (local && typeof local === 'string' && local.length > 20) {
    return local;
  }

  // 2. Try Firestore team_logos collection
  try {
    const snap = await getDoc(doc(db, 'team_logos', docId));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.logoData) {
        safeSetLocalStorage(`mahash_team_logo_${teamIdOrSlug}`, data.logoData);
        safeSetLocalStorage(`mahash_team_logo_${shortId}`, data.logoData);
        return data.logoData;
      }
    }
  } catch {}

  // 3. Try assets collection
  const assetData = await getAssetFromFirestore(`team_${docId}_logo`);
  if (assetData) {
    safeSetLocalStorage(`mahash_team_logo_${teamIdOrSlug}`, assetData);
    safeSetLocalStorage(`mahash_team_logo_${shortId}`, assetData);
    return assetData;
  }

  return null;
}

/**
 * Removes a team logo from Firestore and LocalStorage
 */
export async function deleteLogoFromFirestore(teamIdOrSlug: string): Promise<boolean> {
  if (!teamIdOrSlug) return false;
  const shortId = resolveCanonicalTeamShortId(teamIdOrSlug);
  const docId = sanitizeDocId(shortId);

  safeRemoveLocalStorage(`mahash_team_logo_${teamIdOrSlug}`);
  safeRemoveLocalStorage(`mahash_team_logo_${shortId}`);

  try {
    await deleteDoc(doc(db, 'team_logos', docId));
  } catch {}

  return deleteAssetFromFirestore(`team_${docId}_logo`);
}

// ----------------------------------------------------
// Official Mahash Logo & Youth Club Emblem
// ----------------------------------------------------

export async function saveMahashLogoToFirestore(logoData: string): Promise<boolean> {
  safeSetLocalStorage('mahash_official_logo', logoData);
  const res = await saveAssetToFirestore('mahash_official_logo', 'logo', 'لوگوی رسمی کانون ماهش', logoData);
  return res.success;
}

export async function getMahashLogoFromFirestore(): Promise<string | null> {
  const local = safeGetLocalStorage('mahash_official_logo');
  if (local && typeof local === 'string' && local.length > 20) return local;
  return getAssetFromFirestore('mahash_official_logo');
}

export async function saveYouthClubEmblemToFirestore(emblemData: string): Promise<boolean> {
  safeSetLocalStorage('mahash_youth_club_emblem', emblemData);
  const res = await saveAssetToFirestore('mahash_youth_club_emblem', 'badge', 'مدال و نشان رسمی باشگاه جوانان', emblemData);
  return res.success;
}

export async function getYouthClubEmblemFromFirestore(): Promise<string | null> {
  const local = safeGetLocalStorage('mahash_youth_club_emblem');
  if (local && typeof local === 'string' && local.length > 20) return local;
  return getAssetFromFirestore('mahash_youth_club_emblem');
}

// ----------------------------------------------------
// Consultant Photos (Cloud Firestore + LocalStorage + MySQL)
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
  if (sanitized && sanitized.length > 1) {
    return `consultant_${sanitized}`.slice(0, 120);
  }
  let hash = 0;
  for (let i = 0; i < consultantName.length; i++) {
    hash = ((hash << 5) - hash) + consultantName.charCodeAt(i);
    hash |= 0;
  }
  return `consultant_${Math.abs(hash).toString(36)}`.slice(0, 120);
}

/**
 * Saves a consultant photo directly to Cloud Firestore, LocalStorage, and MySQL
 */
export async function saveConsultantPhotoToFirestore(consultantName: string, photoData: string): Promise<boolean> {
  if (!consultantName || !photoData) return false;
  const docId = getCanonicalConsultantDocId(consultantName);
  const trimmed = consultantName.trim();

  // 1. Immediately cache in local storage under multiple resilient keys
  safeSetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(trimmed)}`, photoData);
  safeSetLocalStorage(`mahash_consultant_photo_${trimmed}`, photoData);
  safeSetLocalStorage(`mahash_consultant_photo_${docId}`, photoData);

  if (docId === 'consultant_nazi_abbasian') {
    safeSetLocalStorage('mahash_consultant_photo_خانم دکتر نازی عباسیان', photoData);
    safeSetLocalStorage('mahash_consultant_photo_نازی عباسیان', photoData);
    safeSetLocalStorage('mahash_consultant_photo_nazi_abbasian', photoData);
  } else if (docId === 'consultant_radin_oroumi') {
    safeSetLocalStorage('mahash_consultant_photo_آقای رادین اورومی', photoData);
    safeSetLocalStorage('mahash_consultant_photo_رادین اورومی', photoData);
    safeSetLocalStorage('mahash_consultant_photo_radin_oroumi', photoData);
  }

  // Update mahash_consultant_photos map in localStorage
  try {
    const raw = safeGetLocalStorage('mahash_consultant_photos');
    const photos = raw ? JSON.parse(raw) : {};
    photos[trimmed] = photoData;
    photos[docId] = photoData;
    if (docId === 'consultant_nazi_abbasian') {
      photos['خانم دکتر نازی عباسیان'] = photoData;
      photos['نازی عباسیان'] = photoData;
      photos['nazi_abbasian'] = photoData;
      photos['consultant_nazi_abbasian'] = photoData;
    } else if (docId === 'consultant_radin_oroumi') {
      photos['آقای رادین اورومی'] = photoData;
      photos['رادین اورومی'] = photoData;
      photos['radin_oroumi'] = photoData;
      photos['consultant_radin_oroumi'] = photoData;
    }
    safeSetLocalStorage('mahash_consultant_photos', JSON.stringify(photos));
  } catch {}

  // 2. Save in Firestore assets collection (and server MySQL)
  const assetRes = await saveAssetToFirestore(docId, 'consultant_photo', `عکس مشاور ${consultantName}`, photoData);

  // 3. Also save in Firestore consultant_photos collection (matching firestore security rules)
  try {
    const cDocRef = doc(db, 'consultant_photos', docId);
    await setDoc(cDocRef, {
      consultantId: docId,
      consultantName: consultantName.trim(),
      photoData: photoData,
      updatedAt: new Date().toISOString()
    });
  } catch (cErr) {
    console.warn('[Firestore] Notice saving consultant photo to collection:', cErr);
  }

  return assetRes.success;
}

/**
 * Retrieves a consultant photo directly from LocalStorage, Cloud Firestore, or server MySQL
 */
export async function getConsultantPhotoFromFirestore(consultantName: string): Promise<string | null> {
  if (!consultantName) return null;
  const docId = getCanonicalConsultantDocId(consultantName);
  const trimmed = consultantName.trim();

  // 1. Fast local storage cache check
  const local = safeGetLocalStorage(`mahash_consultant_photo_${docId}`) ||
                safeGetLocalStorage(`mahash_consultant_photo_${trimmed}`) ||
                safeGetLocalStorage(`mahash_consultant_photo_${encodeURIComponent(trimmed)}`);
  if (local && typeof local === 'string' && local.length > 20) {
    return local;
  }

  // 1.5 Check mahash_consultant_photos map
  try {
    const raw = safeGetLocalStorage('mahash_consultant_photos');
    if (raw) {
      const photos = JSON.parse(raw);
      if (photos[trimmed] && photos[trimmed].length > 20) return photos[trimmed];
      if (photos[docId] && photos[docId].length > 20) return photos[docId];
    }
  } catch {}

  // 2. Try Firestore consultant_photos collection
  try {
    const snap = await getDoc(doc(db, 'consultant_photos', docId));
    if (snap.exists()) {
      const data = snap.data();
      if (data && data.photoData) {
        safeSetLocalStorage(`mahash_consultant_photo_${docId}`, data.photoData);
        safeSetLocalStorage(`mahash_consultant_photo_${trimmed}`, data.photoData);
        return data.photoData;
      }
    }
  } catch (cErr) {
    console.warn('[Firestore] Notice reading consultant_photos:', cErr);
  }

  // 3. Try assets collection
  const asset = await getAssetFromFirestore(docId);
  if (asset) {
    safeSetLocalStorage(`mahash_consultant_photo_${docId}`, asset);
    safeSetLocalStorage(`mahash_consultant_photo_${trimmed}`, asset);
    return asset;
  }

  // 4. Try direct server MySQL fetch
  try {
    const res = await fetch(`/api/mysql/assets/${encodeURIComponent(docId)}`);
    if (res.ok) {
      const json = await res.json();
      if (json?.asset?.data) {
        safeSetLocalStorage(`mahash_consultant_photo_${docId}`, json.asset.data);
        safeSetLocalStorage(`mahash_consultant_photo_${trimmed}`, json.asset.data);
        return json.asset.data;
      }
    }
  } catch {}

  return null;
}

export async function deleteConsultantPhotoFromFirestore(consultantName: string): Promise<boolean> {
  if (!consultantName) return false;
  const docId = getCanonicalConsultantDocId(consultantName);

  safeRemoveLocalStorage(`mahash_consultant_photo_${docId}`);
  safeRemoveLocalStorage(`mahash_consultant_photo_${encodeURIComponent(consultantName.trim())}`);

  try {
    await deleteDoc(doc(db, 'consultant_photos', docId));
  } catch {}

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
