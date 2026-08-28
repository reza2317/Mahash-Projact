import { parseReportTimestamp } from './src/utils/persianDate.js';
console.log(parseReportTimestamp({ date: '۱۸ شهریور ۱۴۰۵' }));
console.log(parseReportTimestamp({ date: '۱۴۰۵/۰۶/۱۸' }));
