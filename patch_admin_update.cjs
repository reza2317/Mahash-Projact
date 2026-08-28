const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

code = code.replace(
  "setAllReports(freshReports);",
  "setAllReports([...freshReports]);"
);
code = code.replace(
  "setTeams(freshTeams);",
  "setTeams({...freshTeams});"
);

// Also do it in the form save callback
code = code.replace(
  "        setAllReports(freshReports);\n        setTeams(freshTeams);",
  "        setAllReports([...freshReports]);\n        setTeams({...freshTeams});"
);

fs.writeFileSync('src/pages/AdminPage.tsx', code);
