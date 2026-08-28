/**
 * Robust, Quota-Safe LocalStorage & SessionStorage Manager for Mahash Portal
 * Prevents QuotaExceededError and provides graceful degradation with in-memory & sessionStorage fallback.
 */

// In-memory fallback map when localStorage is blocked or completely full
const memoryStorageMap = new Map<string, string>();

/**
 * Checks if an error is a QuotaExceededError across all major browsers
 */
export function isQuotaExceededError(err: unknown): boolean {
  if (!err) return false;
  if (err instanceof DOMException) {
    // Standard W3C QuotaExceededError
    if (err.name === 'QuotaExceededError' || err.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
      return true;
    }
    // Legacy code 22 (Chrome, Safari, Firefox, IE) or 1014 (Firefox)
    if (err.code === 22 || err.code === 1014) {
      return true;
    }
  }
  const message = typeof err === 'object' && err !== null && 'message' in err
    ? String((err as { message: unknown }).message).toLowerCase()
    : String(err).toLowerCase();

  return message.includes('quota') || message.includes('exceeded') || message.includes('storage full');
}

/**
 * Proactively purges legacy, duplicate, and non-critical storage entries to free space
 */
export function freeUpLocalStorageQuota(): number {
  if (typeof window === 'undefined') return 0;
  let freedCount = 0;

  try {
    // 1. Prune bloated audit logs to only the latest 10 items
    try {
      const rawAudit = localStorage.getItem('mahash_audit_logs_v1');
      if (rawAudit) {
        const parsed = JSON.parse(rawAudit);
        if (Array.isArray(parsed) && parsed.length > 10) {
          localStorage.setItem('mahash_audit_logs_v1', JSON.stringify(parsed.slice(0, 10)));
          freedCount++;
        }
      }
    } catch {}

    // 2. Remove legacy duplicate single-team logo keys (since they are already in team_overrides & team_logos_map)
    const redundantPrefixes = [
      'team_logo_',
      'mahash_team_logo_',
      'mahash_consultant_photo_',
      'mahash_logos',
      'team_logos',
      'team_overrides'
    ];

    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      // Check if it's a legacy or redundant standalone key
      for (const prefix of redundantPrefixes) {
        if (key.startsWith(prefix) && key !== 'mahash_team_logos_v1' && key !== 'mahash_team_overrides_v1') {
          keysToRemove.push(key);
          break;
        }
      }
    }

    keysToRemove.forEach((k) => {
      try {
        localStorage.removeItem(k);
        freedCount++;
      } catch {}
    });

    // 3. Prune old cached report views if overly bloated
    try {
      const rawViews = localStorage.getItem('mahash_views_v1');
      if (rawViews) {
        const parsedViews = JSON.parse(rawViews);
        if (parsedViews && typeof parsedViews === 'object' && Object.keys(parsedViews).length > 200) {
          // Keep only first 50 keys
          const trimmedViews: Record<string, number> = {};
          Object.keys(parsedViews).slice(0, 50).forEach((vk) => {
            trimmedViews[vk] = parsedViews[vk];
          });
          localStorage.setItem('mahash_views_v1', JSON.stringify(trimmedViews));
          freedCount++;
        }
      }
    } catch {}

  } catch (err) {
    console.warn('Storage cleanup warning:', err);
  }

  return freedCount;
}

/**
 * Safely sets an item in localStorage.
 * If quota is exceeded, performs automatic cleanup and fallback without crashing.
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  if (typeof window === 'undefined') {
    memoryStorageMap.set(key, value);
    return true;
  }

  // Always keep in-memory backup in sync and persist to IndexedDB
  memoryStorageMap.set(key, value);
  persistToKV(key, value);

  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (isQuotaExceededError(err)) {
      console.warn(`[SafeStorage] QuotaExceededError on key "${key}". Running cleanup...`);
      
      // Step 1: Free up space
      freeUpLocalStorageQuota();

      // Step 2: Retry
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (retryErr) {
        console.warn(`[SafeStorage] Retry after cleanup failed for key "${key}". Falling back to sessionStorage.`, retryErr);
        
        // Step 3: Fallback to sessionStorage
        try {
          sessionStorage.setItem(key, value);
        } catch {}
        return false;
      }
    } else {
      console.warn(`[SafeStorage] Error setting localStorage for key "${key}":`, err);
      try {
        sessionStorage.setItem(key, value);
      } catch {}
      return false;
    }
  }
}

/**
 * Safely gets an item from localStorage with fallback to sessionStorage & in-memory map
 */
export function safeGetLocalStorage(key: string, defaultValue: string | null = null): string | null {
  if (typeof window === 'undefined') {
    return memoryStorageMap.get(key) ?? defaultValue;
  }

  // Prioritize memoryStorageMap as it contains the absolute latest write bypassing any browser quota limits
  if (memoryStorageMap.has(key)) {
    return memoryStorageMap.get(key) ?? defaultValue;
  }

  try {
    const val = localStorage.getItem(key);
    if (val !== null) {
      memoryStorageMap.set(key, val);
      return val;
    }
  } catch (err) {
    console.warn(`[SafeStorage] Error reading localStorage key "${key}":`, err);
  }

  // Fallback to sessionStorage
  try {
    const sVal = sessionStorage.getItem(key);
    if (sVal !== null) {
      memoryStorageMap.set(key, sVal);
      return sVal;
    }
  } catch {}

  return defaultValue;
}

/**
 * Safely removes an item from localStorage, sessionStorage, and memory
 */
export function safeRemoveLocalStorage(key: string): void {
  memoryStorageMap.delete(key);
  removeFromKV(key);
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(key);
  } catch {}

  try {
    sessionStorage.removeItem(key);
  } catch {}
}

const KV_DB_NAME = 'MahashKVStore';
const KV_STORE_NAME = 'kv';

function openKVDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(KV_DB_NAME, 1);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(KV_STORE_NAME)) {
        db.createObjectStore(KV_STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
}

function persistToKV(key: string, value: string) {
  openKVDB().then(db => {
    const tx = db.transaction([KV_STORE_NAME], 'readwrite');
    const store = tx.objectStore(KV_STORE_NAME);
    store.put({ id: key, value });
  }).catch(() => {});
}

function removeFromKV(key: string) {
  openKVDB().then(db => {
    const tx = db.transaction([KV_STORE_NAME], 'readwrite');
    const store = tx.objectStore(KV_STORE_NAME);
    store.delete(key);
  }).catch(() => {});
}

export function syncKVToMemory(): Promise<void> {
  return new Promise((resolve) => {
    openKVDB().then(db => {
      const tx = db.transaction([KV_STORE_NAME], 'readonly');
      const store = tx.objectStore(KV_STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const records = req.result || [];
        let modified = false;
        records.forEach(rec => {
          if (memoryStorageMap.get(rec.id) !== rec.value) {
            memoryStorageMap.set(rec.id, rec.value);
            modified = true;
          }
          try {
            if (localStorage.getItem(rec.id) !== rec.value) {
              localStorage.setItem(rec.id, rec.value);
            }
          } catch(e) {}
        });
        if (modified) {
          window.dispatchEvent(new Event('mahash_store_updated'));
        }
        resolve();
      };
      req.onerror = () => resolve();
    }).catch(() => resolve());
  });
}

// Automatically run cleanup and sync on module load if in browser environment
if (typeof window !== 'undefined') {
  try {
    freeUpLocalStorageQuota();
    syncKVToMemory();
  } catch {}
}
