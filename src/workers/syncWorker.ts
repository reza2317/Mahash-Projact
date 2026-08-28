self.onmessage = (e) => {
  const { id, type, payload } = e.data;
  
  if (type === 'PROCESS_CHUNK') {
    try {
      const start = performance.now();
      const dataStr = JSON.stringify(payload);
      
      // Hash
      let hash = 0;
      for (let i = 0, len = dataStr.length; i < len; i++) {
          let chr = dataStr.charCodeAt(i);
          hash = ((hash << 5) - hash) + chr;
          hash |= 0;
      }
      const dataHash = hash.toString();
      
      // Chunking
      const CHUNK_SIZE = 100000;
      const numChunks = Math.max(1, Math.ceil(dataStr.length / CHUNK_SIZE));
      
      const chunks = [];
      for (let i = 0; i < numChunks; i++) {
        chunks.push(dataStr.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
      }
      
      const time = performance.now() - start;
      
      self.postMessage({
        id,
        success: true,
        dataHash,
        chunks,
        time
      });
    } catch (err: any) {
      self.postMessage({ id, success: false, error: err.message });
    }
  }
};
