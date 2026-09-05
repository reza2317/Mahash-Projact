/**
 * MySQL & Local Data Query Optimizer with Memoized In-Memory Caching
 *
 * This module provides high-performance memoized caching and request deduplication
 * for heavy video catalog transformations and member data lookups.
 * It prevents repetitive localStorage reads, JSON deserialization, and redundant network roundtrips,
 * significantly boosting page load speed and smooth tab transitions in TeamDetailPage and catalog views.
 */

import { ActivityReport, TeamData } from '../types';
import { getMemberAvatars } from './reportsStore';
import { fetchOptimizedVideos, OptimizedVideoResponse, MySQLVideoItem } from './mysqlVideoService';

export interface TeamVideoResourceItem {
  id: string;
  reportId: string;
  reportNum: string;
  title: string;
  teamSlug: string;
  teamName: string;
  videoSrc: string;
  posterSrc?: string;
  date: string;
  summary: string;
  keyPoints?: string[];
  transcript?: any[];
  subhead?: string;
  status?: string;
  hasVideo: boolean;
  originalReport: ActivityReport;
}

export interface OptimizedTeamMember {
  name: string;
  avatarSrc: string;
  isCustomImg: boolean;
  initial: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheStats {
  size: number;
  keys: string[];
  inFlightCount: number;
  hitCount: number;
  missCount: number;
}

// ----------------------------------------------------
// In-Memory Storage & In-Flight Promise Registry
// ----------------------------------------------------
const memoryCache = new Map<string, CacheEntry<any>>();
const inFlightPromises = new Map<string, Promise<any>>();

let cacheHits = 0;
let cacheMisses = 0;

const DEFAULT_SYNC_TTL_MS = 3 * 60 * 1000; // 3 minutes for computed in-memory data
const DEFAULT_ASYNC_TTL_MS = 2 * 60 * 1000; // 2 minutes for network queries

/**
 * Generic Synchronous Memoization Helper
 */
export function memoizeSync<T>(
  key: string,
  computeFn: () => T,
  ttlMs: number = DEFAULT_SYNC_TTL_MS,
  forceFresh = false
): T {
  const now = Date.now();
  if (!forceFresh && memoryCache.has(key)) {
    const entry = memoryCache.get(key)!;
    if (now - entry.timestamp < entry.ttl) {
      cacheHits++;
      return entry.data as T;
    }
  }

  cacheMisses++;
  const computed = computeFn();
  memoryCache.set(key, {
    data: computed,
    timestamp: now,
    ttl: ttlMs
  });
  return computed;
}

/**
 * Generic Asynchronous Memoization with Promise Deduplication
 */
export async function memoizeQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  ttlMs: number = DEFAULT_ASYNC_TTL_MS,
  forceFresh = false
): Promise<T> {
  const now = Date.now();

  // 1. Check existing fresh cache
  if (!forceFresh && memoryCache.has(key)) {
    const entry = memoryCache.get(key)!;
    if (now - entry.timestamp < entry.ttl) {
      cacheHits++;
      return entry.data as T;
    }
  }

  // 2. Return active in-flight promise if duplicate request occurs concurrently
  if (inFlightPromises.has(key)) {
    return inFlightPromises.get(key)! as Promise<T>;
  }

  cacheMisses++;
  const promise = (async () => {
    try {
      const result = await queryFn();
      memoryCache.set(key, {
        data: result,
        timestamp: Date.now(),
        ttl: ttlMs
      });
      return result;
    } finally {
      inFlightPromises.delete(key);
    }
  })();

  inFlightPromises.set(key, promise);
  return promise;
}

/**
 * Invalidate cache entries matching a prefix or regex pattern.
 */
export function invalidateQueryCache(pattern?: string | RegExp): void {
  if (!pattern) {
    memoryCache.clear();
    return;
  }

  for (const key of memoryCache.keys()) {
    if (typeof pattern === 'string' ? key.startsWith(pattern) : pattern.test(key)) {
      memoryCache.delete(key);
    }
  }
}

/**
 * Clears the entire optimizer cache.
 */
export function clearQueryCache(): void {
  memoryCache.clear();
  inFlightPromises.clear();
}

/**
 * Returns current performance statistics of the query cache.
 */
export function getCacheStats(): CacheStats {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
    inFlightCount: inFlightPromises.size,
    hitCount: cacheHits,
    missCount: cacheMisses
  };
}

// ----------------------------------------------------
// Optimized Member Data Queries
// ----------------------------------------------------
let cachedAvatarsMap: Record<string, string> | null = null;
let lastAvatarsFetchTime = 0;
const AVATARS_CACHE_TTL_MS = 60 * 1000; // 1 minute in-memory cache for parsed avatars

/**
 * Retrieves the parsed avatars map with in-memory caching to avoid JSON.parse on every lookup.
 */
export function getCachedMemberAvatarsMap(forceFresh = false): Record<string, string> {
  const now = Date.now();
  if (forceFresh || !cachedAvatarsMap || now - lastAvatarsFetchTime > AVATARS_CACHE_TTL_MS) {
    cachedAvatarsMap = getMemberAvatars();
    lastAvatarsFetchTime = now;
  }
  return cachedAvatarsMap;
}

/**
 * High-performance O(1) member avatar lookup using memoized dictionary.
 */
export function getCachedMemberAvatar(
  teamSlugOrId: string,
  memberName: string,
  fallbackEmoji: string = '👤'
): string {
  if (!memberName || typeof memberName !== 'string') return fallbackEmoji;
  const avatars = getCachedMemberAvatarsMap();
  const trimmed = memberName.trim();
  const normSlug = teamSlugOrId ? (teamSlugOrId.startsWith('team-') ? teamSlugOrId : `team-${teamSlugOrId}`) : '';
  const shortId = teamSlugOrId ? teamSlugOrId.replace(/^team-/, '') : '';

  return (
    avatars[`${normSlug}_${trimmed}`] ||
    avatars[`${shortId}_${trimmed}`] ||
    avatars[trimmed] ||
    fallbackEmoji
  );
}

/**
 * Returns a memoized list of member objects with resolved avatars and custom-image flags.
 * Completely eliminates repeated avatar resolutions and regex checks on component re-renders.
 */
export function getOptimizedTeamMembers(
  teamSlug: string,
  members: string[],
  forceFresh = false
): OptimizedTeamMember[] {
  if (!members || members.length === 0) return [];

  const cacheKey = `members_${teamSlug}_${members.join('_')}`;
  return memoizeSync(
    cacheKey,
    () => {
      const avatarsMap = getCachedMemberAvatarsMap();
      const normSlug = teamSlug ? (teamSlug.startsWith('team-') ? teamSlug : `team-${teamSlug}`) : '';
      const shortId = teamSlug ? teamSlug.replace(/^team-/, '') : '';

      return members.map((member) => {
        const trimmed = (member || '').trim();
        const avatarSrc =
          avatarsMap[`${normSlug}_${trimmed}`] ||
          avatarsMap[`${shortId}_${trimmed}`] ||
          avatarsMap[trimmed] ||
          '👤';

        const isCustomImg = Boolean(
          avatarSrc &&
            (avatarSrc.startsWith('data:image') ||
              avatarSrc.startsWith('http://') ||
              avatarSrc.startsWith('https://') ||
              avatarSrc.startsWith('/') ||
              avatarSrc.startsWith('blob:'))
        );

        const initial = trimmed ? trimmed.charAt(0) : '👤';

        return {
          name: trimmed,
          avatarSrc,
          isCustomImg,
          initial
        };
      });
    },
    DEFAULT_SYNC_TTL_MS,
    forceFresh
  );
}

// ----------------------------------------------------
// Optimized Heavy Video Data Queries
// ----------------------------------------------------

/**
 * Transforms and caches raw team report lists into structured TeamVideoResourceItem arrays.
 * Bypasses redundant mapping, string manipulation, and status checks on every re-render.
 */
export function getOptimizedTeamVideos(
  teamSlug: string,
  reports: ActivityReport[],
  isAdmin: boolean,
  teamName: string = '',
  forceFresh = false
): TeamVideoResourceItem[] {
  if (!reports || reports.length === 0) return [];

  // Generate lightweight signature based on length, admin visibility, and latest update
  const latestReportId = reports[0]?.id || 'none';
  const latestUpdate = reports[0]?.updatedAt || reports[0]?.date || '';
  const cacheKey = `videos_${teamSlug}_${isAdmin ? 'adm' : 'pub'}_${reports.length}_${latestReportId}_${latestUpdate}`;

  return memoizeSync(
    cacheKey,
    () => {
      return (reports || [])
        .filter((r) => isAdmin || r.status !== 'draft')
        .map((report) => ({
          id: `${teamSlug}_${report.id}`,
          reportId: report.id,
          reportNum: report.reportNum,
          title: report.title,
          teamSlug: teamSlug,
          teamName: teamName || teamSlug,
          videoSrc: report.videoSrc || (report as any).videoUrl || '',
          posterSrc: report.posterSrc,
          date: report.date,
          summary: report.summary,
          keyPoints: report.keyPoints,
          transcript: report.transcript,
          subhead: report.subhead,
          status: report.status,
          hasVideo: Boolean(
            (report.videoSrc || (report as any).videoUrl) &&
              (report.videoSrc || (report as any).videoUrl) !== '#' &&
              ((report.videoSrc || (report as any).videoUrl) || '').trim() !== '' &&
              report.reportType !== 'text'
          ),
          originalReport: report
        }));
    },
    DEFAULT_SYNC_TTL_MS,
    forceFresh
  );
}

/**
 * Fetch and memoize indexed MySQL video catalog queries from `/api/mysql/videos/optimized`.
 * Prevents redundant network calls when users switch back and forth between tabs or reports.
 */
export async function fetchCachedMySQLVideos(params?: {
  page?: number;
  limit?: number;
  teamSlug?: string;
  search?: string;
  publicOnly?: boolean;
  ttlMs?: number;
  forceFresh?: boolean;
}): Promise<OptimizedVideoResponse> {
  const page = params?.page || 1;
  const limit = params?.limit || 20;
  const teamSlug = params?.teamSlug || 'all';
  const search = params?.search || '';
  const publicOnly = params?.publicOnly !== false;

  const cacheKey = `mysql_videos_${teamSlug}_p${page}_l${limit}_s${search}_pub${publicOnly}`;

  return memoizeQuery<OptimizedVideoResponse>(
    cacheKey,
    () =>
      fetchOptimizedVideos({
        page,
        limit,
        teamSlug,
        search,
        publicOnly
      }),
    params?.ttlMs || DEFAULT_ASYNC_TTL_MS,
    params?.forceFresh
  );
}

/**
 * Calculates and memoizes aggregate video metrics for a team.
 */
export function getCachedVideoMetrics(
  teamSlug: string,
  reports: ActivityReport[],
  isAdmin: boolean = false
): {
  totalReports: number;
  videoCount: number;
  hasVideoRatio: number;
  hasTranscriptsCount: number;
} {
  const cacheKey = `metrics_${teamSlug}_${isAdmin ? 'adm' : 'pub'}_${reports?.length || 0}`;

  return memoizeSync(cacheKey, () => {
    const items = getOptimizedTeamVideos(teamSlug, reports, isAdmin);
    const totalReports = items.length;
    const videoCount = items.filter((v) => v.hasVideo).length;
    const hasTranscriptsCount = items.filter(
      (v) => v.transcript && Array.isArray(v.transcript) && v.transcript.length > 0
    ).length;

    return {
      totalReports,
      videoCount,
      hasVideoRatio: totalReports > 0 ? Math.round((videoCount / totalReports) * 100) : 0,
      hasTranscriptsCount
    };
  });
}

// ----------------------------------------------------
// Automatic Cache Synchronization
// ----------------------------------------------------
if (typeof window !== 'undefined') {
  const handleStoreChange = () => {
    cachedAvatarsMap = null;
    invalidateQueryCache(/^videos_/);
    invalidateQueryCache(/^members_/);
    invalidateQueryCache(/^metrics_/);
    invalidateQueryCache(/^mysql_videos_/);
  };

  window.addEventListener('mahash_store_updated', handleStoreChange);
  window.addEventListener('storage', handleStoreChange);
  window.addEventListener('mahash_clear_query_cache', () => {
    clearQueryCache();
  });
}
