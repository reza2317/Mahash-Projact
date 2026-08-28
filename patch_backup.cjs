const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

content = content.replace('  const mahashLogo = getMahashLogo();\n  const youthClubBadge = getYouthClubBadge();\n\n  return JSON.stringify(\n    {\n      exportedAt: new Date().toISOString(),', '  const mahashLogo = getMahashLogo();\n  const youthClubBadge = getYouthClubBadge();\n  const consultantPhotos = getConsultantPhotos();\n  const consultantsList = getAllConsultants();\n  const memberAvatars = getMemberAvatars();\n\n  return JSON.stringify(\n    {\n      exportedAt: new Date().toISOString(),\n      consultantPhotos,\n      consultantsList,\n      memberAvatars,');

content = content.replace('    if (data.mahashLogo) setMahashLogo(data.mahashLogo);\n    if (data.youthClubBadge) setYouthClubBadge(data.youthClubBadge);\n    triggerStoreUpdate();', '    if (data.mahashLogo) setMahashLogo(data.mahashLogo);\n    if (data.youthClubBadge) setYouthClubBadge(data.youthClubBadge);\n    if (data.consultantPhotos) safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(data.consultantPhotos));\n    if (data.consultantsList) safeSetLocalStorage(CONSULTANTS_STORAGE_KEY, JSON.stringify(data.consultantsList));\n    if (data.memberAvatars) safeSetLocalStorage(MEMBER_AVATARS_KEY, JSON.stringify(data.memberAvatars));\n    triggerStoreUpdate();');

fs.writeFileSync('src/utils/reportsStore.ts', content, 'utf-8');
