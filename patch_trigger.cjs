const fs = require('fs');
let code = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');
code = code.replace(
  "  triggerStoreUpdate();\n  return newVer;",
  "  triggerStoreUpdate();\n  syncLocalDataToServer().catch(console.error);\n  return newVer;"
);
fs.writeFileSync('src/utils/reportsStore.ts', code, 'utf-8');
console.log('Patched triggerGlobalCacheBust');
