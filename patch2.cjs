const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

const s1 = '    for (let i = 0; i < numChunks; i++) {\\n      const docId = i === 0 ? chunkId : `${chunkId}_part${i}`;\\n      const partStr = dataStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);\\n      await setDoc(doc(db, \\'store\\', docId), {\\n        data: partStr,\\n        updatedAt: new Date().toISOString()\\n      });\\n    }';

const s2 = '    // Cleanup old extra parts\\n    for (let i = numChunks; i < numChunks + 2; i++) {\\n        try {\\n            await deleteDoc(doc(db, \\'store\\', `${chunkId}_part${i}`));\\n        } catch (e) {}\\n    }';

code = code.replace(/    for \(let i = 0; i < numChunks; i\+\+\) \{[\s\S]*?updatedAt: new Date\(\)\.toISOString\(\)\n      \}\);\n    \}/, `    const chunkPromises = [];
    for (let i = 0; i < numChunks; i++) {
      const docId = i === 0 ? chunkId : \\\`\\\${\\chunkId}_part\\\${\\i}\\\`;
      const partStr = dataStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      chunkPromises.push(
        setDoc(doc(db, 'store', docId), {
          data: partStr,
          updatedAt: new Date().toISOString()
        })
      );
    }
    await Promise.all(chunkPromises);`);

code = code.replace(/    \/\/ Cleanup old extra parts\n    for \(let i = numChunks; i < numChunks \+ 2; i\+\+\) \{[\s\S]*?catch \(e\) \{\}\n    \}/, `    // Cleanup old extra parts
    const cleanupPromises = [];
    for (let i = numChunks; i < numChunks + 2; i++) {
      cleanupPromises.push(
        deleteDoc(doc(db, 'store', \\\`\\\${\\chunkId}_part\\\${\\i}\\\`)).catch(() => {})
      );
    }
    await Promise.all(cleanupPromises);`);

fs.writeFileSync('src/utils/firebaseSync.ts', code);
