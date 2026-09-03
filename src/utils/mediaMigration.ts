import { indexedDBService } from './indexedDBService';

/**
 * Enterprise Media IndexedDB Manager with strict isolated read/write transactions
 * preventing database locking during global publishing.
 */
class MediaIndexedDBManager {
  private dbName = 'MahashEnterpriseDB';
  private dbVersion = 3;
  private writeQueue: Promise<any> = Promise.resolve();

  public async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('reports')) {
          db.createObjectStore('reports', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('media_assets')) {
          const mediaStore = db.createObjectStore('media_assets', { keyPath: 'id' });
          mediaStore.createIndex('reportId', 'reportId', { unique: false });
        }
      };
    });
  }

  /**
   * Isolated read transaction for fetching a media asset
   */
  public async getMediaAsset(id: string): Promise<any | null> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('media_assets', 'readonly');
      const store = transaction.objectStore('media_assets');
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Isolated read transaction for fetching all media assets
   */
  public async getAllMediaAssets(): Promise<any[]> {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('media_assets', 'readonly');
      const store = transaction.objectStore('media_assets');
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Isolated write transaction with queue serialization for saving a single media asset
   */
  public async saveMediaAssetAsync(item: { id: string; reportId?: string; url: string; original_name?: string; mime_type?: string }): Promise<boolean> {
    return this.enqueueWrite(async () => {
      const db = await this.openDB();
      return new Promise<boolean>((resolve, reject) => {
        const transaction = db.transaction(['media_assets'], 'readwrite');
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve(true);

        const store = transaction.objectStore('media_assets');
        store.put(item);
      });
    });
  }

  /**
   * Isolated write transaction with queue serialization for saving reports and media
   */
  public async bulkSaveReportsAndMedia(reports: any[], mediaItems: any[]): Promise<boolean> {
    return this.enqueueWrite(async () => {
      const db = await this.openDB();
      return new Promise<boolean>((resolve, reject) => {
        const transaction = db.transaction(['reports', 'media_assets'], 'readwrite');
        
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => resolve(true);

        const reportStore = transaction.objectStore('reports');
        const mediaStore = transaction.objectStore('media_assets');

        for (const rep of reports) {
          reportStore.put(rep);
        }

        for (const item of mediaItems) {
          mediaStore.put(item);
        }
      });
    });
  }

  /**
   * Serializes write operations to prevent concurrent database locks.
   */
  private async enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
    this.writeQueue = this.writeQueue.then(task, task);
    return this.writeQueue;
  }
}

export const mediaIDBManager = new MediaIndexedDBManager();

/**
 * Cleanup stale media caches and abort lingering requests to prevent queue bloat and DB locking.
 */
export async function cleanupStaleMediaCaches(timeoutMs = 10000): Promise<void> {
  if (typeof window === 'undefined' || !('caches' in window)) return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const cacheNames = await caches.keys();
    for (const name of cacheNames) {
      if (name.includes('media-cache') || name.includes('assets-cache')) {
        const cache = await caches.open(name);
        const requests = await cache.keys();
        if (requests.length > 100) {
          // Remove excess or stale cached items to prevent bloat
          for (let i = 0; i < requests.length - 50; i++) {
            if (controller.signal.aborted) break;
            await cache.delete(requests[i]);
          }
        }
      }
    }
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      console.warn('[MediaMigration] Cache cleanup aborted due to timeout.');
    } else {
      console.warn('[MediaMigration] Cache cleanup warning:', err);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Registers uploaded video and image assets into CacheStorage and IndexedDB media_assets store
 * using AbortController to prevent queue bloat and long-hanging requests.
 */
export async function registerAndCacheUploadedMedia(
  id: string,
  url: string,
  mimeType: string,
  originalName?: string,
  reportId?: string,
  timeoutMs = 15000
): Promise<string> {
  if (!url) return url;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    if (typeof window !== 'undefined' && 'caches' in window && !url.startsWith('data:')) {
      const cache = await caches.open('mahash-media-cache-v1');
      try {
        const response = await fetch(url, { 
          mode: 'no-cors',
          signal: controller.signal 
        });
        if (response) {
          await cache.put(url, response.clone());
        }
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          console.warn('[MediaMigration] Media cache fetch aborted due to timeout');
        } else {
          console.warn('[MediaMigration] CacheStorage put warning:', fetchErr);
        }
      }
    }

    await mediaIDBManager.saveMediaAssetAsync({
      id,
      reportId,
      url,
      original_name: originalName || `MediaAsset_${id}`,
      mime_type: mimeType || (url.startsWith('data:video/') ? 'video/mp4' : 'image/png')
    });
  } catch (err) {
    console.error('[MediaMigration] Error registering uploaded media:', err);
  } finally {
    clearTimeout(timeoutId);
  }

  return url;
}

/**
 * Migrates client media to WordPress with AbortController timeout & queue bloat protection.
 */
export async function migrateAllClientMediaToWordPress(timeoutMs = 20000): Promise<void> {
  if (typeof window === 'undefined') return;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    await cleanupStaleMediaCaches(5000);

    const itemsToMigrate: Array<{ url: string; original_name?: string; mime_type?: string }> = [];

    // 1. Scan LocalStorage asynchronously
    for (let i = 0; i < localStorage.length; i++) {
      if (controller.signal.aborted) break;
      const key = localStorage.key(i);
      if (!key) continue;
      try {
        const val = localStorage.getItem(key);
        if (val && typeof val === 'string') {
          if (val.startsWith('data:image/') || val.startsWith('data:video/') || (val.startsWith('http') && (val.includes('.jpg') || val.includes('.png') || val.includes('.mp4')))) {
            itemsToMigrate.push({
              url: val,
              original_name: `LocalStorage Asset (${key})`,
              mime_type: val.startsWith('data:video/') ? 'video/mp4' : 'image/png'
            });
          }
        }
      } catch {}
    }

    // 2. Scan IndexedDB reports & media safely in read transactions
    try {
      const dbReports = await indexedDBService.getAllReports();
      if (Array.isArray(dbReports)) {
        for (const rep of dbReports) {
          if (controller.signal.aborted) break;
          if (rep.posterSrc && typeof rep.posterSrc === 'string') {
            itemsToMigrate.push({ url: rep.posterSrc, original_name: `Report Poster (${rep.id})`, mime_type: 'image/png' });
          }
          if (rep.videoSrc && typeof rep.videoSrc === 'string' && (rep.videoSrc.startsWith('data:') || rep.videoSrc.startsWith('blob:'))) {
            itemsToMigrate.push({ url: rep.videoSrc, original_name: `Report Video (${rep.id})`, mime_type: 'video/mp4' });
          }
          if (Array.isArray(rep.images)) {
            for (const img of rep.images) {
              if (img && img.src) {
                itemsToMigrate.push({ url: img.src, original_name: `Report Image (${rep.id})`, mime_type: 'image/png' });
              }
            }
          }
        }
      }

      const idbMedia = await mediaIDBManager.getAllMediaAssets();
      if (Array.isArray(idbMedia)) {
        for (const m of idbMedia) {
          if (controller.signal.aborted) break;
          if (m && m.url) {
            itemsToMigrate.push({ url: m.url, original_name: m.original_name || 'IDB Media Asset', mime_type: m.mime_type || 'image/png' });
          }
        }
      }
    } catch (e) {
      console.warn('IDB read scan note:', e);
    }

    if (itemsToMigrate.length > 0 && !controller.signal.aborted) {
      const res = await fetch('/api/wp/media/migrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToMigrate }),
        signal: controller.signal
      });
      const data = await res.json();
      if (data.success) {
        console.log(`[MediaMigration] Successfully migrated ${data.migratedCount} assets to WordPress server & MySQL.`);
      }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      console.warn('[MediaMigration] Migration operation timed out and was aborted to prevent queue bloat.');
    } else {
      console.error('Migration error:', err);
    }
  } finally {
    clearTimeout(timeoutId);
  }
}
