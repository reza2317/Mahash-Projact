/**
 * IndexedDB and Storage Monitor Utility
 * Reports stored size and triggers automatic cleanup of old data starting with 'mahash_' prefix when storage approaches capacity limits.
 */

export interface StorageUsageReport {
  quota: number;
  usage: number;
  usagePercentage: number;
  formattedUsageMB: string;
  formattedQuotaMB: string;
}

export const STORAGE_CAPACITY_WARNING_THRESHOLD = 0.85; // 85%

export async function checkStorageQuota(): Promise<StorageUsageReport | null> {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return null;
  }

  try {
    const estimate = await navigator.storage.estimate();
    const quota = estimate.quota || 0;
    const usage = estimate.usage || 0;
    const usagePercentage = quota > 0 ? usage / quota : 0;

    const report: StorageUsageReport = {
      quota,
      usage,
      usagePercentage,
      formattedUsageMB: (usage / (1024 * 1024)).toFixed(2),
      formattedQuotaMB: (quota / (1024 * 1024)).toFixed(2),
    };

    if (usagePercentage >= STORAGE_CAPACITY_WARNING_THRESHOLD) {
      console.warn(`[StorageMonitor] Storage usage high (${(usagePercentage * 100).toFixed(1)}%). Triggering automatic cleanup of 'mahash_' older cache/data.`);
      await performAutomaticCleanup();
    }

    return report;
  } catch (err) {
    console.error('[StorageMonitor] Error estimating storage quota:', err);
    return null;
  }
}

async function performAutomaticCleanup(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    // 1. Clean LocalStorage items starting with 'mahash_'
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mahash_')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
    }
    console.log(`[StorageMonitor] Cleaned ${keysToRemove.length} 'mahash_' items from localStorage.`);

    // 2. Clean CacheStorage entries starting with 'mahash-'
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.startsWith('mahash-')) {
          await caches.delete(name);
          console.log(`[StorageMonitor] Deleted cache storage: ${name}`);
        }
      }
    }

    // 3. IndexedDB database cleanup for MahashEnterpriseDB
    const dbName = 'MahashEnterpriseDB';
    const request = indexedDB.open(dbName);
    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const storeNames = Array.from(db.objectStoreNames);
      if (storeNames.length > 0) {
        try {
          const transaction = db.transaction(storeNames, 'readwrite');
          transaction.oncomplete = () => {
            console.log('[StorageMonitor] Successfully cleared old indexedDB stores for MahashEnterpriseDB.');
          };
          for (const storeName of storeNames) {
            const store = transaction.objectStore(storeName);
            // Clear items or older records if needed
            // For safety, let's clear cache/temp stores or truncate if necessary
            if (storeName.includes('media') || storeName.includes('temp')) {
              store.clear();
            }
          }
        } catch (e) {
          console.warn('[StorageMonitor] IndexedDB cleanup transaction note:', e);
        }
      }
    };
  } catch (err) {
    console.error('[StorageMonitor] Error during automatic storage cleanup:', err);
  }
}

/**
 * Initializes periodic storage monitoring
 */
export function initStorageMonitor(intervalMs: number = 60000 * 15): () => void {
  if (typeof window === 'undefined') return () => {};

  const intervalId = setInterval(() => {
    checkStorageQuota();
  }, intervalMs);

  // Initial check on startup
  checkStorageQuota();

  return () => clearInterval(intervalId);
}
