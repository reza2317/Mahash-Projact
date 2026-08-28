const fs = require('fs');
let code = fs.readFileSync('src/components/MonthlyReports.tsx', 'utf-8');

const searchMonth = `    const monthNum = parseInt(parts[1], 10);`;
const replaceMonth = `
    const toEnglishDigits = (str: string) => {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return str.replace(/[۰-۹]/g, (w) => persianDigits.indexOf(w).toString());
    };
    const monthNum = parseInt(toEnglishDigits(parts[1]), 10);
`;

code = code.replace(searchMonth, replaceMonth);
fs.writeFileSync('src/components/MonthlyReports.tsx', code);
