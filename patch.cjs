const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

content = content.replace('reportViews: Record<string, number>;\n  updatedAt?: string;', 'reportViews: Record<string, number>;\n  consultantPhotos: Record<string, string>;\n  consultantsList: any[];\n  memberAvatars: Record<string, string>;\n  updatedAt?: string;');

content = content.replace('reportViews: {},\n  updatedAt: new Date().toISOString()', 'reportViews: {},\n  consultantPhotos: {},\n  consultantsList: [],\n  memberAvatars: {},\n  updatedAt: new Date().toISOString()');

content = content.replace('reportViews: parsed.reportViews || {}\n      };', 'reportViews: parsed.reportViews || {},\n        consultantPhotos: parsed.consultantPhotos || {},\n        consultantsList: Array.isArray(parsed.consultantsList) ? parsed.consultantsList : [],\n        memberAvatars: parsed.memberAvatars || {}\n      };');

content = content.replace('// Update report views', `// Update consultant and member info
    if (payload.consultantPhotos && typeof payload.consultantPhotos === 'object') {
      inMemoryStore.consultantPhotos = payload.consultantPhotos;
    }
    if (Array.isArray(payload.consultantsList)) {
      inMemoryStore.consultantsList = payload.consultantsList;
    }
    if (payload.memberAvatars && typeof payload.memberAvatars === 'object') {
      inMemoryStore.memberAvatars = payload.memberAvatars;
    }

    // Update report views`);

content = content.replace('reportViews: {},\n    updatedAt: new Date().toISOString()', 'reportViews: {},\n    consultantPhotos: {},\n    consultantsList: [],\n    memberAvatars: {},\n    updatedAt: new Date().toISOString()');

fs.writeFileSync('server.ts', content, 'utf-8');
