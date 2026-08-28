const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultationPage.tsx', 'utf-8');

content = content.replace('  getConsultantPhotos, \n', '  getConsultantPhotos,\n  getConsultantPhoto,\n');

fs.writeFileSync('src/pages/ConsultationPage.tsx', content, 'utf-8');
