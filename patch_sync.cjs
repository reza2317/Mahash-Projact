const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `        const vUrl = vUrlRaw.trim();`;
const replace = `        const vUrl = vUrlRaw.trim();
        if (vUrl.startsWith('indexeddb:') || vUrl.startsWith('blob:')) continue;`;

content = content.replace(search, replace);
fs.writeFileSync('server.ts', content);
