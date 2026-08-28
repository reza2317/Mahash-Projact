const fs = require('fs');
let content = fs.readFileSync('src/pages/ConsultationPage.tsx', 'utf-8');

content = content.replace('import {\n  getAllConsultants,\n  subscribeToStoreUpdates,\n  getConsultantPhotos,\n  saveConsultant\n} from \'../utils/reportsStore\';', 'import {\n  getAllConsultants,\n  subscribeToStoreUpdates,\n  getConsultantPhotos,\n  getConsultantPhoto,\n  saveConsultant\n} from \'../utils/reportsStore\';');

content = content.replace('          const currentPhoto = customPhotos[c.name.trim()] || c.image || defaultAvatar;', '          const currentPhoto = getConsultantPhoto(c.name, c.image || defaultAvatar);');

fs.writeFileSync('src/pages/ConsultationPage.tsx', content, 'utf-8');
