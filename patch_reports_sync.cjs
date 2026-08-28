const fs = require('fs');
let code = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

const s1 = `        if (onProgress) onProgress(5, 'پاکسازی کش‌های قدیمی و بلااستفاده...');
        
        // Cache cleanup
        const pStart = performance.now();
        let stepStart = performance.now();
        const profile = (name) => {
            const now = performance.now();
            console.log(\`[Profile] \${name}: \${(now - stepStart).toFixed(2)}ms\`);
            stepStart = now;
        };
        try {
          const keys = Object.keys(localStorage);
          for (let i = 0; i < keys.length; i++) {
            if (i % 20 === 0) await yieldToMain();
            const k = keys[i];
            if (k.startsWith('firebase_sync_hash_') && !k.includes('part')) {
               // keep these
            } else if (k.startsWith('mahash_')) {
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
            }
          }
        } catch(e) {}
        profile('Cache Cleanup');
        if (onProgress) onProgress(15, 'جمع‌آوری و تجمیع اطلاعات لوگوها و تصاویر تیم‌ها...');`;

const r1 = `        const pStart = performance.now();
        let stepStart = performance.now();
        const profile = (name) => {
            const now = performance.now();
            console.log(\`[Profile] \${name}: \${(now - stepStart).toFixed(2)}ms\`);
            stepStart = now;
        };

        if (onProgress) onProgress(5, 'پاکسازی کش‌های قدیمی و بلااستفاده...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 5, message: 'پاکسازی کش‌های قدیمی و بلااستفاده...' });
        
        await runGarbageCollection();
        profile('Cache Cleanup');
        
        if (onProgress) onProgress(15, 'جمع‌آوری و تجمیع اطلاعات لوگوها و تصاویر تیم‌ها...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 15, message: 'جمع‌آوری و تجمیع اطلاعات لوگوها و تصاویر تیم‌ها...' });`;

code = code.replace(s1, r1);

// Add imports
code = "import { runGarbageCollection } from './cleanupUtils';\nimport { globalEventBus } from './eventBus';\n" + code;

const search2 = `        if (onProgress) onProgress(25, 'آماده‌سازی گزارش‌ها و امتیازات...');`;
const replace2 = `        if (onProgress) onProgress(25, 'آماده‌سازی گزارش‌ها و امتیازات...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 25, message: 'آماده‌سازی گزارش‌ها و امتیازات...' });`;
code = code.replace(search2, replace2);

const search3 = `        if (onProgress) onProgress(35, 'فشرده‌سازی اطلاعات و آماده‌سازی برای ارسال شبکه...');`;
const replace3 = `        if (onProgress) onProgress(35, 'فشرده‌سازی اطلاعات و آماده‌سازی برای ارسال شبکه...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 35, message: 'فشرده‌سازی اطلاعات و آماده‌سازی برای ارسال شبکه...' });`;
code = code.replace(search3, replace3);

const search4 = `        if (onProgress) onProgress(40, 'شروع ارتباط با سرور ابری Firebase...');`;
const replace4 = `        if (onProgress) onProgress(40, 'شروع ارتباط با سرور ابری Firebase...');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 40, message: 'شروع ارتباط با سرور ابری Firebase...' });`;
code = code.replace(search4, replace4);

const search5 = `                if (onProgress) onProgress(40 + Math.round((completed / total) * 50), \`در حال پردازش \${k} (\${completed} از \${total})...\`);`;
const replace5 = `                const p = 40 + Math.round((completed / total) * 50);
                if (onProgress) onProgress(p, \`در حال پردازش \${k} (\${completed} از \${total})...\`);
                globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: p, message: \`در حال پردازش \${k} (\${completed} از \${total})...\` });`;
code = code.replace(search5, replace5);

const search6 = `        if (onProgress) onProgress(100, 'عملیات با موفقیت به پایان رسید.');
        await yieldToMain();
        resolversToCall.forEach(res => res(true));`;
const replace6 = `        if (onProgress) onProgress(100, 'عملیات با موفقیت به پایان رسید.');
        globalEventBus.emit('SYNC_PROGRESS', { visible: true, progress: 100, message: 'عملیات با موفقیت به پایان رسید.' });
        await yieldToMain();
        setTimeout(() => globalEventBus.emit('SYNC_PROGRESS', { visible: false }), 2000);
        resolversToCall.forEach(res => res(true));`;
code = code.replace(search6, replace6);

const search7 = `        console.warn('[reportsStore] Failed to sync data to Firebase:', err);
        resolversToCall.forEach(res => res(false));`;
const replace7 = `        console.warn('[reportsStore] Failed to sync data to Firebase:', err);
        globalEventBus.emit('SYNC_PROGRESS', { visible: false });
        resolversToCall.forEach(res => res(false));`;
code = code.replace(search7, replace7);


fs.writeFileSync('src/utils/reportsStore.ts', code);
