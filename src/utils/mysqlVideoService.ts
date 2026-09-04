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
    return data as OptimizedVideoResponse;
  } catch (error) {
    console.warn('[MySQLVideoService] Error fetching optimized videos:', error);
    return {
      success: false,
      source: 'in_memory_fallback',
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      stats: { total: 0, publicCount: 0, privateCount: 0, totalSizeBytes: 0 },
      videos: []
    };
  }
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
    console.error('[MySQLVideoService] Error updating visibility:', error);
    return {
      success: false,
      message: error?.message || 'خطا در برقراری ارتباط با سرور'
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
