const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf8');

const additions = [
  { search: `  // Asynchronously mirror into dedicated IndexedDB service without locking UI
  if (typeof window !== 'undefined') {
    indexedDBService.saveReport(reportToSave, teamSlug).catch((e) => {
      console.warn('[IndexedDB Sync Warning] Could not persist report to IndexedDB:', e);
    });
  }
}

/**
 * Detaches / removes video from any report (custom or base) and converts it to a clean text-only report.
 */`,
    replace: `  // Asynchronously mirror into dedicated IndexedDB service without locking UI
  if (typeof window !== 'undefined') {
    indexedDBService.saveReport(reportToSave, teamSlug).catch((e) => {
      console.warn('[IndexedDB Sync Warning] Could not persist report to IndexedDB:', e);
    });
  }
  
  // Immediately sync to server
  syncLocalDataToServer().catch(console.warn);
}

/**
 * Detaches / removes video from any report (custom or base) and converts it to a clean text-only report.
 */`
  }
];

// Apply replacements
additions.forEach(({search, replace}) => {
  if (content.includes(search)) {
    content = content.replace(search, replace);
  }
});

fs.writeFileSync('src/utils/reportsStore.ts', content);
