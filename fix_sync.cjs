const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `    // 2. Scan customReports & built-in reports
    const allReps = Array.isArray(inMemoryStore.customReports) ? inMemoryStore.customReports : [];
    for (const rep of allReps) {
      const vUrlRaw = rep.videoSrc || rep.videoUrl;
      if (vUrlRaw && vUrlRaw !== '#' && vUrlRaw.trim() !== '') {
        const vUrl = vUrlRaw.trim();) {
        const vUrl = rep.videoSrc.trim();`;

const replace = `    // 2. Scan customReports & built-in reports
    const allReps = Array.isArray(inMemoryStore.customReports) ? inMemoryStore.customReports : [];
    for (const rep of allReps) {
      const vUrlRaw = rep.videoSrc || rep.videoUrl;
      if (vUrlRaw && vUrlRaw !== '#' && vUrlRaw.trim() !== '') {
        const vUrl = vUrlRaw.trim();`;

content = content.replace(search, replace);
fs.writeFileSync('server.ts', content);
