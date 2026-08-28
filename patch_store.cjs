const fs = require('fs');
let code = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

// Replace console.time with performance.now profiling
const searchSyncStart = `        // Cache cleanup
        console.time('Sync: Cache Cleanup');`;
const replaceSyncStart = `        // Cache cleanup
        const pStart = performance.now();
        let stepStart = performance.now();
        const profile = (name) => {
            const now = performance.now();
            console.log(\`[Profile] \${name}: \${(now - stepStart).toFixed(2)}ms\`);
            stepStart = now;
        };`;
code = code.replace(searchSyncStart, replaceSyncStart);

// Let's modify the whole method to use profile()
code = code.replace(`        console.timeEnd('Sync: Cache Cleanup');`, `        profile('Cache Cleanup');`);
code = code.replace(`        console.time('Sync: Processing Reports');`, ``);
code = code.replace(`        console.timeEnd('Sync: Processing Reports');`, `        profile('Processing Reports');`);
code = code.replace(`        console.time('Sync: Assemble Payload');`, ``);
code = code.replace(`        console.timeEnd('Sync: Assemble Payload');`, `        profile('Assemble Payload');`);
code = code.replace(`        console.time('Sync: Upload Data');`, `        const uploadStart = performance.now();`);
code = code.replace(`        console.timeEnd('Sync: Upload Data');`, `        console.log(\`[Profile] Total Upload Data time: \${(performance.now() - uploadStart).toFixed(2)}ms\`);\n        console.log(\`[Profile] Total Sync time: \${(performance.now() - pStart).toFixed(2)}ms\`);`);

// And for the upload loop:
const uploadLoopSearch = `        // Process uploads in parallel (Promise.all) but track progress responsively
        const uploadPromises = keys.map(async (k, i) => {
            const dataToSave = (payload as any)[k];
            
            // Yield to main thread initially to prevent synchronous blocking at start
            await yieldToMain();
            
            console.time(\`Sync: Upload chunk \${k}\`);
            const result = await saveToFirebaseStore(k, dataToSave);
            console.timeEnd(\`Sync: Upload chunk \${k}\`);
            
            completed++;
            if (onProgress) onProgress(40 + Math.round((completed / total) * 50), \`در حال ارسال اطلاعات... (\${completed} از \${total} بسته)\`);
            return result;
        });
        
        await Promise.all(uploadPromises);`;

const uploadLoopReplace = `        // Process uploads with a concurrency queue (e.g. 3 at a time) to prevent blocking
        const MAX_CONCURRENCY = 2;
        let currentIndex = 0;
        
        const worker = async () => {
            while (currentIndex < keys.length) {
                const i = currentIndex++;
                const k = keys[i];
                const dataToSave = (payload as any)[k];
                
                await yieldToMain();
                const chunkStart = performance.now();
                
                if (onProgress) onProgress(40 + Math.round((completed / total) * 50), \`در حال پردازش \${k} (\${completed} از \${total})...\`);
                
                const result = await saveToFirebaseStore(k, dataToSave);
                
                console.log(\`[Profile] Upload chunk \${k}: \${(performance.now() - chunkStart).toFixed(2)}ms\`);
                completed++;
                if (onProgress) onProgress(40 + Math.round((completed / total) * 50), \`بسته \${k} با موفقیت ارسال شد.\`);
            }
        };
        
        const workers = Array(Math.min(MAX_CONCURRENCY, keys.length)).fill(null).map(() => worker());
        await Promise.all(workers);`;
        
code = code.replace(uploadLoopSearch, uploadLoopReplace);

// Implement 30 days cache cleanup
const cacheCleanupSearch = `            } else if (k.startsWith('mahash_team_logo_')) {
               const shortId = k.replace('mahash_team_logo_', '');
               if (!['team-thinker', 'team-tomorrow', 'team-angels', 'team-ghorbani', 'team-silence', 'thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'].includes(shortId)) {
                   localStorage.removeItem(k);
               }
            }`;
            
const cacheCleanupReplace = `            } else if (k.startsWith('mahash_')) {
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
                                console.log(\`[Cleanup] Removed stale cache: \${k}\`);
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
                 }
               }
            }`;

code = code.replace(cacheCleanupSearch, cacheCleanupReplace);

fs.writeFileSync('src/utils/reportsStore.ts', code);
