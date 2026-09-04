const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf8');

// For deleteReport
const deleteSearch = `  markPendingSyncItem(\`delete:\${reportId}\`);
  triggerStoreUpdate();
}`;
const deleteReplace = `  markPendingSyncItem(\`delete:\${reportId}\`);
  triggerStoreUpdate();
  syncLocalDataToServer().catch(console.warn);
}`;
content = content.replace(deleteSearch, deleteReplace);

// For restoreReport
const restoreSearch = `  markPendingSyncItem(\`restore:\${reportId}\`);
  triggerStoreUpdate();
}`;
const restoreReplace = `  markPendingSyncItem(\`restore:\${reportId}\`);
  triggerStoreUpdate();
  syncLocalDataToServer().catch(console.warn);
}`;
content = content.replace(restoreSearch, restoreReplace);

// For permanentlyDeleteReport
const permSearch = `  markPendingSyncItem(\`purge:\${reportId}\`);
  triggerStoreUpdate();
}`;
const permReplace = `  markPendingSyncItem(\`purge:\${reportId}\`);
  triggerStoreUpdate();
  syncLocalDataToServer().catch(console.warn);
}`;
content = content.replace(permSearch, permReplace);

fs.writeFileSync('src/utils/reportsStore.ts', content);
