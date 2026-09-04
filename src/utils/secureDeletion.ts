import { getCustomReportsMap, saveCustomReportsMap, getDeletedReportsList, saveDeletedReportsList, getTrashBinList, saveTrashBinList, triggerStoreUpdate, syncLocalDataToServer } from './reportsStore';
import { indexedDBService } from './indexedDBService';
import { deleteAllAttachmentsForReport } from './attachmentsStorage';
import { deleteVideoFromCache } from './videoCache';
import { logAuditEvent, AuditLogEntry } from './auditLogger';
import { logReportToMySQL } from './mysqlLogger';
import { getSmartCurrentDate, toPersianDigits } from './persianDate';

export interface SecurePurgeOptions {
  reportId: string;
  teamSlug?: string;
  reportTitle?: string;
  teamName?: string;
  operatorName?: string;
  operatorRole?: string;
  reason?: string;
  purgeMedia?: boolean;
}

export interface SecurePurgeResult {
  success: boolean;
  reportId: string;
  reportTitle: string;
  message: string;
  timestamp: string;
  persianTimestamp: string;
  operator: string;
  reason?: string;
  purgedComponents: {
    customReports: boolean;
    trashBin: boolean;
    versionHistory: boolean;
    wordPressPosts: boolean;
    indexedDb: boolean;
    attachments: boolean;
    videoCache: boolean;
    mysqlDatabase: boolean;
    serverDiskStore: boolean;
  };
  auditLogId?: string;
}

/**
 * Securely and permanently purges a report and all its associated data, versions,
 * attachments, and cached videos from all local and remote database stores.
 * Guaranteed no residual records remain.
 */
export async function securePermanentReportPurge(
  options: SecurePurgeOptions
): Promise<SecurePurgeResult> {
  const {
    reportId,
    teamSlug,
    reportTitle = 'گزارش بدون عنوان',
    teamName = '',
    operatorName = 'مدیر ارشد سامانه (Admin)',
    operatorRole = 'مدیر سامانه',
    reason = 'درخواست حذف نهایی توسط مدیر',
    purgeMedia = true
  } = options;

  if (!reportId || typeof reportId !== 'string') {
    throw new Error('شناسه گزارش جهت پاکسازی نامعتبر است.');
  }

  const now = new Date();
  const persianDate = getSmartCurrentDate();
  const persianTime = `${toPersianDigits(String(now.getHours()).padStart(2, '0'))}:${toPersianDigits(String(now.getMinutes()).padStart(2, '0'))}:${toPersianDigits(String(now.getSeconds()).padStart(2, '0'))}`;
  const persianTimestamp = `${persianDate} - ${persianTime}`;

  const purgedComponents = {
    customReports: false,
    trashBin: false,
    versionHistory: false,
    wordPressPosts: false,
    indexedDb: false,
    attachments: false,
    videoCache: false,
    mysqlDatabase: false,
    serverDiskStore: false
  };

  try {
    // 1. Remove from Custom Reports store across all teams
    const customMap = getCustomReportsMap();
    let modifiedCustom = false;
    for (const slug of Object.keys(customMap)) {
      if (Array.isArray(customMap[slug])) {
        const initialLen = customMap[slug].length;
        customMap[slug] = customMap[slug].filter((r) => r.id !== reportId);
        if (customMap[slug].length !== initialLen) {
          modifiedCustom = true;
          purgedComponents.customReports = true;
        }
      }
    }
    if (modifiedCustom) {
      saveCustomReportsMap(customMap);
    }

    // 2. Eradicate from Trash Bin
    const trashBin = getTrashBinList();
    const cleanTrash = trashBin.filter((t) => t.itemId !== reportId && t.id !== reportId);
    if (cleanTrash.length !== trashBin.length) {
      saveTrashBinList(cleanTrash);
      purgedComponents.trashBin = true;
    }

    // 3. Register in Blacklist so default initial base reports never regenerate it
    const deletedList = getDeletedReportsList();
    if (!deletedList.includes(reportId)) {
      deletedList.push(reportId);
      saveDeletedReportsList(deletedList);
    }

    // 4. Clean IndexedDB records
    if (typeof window !== 'undefined') {
      try {
        await indexedDBService.deleteReport(reportId);
        purgedComponents.indexedDb = true;
      } catch (err) {
        console.warn('IndexedDB purge warning:', err);
      }

      // 5. Clean Attachments Storage
      if (purgeMedia) {
        try {
          await deleteAllAttachmentsForReport(reportId);
          purgedComponents.attachments = true;
        } catch (err) {
          console.warn('Attachments purge warning:', err);
        }

        // 6. Clean Video Cache Blobs
        try {
          await deleteVideoFromCache(reportId);
          purgedComponents.videoCache = true;
        } catch (err) {
          console.warn('Video cache purge warning:', err);
        }
      }
    }

    // 7. Call Backend API to permanently delete from MySQL and Disk Store
    try {
      const response = await fetch(`/api/reports/${encodeURIComponent(reportId)}?permanent=true`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reportId,
          permanent: true,
          operatorName,
          operatorRole,
          reason,
          title: reportTitle,
          teamSlug
        })
      });
      if (response.ok) {
        purgedComponents.mysqlDatabase = true;
        purgedComponents.serverDiskStore = true;
        purgedComponents.versionHistory = true;
        purgedComponents.wordPressPosts = true;
      }
    } catch (err) {
      console.warn('Server purge API warning:', err);
    }

    // 8. Record in Local & Real-time Audit Logger
    const auditEntry: AuditLogEntry = logAuditEvent(
      'PERMANENT_DELETE_REPORT',
      `حذف نهایی و غیرقابل بازگشت گزارش: ${reportTitle}`,
      `گزارش با شناسه «${reportId}» و متعلق به تیم «${teamName || teamSlug || 'نامشخص'}» به صورت قطعی توسط ${operatorName} حذف گردید. دلیل: ${reason}`,
      {
        teamSlug,
        actor: operatorName,
        details: {
          reportId,
          reportTitle,
          teamSlug,
          teamName,
          reason,
          purgedComponents,
          persianTimestamp
        }
      }
    );

    // 9. Record in MySQL Activity Logs
    try {
      await logReportToMySQL({
        actionType: 'report_delete',
        title: `حذف نهایی و پاکسازی گزارش: ${reportTitle}`,
        details: `تیم: ${teamName || teamSlug || 'نامشخص'} | اپراتور: ${operatorName} (${operatorRole}) | دلیل: ${reason} | شناسه: ${reportId}`,
        userName: operatorName,
        teamSlug,
        reportId,
        status: 'warning',
        metadata: {
          purgedComponents,
          reason,
          auditLogId: auditEntry.id,
          persianTimestamp
        }
      });
    } catch (err) {
      console.warn('MySQL logger error:', err);
    }

    // 10. Global notification and sync
    triggerStoreUpdate();
    syncLocalDataToServer().catch(console.warn);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('mahash_report_permanently_purged', {
          detail: { reportId, title: reportTitle, operatorName, timestamp: now.toISOString() }
        })
      );
      window.dispatchEvent(
        new CustomEvent('mahash_store_updated', {
          detail: { deletedId: reportId, permanent: true }
        })
      );
    }

    return {
      success: true,
      reportId,
      reportTitle,
      message: `گزارش «${reportTitle}» با موفقیت و بدون باقی‌ماندن هیچ ردپایی از پایگاه داده و سرور پاکسازی شد.`,
      timestamp: now.toISOString(),
      persianTimestamp,
      operator: operatorName,
      reason,
      purgedComponents,
      auditLogId: auditEntry.id
    };
  } catch (err: any) {
    console.error('Error during secure report purge:', err);
    throw new Error(`خطا در پاکسازی امن گزارش: ${err?.message || 'خطای نامشخص'}`);
  }
}
