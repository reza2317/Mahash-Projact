const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

code = code.replace(
    \`<span className="relative z-10">{isSyncingServer ? \\\`\\\${syncProgress}% - \\\${syncMessage}\\\` : '🚀 انتشار سراسری تغییرات و لوگوها در سرور'}</span>\`,
    \`<span className="relative z-10 font-medium tracking-tight truncate max-w-xs">{isSyncingServer ? \\\`\\\${syncProgress}% - \\\${syncMessage}\\\` : '🚀 انتشار سراسری تغییرات و لوگوها در سرور'}</span>\`
);

fs.writeFileSync('src/pages/AdminPage.tsx', code);
