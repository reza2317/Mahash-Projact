/**
 * Dedicated IndexedDB Storage & Transaction Manager for Mahash Portal
 * 
 * Features:
 * - Thread-safe asynchronous transaction queue & mutex pipeline to prevent race conditions and lock-ups.
 * - Robust error handling with auto-retry on transient IndexedDB AbortErrors.
 * - High-capacity storage for full-text reports, Persian metadata, attachments, and image blobs.
 * - Batch operations for concurrent and bulk publishes without database deadlocks.
 */

import { ActivityReport, ReportAttachment } from '../types';

export interface StoredMediaItem {
  id: string;
  reportId: string;
  name: string;
  type: 'image' | 'pdf' | 'word' | 'excel' | 'archive' | 'audio' | 'video' | 'file';
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  blob?: Blob;
  dataUrl?: string;
  caption?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SyncJournalEntry {
  id: string;
  entityType: 'report' | 'media' | 'team';
  entityId: string;
  action: 'insert' | 'update' | 'delete';
  timestamp: string;
  status: 'pending' | 'synced' | 'failed';
  payload?: any;
}

export interface DBStats {
  isSupported: boolean;
  reportsCount: number;
  mediaCount: number;
  journalCount: number;
  estimatedStorageMb: number;
  dbVersion: number;
}

const DB_NAME = 'MahashCoreDB';
const DB_VERSION = 2;

// Store names
export const STORES = {
  REPORTS: 'reports',
  MEDIA: 'media_assets',
  JOURNAL: 'sync_journal',
  KV: 'key_value_store'
} as const;

/**
 * Mutex Queue for serializing write transactions to avoid IndexedDB locking
 */
class AsyncTransactionQueue {
  private queue: Promise<any> = Promise.resolve();
  private activeLocks: number = 0;

  /**
   * Enqueues an async database operation to be executed sequentially
   */
  public enqueue<T>(operation: () => Promise<T>, label = 'db-tx'): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue = this.queue
        .then(async () => {
          this.activeLocks++;
          try {
            const result = await operation();
            resolve(result);
          } catch (err) {
            console.error(`[IndexedDB AsyncTx] Error in ${label}:`, err);
            reject(err);
          } finally {
            this.activeLocks = Math.max(0, this.activeLocks - 1);
          }
        })
        .catch((fatalErr) => {
          console.error(`[IndexedDB AsyncTx] Pipeline fatal error in ${label}:`, fatalErr);
          reject(fatalErr);
        });
    });
  }

  public getPendingCount(): number {
    return this.activeLocks;
  }
}

class IndexedDBManager {
  private dbInstance: IDBDatabase | null = null;
  private dbOpenPromise: Promise<IDBDatabase> | null = null;
  private txQueue = new AsyncTransactionQueue();
  private maxRetries = 3;

  /**
   * Checks if IndexedDB is available in the current browser environment
   */
  public isAvailable(): boolean {
    return typeof window !== 'undefined' && 'indexedDB' in window && window.indexedDB !== null;
  }

  /**
   * Opens or retrieves the singleton IndexedDB connection with upgrade handling
   */
  public async getDB(): Promise<IDBDatabase> {
    if (!this.isAvailable()) {
      throw new Error('IndexedDB is not supported or disabled in this browser.');
    }

    if (this.dbInstance) {
      return this.dbInstance;
    }

    if (this.dbOpenPromise) {
      return this.dbOpenPromise;
    }

    this.dbOpenPromise = new Promise<IDBDatabase>((resolve, reject) => {
      try {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);

        req.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result;
          console.info(`[IndexedDB] Upgrading schema to version ${DB_VERSION}...`);

          // 1. Reports Store
          if (!db.objectStoreNames.contains(STORES.REPORTS)) {
            const reportsStore = db.createObjectStore(STORES.REPORTS, { keyPath: 'id' });
            reportsStore.createIndex('teamSlug', 'teamSlug', { unique: false });
            reportsStore.createIndex('reportNum', 'reportNum', { unique: false });
            reportsStore.createIndex('date', 'date', { unique: false });
            reportsStore.createIndex('status', 'status', { unique: false });
            reportsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          // 2. Media & Images Store
          if (!db.objectStoreNames.contains(STORES.MEDIA)) {
            const mediaStore = db.createObjectStore(STORES.MEDIA, { keyPath: 'id' });
            mediaStore.createIndex('reportId', 'reportId', { unique: false });
            mediaStore.createIndex('type', 'type', { unique: false });
            mediaStore.createIndex('createdAt', 'createdAt', { unique: false });
          }

          // 3. Sync Journal Store
          if (!db.objectStoreNames.contains(STORES.JOURNAL)) {
            const journalStore = db.createObjectStore(STORES.JOURNAL, { keyPath: 'id' });
            journalStore.createIndex('entityType', 'entityType', { unique: false });
            journalStore.createIndex('status', 'status', { unique: false });
            journalStore.createIndex('timestamp', 'timestamp', { unique: false });
          }

          // 4. Key-Value Meta Store
          if (!db.objectStoreNames.contains(STORES.KV)) {
            db.createObjectStore(STORES.KV, { keyPath: 'key' });
          }
        };

        req.onsuccess = (event) => {
          this.dbInstance = (event.target as IDBOpenDBRequest).result;
          
          this.dbInstance.onversionchange = () => {
            this.dbInstance?.close();
            this.dbInstance = null;
            this.dbOpenPromise = null;
            console.warn('[IndexedDB] Database version changed elsewhere. Closed instance.');
          };

          this.dbInstance.onerror = (evt) => {
            console.error('[IndexedDB] Connection error:', evt);
          };

          resolve(this.dbInstance);
        };

        req.onerror = (event) => {
          this.dbOpenPromise = null;
          const error = (event.target as IDBOpenDBRequest).error;
          console.error('[IndexedDB] Failed to open database:', error);
          reject(error || new Error('Could not open IndexedDB'));
        };

        req.onblocked = () => {
          console.warn('[IndexedDB] Database open request is blocked by another tab.');
        };
      } catch (err) {
        this.dbOpenPromise = null;
        reject(err);
      }
    });

    return this.dbOpenPromise;
  }

  /**
   * Executes a write transaction inside the sequential async transaction queue with auto-retry
   */
  public async executeWriteTx<T>(
    storeNames: string[],
    txCallback: (tx: IDBTransaction, stores: Record<string, IDBObjectStore>) => Promise<T>,
    actionLabel = 'write-tx'
  ): Promise<T> {
    return this.txQueue.enqueue(async () => {
      let attempts = 0;
      let lastError: any = null;

      while (attempts < this.maxRetries) {
        attempts++;
        try {
          const db = await this.getDB();
          return await new Promise<T>((resolve, reject) => {
            let tx: IDBTransaction;
            try {
              tx = db.transaction(storeNames, 'readwrite');
            } catch (initErr) {
              return reject(initErr);
            }

            const storeMap: Record<string, IDBObjectStore> = {};
            for (const name of storeNames) {
              storeMap[name] = tx.objectStore(name);
            }

            let callbackResult: any;
            let callbackPromiseFailed = false;

            txCallback(tx, storeMap)
              .then((res) => {
                callbackResult = res;
              })
              .catch((err) => {
                callbackPromiseFailed = true;
                try {
                  tx.abort();
                } catch {}
                reject(err);
              });

            tx.oncomplete = () => {
              if (!callbackPromiseFailed) {
                resolve(callbackResult);
              }
            };

            tx.onerror = (evt) => {
              const err = (evt.target as IDBTransaction).error || tx.error;
              reject(err || new Error(`Transaction error in ${actionLabel}`));
            };

            tx.onabort = (evt) => {
              if (!callbackPromiseFailed) {
                const err = (evt.target as IDBTransaction).error || tx.error;
                reject(err || new Error(`Transaction aborted in ${actionLabel}`));
              }
            };
          });
        } catch (err: any) {
          lastError = err;
          const isAbortOrLocked =
            err?.name === 'AbortError' ||
            err?.name === 'InvalidStateError' ||
            err?.message?.includes('closing');

          if (isAbortOrLocked && attempts < this.maxRetries) {
            console.warn(`[IndexedDB Retry] Retrying ${actionLabel} (attempt ${attempts}/${this.maxRetries}) after delay...`);
            await new Promise((r) => setTimeout(r, attempts * 60));
            // Reset DB instance if invalid state
            if (err?.name === 'InvalidStateError') {
              this.dbInstance = null;
              this.dbOpenPromise = null;
            }
          } else {
            break;
          }
        }
      }

      throw lastError || new Error(`Failed transaction ${actionLabel} after ${this.maxRetries} attempts.`);
    }, actionLabel);
  }

  /**
   * Executes a read-only transaction safely
   */
  public async executeReadTx<T>(
    storeName: string,
    txCallback: (store: IDBObjectStore) => Promise<T>,
    actionLabel = 'read-tx'
  ): Promise<T> {
    try {
      const db = await this.getDB();
      return await new Promise<T>((resolve, reject) => {
        const tx = db.transaction([storeName], 'readonly');
        const store = tx.objectStore(storeName);

        txCallback(store)
          .then((res) => resolve(res))
          .catch((err) => reject(err));

        tx.onerror = () => {
          reject(tx.error || new Error(`Read transaction failed in ${actionLabel}`));
        };
      });
    } catch (err) {
      console.warn(`[IndexedDB Read Error] in ${actionLabel}:`, err);
      throw err;
    }
  }

  // ==========================================
  // REPORT OPERATIONS (ASYNC TRANSACTIONAL)
  // ==========================================

  /**
   * Inserts or updates a single ActivityReport in a non-blocking, queued transaction
   */
  public async saveReport(report: ActivityReport, teamSlug?: string): Promise<boolean> {
    if (!report || !report.id) {
      console.warn('[IndexedDB] Cannot save report without an ID.');
      return false;
    }

    const cleanTeamSlug = teamSlug || report.teamSlug || 'team-thinker';
    const nowIso = new Date().toISOString();

    const recordToSave: ActivityReport & { updatedAt: string } = {
      ...report,
      teamSlug: cleanTeamSlug,
      status: report.status || 'published',
      updatedAt: nowIso
    };

    try {
      await this.executeWriteTx(
        [STORES.REPORTS, STORES.JOURNAL],
        async (tx, stores) => {
          const reportsStore = stores[STORES.REPORTS];
          const journalStore = stores[STORES.JOURNAL];

          await new Promise<void>((resolve, reject) => {
            const putReq = reportsStore.put(recordToSave);
            putReq.onsuccess = () => resolve();
            putReq.onerror = () => reject(putReq.error);
          });

          // Log to journal
          const journalEntry: SyncJournalEntry = {
            id: `j_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            entityType: 'report',
            entityId: report.id,
            action: 'update',
            timestamp: nowIso,
            status: 'pending'
          };

          await new Promise<void>((resolve, reject) => {
            const jReq = journalStore.put(journalEntry);
            jReq.onsuccess = () => resolve();
            jReq.onerror = () => reject(jReq.error);
          });
        },
        `saveReport-${report.id}`
      );

      // If the report contains embedded images/attachments, store them in MEDIA store too
      if (report.attachments && Array.isArray(report.attachments) && report.attachments.length > 0) {
        this.saveReportAttachmentsAsync(report.id, report.attachments).catch((e) =>
          console.warn('[IndexedDB] Background attachment sync warning:', e)
        );
      }

      return true;
    } catch (err) {
      console.error(`[IndexedDB] Failed to save report ${report.id}:`, err);
      return false;
    }
  }

  /**
   * Batch inserts/updates multiple reports in a single atomic transaction without locking
   */
  public async batchSaveReports(
    reports: ActivityReport[]
  ): Promise<{ successCount: number; failCount: number; errors: string[] }> {
    if (!reports || reports.length === 0) {
      return { successCount: 0, failCount: 0, errors: [] };
    }

    const errors: string[] = [];
    let successCount = 0;
    let failCount = 0;

    const nowIso = new Date().toISOString();

    try {
      await this.executeWriteTx(
        [STORES.REPORTS, STORES.JOURNAL],
        async (tx, stores) => {
          const reportsStore = stores[STORES.REPORTS];
          const journalStore = stores[STORES.JOURNAL];

          for (const rep of reports) {
            if (!rep || !rep.id) {
              failCount++;
              errors.push('Report missing ID skipped.');
              continue;
            }

            try {
              const record = {
                ...rep,
                status: rep.status || 'published',
                updatedAt: nowIso
              };

              await new Promise<void>((res, rej) => {
                const req = reportsStore.put(record);
                req.onsuccess = () => res();
                req.onerror = () => rej(req.error);
              });

              successCount++;
            } catch (itemErr: any) {
              failCount++;
              errors.push(`Error saving report ${rep.id}: ${itemErr?.message || itemErr}`);
            }
          }

          // Batch journal summary
          const batchJournal: SyncJournalEntry = {
            id: `batch_j_${Date.now()}`,
            entityType: 'report',
            entityId: 'batch_reports',
            action: 'insert',
            timestamp: nowIso,
            status: 'pending',
            payload: { count: successCount }
          };

          journalStore.put(batchJournal);
        },
        `batchSaveReports-${reports.length}`
      );
    } catch (err: any) {
      console.error('[IndexedDB] Batch save fatal error:', err);
      errors.push(`Transaction error: ${err?.message || err}`);
      failCount = reports.length - successCount;
    }

    return { successCount, failCount, errors };
  }

  /**
   * Retrieves a single report by its ID
   */
  public async getReport(id: string): Promise<ActivityReport | null> {
    if (!id) return null;
    try {
      return await this.executeReadTx<ActivityReport | null>(
        STORES.REPORTS,
        async (store) => {
          return new Promise((resolve) => {
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
          });
        },
        `getReport-${id}`
      );
    } catch {
      return null;
    }
  }

  /**
   * Retrieves all reports for a specific team slug
   */
  public async getReportsByTeam(teamSlug: string): Promise<ActivityReport[]> {
    if (!teamSlug) return [];
    try {
      return await this.executeReadTx<ActivityReport[]>(
        STORES.REPORTS,
        async (store) => {
          return new Promise((resolve) => {
            const index = store.index('teamSlug');
            const req = index.getAll(teamSlug);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
          });
        },
        `getReportsByTeam-${teamSlug}`
      );
    } catch {
      return [];
    }
  }

  /**
   * Retrieves all stored reports across all teams
   */
  public async getAllReports(): Promise<ActivityReport[]> {
    try {
      return await this.executeReadTx<ActivityReport[]>(
        STORES.REPORTS,
        async (store) => {
          return new Promise((resolve) => {
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
          });
        },
        'getAllReports'
      );
    } catch {
      return [];
    }
  }

  /**
   * Deletes a report and associated media records
   */
  public async deleteReport(id: string): Promise<boolean> {
    if (!id) return false;

    try {
      await this.executeWriteTx(
        [STORES.REPORTS, STORES.MEDIA, STORES.JOURNAL],
        async (tx, stores) => {
          const reportsStore = stores[STORES.REPORTS];
          const mediaStore = stores[STORES.MEDIA];
          const journalStore = stores[STORES.JOURNAL];

          // 1. Delete report record
          reportsStore.delete(id);

          // 2. Delete linked media
          const mediaIndex = mediaStore.index('reportId');
          const mediaKeysReq = mediaIndex.getAllKeys(id);

          await new Promise<void>((resolve) => {
            mediaKeysReq.onsuccess = () => {
              const keys = mediaKeysReq.result || [];
              for (const k of keys) {
                mediaStore.delete(k);
              }
              resolve();
            };
            mediaKeysReq.onerror = () => resolve();
          });

          // 3. Journal record
          const journalEntry: SyncJournalEntry = {
            id: `j_del_${Date.now()}_${id}`,
            entityType: 'report',
            entityId: id,
            action: 'delete',
            timestamp: new Date().toISOString(),
            status: 'pending'
          };
          journalStore.put(journalEntry);
        },
        `deleteReport-${id}`
      );

      return true;
    } catch (err) {
      console.error(`[IndexedDB] Error deleting report ${id}:`, err);
      return false;
    }
  }

  // ==========================================
  // MEDIA & ATTACHMENTS (ASYNC TRANSACTIONAL)
  // ==========================================

  /**
   * Stores a media asset / image blob in a queued async transaction
   */
  public async saveMediaItem(item: StoredMediaItem): Promise<boolean> {
    if (!item || !item.id || !item.reportId) {
      console.warn('[IndexedDB] Incomplete media item cannot be saved.');
      return false;
    }

    const record: StoredMediaItem = {
      ...item,
      updatedAt: new Date().toISOString()
    };

    try {
      await this.executeWriteTx(
        [STORES.MEDIA],
        async (tx, stores) => {
          const mediaStore = stores[STORES.MEDIA];
          await new Promise<void>((resolve, reject) => {
            const req = mediaStore.put(record);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
          });
        },
        `saveMediaItem-${item.id}`
      );
      return true;
    } catch (err) {
      console.error(`[IndexedDB] Error saving media ${item.id}:`, err);
      return false;
    }
  }

  /**
   * Helper to store raw blob/file for a report
   */
  public async storeImageBlob(
    reportId: string,
    imageId: string,
    fileOrBlob: Blob | File,
    metadata?: { name?: string; caption?: string; extension?: string }
  ): Promise<string> {
    const ext = metadata?.extension || (fileOrBlob instanceof File ? fileOrBlob.name.split('.').pop() : 'jpg') || 'jpg';
    const name = metadata?.name || (fileOrBlob instanceof File ? fileOrBlob.name : `image_${imageId}.${ext}`);

    const item: StoredMediaItem = {
      id: imageId,
      reportId,
      name,
      type: 'image',
      extension: ext,
      sizeBytes: fileOrBlob.size,
      sizeFormatted: `${(fileOrBlob.size / 1024).toFixed(1)} KB`,
      blob: fileOrBlob,
      caption: metadata?.caption || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await this.saveMediaItem(item);
    return URL.createObjectURL(fileOrBlob);
  }

  /**
   * Saves all attachments of a report asynchronously
   */
  public async saveReportAttachmentsAsync(reportId: string, attachments: ReportAttachment[]): Promise<void> {
    if (!attachments || attachments.length === 0) return;

    for (const att of attachments) {
      const mediaItem: StoredMediaItem = {
        id: att.id,
        reportId,
        name: att.name,
        type: att.type || 'image',
        extension: att.extension || 'jpg',
        sizeBytes: att.sizeBytes || 0,
        sizeFormatted: att.sizeFormatted || '0 KB',
        dataUrl: att.dataUrl,
        blob: att.file,
        caption: att.caption,
        createdAt: att.uploadDate || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await this.saveMediaItem(mediaItem);
    }
  }

  /**
   * Gets all media items attached to a specific report
   */
  public async getMediaForReport(reportId: string): Promise<StoredMediaItem[]> {
    if (!reportId) return [];
    try {
      return await this.executeReadTx<StoredMediaItem[]>(
        STORES.MEDIA,
        async (store) => {
          return new Promise((resolve) => {
            const index = store.index('reportId');
            const req = index.getAll(reportId);
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
          });
        },
        `getMediaForReport-${reportId}`
      );
    } catch {
      return [];
    }
  }

  /**
   * Deletes a specific media item by ID
   */
  public async deleteMedia(mediaId: string): Promise<boolean> {
    if (!mediaId) return false;
    try {
      await this.executeWriteTx(
        [STORES.MEDIA],
        async (tx, stores) => {
          stores[STORES.MEDIA].delete(mediaId);
        },
        `deleteMedia-${mediaId}`
      );
      return true;
    } catch {
      return false;
    }
  }

  // ==========================================
  // STATS & BACKUP MANAGEMENT
  // ==========================================

  /**
   * Calculates detailed storage statistics
   */
  public async getDatabaseStats(): Promise<DBStats> {
    if (!this.isAvailable()) {
      return {
        isSupported: false,
        reportsCount: 0,
        mediaCount: 0,
        journalCount: 0,
        estimatedStorageMb: 0,
        dbVersion: DB_VERSION
      };
    }

    try {
      const db = await this.getDB();
      return await new Promise<DBStats>((resolve) => {
        const tx = db.transaction([STORES.REPORTS, STORES.MEDIA, STORES.JOURNAL], 'readonly');

        const reportsCountReq = tx.objectStore(STORES.REPORTS).count();
        const mediaCountReq = tx.objectStore(STORES.MEDIA).count();
        const journalCountReq = tx.objectStore(STORES.JOURNAL).count();

        tx.oncomplete = () => {
          const reportsCount = reportsCountReq.result || 0;
          const mediaCount = mediaCountReq.result || 0;
          const journalCount = journalCountReq.result || 0;

          // Rough estimation based on records
          const estimatedMb = Number(((reportsCount * 15 + mediaCount * 120 + journalCount * 2) / 1024).toFixed(2));

          resolve({
            isSupported: true,
            reportsCount,
            mediaCount,
            journalCount,
            estimatedStorageMb: estimatedMb,
            dbVersion: db.version
          });
        };

        tx.onerror = () => {
          resolve({
            isSupported: true,
            reportsCount: 0,
            mediaCount: 0,
            journalCount: 0,
            estimatedStorageMb: 0,
            dbVersion: DB_VERSION
          });
        };
      });
    } catch {
      return {
        isSupported: true,
        reportsCount: 0,
        mediaCount: 0,
        journalCount: 0,
        estimatedStorageMb: 0,
        dbVersion: DB_VERSION
      };
    }
  }

  /**
   * Exports all data from IndexedDB into a single JSON backup string
   */
  public async exportDatabaseBackup(): Promise<string> {
    const reports = await this.getAllReports();
    const stats = await this.getDatabaseStats();

    const backupPayload = {
      version: DB_VERSION,
      appName: 'Mahash Portal IndexedDB',
      exportedAt: new Date().toISOString(),
      stats,
      reports
    };

    return JSON.stringify(backupPayload, null, 2);
  }

  /**
   * Imports data into IndexedDB safely with transaction queue
   */
  public async importDatabaseBackup(jsonString: string): Promise<{ reportsImported: number; errors: string[] }> {
    try {
      const parsed = JSON.parse(jsonString);
      const reports: ActivityReport[] = Array.isArray(parsed?.reports) ? parsed.reports : [];

      if (reports.length === 0) {
        return { reportsImported: 0, errors: ['هیچ گزارشی در فایل پشتیبان یافت نشد.'] };
      }

      const result = await this.batchSaveReports(reports);
      return {
        reportsImported: result.successCount,
        errors: result.errors
      };
    } catch (e: any) {
      return {
        reportsImported: 0,
        errors: [`خطا در تجزیه فایل پشتیبان: ${e?.message || e}`]
      };
    }
  }

  /**
   * Clears an entire store safely
   */
  public async clearStore(storeName: (typeof STORES)[keyof typeof STORES]): Promise<boolean> {
    try {
      await this.executeWriteTx(
        [storeName],
        async (tx, stores) => {
          stores[storeName].clear();
        },
        `clearStore-${storeName}`
      );
      return true;
    } catch (e) {
      console.error(`[IndexedDB] Failed to clear store ${storeName}:`, e);
      return false;
    }
  }

  /**
   * Integrated and reliable transactional duplicate cleanup method for IndexedDB stores.
   * Features robust error handling, transactional safety, and detailed debug logging.
   */
  public async cleanupDuplicateRecords(
    storeName: (typeof STORES)[keyof typeof STORES],
    uniqueKeyProp = 'id',
    compareKeyProp = 'title'
  ): Promise<{ success: boolean; removedCount: number; logs: string[] }> {
    const logs: string[] = [];
    const logMessage = (msg: string, type: 'info' | 'warn' | 'error' = 'info') => {
      const timestamp = new Date().toISOString();
      const formatted = `[IndexedDB Cleanup][${storeName}][${timestamp}] ${msg}`;
      logs.push(formatted);
      if (type === 'error') {
        console.error(formatted);
      } else if (type === 'warn') {
        console.warn(formatted);
      } else {
        console.info(formatted);
      }
    };

    if (!this.isAvailable()) {
      logMessage('IndexedDB is not available in this environment.', 'error');
      return { success: false, removedCount: 0, logs };
    }

    try {
      logMessage(`Starting duplicate record cleanup for store: ${storeName}`);

      // Step 1: Fetch all records in a read transaction
      const allRecords = await new Promise<any[]>((resolve, reject) => {
        this.getDB()
          .then((db) => {
            const tx = db.transaction([storeName], 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => reject(req.error || new Error('Failed to fetch records for cleanup'));
          })
          .catch(reject);
      });

      logMessage(`Fetched ${allRecords.length} total records from ${storeName}`);

      if (allRecords.length <= 1) {
        logMessage('Store has 0 or 1 record. No duplicates possible.');
        return { success: true, removedCount: 0, logs };
      }

      // Step 2: Identify duplicates based on uniqueKeyProp and content comparison
      const seenKeys = new Set<any>();
      const seenContent = new Map<string, any>();
      const duplicateIds: any[] = [];

      for (const record of allRecords) {
        const primaryKey = record[uniqueKeyProp];
        const contentKey = record[compareKeyProp] ? String(record[compareKeyProp]).trim().toLowerCase() : null;

        if (primaryKey !== undefined && seenKeys.has(primaryKey)) {
          duplicateIds.push(primaryKey);
          logMessage(`Found exact duplicate ID collision: ${primaryKey}`, 'warn');
        } else if (primaryKey !== undefined) {
          seenKeys.add(primaryKey);
        }

        if (contentKey && contentKey.length > 2) {
          if (seenContent.has(contentKey)) {
            const firstId = seenContent.get(contentKey);
            duplicateIds.push(primaryKey);
            logMessage(`Found content duplicate (Match on '${compareKeyProp}': '${contentKey}'). Duplicate ID: ${primaryKey}, keeping original ID: ${firstId}`, 'warn');
          } else {
            seenContent.set(contentKey, primaryKey);
          }
        }
      }

      const uniqueDuplicates = Array.from(new Set(duplicateIds));
      logMessage(`Identified ${uniqueDuplicates.length} duplicate records to purge.`);

      if (uniqueDuplicates.length === 0) {
        logMessage('No duplicates found. Database is clean.');
        return { success: true, removedCount: 0, logs };
      }

      // Step 3: Perform atomic transaction-managed deletion of identified duplicates
      await this.executeWriteTx(
        [storeName],
        async (tx, stores) => {
          const store = stores[storeName];
          for (const dupId of uniqueDuplicates) {
            await new Promise<void>((resolveDelete, rejectDelete) => {
              const delReq = store.delete(dupId);
              delReq.onsuccess = () => {
                logMessage(`Successfully purged duplicate record with ID: ${dupId}`);
                resolveDelete();
              };
              delReq.onerror = () => {
                const err = delReq.error || new Error(`Failed to delete record ${dupId}`);
                logMessage(`Error purging duplicate ID ${dupId}: ${err.message}`, 'error');
                rejectDelete(err);
              };
            });
          }
        },
        `cleanupDuplicates-${storeName}`
      );

      logMessage(`Successfully completed duplicate cleanup for ${storeName}. Removed ${uniqueDuplicates.length} items.`);
      return { success: true, removedCount: uniqueDuplicates.length, logs };
    } catch (e: any) {
      logMessage(`Fatal error during duplicate cleanup transaction: ${e?.message || e}`, 'error');
      console.error('[IndexedDB Cleanup Fatal Stack]', e);
      return { success: false, removedCount: 0, logs };
    }
  }
}

// Singleton Instance
export const indexedDBService = new IndexedDBManager();
