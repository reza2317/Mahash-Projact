const fs = require('fs');
let code = fs.readFileSync('src/components/MonthlyReports.tsx', 'utf-8');

code = code.replace(
  "import { toPersianDigits } from '../utils/persianConversion';",
  "import { toPersianDigits } from '../utils/persianDigitsHandler';"
);

fs.writeFileSync('src/components/MonthlyReports.tsx', code);
