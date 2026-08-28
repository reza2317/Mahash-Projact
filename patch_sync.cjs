const fs = require('fs');
let code = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

const searchStr = `        const keys = Object.keys(payload);
        for (const k of keys) {
          await saveToFirebaseStore(k, (payload as any)[k]);
        }`;

const replaceStr = `        const keys = Object.keys(payload);
        const promises = keys.map(k => saveToFirebaseStore(k, (payload as any)[k]));
        await Promise.all(promises);`;

code = code.replace(searchStr, replaceStr);

fs.writeFileSync('src/utils/reportsStore.ts', code);
