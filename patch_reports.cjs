const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

// In syncLocalDataToServer()
content = content.replace('    let customBadges: any[] = [];\n    try {\n      const rawBadges = safeGetLocalStorage(\'mahash_custom_badges_v1\');', '    const consultantPhotos = getConsultantPhotos();\n    const consultantsList = getAllConsultants();\n    const memberAvatars = getMemberAvatars();\n\n    let customBadges: any[] = [];\n    try {\n      const rawBadges = safeGetLocalStorage(\'mahash_custom_badges_v1\');');

content = content.replace('      events,\n      customBadges,\n      reportViews\n    };\n\n    const res = await fetch(\'/api/store\'', '      events,\n      customBadges,\n      reportViews,\n      consultantPhotos,\n      consultantsList,\n      memberAvatars\n    };\n\n    const res = await fetch(\'/api/store\'');

// In fetchAndMergeServerStore()
content = content.replace('      safeSetLocalStorage(VIEWS_KEY, JSON.stringify(serverData.reportViews));\n      modified = true;\n    }\n\n    if (modified) {', '      safeSetLocalStorage(VIEWS_KEY, JSON.stringify(serverData.reportViews));\n      modified = true;\n    }\n\n    // Consultants Photos\n    if (serverData.consultantPhotos && typeof serverData.consultantPhotos === \'object\' && Object.keys(serverData.consultantPhotos).length > 0) {\n      safeSetLocalStorage(CONSULTANT_PHOTOS_KEY, JSON.stringify(serverData.consultantPhotos));\n      modified = true;\n    }\n\n    // Consultants List\n    if (Array.isArray(serverData.consultantsList) && serverData.consultantsList.length > 0) {\n      safeSetLocalStorage(CONSULTANTS_STORAGE_KEY, JSON.stringify(serverData.consultantsList));\n      modified = true;\n    }\n\n    // Member Avatars\n    if (serverData.memberAvatars && typeof serverData.memberAvatars === \'object\' && Object.keys(serverData.memberAvatars).length > 0) {\n      safeSetLocalStorage(MEMBER_AVATARS_KEY, JSON.stringify(serverData.memberAvatars));\n      modified = true;\n    }\n\n    if (modified) {');

fs.writeFileSync('src/utils/reportsStore.ts', content, 'utf-8');
