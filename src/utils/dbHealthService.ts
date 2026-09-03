/**
 * Database Health & Storage Monitoring Service
 * 
 * Verifies disk capacity, quota usage, and cached file health before any large write
 * in IndexedDB. Automatically performs cleanup of old data with prefix 'mahash_'
 * if disk capacity is near full or file corruption/errors are detected.
 */

export interface DBHealthReport {
  isHealthy: boolean;
  quota: number;
  usage: number;
  usagePercentage: number;
  formattedUsageMB: string;
  formattedQuotaMB: string;
  warningTriggered: boolean;
  cleanedItemsCount: number;
}

const WARNING_THRESHOLD = 0.80; // 80% capacity warning

export async function checkDBHealthBeforeLargeWrite(): Promise<DBHealthReport> {
  let quota = 0;
  let usage = 0;
  let usagePercentage = 0;
  let warningTriggered = false;
  let cleanedCount = 0;

  if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      quota = estimate.quota || 0;
      usage = estimate.usage || 0;
      usagePercentage = quota > 0 ? usage / quota : 0;
    } catch (err) {
      console.warn('[DBHealthService] Failed to estimate storage quota:', err);
    }
  }

  // Check if storage is near capacity (> 80%)
  if (usagePercentage >= WARNING_THRESHOLD) {
    warningTriggered = true;
    console.warn(`[DBHealthService] WARNING: Storage usage is at ${(usagePercentage * 100).toFixed(1)}% (${(usage / (1024 * 1024)).toFixed(2)} MB / ${(quota / (1024 * 1024)).toFixed(2)} MB). Triggering automatic 'mahash_' cleanup.`);
    cleanedCount = await performMahashCleanup();
  }

  // Verify CacheStorage health & corruption check
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.includes('mahash')) {
          const cache = await caches.open(name);
          const requests = await cache.keys();
          for (const req of requests) {
            const resp = await cache.match(req);
            if (!resp || resp.status >= 500) {
              console.warn(`[DBHealthService] Corrupted or invalid cached asset found in ${name}: ${req.url}. Removing.`);
              await cache.delete(req);
              cleanedCount++;
            }
          }
        }
      }
    } catch (cacheErr) {
      console.warn('[DBHealthService] CacheStorage health check warning:', cacheErr);
    }
  }

  return {
    isHealthy: !warningTriggered || cleanedCount > 0,
    quota,
    usage,
    usagePercentage,
    formattedUsageMB: (usage / (1024 * 1024)).toFixed(2),
    formattedQuotaMB: (quota / (1024 * 1024)).toFixed(2),
    warningTriggered,
    cleanedItemsCount: cleanedCount
  };
}

export async function performMahashCleanup(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  let count = 0;

  try {
    // 1. LocalStorage cleanup for 'mahash_' prefix
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('mahash_')) {
        keysToRemove.push(key);
      }
    }
    for (const key of keysToRemove) {
      localStorage.removeItem(key);
      count++;
    }

    // 2. CacheStorage cleanup for 'mahash-' prefix
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      for (const name of cacheNames) {
        if (name.startsWith('mahash-')) {
          await caches.delete(name);
          count++;
        }
      }
    }

    // 3. IndexedDB MahashEnterpriseDB or MahashCoreDB cache cleanup
    const dbNames = ['MahashEnterpriseDB', 'MahashCoreDB'];
    for (const dbName of dbNames) {
      try {
        const req = indexedDB.open(dbName);
        req.onsuccess = (e) => {
          const db = (e.target as IDBOpenDBRequest).result;
          const storeNames = Array.from(db.objectStoreNames);
          if (storeNames.length > 0) {
            try {
              const tx = db.transaction(storeNames, 'readwrite');
              for (const store of storeNames) {
                if (store.includes('media') || store.includes('temp') || store.includes('journal')) {
                  tx.objectStore(store).clear();
                  count++;
                }
              }
            } catch {}
          }
        };
      } catch {}
    }

    console.log(`[DBHealthService] Successfully cleaned up ${count} items/caches starting with 'mahash_'.`);
  } catch (err) {
    console.error('[DBHealthService] Error during automatic cleanup:', err);
  }

  return count;
}
