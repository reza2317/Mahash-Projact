/**
 * Persistent Attachments Storage for Mahash Reports
 * Handles JPG, PNG, PDF, Word, Excel, ZIP and other file formats via IndexedDB and DataURLs.
 */
import { ReportAttachment } from '../types';
import { toPersianDigits } from './persianDate';

const DB_NAME = 'MahashAttachmentsDB';
const DB_VERSION = 1;
const STORE_NAME = 'attachments';

interface StoredAttachmentRecord {
  id: string;
  reportId: string;
  name: string;
  type: string;
  extension: string;
  sizeBytes: number;
  sizeFormatted: string;
  blob?: Blob;
  dataUrl?: string;
  caption?: string;
  createdAt: string;
}

function openAttachmentsDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('reportId', 'reportId', { unique: false });
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

/**
 * Format file size with appropriate unit (KB / MB) and Persian digits
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${toPersianDigits(bytes)} بایت`;
  } else if (bytes < 1024 * 1024) {
    const kb = (bytes / 1024).toFixed(1);
    return `${toPersianDigits(kb)} کیلوبایت`;
  } else {
    const mb = (bytes / (1024 * 1024)).toFixed(1);
    return `${toPersianDigits(mb)} مگابایت`;
  }
}

/**
 * Detects attachment category based on extension and MIME type
 */
export function detectAttachmentType(fileName: string, mimeType?: string): ReportAttachment['type'] {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'avif'].includes(ext) || mimeType?.startsWith('image/')) {
    return 'image';
  }
  if (ext === 'pdf' || mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (['doc', 'docx', 'rtf', 'odt'].includes(ext) || mimeType?.includes('word')) {
    return 'word';
  }
  if (['xls', 'xlsx', 'csv'].includes(ext) || mimeType?.includes('sheet') || mimeType?.includes('excel')) {
    return 'excel';
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType?.includes('zip') || mimeType?.includes('compressed')) {
    return 'archive';
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext) || mimeType?.startsWith('audio/')) {
    return 'audio';
  }
  if (['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext) || mimeType?.startsWith('video/')) {
    return 'video';
  }
  return 'file';
}

/**
 * Convert a File or Blob into base64 DataURL
 */
export function readFileAsDataURL(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/**
 * Save attachment record to IndexedDB
 */
export async function saveAttachmentRecord(
  reportId: string,
  attachment: ReportAttachment,
  blobOrFile?: File | Blob
): Promise<void> {
  try {
    const db = await openAttachmentsDB();
    return new Promise((resolve) => {
      try {
        const tx = db.transaction([STORE_NAME], 'readwrite');
        const store = tx.objectStore(STORE_NAME);

        const record: StoredAttachmentRecord = {
          id: attachment.id,
          reportId,
          name: attachment.name,
          type: attachment.type,
          extension: attachment.extension,
          sizeBytes: attachment.sizeBytes || 0,
          sizeFormatted: attachment.sizeFormatted,
          blob: blobOrFile,
          dataUrl: attachment.dataUrl,
          caption: attachment.caption,
          createdAt: new Date().toISOString()
        };

        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => resolve();
        tx.onerror = () => resolve();
        tx.onabort = () => resolve();
      } catch (innerErr) {
        console.warn('saveAttachmentRecord inner error:', innerErr);
        resolve();
      }
    });
  } catch (err) {
    console.warn('Failed to save attachment to IndexedDB:', err);
    return Promise.resolve();
  }
}

/**
 * Retrieve all attachments for a specific report from IndexedDB
 */
export async function getAttachmentsFromDB(reportId: string): Promise<ReportAttachment[]> {
  try {
    const db = await openAttachmentsDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('reportId');
      const req = index.getAll(reportId);

      req.onsuccess = () => {
        const records: StoredAttachmentRecord[] = req.result || [];
        const result: ReportAttachment[] = records.map((rec) => {
          let dataUrl = rec.dataUrl;
          if (!dataUrl && rec.blob) {
            dataUrl = URL.createObjectURL(rec.blob);
          }
          return {
            id: rec.id,
            name: rec.name,
            type: rec.type as ReportAttachment['type'],
            extension: rec.extension,
            sizeFormatted: rec.sizeFormatted,
            sizeBytes: rec.sizeBytes,
            dataUrl,
            caption: rec.caption
          };
        });
        resolve(result);
      };

      req.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn('Failed to get attachments from IndexedDB:', err);
    return [];
  }
}

/**
 * Delete a specific attachment
 */
export async function deleteAttachmentFromDB(attachmentId: string): Promise<void> {
  try {
    const db = await openAttachmentsDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(attachmentId);
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to delete attachment from IndexedDB:', err);
  }
}

/**
 * Delete all attachments for a report
 */
export async function deleteAllAttachmentsForReport(reportId: string): Promise<void> {
  try {
    const db = await openAttachmentsDB();
    return new Promise((resolve) => {
      const tx = db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('reportId');
      const req = index.getAllKeys(reportId);

      req.onsuccess = () => {
        const keys = req.result || [];
        keys.forEach((key) => store.delete(key));
        resolve();
      };
      req.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('Failed to delete all attachments for report:', err);
  }
}
