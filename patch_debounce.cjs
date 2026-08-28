const fs = require('fs');
let code = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

// Replace syncLocalDataToServer
const match = /export async function syncLocalDataToServer\(\): Promise<boolean> \{[\s\S]*?isSyncingToServer = false;\n  \}\n\}/;
const replacement = `
let syncTimeout: any = null;
export async function syncLocalDataToServer(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  
  return new Promise((resolve) => {
    if (syncTimeout) clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        const rawMap = safeGetLocalStorage(TEAM_LOGOS_MAP_KEY);
        const parsedMap = rawMap ? JSON.parse(rawMap) : {};
        
        const officialShortIds = ['thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'];
        officialShortIds.forEach((shortId) => {
          const slug = \`team-\${shortId}\`;
          const indVal = safeGetLocalStorage(\`mahash_team_logo_\${shortId}\`) || 
                         safeGetLocalStorage(\`mahash_team_logo_\${slug}\`) ||
                         safeGetLocalStorage(\`team_logo_\${shortId}\`);
          if (indVal && isCustomImageDataUrlOrUrl(indVal)) {
            parsedMap[slug] = indVal;
            parsedMap[shortId] = indVal;
          }
        });

        const teamOverrides = getTeamOverrides();
        const mahashLogo = safeGetLocalStorage(MAHASH_LOGO_KEY);
        const clubEmblem = safeGetLocalStorage(CLUB_EMBLEM_KEY);
        
        const customReportsMap = getCustomReportsMap();
        const customReports = Object.values(customReportsMap).flat();
        
        const deletedReports = getDeletedReportsList();
        const scores = getAllScores();
        const events = getAllEvents();
        
        const customBadgesRaw = safeGetLocalStorage('mahash_custom_badges_v1');
        const customBadges = customBadgesRaw ? JSON.parse(customBadgesRaw) : [];

        const consultantPhotosRaw = safeGetLocalStorage(CONSULTANT_PHOTOS_KEY);
        const consultantPhotos = consultantPhotosRaw ? JSON.parse(consultantPhotosRaw) : {};

        const consultantsListRaw = safeGetLocalStorage(CONSULTANTS_STORAGE_KEY);
        const consultantsList = consultantsListRaw ? JSON.parse(consultantsListRaw) : [];

        const memberAvatarsRaw = safeGetLocalStorage(MEMBER_AVATARS_KEY);
        const memberAvatars = memberAvatarsRaw ? JSON.parse(memberAvatarsRaw) : {};

        const payload = {
          teamLogos: parsedMap,
          teamOverrides,
          mahashLogo,
          clubEmblem,
          customReports,
          deletedReports,
          scores,
          events,
          customBadges,
          consultantPhotos,
          consultantsList,
          memberAvatars
        };

        const keys = Object.keys(payload);
        await Promise.all(keys.map(k => saveToFirebaseStore(k, (payload as any)[k])));
        resolve(true);
      } catch (err) {
        console.warn('[reportsStore] Failed to sync data to Firebase:', err);
        resolve(false);
      }
    }, 1500); // 1.5 seconds debounce
  });
}`;

code = code.replace(match, replacement);
fs.writeFileSync('src/utils/reportsStore.ts', code, 'utf-8');
console.log('Debounced syncLocalDataToServer');
