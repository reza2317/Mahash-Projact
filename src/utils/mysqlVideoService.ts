/**
 * High-Performance MySQL Video Management & Data Delivery Service
 *
 * This module provides an optimized, indexed data access layer for high-volume video catalogs
 * and public reports, ensuring minimal network transfer, cache friendliness, and zero CLS.
 */

export interface MySQLVideoItem {
  id: string;
  title: string;
  team_slug: string;
  report_id: string | null;
  video_url: string;
  thumbnail_url: string | null;
  file_name: string;
  file_size_bytes: number;
  mime_type: string;
  duration_seconds: number;
  width: number;
  height: number;
  is_public: number | boolean; // 1 = Public, 0 = Private
  views_count: number;
  created_at: string;
  updated_at: string;
}

export interface MySQLVideoStats {
  total: number;
  publicCount: number;
  privateCount: number;
  totalSizeBytes: number;
}

export interface MySQLVideoPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OptimizedVideoResponse {
  success: boolean;
  source: 'mysql_optimized' | 'in_memory_fallback';
  pagination: MySQLVideoPagination;
  stats: MySQLVideoStats;
  videos: MySQLVideoItem[];
}

/**
 * Documentation of the High-Performance MySQL Query:
 *
 * SELECT
 *   id, title, team_slug, report_id, video_url, thumbnail_url,
 *   file_name, file_size_bytes, mime_type, duration_seconds,
 *   width, height, is_public, views_count, created_at
 * FROM mahash_videos
 * WHERE is_public = 1 AND (team_slug = ?)
 * ORDER BY created_at DESC
 * LIMIT ? OFFSET ?;
 *
 * Performance Features:
 * 1. Covered B-Tree Indexes: `idx_video_public (is_public)` & `idx_video_team (team_slug)` & `idx_video_created (created_at)`
 *    avoid full-table scans.
 * 2. Light Projection: Excludes heavy BLOBs/raw base64 text, reducing network payload from megabytes to kilobytes.
 * 3. Fast Window/Limit Pagination: Prevents thread locking when public pages display many videos.
 * 4. Microsecond Aggregation: `SUM(CASE WHEN is_public = 1 THEN 1 ELSE 0 END)` executes directly inside the database engine.
 */

/**
 * Fetch paginated & filtered videos using the optimized MySQL query endpoint.
 */
export async function fetchOptimizedVideos(params?: {
  page?: number;
  limit?: number;
  teamSlug?: string;
  search?: string;
  publicOnly?: boolean;
}): Promise<OptimizedVideoResponse> {
  const query = new URLSearchParams();
  if (params?.page) query.set('page', String(params.page));
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.teamSlug && params.teamSlug !== 'all') query.set('team_slug', params.teamSlug);
  if (params?.search) query.set('search', params.search);
  if (params?.publicOnly !== undefined) query.set('public_only', params.publicOnly ? '1' : '0');

  try {
    const res = await fetch(`/api/mysql/videos/optimized?${query.toString()}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!res.ok) {
      throw new Error(`Server returned HTTP ${res.status}`);
    }

    const data = await res.json();
    if (data && data.success && Array.isArray(data.videos)) {
      return data as OptimizedVideoResponse;
    }
    throw new Error('Invalid JSON response from server');
  } catch (error) {
    console.warn('[MySQLVideoService] Server unavailable or static host (Netlify). Loading fallback baseline videos:', error);
    return await getFallbackVideos(params);
  }
}

/**
 * Netlify and Offline static fallback video extractor.
 * Reads reports and media assets directly from localStorage and offline_baseline.json.
 */
async function getFallbackVideos(params?: {
  page?: number;
  limit?: number;
  teamSlug?: string;
  search?: string;
  publicOnly?: boolean;
}): Promise<OptimizedVideoResponse> {
  const page = Math.max(1, params?.page || 1);
  const limit = Math.min(100, Math.max(1, params?.limit || 20));
  const teamFilter = params?.teamSlug && params.teamSlug !== 'all' ? params.teamSlug : null;
  const search = params?.search ? params.search.trim().toLowerCase() : null;
  const publicOnly = params?.publicOnly ?? false;

  let reports: any[] = [];
  let videoVisibility: Record<string, boolean> = {};

  try {
    const rawVis = localStorage.getItem('mahash_video_visibility');
    if (rawVis) videoVisibility = JSON.parse(rawVis);
  } catch {}

  // 1. Try local storage
  try {
    const rawRep = localStorage.getItem('mahash_custom_reports') || localStorage.getItem('customReports');
    if (rawRep) {
      const parsed = JSON.parse(rawRep);
      if (Array.isArray(parsed)) {
        reports = parsed;
      } else if (parsed && typeof parsed === 'object') {
        Object.values(parsed).forEach((teamReports: any) => {
          if (Array.isArray(teamReports)) reports.push(...teamReports);
        });
      }
    }
  } catch {}

  // 2. If reports is empty, fetch offline_baseline.json
  if (reports.length === 0) {
    try {
      const baseline = await fetch('/offline_baseline.json').then(r => r.ok ? r.json() : null);
      if (baseline) {
        if (Array.isArray(baseline.customReports)) reports = baseline.customReports;
        if (baseline.videoVisibility) videoVisibility = { ...baseline.videoVisibility, ...videoVisibility };
      }
    } catch {}
  }

  // Filter unique reports with valid video URLs
  const seenUrls = new Set<string>();
  const videoItems: MySQLVideoItem[] = [];

  reports.forEach((r) => {
    const url = r.videoSrc || r.videoUrl || r.video_url;
    if (!url || typeof url !== 'string' || url.startsWith('blob:') || url === '#') return;
    if (seenUrls.has(url)) return;
    seenUrls.add(url);

    const vidId = `vid_${r.id || Math.random().toString(36).substring(2, 9)}`;
    const isPublic = videoVisibility[vidId] !== undefined ? videoVisibility[vidId] : true;
    const teamSlug = r.teamSlug || (r.teamId ? (r.teamId.startsWith('team-') ? r.teamId : `team-${r.teamId}`) : 'team-thinker');

    videoItems.push({
      id: vidId,
      title: r.title || 'گزارش ویدیویی باشگاه ماهش',
      team_slug: teamSlug,
      report_id: r.id || null,
      video_url: url,
      thumbnail_url: r.videoThumbnail || r.coverImage || null,
      file_name: url.split('/').pop() || 'video.mp4',
      file_size_bytes: 14 * 1024 * 1024,
      mime_type: 'video/mp4',
      duration_seconds: 120,
      width: 1920,
      height: 1080,
      is_public: isPublic ? 1 : 0,
      views_count: r.views || 1,
      created_at: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updated_at: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString()
    });
  });

  const total = videoItems.length;
  const publicCount = videoItems.filter(v => v.is_public === 1).length;
  const privateCount = total - publicCount;
  const totalSizeBytes = videoItems.reduce((acc, v) => acc + v.file_size_bytes, 0);

  let filtered = videoItems;
  if (publicOnly) {
    filtered = filtered.filter(v => v.is_public === 1);
  }
  if (teamFilter) {
    filtered = filtered.filter(v => v.team_slug === teamFilter || v.team_slug.replace(/^team-/, '') === teamFilter.replace(/^team-/, ''));
  }
  if (search) {
    filtered = filtered.filter(v => (v.title && v.title.toLowerCase().includes(search)) || v.file_name.toLowerCase().includes(search));
  }

  const offset = (page - 1) * limit;
  const paginated = filtered.slice(offset, offset + limit);

  return {
    success: true,
    source: 'in_memory_fallback',
    pagination: {
      page,
      limit,
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / limit) || 1
    },
    stats: {
      total,
      publicCount,
      privateCount,
      totalSizeBytes
    },
    videos: paginated
  };
}

/**
 * Updates the public/private visibility state of a video in MySQL.
 */
export async function updateVideoVisibility(
  videoId: string,
  isPublic: boolean
): Promise<{ success: boolean; message: string; is_public?: boolean }> {
  try {
    const res = await fetch(`/api/mysql/videos/${encodeURIComponent(videoId)}/visibility`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ is_public: isPublic })
    });

    if (!res.ok) {
      throw new Error(`Failed to update visibility (HTTP ${res.status})`);
    }

    return await res.json();
  } catch (error: any) {
    console.warn('[MySQLVideoService] Server update failed, falling back to local state:', error);
    try {
      const raw = localStorage.getItem('mahash_video_visibility');
      const vis = raw ? JSON.parse(raw) : {};
      vis[videoId] = isPublic;
      localStorage.setItem('mahash_video_visibility', JSON.stringify(vis));
      return {
        success: true,
        message: 'وضعیت نمایش ویدیو ذخیره شد (حالت استاتیک/آفلاین)',
        is_public: isPublic
      };
    } catch {}
    return {
      success: false,
      message: error?.message || 'خطا در برقراری ارتباط با سرور'
    };
  }
}

/**
 * Deletes a video permanently from MySQL, disk storage, and memory caches.
 */
export async function deleteVideoFromMySQL(
  videoId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch(`/api/mysql/videos/${encodeURIComponent(videoId)}`, {
      method: 'DELETE'
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData?.error || `HTTP ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.error('[MySQLVideoService] Error deleting video:', error);
    return {
      success: false,
      message: error?.message || 'خطا در حذف ویدیو'
    };
  }
}

/**
 * Triggers a full synchronization of all disk media and reports into the MySQL mahash_videos table.
 */
export async function syncAllVideosToMySQL(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetch('/api/mysql/videos/sync-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    return await res.json();
  } catch (error: any) {
    return {
      success: false,
      message: error?.message || 'خطا در همگام‌سازی ویدیوها با MySQL'
    };
  }
}

/**
 * Records a view increment for the given video in MySQL.
 */
export async function recordVideoView(videoId: string): Promise<void> {
  try {
    await fetch(`/api/mysql/videos/${encodeURIComponent(videoId)}/view`, {
      method: 'POST'
    });
  } catch {
    // Non-blocking telemetry
  }
}
