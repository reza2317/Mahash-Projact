const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

const workerCode = `
// Worker setup
let syncWorker: Worker | null = null;
let workerMsgId = 0;
const workerPromises = new Map<number, { resolve: (value: any) => void, reject: (reason?: any) => void }>();

if (typeof window !== 'undefined') {
  try {
    syncWorker = new Worker(new URL('../workers/syncWorker.ts', import.meta.url), { type: 'module' });
    syncWorker.onmessage = (e) => {
      const { id, success, dataHash, chunks, error, time } = e.data;
      if (workerPromises.has(id)) {
        const { resolve, reject } = workerPromises.get(id)!;
        workerPromises.delete(id);
        if (success) {
          console.log(\`[Profile] Worker Processed chunk in \${time.toFixed(2)}ms\`);
          resolve({ dataHash, chunks });
        } else {
          reject(new Error(error));
        }
      }
    };
  } catch (e) {
    console.warn("Could not load worker", e);
  }
}

const processChunkInWorker = (payload: any): Promise<{dataHash: string, chunks: string[]}> => {
  if (!syncWorker) {
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
    syncWorker!.postMessage({ id, type: 'PROCESS_CHUNK', payload });
  });
};
`;

code = code.replace("export async function saveToFirebaseStore", workerCode + "\\nexport async function saveToFirebaseStore");
fs.writeFileSync('src/utils/firebaseSync.ts', code);
