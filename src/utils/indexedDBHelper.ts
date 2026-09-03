export interface DBCommentRecord {
  id: string;
  reportId: string;
  author: string;
  content: string;
  timestamp: number;
  syncStatus?: 'synced' | 'pending';
}

const COMMENTS_DB_NAME = 'mahash_comments_isolated_db';
const COMMENTS_STORE_NAME = 'comments';
const COMMENTS_DB_VERSION = 1;

export function openCommentsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported'));
    }
    const request = window.indexedDB.open(COMMENTS_DB_NAME, COMMENTS_DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(COMMENTS_STORE_NAME)) {
        const store = db.createObjectStore(COMMENTS_STORE_NAME, { keyPath: 'id' });
        store.createIndex('reportId', 'reportId', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
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

export async function saveCommentIsolated(comment: DBCommentRecord): Promise<void> {
  const db = await openCommentsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COMMENTS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(COMMENTS_STORE_NAME);
    const req = store.put(comment);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getCommentsByReportIdIsolated(reportId: string): Promise<DBCommentRecord[]> {
  try {
    const db = await openCommentsDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(COMMENTS_STORE_NAME, 'readonly');
      const store = tx.objectStore(COMMENTS_STORE_NAME);
      const index = store.index('reportId');
      const req = index.getAll(reportId);
      req.onsuccess = () => {
        const results = (req.result || []) as DBCommentRecord[];
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDBHelper] Error fetching isolated comments:', err);
    return [];
  }
}

export async function deleteCommentIsolated(commentId: string): Promise<void> {
  const db = await openCommentsDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(COMMENTS_STORE_NAME, 'readwrite');
    const store = tx.objectStore(COMMENTS_STORE_NAME);
    const req = store.delete(commentId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export const checkIndexedDBHealth = async (): Promise<boolean> => {
  try {
    if (!window.indexedDB) return false;
    
    return new Promise((resolve) => {
      const request = window.indexedDB.open('mahash_health_check', 1);
      request.onsuccess = () => {
        request.result.close();
        window.indexedDB.deleteDatabase('mahash_health_check');
        resolve(true);
      };
      request.onerror = (e) => {
        console.warn("IndexedDB Health Check Failed:", e);
        if ((e.target as any)?.error?.name === 'QuotaExceededError') {
            console.error("IndexedDB Quota Exceeded");
        }
        resolve(false);
      };
    });
  } catch (e) {
    return false;
  }
};

export const reportIndexedDBDatabases = async () => {
  if (window.indexedDB && (window.indexedDB as any).databases) {
    try {
      const dbs = await (window.indexedDB as any).databases();
      console.log(`[IndexedDB Debug] Found ${dbs.length} databases:`, dbs);
      if (dbs.length > 20) {
         console.warn("[IndexedDB Debug] Too many databases detected. Performing auto-cleanup of unmanaged DBs.");
         for (const db of dbs) {
            if (db.name && db.name.startsWith('temp_')) {
                window.indexedDB.deleteDatabase(db.name);
            }
         }
      }
      return dbs;
    } catch(e) {
      console.warn("Could not report IndexedDB databases:", e);
    }
  }
  return [];
};
