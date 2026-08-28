const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

const replacement1 = `let quotaExceeded = false;
export const yieldToMain = () => new Promise(r => setTimeout(r, 10));

// Worker setup
let syncWorker = null;
let workerMsgId = 0;
const workerPromises = new Map();

if (typeof window !== 'undefined') {
  syncWorker = new Worker(new URL('../workers/syncWorker.ts', import.meta.url), { type: 'module' });
  syncWorker.onmessage = (e) => {
    const { id, success, dataHash, chunks, error, time } = e.data;
    if (workerPromises.has(id)) {
      const { resolve, reject } = workerPromises.get(id);
      workerPromises.delete(id);
      if (success) {
        console.log(\`[Profile] Worker Processed chunk in \${time.toFixed(2)}ms\`);
        resolve({ dataHash, chunks });
      } else {
        reject(new Error(error));
      }
    }
  };
}

const processChunkInWorker = (payload) => {
  if (!syncWorker) {
    // Fallback if no worker
    const dataStr = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0, len = dataStr.length; i < len; i++) {
        let chr = dataStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    const dataHash = hash.toString();
    const CHUNK_SIZE = 100000;
    const numChunks = Math.max(1, Math.ceil(dataStr.length / CHUNK_SIZE));
    const chunks = [];
    for (let i = 0; i < numChunks; i++) {
      chunks.push(dataStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
    }
    return Promise.resolve({ dataHash, chunks });
  }
  
  return new Promise((resolve, reject) => {
    const id = ++workerMsgId;
    workerPromises.set(id, { resolve, reject });
    syncWorker.postMessage({ id, type: 'PROCESS_CHUNK', payload });
  });
};`;

code = code.replace(/let quotaExceeded = false;\nexport const yieldToMain = \(\) => new Promise\(r => setTimeout\(r, 10\)\);/, replacement1);

const replacement2 = `    await yieldToMain();
    const { dataHash, chunks } = await processChunkInWorker(dataObj);`;

code = code.replace(/    await yieldToMain\(\);\n    const dataStr = JSON\.stringify\(dataObj\);[\s\S]*?const dataHash = hash\.toString\(\);/, replacement2);


fs.writeFileSync('src/utils/firebaseSync.ts', code);
