import { yieldToMain } from './firebaseSync';
import { appProfiler } from './profiler';
import { globalEventBus } from './eventBus';

export async function runGarbageCollection() {
  if (typeof window === 'undefined') return;
  
  appProfiler.start('Garbage Collection');
  globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 5, message: 'در حال پاکسازی هوشمند حافظه نهان (Garbage Collection)...' });
  
  try {
    const keys = Object.keys(localStorage);
    
    // We will process in batches to not block the main thread
    for (let i = 0; i < keys.length; i++) {
      if (i % 50 === 0) {
          await yieldToMain();
      }
      
      const k = keys[i];
      if (k.startsWith('firebase_sync_hash_') && !k.includes('part')) {
         // Keep hash keys
         continue;
      }
      
      if (k.startsWith('mahash_')) {
        // 30 days cleanup logic
        try {
            const val = localStorage.getItem(k);
            if (val && val.startsWith('{')) {
                const parsed = JSON.parse(val);
                // Check if it has a date/timestamp and is older than 30 days
                if (parsed.updatedAt || parsed.date || parsed.timestamp) {
                    const dateStr = parsed.updatedAt || parsed.date || parsed.timestamp;
                    const dateObj = new Date(dateStr);
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    
                    if (dateObj < thirtyDaysAgo) {
                        localStorage.removeItem(k);
                        console.log(`[Cleanup] Removed stale 30-day cache: ${k}`);
                        continue;
                    }
                }
            }
        } catch(e) {}
        
       // Cleanup old logos logic
       if (k.startsWith('mahash_team_logo_')) {
         const shortId = k.replace('mahash_team_logo_', '');
         if (!['team-thinker', 'team-tomorrow', 'team-angels', 'team-ghorbani', 'team-silence', 'thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'].includes(shortId)) {
             localStorage.removeItem(k);
             console.log(`[Cleanup] Removed stale team logo: ${k}`);
         }
       }
      }
    }
  } catch (err) {
    console.error('Garbage collection failed:', err);
  }
  
  appProfiler.end('Garbage Collection');
}
