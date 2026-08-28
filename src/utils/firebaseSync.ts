import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, getDoc, deleteDoc, setLogLevel } from 'firebase/firestore';

setLogLevel('silent');
import { getAuth } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

let lastSyncedData: Record<string, string> = {};
let quotaExceeded = false;

export const yieldToMain = () => new Promise(r => setTimeout(r, 10));


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
          console.log(`[Profile] Worker Processed chunk in ${time.toFixed(2)}ms`);
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
export async function saveToFirebaseStore(chunkId: string, dataObj: any) {
  if (quotaExceeded) {
    console.warn('Firebase write quota exceeded. Skipping sync for this session.');
    return false;
  }
  
  try {
    await yieldToMain();
    const { dataHash, chunks } = await processChunkInWorker(dataObj);
    
    // Optimization: Skip write if data hasn't changed
    const localHashKey = `firebase_sync_hash_${chunkId}`;
    let previousHash = lastSyncedData[chunkId] || null;
    if (!previousHash && typeof window !== 'undefined') {
        try { previousHash = localStorage.getItem(localHashKey); } catch(e){}
    }
    
    if (previousHash === dataHash) {
      return true;
    }

    const numChunks = chunks.length;

    // Process chunks using a queue-like structure to prevent overwhelming the connection
    const chunkPromises = [];
    for (let i = 0; i < numChunks; i++) {
      const docId = i === 0 ? chunkId : `${chunkId}_part${i}`;
      const partStr = chunks[i];
      
      // We push a thunk to the queue
      const task = async () => {
          await yieldToMain();
          await setDoc(doc(db, 'store', docId), {
            data: partStr,
            numChunks: i === 0 ? numChunks : undefined,
            updatedAt: new Date().toISOString()
          });
      };
      chunkPromises.push(task());
      
      // Simple concurrency limit (e.g. await every 3 chunks)
      if (i % 3 === 0) await yieldToMain();
    }
    await Promise.all(chunkPromises);

    // Cleanup old extra parts
    const cleanupPromises = [];
    for (let i = numChunks; i < numChunks + 2; i++) {
      cleanupPromises.push(
        deleteDoc(doc(db, 'store', `${chunkId}_part${i}`)).catch(() => {})
      );
    }
    await Promise.all(cleanupPromises);

    // Update cache after successful write
    lastSyncedData[chunkId] = dataHash;
    if (typeof window !== 'undefined') {
        try { localStorage.setItem(`firebase_sync_hash_${chunkId}`, dataHash); } catch(e) {}
    }
    return true;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      quotaExceeded = true;
      console.error('Firebase Daily Write Quota Exceeded! Syncing will be paused for this session.', err);
    } else {
      console.error(`Error saving chunk ${chunkId} to Firebase`, err);
    }
    return false;
  }
}

export async function loadFromFirebaseStore(chunkId: string) {
  if (quotaExceeded) {
    console.warn('Firebase read quota exceeded earlier. Skipping load for this session.');
    return null;
  }

  try {
    let fullStr = '';
    
    // Check main doc first
    const mainDocSnap = await getDoc(doc(db, 'store', chunkId));
    if (!mainDocSnap.exists()) return null;
    
    let partData = mainDocSnap.data().data;
    if (!partData) return null;
    fullStr += partData;
    
    const numChunks = mainDocSnap.data().numChunks;
    
    if (numChunks === undefined) {
      // Legacy behavior: Assume up to 50 chunks and fetch in parallel
      const chunkPromises = [];
      for (let i = 1; i <= 50; i++) {
        chunkPromises.push(getDoc(doc(db, 'store', `${chunkId}_part${i}`)));
      }
      
      const chunkSnaps = await Promise.all(chunkPromises);
      for (const snap of chunkSnaps) {
        if (snap.exists()) {
          const data = snap.data().data;
          if (data) {
            fullStr += data;
          }
        } else {
          break; // Stop at first missing chunk
        }
      }
    } else if (numChunks > 1) {
      // New behavior: Only fetch exactly the missing chunks
      const chunkPromises = [];
      for (let i = 1; i < numChunks; i++) {
        chunkPromises.push(getDoc(doc(db, 'store', `${chunkId}_part${i}`)));
      }
      const chunkSnaps = await Promise.all(chunkPromises);
      for (const snap of chunkSnaps) {
        if (snap.exists()) {
          const data = snap.data().data;
          if (data) {
            fullStr += data;
          }
        }
      }
    }
    
    if (fullStr) {
      try {
        return JSON.parse(fullStr);
      } catch (parseErr) {
        console.warn(`Warning: Could not parse chunk ${chunkId} from Firebase. Data might be corrupt or incomplete.`);
        return { __corrupt: true };
      }
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      quotaExceeded = true;
      console.warn(`[Offline] Firebase Read Quota Exceeded. Disabling sync pull for this session.`);
    } else if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.warn(`[Offline] Could not load chunk ${chunkId} from Firebase (using local data instead).`);
    } else {
      console.error(`Error loading chunk ${chunkId} from Firebase`, err);
    }
    return null;
  }
}
