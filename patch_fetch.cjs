const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

const target = `    // Merge team logos
    if (serverData.teamLogos && typeof serverData.teamLogos === 'object' && Object.keys(serverData.teamLogos).length > 0) {`;

const replacement = `    // Auto-restore from admin browser if server is wiped (Serverless container restart recovery)
    let needsPushToServer = false;
    if (Object.keys(serverData.teamLogos || {}).length === 0) {
      const localLogos = safeGetLocalStorage('mahash_team_logos_map');
      if (localLogos && Object.keys(JSON.parse(localLogos)).length > 0) {
        needsPushToServer = true;
      }
    }

    // Merge team logos
    if (serverData.teamLogos && typeof serverData.teamLogos === 'object' && Object.keys(serverData.teamLogos).length > 0) {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  
  const endTarget = `    if (modified) {
      triggerStoreUpdate();
    }

    return true;`;
    
  const endReplacement = `    if (modified) {
      triggerStoreUpdate();
    }
    
    if (needsPushToServer) {
      console.log('Server is empty, but local data exists. Pushing recovery data to server...');
      setTimeout(() => syncLocalDataToServer(), 1000);
    }

    return true;`;
    
  content = content.replace(endTarget, endReplacement);
  fs.writeFileSync('src/utils/reportsStore.ts', content, 'utf-8');
  console.log('Patched fetchAndMergeServerStore successfully.');
} else {
  console.log('Could not find target.');
}
