/**
 * Offline Baseline Utility (src/utils/offlineBaseline.ts)
 * 
 * Provides client-side management for the static offline-first baseline database.
 * Enables zero-cloud, static host resilience (e.g. Netlify, Cloudflare Pages) and
 * offline data hydration when remote server connections are unavailable.
 */

import { ActivityReport, TeamData } from '../types';
import { safeGetLocalStorage, safeSetLocalStorage } from './storage';
import { globalEventBus } from './eventBus';

export interface OfflineBaselineState {
  version: string;
  generatedAt: string;
  schema: string;
  customReports: ActivityReport[];
  teamLogos: Record<string, string>;
  teamOverrides: Record<string, Partial<TeamData>>;
  scores: Record<string, any>;
  events: any[];
  consultantPhotos: Record<string, string>;
  consultantsList: any[];
  memberAvatars: Record<string, string>;
  mahashLogo?: string;
  clubEmblem?: string;
  metadata?: {
    appName?: string;
    author?: string;
    description?: string;
    totalReports?: number;
    totalTeams?: number;
    totalLogos?: number;
    totalConsultantPhotos?: number;
  };
}

const OFFLINE_BASELINE_PATH = '/offline_baseline.json';
const LAST_BASELINE_LOADED_KEY = 'mahash_last_baseline_loaded_at';

/**
 * Fetches the build-time static offline baseline JSON from the static host.
 */
export async function fetchOfflineBaseline(force = false): Promise<OfflineBaselineState | null> {
  if (typeof window === 'undefined') return null;

  try {
    const url = force ? `${OFFLINE_BASELINE_PATH}?t=${Date.now()}` : OFFLINE_BASELINE_PATH;
    const res = await fetch(url, {
      cache: force ? 'no-store' : 'default',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      console.warn(`[OfflineBaseline] Baseline fetch returned HTTP ${res.status}`);
      return null;
    }

    const data: OfflineBaselineState = await res.json();
    if (data && typeof data === 'object' && (Array.isArray(data.customReports) || data.schema === 'mahash_offline_baseline_v1')) {
      return data;
    }
    return null;
  } catch (err) {
    console.warn('[OfflineBaseline] Could not fetch offline baseline:', err);
    return null;
  }
}

/**
 * Applies the static baseline data into client-side cache and persistent localStorage.
 * Only overwrites missing or empty fields to avoid overriding newer user edits.
 */
export function applyOfflineBaseline(baseline: OfflineBaselineState): {
  reportsAdded: number;
  logosAdded: number;
  photosAdded: number;
} {
  let reportsAdded = 0;
  let logosAdded = 0;
  let photosAdded = 0;

  try {
    // 1. Merge Team Logos
    if (baseline.teamLogos && typeof baseline.teamLogos === 'object') {
      const rawLogos = safeGetLocalStorage('mahash_team_logos_map');
      const currentLogos: Record<string, string> = rawLogos ? JSON.parse(rawLogos) : {};
      let logosChanged = false;

      for (const [key, logoData] of Object.entries(baseline.teamLogos)) {
        if (!currentLogos[key] && logoData) {
          currentLogos[key] = logoData;
          logosAdded++;
          logosChanged = true;
          safeSetLocalStorage(`mahash_team_logo_${key}`, logoData);
        }
      }

      if (logosChanged) {
        safeSetLocalStorage('mahash_team_logos_map', JSON.stringify(currentLogos));
      }
    }

    // 2. Merge Consultant Photos
    if (baseline.consultantPhotos && typeof baseline.consultantPhotos === 'object') {
      const rawPhotos = safeGetLocalStorage('mahash_consultant_photos');
      const currentPhotos: Record<string, string> = rawPhotos ? JSON.parse(rawPhotos) : {};
      let photosChanged = false;

      for (const [key, photoData] of Object.entries(baseline.consultantPhotos)) {
        if (!currentPhotos[key] && photoData) {
          currentPhotos[key] = photoData;
          photosAdded++;
          photosChanged = true;
          safeSetLocalStorage(`mahash_consultant_photo_${key}`, photoData);
        }
      }

      if (photosChanged) {
        safeSetLocalStorage('mahash_consultant_photos', JSON.stringify(currentPhotos));
      }
    }

    // 3. Merge Official Logos
    if (baseline.mahashLogo && !safeGetLocalStorage('mahash_official_logo')) {
      safeSetLocalStorage('mahash_official_logo', baseline.mahashLogo);
    }
    if (baseline.clubEmblem && !safeGetLocalStorage('mahash_youth_club_emblem')) {
      safeSetLocalStorage('mahash_youth_club_emblem', baseline.clubEmblem);
    }

    // 4. Merge Team Overrides
    if (baseline.teamOverrides && typeof baseline.teamOverrides === 'object') {
      const rawOverrides = safeGetLocalStorage('mahash_team_overrides');
      const currentOverrides: Record<string, any> = rawOverrides ? JSON.parse(rawOverrides) : {};
      let overridesChanged = false;

      for (const [slug, data] of Object.entries(baseline.teamOverrides)) {
        if (!currentOverrides[slug] && data) {
          currentOverrides[slug] = data;
          overridesChanged = true;
        }
      }

      if (overridesChanged) {
        safeSetLocalStorage('mahash_team_overrides', JSON.stringify(currentOverrides));
      }
    }

    // 5. Merge Custom Reports
    if (Array.isArray(baseline.customReports) && baseline.customReports.length > 0) {
      const rawReportsMap = safeGetLocalStorage('mahash_custom_reports');
      const currentReportsMap: Record<string, ActivityReport[]> = rawReportsMap ? JSON.parse(rawReportsMap) : {};
      let reportsChanged = false;

      const existingIds = new Set<string>();
      Object.values(currentReportsMap).forEach((rList) => {
        if (Array.isArray(rList)) {
          rList.forEach((r) => {
            if (r?.id) existingIds.add(r.id);
          });
        }
      });

      for (const report of baseline.customReports) {
        if (report && report.id && !existingIds.has(report.id)) {
          const teamSlug = report.teamSlug || 'team-thinker';
          const shortSlug = teamSlug.replace(/^team-/, '');
          const canonicalSlug = teamSlug.startsWith('team-') ? teamSlug : `team-${teamSlug}`;

          if (!currentReportsMap[canonicalSlug]) currentReportsMap[canonicalSlug] = [];
          if (!currentReportsMap[shortSlug]) currentReportsMap[shortSlug] = [];

          currentReportsMap[canonicalSlug].push(report);
          currentReportsMap[shortSlug].push(report);

          existingIds.add(report.id);
          reportsAdded++;
          reportsChanged = true;
        }
      }

      if (reportsChanged) {
        safeSetLocalStorage('mahash_custom_reports', JSON.stringify(currentReportsMap));
      }
    }

    safeSetLocalStorage(LAST_BASELINE_LOADED_KEY, baseline.generatedAt || new Date().toISOString());

    if (reportsAdded > 0 || logosAdded > 0 || photosAdded > 0) {
      globalEventBus.emit('STORAGE_STORE_UPDATED');
    }

    return { reportsAdded, logosAdded, photosAdded };
  } catch (err) {
    console.error('[OfflineBaseline] Error applying baseline to local store:', err);
    return { reportsAdded, logosAdded, photosAdded };
  }
}

/**
 * Serializes the current live client application state into a normalized OfflineBaselineState object.
 */
export function serializeCurrentClientStateToBaseline(): OfflineBaselineState {
  const rawReports = safeGetLocalStorage('mahash_custom_reports');
  const reportsMap: Record<string, ActivityReport[]> = rawReports ? JSON.parse(rawReports) : {};

  const allReports: ActivityReport[] = [];
  const seenIds = new Set<string>();
  Object.values(reportsMap).forEach((list) => {
    if (Array.isArray(list)) {
      list.forEach((r) => {
        if (r?.id && !seenIds.has(r.id)) {
          seenIds.add(r.id);
          allReports.push(r);
        }
      });
    }
  });

  const rawLogos = safeGetLocalStorage('mahash_team_logos_map');
  const teamLogos = rawLogos ? JSON.parse(rawLogos) : {};

  const rawOverrides = safeGetLocalStorage('mahash_team_overrides');
  const teamOverrides = rawOverrides ? JSON.parse(rawOverrides) : {};

  const rawPhotos = safeGetLocalStorage('mahash_consultant_photos');
  const consultantPhotos = rawPhotos ? JSON.parse(rawPhotos) : {};

  const mahashLogo = safeGetLocalStorage('mahash_official_logo') || '';
  const clubEmblem = safeGetLocalStorage('mahash_youth_club_emblem') || '';

  return {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    schema: 'mahash_offline_baseline_v1',
    customReports: allReports,
    teamLogos,
    teamOverrides,
    scores: {},
    events: [],
    consultantPhotos,
    consultantsList: [],
    memberAvatars: {},
    mahashLogo,
    clubEmblem,
    metadata: {
      appName: 'پرتال جامع کانون جوانان ماهش',
      author: 'کانون جوانان ماهش',
      description: 'نسخه پشتیبان و پایگاه داده استاتیک آفلاین',
      totalReports: allReports.length,
      totalTeams: 5,
      totalLogos: Object.keys(teamLogos).length,
      totalConsultantPhotos: Object.keys(consultantPhotos).length
    }
  };
}

/**
 * Triggers a browser download of the current serialized state as an offline baseline JSON file.
 */
export function downloadOfflineBaselineJson(filename = 'mahash_offline_baseline.json'): void {
  const baseline = serializeCurrentClientStateToBaseline();
  const jsonStr = JSON.stringify(baseline, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
