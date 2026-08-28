const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

if (!code.includes('import { MonthlyReports }')) {
  code = code.replace(
    "import DatePicker",
    "import { MonthlyReports } from '../components/MonthlyReports';\nimport DatePicker"
  );
}

const searchRender = `      {activeTab === 'analytics' && (
        <div className="space-y-6">`;

const replaceRender = `      {activeTab === 'monthly' && (
        <MonthlyReports allReports={allReports} />
      )}

      {activeTab === 'analytics' && (
        <div className="space-y-6">`;

code = code.replace(searchRender, replaceRender);

fs.writeFileSync('src/pages/AdminPage.tsx', code);
