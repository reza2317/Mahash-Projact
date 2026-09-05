const fs = require('fs');
let content = fs.readFileSync('src/components/ReportVideoPlayer.tsx', 'utf8');

// Replace everything up to `import React` with clean imports
const idx = content.indexOf('import React, { useState');
if (idx !== -1) {
  content = 'import { useAutoVideoThumbnail } from "../hooks/useAutoVideoThumbnail";\n' + content.substring(idx);
  fs.writeFileSync('src/components/ReportVideoPlayer.tsx', content);
  console.log("Fixed for real!");
}
