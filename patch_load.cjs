const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

const s1 = `          await setDoc(doc(db, 'store', docId), {
            data: partStr,
            updatedAt: new Date().toISOString()
          });`;

const r1 = `          await setDoc(doc(db, 'store', docId), {
            data: partStr,
            numChunks: i === 0 ? numChunks : undefined,
            updatedAt: new Date().toISOString()
          });`;

code = code.replace(s1, r1);

const s2 = `export async function loadFromFirebaseStore(chunkId: string) {
  try {
    let fullStr = '';
    let partIndex = 0;
    
    // Check main doc first
    const mainDocSnap = await getDoc(doc(db, 'store', chunkId));
    if (!mainDocSnap.exists()) return null;
    
    let partData = mainDocSnap.data().data;
    if (!partData) return null;
    fullStr += partData;
    
    // Assume up to 50 chunks for fast parallel fetching
    const chunkPromises = [];
    for (let i = 1; i <= 50; i++) {
      chunkPromises.push(getDoc(doc(db, 'store', \`\${chunkId}_part\${i}\`)));
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
    
    if (fullStr) {
      try {
        return JSON.parse(fullStr);
      } catch (parseErr) {
        console.warn(\`Warning: Could not parse chunk \${chunkId} from Firebase. Data might be corrupt or incomplete.\`);
        return { __corrupt: true };
      }
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.warn(\`[Offline] Could not load chunk \${chunkId} from Firebase (using local data instead).\`);
    } else {
      console.error(\`Error loading chunk \${chunkId} from Firebase\`, err);
    }
    return null;
  }
}`;

const r2 = `export async function loadFromFirebaseStore(chunkId: string) {
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
        chunkPromises.push(getDoc(doc(db, 'store', \`\${chunkId}_part\${i}\`)));
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
        chunkPromises.push(getDoc(doc(db, 'store', \`\${chunkId}_part\${i}\`)));
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
        console.warn(\`Warning: Could not parse chunk \${chunkId} from Firebase. Data might be corrupt or incomplete.\`);
        return { __corrupt: true };
      }
    }
    return null;
  } catch (err: any) {
    if (err?.code === 'resource-exhausted' || err?.message?.includes('Quota limit exceeded')) {
      quotaExceeded = true;
      console.warn(\`[Offline] Firebase Read Quota Exceeded. Disabling sync pull for this session.\`);
    } else if (err?.code === 'unavailable' || err?.message?.includes('offline')) {
      console.warn(\`[Offline] Could not load chunk \${chunkId} from Firebase (using local data instead).\`);
    } else {
      console.error(\`Error loading chunk \${chunkId} from Firebase\`, err);
    }
    return null;
  }
}`;

code = code.replace(s2, r2);
fs.writeFileSync('src/utils/firebaseSync.ts', code);
