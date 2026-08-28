const fs = require('fs');
let code = fs.readFileSync('src/hooks/useReportSync.ts', 'utf-8');

code = code.replace(
  "      const freshReports = getAllReports();",
  "      const freshReports = getAllReports();\n      console.log('SYNC: fetched fresh reports', freshReports.find(r => r.id === reportObject.id)?.date);"
);

fs.writeFileSync('src/hooks/useReportSync.ts', code);
