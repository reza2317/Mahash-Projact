const fs = require('fs');
let content = fs.readFileSync('src/utils/mysqlQueryOptimizer.ts', 'utf8');

const search = `          hasVideo: Boolean(
            ((report.videoSrc || (report as any).videoUrl) report.videoSrc &&report.videoSrc &&
              ((report.videoSrc || (report as any).videoUrl) !== '#') &&
              ((report.videoSrc || (report as any).videoUrl) || '').trim() !== '' &&
              report.reportType !== 'text'
          ),`;

const replace = `          hasVideo: Boolean(
            (report.videoSrc || (report as any).videoUrl) &&
              (report.videoSrc || (report as any).videoUrl) !== '#' &&
              ((report.videoSrc || (report as any).videoUrl) || '').trim() !== '' &&
              report.reportType !== 'text'
          ),`;

content = content.replace(search, replace);
fs.writeFileSync('src/utils/mysqlQueryOptimizer.ts', content);
