const fs = require('fs');
let code = fs.readFileSync('src/utils/cleanupUtils.ts', 'utf-8');

code = code.replace(/console\.log\(\\\`\\[Cleanup\\] Removed stale 30-day cache: \\\$\\{k\\}\\\`\);/g, "console.log(`[Cleanup] Removed stale 30-day cache: ${k}`);");
code = code.replace(/console\.log\(\\\`\\[Cleanup\\] Removed stale team logo: \\\$\\{k\\}\\\`\);/g, "console.log(`[Cleanup] Removed stale team logo: ${k}`);");

fs.writeFileSync('src/utils/cleanupUtils.ts', code);
