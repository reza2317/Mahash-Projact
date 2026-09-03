
import { useState, useCallback } from 'react';
import { ActivityReport, TeamData, ReportDraft } from '../types';
import { 
  saveReport, 
  getAllReports, 
  getAllTeams, 
  triggerGlobalCacheBust, 
  syncLocalDataToServer, 
  saveDraft, 
  deleteDraft,
  getSavedDrafts 
} from '../utils/reportsStore';

export function useReportSync() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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
        // Save as Draft
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
        // If it was a draft being published, clean up draft record
        if (options?.draftId) {
          deleteDraft(options.draftId);
        }
        // 1. Immediate local storage update with schema enforcement
        saveReport(reportObject, selectedTeamSlug, { keepVideoAttachment: options?.keepVideoAttachment });
      }

      triggerGlobalCacheBust();
      
      // 2. Fetch fresh state based on immutable arrays
      const freshReports = getAllReports();
      const freshTeams = getAllTeams();
      
      // 3. Update parent component state to trigger re-render
      onSuccess(freshReports, freshTeams);

      // 4. Server sync (run asynchronously in the background so UI save completes instantly)
      if (!options?.asDraft) {
        syncLocalDataToServer().catch((err) => {
          console.warn('[useReportSync] Background server sync warning:', err);
        });
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (error) {
      console.error('Failed to sync report:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, []);

  return { isSaving, saveSuccess, syncReportData };
}
