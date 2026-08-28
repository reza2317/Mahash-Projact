import { parseReportTimestamp } from './src/utils/persianDate.js';
console.log(parseReportTimestamp({ id: 'report-1740000000000', date: '۱۴۰۵/۰۶/۰۲', datetimeIso: '' }));
console.log(parseReportTimestamp({ id: 'thinker-01', date: '۲۶ مرداد ۱۴۰۵', datetimeIso: '2026-08-17T12:00:00' }));
