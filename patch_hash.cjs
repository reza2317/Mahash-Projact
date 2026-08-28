const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

const search = `    // Optimization: Skip write if data hasn't changed since last sync in this session
    if (lastSyncedData[chunkId] === dataStr) {
      return true;
    }`;

const replace = `    // Simple string hash function
    const hashCode = (s) => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0).toString();
    const dataHash = hashCode(dataStr);
    
    // Optimization: Skip write if data hasn't changed
    const localHashKey = \`firebase_sync_hash_\${chunkId}\`;
    let previousHash = lastSyncedData[chunkId] || null;
    if (!previousHash && typeof window !== 'undefined') {
        try { previousHash = localStorage.getItem(localHashKey); } catch(e){}
    }
    
    if (previousHash === dataHash) {
      return true;
    }`;

const searchCache = `    // Update cache after successful write
    lastSyncedData[chunkId] = dataStr;
    return true;`;

const replaceCache = `    // Update cache after successful write
    lastSyncedData[chunkId] = dataHash;
    if (typeof window !== 'undefined') {
        try { localStorage.setItem(\`firebase_sync_hash_\${chunkId}\`, dataHash); } catch(e) {}
    }
    return true;`;

code = code.replace(search, replace);
code = code.replace(searchCache, replaceCache);

fs.writeFileSync('src/utils/firebaseSync.ts', code);
