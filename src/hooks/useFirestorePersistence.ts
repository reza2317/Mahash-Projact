import { useState, useCallback, useRef } from 'react';
import {
  saveLogoToFirestore,
  getLogoFromFirestore,
  saveMahashLogoToFirestore,
  getMahashLogoFromFirestore,
  saveYouthClubEmblemToFirestore,
  getYouthClubEmblemFromFirestore,
  savePreferencesToFirestore,
  getPreferencesFromFirestore
} from '../utils/firestorePersistence';
import { UserPreferences } from '../types';
import { saveTeamLogo, setMahashLogo, setYouthClubBadge } from '../utils/reportsStore';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

export function useFirestorePersistence() {
  const [syncStatus, setSyncStatus] = useState<SyncState>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const setStatusTemporarily = useCallback((status: SyncState, errorMsg?: string) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setSyncStatus(status);
    if (errorMsg) {
      setSyncError(errorMsg);
    } else {
      setSyncError(null);
    }

    if (status === 'synced') {
      setLastSyncedAt(new Date());
      timerRef.current = setTimeout(() => {
        setSyncStatus('idle');
      }, 3500);
    }
  }, []);

  const saveTeamLogoDirect = useCallback(async (teamIdOrSlug: string, logoDataUrl: string): Promise<boolean> => {
    if (!teamIdOrSlug || !logoDataUrl) return false;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      // 1. Save in synchronous in-memory / local state
      saveTeamLogo(teamIdOrSlug, logoDataUrl);

      // 2. Persist to MySQL database
      const success = await saveLogoToFirestore(teamIdOrSlug, logoDataUrl);
      if (success) {
        setStatusTemporarily('synced');
        return true;
      } else {
        setStatusTemporarily('error', 'خطا در همگام‌سازی با پایگاه داده MySQL');
        return false;
      }
    } catch (err: any) {
      console.error('Failed to save team logo to MySQL:', err);
      setStatusTemporarily('error', err?.message || 'خطا در ارتباط با دیتابیس MySQL');
      return false;
    }
  }, [setStatusTemporarily]);

  const saveMahashLogoDirect = useCallback(async (logoDataUrl: string): Promise<boolean> => {
    if (!logoDataUrl) return false;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      setMahashLogo(logoDataUrl);
      const success = await saveMahashLogoToFirestore(logoDataUrl);
      if (success) {
        setStatusTemporarily('synced');
        return true;
      } else {
        setStatusTemporarily('error', 'خطا در ذخیره لوگوی ماهش در دیتابیس MySQL');
        return false;
      }
    } catch (err: any) {
      console.error('Failed to save Mahash logo to MySQL:', err);
      setStatusTemporarily('error', err?.message || 'خطا در ارتباط با دیتابیس MySQL');
      return false;
    }
  }, [setStatusTemporarily]);

  const saveYouthClubBadgeDirect = useCallback(async (badgeDataUrl: string): Promise<boolean> => {
    if (!badgeDataUrl) return false;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      setYouthClubBadge(badgeDataUrl);
      const success = await saveYouthClubEmblemToFirestore(badgeDataUrl);
      if (success) {
        setStatusTemporarily('synced');
        return true;
      } else {
        setStatusTemporarily('error', 'خطا در ذخیره نشان باشگاه در دیتابیس MySQL');
        return false;
      }
    } catch (err: any) {
      console.error('Failed to save Youth Club badge to MySQL:', err);
      setStatusTemporarily('error', err?.message || 'خطا در ارتباط با دیتابیس MySQL');
      return false;
    }
  }, [setStatusTemporarily]);

  const savePreferencesDirect = useCallback(async (prefs: UserPreferences): Promise<boolean> => {
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const success = await savePreferencesToFirestore(prefs);
      if (success) {
        setStatusTemporarily('synced');
        return true;
      } else {
        setStatusTemporarily('error', 'خطا در ذخیره تنظیمات کاربری در دیتابیس MySQL');
        return false;
      }
    } catch (err: any) {
      console.error('Failed to save preferences to MySQL:', err);
      setStatusTemporarily('error', err?.message || 'خطا در ذخیره تنظیمات در MySQL');
      return false;
    }
  }, [setStatusTemporarily]);

  return {
    syncStatus,
    isSyncing: syncStatus === 'syncing',
    isSynced: syncStatus === 'synced',
    isError: syncStatus === 'error',
    syncError,
    lastSyncedAt,
    saveTeamLogoDirect,
    saveMahashLogoDirect,
    saveYouthClubBadgeDirect,
    savePreferencesDirect,
    getLogoFromFirestore,
    getMahashLogoFromFirestore,
    getYouthClubEmblemFromFirestore,
    getPreferencesFromFirestore
  };
}
