import { syncKVToMemory } from './storage';

export const syncToWordPressAPI = async (action: string, _payload?: any) => {
  if (typeof window === 'undefined') return;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const res = await fetch('/api/wp/sync-all', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, timestamp: Date.now() }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      console.log(`[SyncService] Successfully synced to WordPress DB for action: ${action}`);
      // Refresh local cache (IndexedDB) to ensure data accuracy
      await syncKVToMemory();
    } else {
      console.warn(`[SyncService] WordPress DB sync responded with status: ${res.status}`);
    }
  } catch (err: any) {
    console.warn(`[SyncService] WordPress DB sync notice (offline or local server busy):`, err?.message || err);
  }
};
