
import { useState, useCallback } from 'react';
import { ActivityReport, TeamData } from '../types';
import { saveReport, getAllReports, getAllTeams, triggerGlobalCacheBust, syncLocalDataToServer } from '../utils/reportsStore';

export function useReportSync() {
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const syncReportData = useCallback(async (
    reportObject: ActivityReport,
    selectedTeamSlug: string,
    onSuccess: (freshReports: any[], freshTeams: Record<string, TeamData>) => void
  ) => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      // 1. Immediate local storage update (using immutability inside saveReport)
      saveReport(reportObject, selectedTeamSlug);
      triggerGlobalCacheBust();
      
      // 2. Fetch fresh state based on immutable arrays
      const freshReports = getAllReports();
      console.log('SYNC: fetched fresh reports', freshReports.find(r => r.id === reportObject.id)?.date);
      const freshTeams = getAllTeams();
      
      // 3. Update parent component state to trigger re-render
      onSuccess(freshReports, freshTeams);

      // 4. Background server sync (Don't await to avoid UI lockup)
      syncLocalDataToServer().catch(err => console.warn('Background sync failed', err));
      
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
