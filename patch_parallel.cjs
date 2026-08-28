const fs = require('fs');
let code = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

const search = `        // We do not want to use Promise.all to map them blindly because we want to report progress
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
        }`;

const replace = `        // Process uploads in parallel (Promise.all) but track progress responsively
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

code = code.replace(search, replace);
fs.writeFileSync('src/utils/reportsStore.ts', code);
