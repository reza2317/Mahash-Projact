/**
 * Persistent Video Cache and Storage Engine for Mahash Reports
 * Uses IndexedDB to store video Blobs locally for instant playback, offline caching, and permanent persistence across reloads.
 * Includes in-memory URL pooling to prevent redundant Blob re-instantiations and DOM ID collisions.
 */

const DB_NAME = 'MahashVideoDB';
const DB_VERSION = 1;
const STORE_NAME = 'report_videos';

export interface StoredVideoRecord {
  reportId: string;
  blob: Blob;
  name: string;
  size: number;
  type: string;
  updatedAt: string;
}

export interface VideoResourceDescriptor {
  id: string;
  domId: string;
  teamSlug: string;
  teamName: string;
  reportId: string;
  reportTitle: string;
  videoSrc: string;
  posterSrc?: string;
  isCached: boolean;
  status: 'idle' | 'loading' | 'ready' | 'error';
  errorMessage?: string;
  sizeBytes?: number;
}

// In-memory pool for active object URLs to prevent garbage collection glitches and re-allocations
const inMemoryObjectUrlCache = new Map<string, { url: string; size: number; type: string }>();

/**
 * Generate globally unique and safe DOM element ID for HTML5 video tags
 */
export function getTeamVideoElementId(teamSlug: string, reportId: string): string {
  const safeTeam = (teamSlug || 'team').replace(/[^a-zA-Z0-9_-]/g, '_');
  const safeReport = (reportId || 'report').replace(/[^a-zA-Z0-9_-]/g, '_');
  return `mahash_video_${safeTeam}__${safeReport}`;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'reportId' });
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

export async function saveVideoToCache(reportId: string, file: File | Blob, fileName?: string): Promise<void> {
  try {
    const db = await openDB();
    
    // Invalidate existing in-memory URL for this report
    const existing = inMemoryObjectUrlCache.get(reportId);
    if (existing) {
      try {
        URL.revokeObjectURL(existing.url);
      } catch {}
      inMemoryObjectUrlCache.delete(reportId);
    }

    return new Promise((resolve) => {
      try {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);

        const record: StoredVideoRecord = {
          reportId,
          blob: file,
          name: fileName || (file instanceof File ? file.name : `video_${reportId}.mp4`),
          size: file.size,
          type: file.type || 'video/mp4',
          updatedAt: new Date().toISOString()
        };

        const request = store.put(record);

        request.onsuccess = () => {
          // Pre-cache object URL for instant playback
          try {
            const objectUrl = URL.createObjectURL(file);
            inMemoryObjectUrlCache.set(reportId, {
              url: objectUrl,
              size: file.size,
              type: record.type
            });
          } catch {}
          resolve();
        };

        request.onerror = (e) => {
          console.warn('Put video request warning in IndexedDB:', e);
          resolve();
        };
        transaction.onerror = (e) => {
          console.warn('Transaction error in IndexedDB:', e);
          resolve();
        };
        transaction.onabort = () => {
          console.warn('Transaction aborted in IndexedDB');
          resolve();
        };
      } catch (innerErr) {
        console.warn('Failed executing transaction in saveVideoToCache:', innerErr);
        resolve();
      }
    });
  } catch (err) {
    console.warn('saveVideoToCache openDB warning:', err);
    return Promise.resolve();
  }
}

export async function getVideoFromCache(reportId: string): Promise<StoredVideoRecord | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(reportId);

      request.onsuccess = () => {
        resolve(request.result || null);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to fetch video from IndexedDB cache:', err);
    return null;
  }
}

/**
 * Fast video URL resolver with memory caching
 * Checks memory pool first, then IndexedDB, otherwise falls back to remote URL.
 */
export async function getOrLoadCachedVideoUrl(
  reportId: string, 
  rawVideoSrc?: string
): Promise<{ url: string; isFromCache: boolean; sizeBytes?: number; mimeType?: string }> {
  // Check in-memory pool first
  const mem = inMemoryObjectUrlCache.get(reportId);
  if (mem) {
    return { url: mem.url, isFromCache: true, sizeBytes: mem.size, mimeType: mem.type };
  }

  const cacheKey = typeof rawVideoSrc === 'string' && rawVideoSrc.startsWith('indexeddb:')
    ? rawVideoSrc.replace('indexeddb:', '').trim()
    : reportId;

  // Check IndexedDB
  try {
    let cached = await getVideoFromCache(cacheKey);
    if (!cached && cacheKey !== reportId) {
      cached = await getVideoFromCache(reportId);
    }

    if (cached && cached.blob) {
      const objectUrl = URL.createObjectURL(cached.blob);
      inMemoryObjectUrlCache.set(reportId, {
        url: objectUrl,
        size: cached.size || cached.blob.size,
        type: cached.type || cached.blob.type || 'video/mp4'
      });
      return {
        url: objectUrl,
        isFromCache: true,
        sizeBytes: cached.size || cached.blob.size,
        mimeType: cached.type || 'video/mp4'
      };
    }
  } catch (err) {
    console.warn('[videoCache] Error resolving IndexedDB video:', err);
  }

  // Fallback to remote URL or server stable video for public visitors
  let remoteUrl = rawVideoSrc && !rawVideoSrc.startsWith('indexeddb:') && !rawVideoSrc.startsWith('blob:') ? rawVideoSrc : '';
  if (!remoteUrl && (rawVideoSrc?.startsWith('indexeddb:') || rawVideoSrc?.startsWith('blob:'))) {
    remoteUrl = '/uploads/mahash-stable-video.mp4';
  }
  return {
    url: remoteUrl,
    isFromCache: false
  };
}

export async function getAllCachedVideos(): Promise<StoredVideoRecord[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to fetch all videos from cache:', err);
    return [];
  }
}

export async function deleteVideoFromCache(reportId: string): Promise<void> {
  // Revoke in-memory URL
  const existing = inMemoryObjectUrlCache.get(reportId);
  if (existing) {
    try {
      URL.revokeObjectURL(existing.url);
    } catch {}
    inMemoryObjectUrlCache.delete(reportId);
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(reportId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to delete video from IndexedDB:', err);
  }
}

export async function clearAllVideoCache(): Promise<void> {
  // Revoke all in-memory URLs
  inMemoryObjectUrlCache.forEach((item) => {
    try {
      URL.revokeObjectURL(item.url);
    } catch {}
  });
  inMemoryObjectUrlCache.clear();

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Failed to clear video cache:', err);
  }
}

export async function getStorageStats(): Promise<{ count: number; totalSizeBytes: number; totalSizeFormatted: string }> {
  try {
    const videos = await getAllCachedVideos();
    const totalSizeBytes = videos.reduce((acc, v) => acc + (v.size || 0), 0);
    const mb = totalSizeBytes / (1024 * 1024);
    const totalSizeFormatted = mb > 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
    return {
      count: videos.length,
      totalSizeBytes,
      totalSizeFormatted
    };
  } catch {
    return { count: 0, totalSizeBytes: 0, totalSizeFormatted: '0 MB' };
  }
}


