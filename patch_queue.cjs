const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

// Export yieldToMain so firebaseSync can use it
const yieldToMainStr = `export const yieldToMain = () => new Promise(r => setTimeout(r, 10));`;
if (!code.includes(yieldToMainStr)) {
    code = code.replace("export async function saveToFirebaseStore", yieldToMainStr + "\n\nexport async function saveToFirebaseStore");
}

const syncBodyOld = `    const CHUNK_SIZE = 300000;
    const numChunks = Math.max(1, Math.ceil(dataStr.length / CHUNK_SIZE));

    const chunkPromises = [];
    for (let i = 0; i < numChunks; i++) {
      const docId = i === 0 ? chunkId : \`\${chunkId}_part\${i}\`;
      const partStr = dataStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      chunkPromises.push(
        setDoc(doc(db, 'store', docId), {
          data: partStr,
          updatedAt: new Date().toISOString()
        })
      );
    }
    await Promise.all(chunkPromises);`;

const syncBodyNew = `    const CHUNK_SIZE = 100000; // 100KB chunks as requested
    const numChunks = Math.max(1, Math.ceil(dataStr.length / CHUNK_SIZE));

    // Process chunks using a queue-like structure to prevent overwhelming the connection
    const chunkPromises = [];
    for (let i = 0; i < numChunks; i++) {
      const docId = i === 0 ? chunkId : \`\${chunkId}_part\${i}\`;
      const partStr = dataStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      
      // We push a thunk to the queue
      const task = async () => {
          await yieldToMain();
          await setDoc(doc(db, 'store', docId), {
            data: partStr,
            updatedAt: new Date().toISOString()
          });
      };
      chunkPromises.push(task());
      
      // Simple concurrency limit (e.g. await every 3 chunks)
      if (i % 3 === 0) await yieldToMain();
    }
    await Promise.all(chunkPromises);`;

code = code.replace(syncBodyOld, syncBodyNew);

// Add yield before stringify and hash
code = code.replace(
  `    const dataStr = JSON.stringify(dataObj);`,
  `    await yieldToMain();\n    const dataStr = JSON.stringify(dataObj);`
);

fs.writeFileSync('src/utils/firebaseSync.ts', code);
