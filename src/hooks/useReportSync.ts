
import { useState, useCallback } from 'react';
import { ActivityReport, TeamData, ReportDraft } from '../types';
import { 
  saveReport, 
  getAllReports, 
  getAllTeams, 
  triggerGlobalCacheBust, 
  persistReportDirectlyToServerWithConfirmation,
  saveDraft, 
  deleteDraft,
  getSavedDrafts 
} from '../utils/reportsStore';

export function useReportSync() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [lastServerTimestamp, setLastServerTimestamp] = useState<string | null>(null);

  const syncReportData = useCallback(async (
    reportObject: ActivityReport,
    selectedTeamSlug: string,
    onSuccess: (freshReports: any[], freshTeams: Record<string, TeamData>) => void,
    options?: { keepVideoAttachment?: boolean; asDraft?: boolean; draftId?: string }
  ) => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      if (options?.asDraft) {
        // Save as Draft (local draft storage)
        const draft: ReportDraft = {
          id: options.draftId || `draft_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          reportId: reportObject.id,
          teamSlug: selectedTeamSlug,
          reportFormat: reportObject.reportType || 'hybrid',
          title: reportObject.title,
          date: reportObject.date,
          reportNum: reportObject.reportNum,
          subhead: reportObject.subhead || '',
          summary: reportObject.summary,
          keyPoints: reportObject.keyPoints || [],
          pdfUrl: reportObject.pdfUrl,
          pdfLabel: reportObject.pdfLabel,
          videoSrc: reportObject.videoSrc,
          videoHint: reportObject.videoHint,
          posterSrc: reportObject.posterSrc,
          transcript: reportObject.transcript,
          images: reportObject.images,
          attachments: reportObject.attachments,
          keepVideoAttachment: options.keepVideoAttachment ?? reportObject.keepVideoAttachment,
          status: 'draft',
          updatedAt: Date.now()
        };
        saveDraft(draft);
      } else {
        // 1. Definitively commit to Database Server FIRST and await confirmation
        const serverConfirmation = await persistReportDirectlyToServerWithConfirmation(
          reportObject,
          selectedTeamSlug,
          { keepVideoAttachment: options?.keepVideoAttachment }
        );

        if (!serverConfirmation.success) {
          throw new Error('پایگاه داده سرور موفقیت عملیات ذخیره را تأیید نکرد.');
        }

        if (serverConfirmation.serverUpdatedAt) {
          setLastServerTimestamp(serverConfirmation.serverUpdatedAt);
        }

        // 2. If it was a draft being published, clean up draft record
        if (options?.draftId) {
          deleteDraft(options.draftId);
        }
      }

      // 3. Invalidate client caches and fetch fresh immutable arrays
      triggerGlobalCacheBust();
      const freshReports = getAllReports();
      const freshTeams = getAllTeams();
      
      // 4. Update parent component state with server-acknowledged data
      onSuccess(freshReports, freshTeams);

      // 5. Mark success state only after server confirmation
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 5000);
    } catch (error: any) {
      console.error('[useReportSync] Failed to sync report to database:', error);
      setSaveSuccess(false);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { isSaving, saveSuccess, lastServerTimestamp, syncReportData };
}
