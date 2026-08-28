const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

code = code.replace(
  "import { StatusNotification } from './components/StatusNotification';",
  "import { StatusNotification } from './components/StatusNotification';\nimport { ProgressTracker } from './components/ProgressTracker';"
);

code = code.replace(
  "        <BackToTop />",
  "        <ProgressTracker />\n        <BackToTop />"
);

fs.writeFileSync('src/App.tsx', code);
