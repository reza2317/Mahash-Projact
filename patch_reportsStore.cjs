const fs = require('fs');
let code = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

// 1. Add yield helper
if (!code.includes('const yieldToMain')) {
  code = code.replace(
    "export async function syncLocalDataToServer",
    "const yieldToMain = () => new Promise(r => setTimeout(r, 10));\n\nexport async function syncLocalDataToServer"
  );
}

// 2. Add signature
code = code.replace(
  "export async function syncLocalDataToServer(): Promise<boolean> {",
  "export async function syncLocalDataToServer(onProgress?: (progress: number, step: string) => void): Promise<boolean> {"
);

// 3. Update the timeout logic to pass onProgress
code = code.replace(
  "    if (syncTimeout) clearTimeout(syncTimeout);\n    syncTimeout = setTimeout(async () => {\n      const resolversToCall = [...pendingResolvers];\n      pendingResolvers = [];\n      try {",
  `    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      const resolversToCall = [...pendingResolvers];
      pendingResolvers = [];
      try {
        if (onProgress) onProgress(5, 'پاکسازی کش‌های قدیمی و بلااستفاده...');
        
        // Cache cleanup
        console.time('Sync: Cache Cleanup');
        try {
          const keys = Object.keys(localStorage);
          for (let i = 0; i < keys.length; i++) {
            if (i % 20 === 0) await yieldToMain();
            const k = keys[i];
            if (k.startsWith('firebase_sync_hash_') && !k.includes('part')) {
               // keep these
            } else if (k.startsWith('mahash_team_logo_')) {
               const shortId = k.replace('mahash_team_logo_', '');
               if (!['team-thinker', 'team-tomorrow', 'team-angels', 'team-ghorbani', 'team-silence', 'thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'].includes(shortId)) {
                   localStorage.removeItem(k);
               }
            }
          }
        } catch(e) {}
        console.timeEnd('Sync: Cache Cleanup');
        if (onProgress) onProgress(15, 'جمع‌آوری و تجمیع اطلاعات لوگوها و تصاویر تیم‌ها...');
        await yieldToMain();`
);

code = code.replace(
  `        const keys = Object.keys(payload);\n        const promises = keys.map(k => saveToFirebaseStore(k, (payload as any)[k]));\n        await Promise.all(promises);`,
  `        const keys = Object.keys(payload);
        
        let completed = 0;
        const total = keys.length;
        
        console.time('Sync: Upload Data');
        
        // We do not want to use Promise.all to map them blindly because we want to report progress
        // And we want to stagger them slightly so the browser doesn't freeze
        const results = [];
        for (let i = 0; i < keys.length; i++) {
            const k = keys[i];
            const dataToSave = (payload as any)[k];
            
            // Log timing for each chunk
            if (onProgress) onProgress(40 + Math.round((i / total) * 50), \`در حال ارسال بسته \${i+1} از \${total} (\${k})...\`);
            console.time(\`Sync: Upload chunk \${k}\`);
            
            // Yield to main thread before heavy processing in saveToFirebaseStore
            await yieldToMain();
            const result = await saveToFirebaseStore(k, dataToSave);
            
            console.timeEnd(\`Sync: Upload chunk \${k}\`);
            results.push(result);
            completed++;
            if (onProgress) onProgress(40 + Math.round((completed / total) * 50), \`بسته \${k} با موفقیت ارسال شد.\`);
        }
        
        console.timeEnd('Sync: Upload Data');
        if (onProgress) onProgress(100, 'عملیات با موفقیت به پایان رسید.');
        await yieldToMain();`
);

// We need to fix the middle parts logging

const midSearch = `        const customReportsMap = getCustomReportsMap();`;
const midReplace = `        if (onProgress) onProgress(25, 'آماده‌سازی گزارش‌ها و امتیازات...');
        console.time('Sync: Processing Reports');
        await yieldToMain();
        const customReportsMap = getCustomReportsMap();`;
code = code.replace(midSearch, midReplace);

const midSearch2 = `        const payload = {`;
const midReplace2 = `        console.timeEnd('Sync: Processing Reports');
        if (onProgress) onProgress(35, 'فشرده‌سازی اطلاعات و آماده‌سازی برای ارسال شبکه...');
        console.time('Sync: Assemble Payload');
        await yieldToMain();
        const payload = {`;
code = code.replace(midSearch2, midReplace2);

const midSearch3 = `        const keys = Object.keys(payload);`;
const midReplace3 = `        console.timeEnd('Sync: Assemble Payload');
        if (onProgress) onProgress(40, 'شروع ارتباط با سرور ابری Firebase...');
        await yieldToMain();
        const keys = Object.keys(payload);`;
code = code.replace(midSearch3, midReplace3);


fs.writeFileSync('src/utils/reportsStore.ts', code);
