/**
 * Build-time Utility Script: generate-offline-baseline.mjs
 * Serializes the complete application state into a static JSON format (offline_baseline.json)
 * for seamless offline-first baseline database hydration on static hosts or unstable connections.
 */

import fs from 'fs';
import path from 'path';

export function generateOfflineBaseline() {
  const rootDir = process.cwd();
  const publicDir = path.join(rootDir, 'public');
  const distDir = path.join(rootDir, 'dist');
  const targetPublicPath = path.join(publicDir, 'offline_baseline.json');
  const targetDistPath = path.join(distDir, 'offline_baseline.json');

  console.log('[OfflineBaseline] 📦 Generating static offline-first baseline database...');

  // 1. Initialize empty state structure
  const baseline = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    schema: 'mahash_offline_baseline_v1',
    customReports: [],
    teamLogos: {},
    teamOverrides: {},
    scores: {},
    events: [],
    consultantPhotos: {},
    consultantsList: [],
    memberAvatars: {},
    memberships: [],
    videoVisibility: {},
    deletedVideos: [],
    reportViews: {},
    activityLogs: [],
    customBadges: [],
    trashBin: [],
    mahashLogo: '',
    clubEmblem: '',
    metadata: {
      appName: 'پرتال جامع کانون جوانان ماهش',
      author: 'کانون جوانان ماهش',
      description: 'دیتابیس استاتیک آفلاین برای میزبانی در هاست‌های استاتیک و شبکه ناپایدار',
      totalReports: 0,
      totalTeams: 5
    }
  };

  // 2. Extract state from data_store.json if present
  const dataStorePath = path.join(rootDir, 'data_store.json');
  if (fs.existsSync(dataStorePath)) {
    try {
      const dataStoreRaw = fs.readFileSync(dataStorePath, 'utf-8');
      const dataStore = JSON.parse(dataStoreRaw);
      if (dataStore && typeof dataStore === 'object') {
        if (Array.isArray(dataStore.customReports)) baseline.customReports = dataStore.customReports;
        if (dataStore.teamLogos && typeof dataStore.teamLogos === 'object') baseline.teamLogos = dataStore.teamLogos;
        if (dataStore.teamOverrides && typeof dataStore.teamOverrides === 'object') baseline.teamOverrides = dataStore.teamOverrides;
        if (dataStore.scores && typeof dataStore.scores === 'object') baseline.scores = dataStore.scores;
        if (Array.isArray(dataStore.events)) baseline.events = dataStore.events;
        if (dataStore.consultantPhotos && typeof dataStore.consultantPhotos === 'object') baseline.consultantPhotos = dataStore.consultantPhotos;
        if (Array.isArray(dataStore.consultantsList)) baseline.consultantsList = dataStore.consultantsList;
        if (dataStore.memberAvatars && typeof dataStore.memberAvatars === 'object') baseline.memberAvatars = dataStore.memberAvatars;
        if (Array.isArray(dataStore.memberships)) baseline.memberships = dataStore.memberships;
        if (dataStore.videoVisibility && typeof dataStore.videoVisibility === 'object') baseline.videoVisibility = dataStore.videoVisibility;
        if (Array.isArray(dataStore.deletedVideos)) baseline.deletedVideos = dataStore.deletedVideos;
        if (dataStore.reportViews && typeof dataStore.reportViews === 'object') baseline.reportViews = dataStore.reportViews;
        if (Array.isArray(dataStore.activityLogs)) baseline.activityLogs = dataStore.activityLogs;
        if (Array.isArray(dataStore.customBadges)) baseline.customBadges = dataStore.customBadges;
        if (Array.isArray(dataStore.trashBin)) baseline.trashBin = dataStore.trashBin;
        if (dataStore.mahashLogo) baseline.mahashLogo = dataStore.mahashLogo;
        if (dataStore.clubEmblem) baseline.clubEmblem = dataStore.clubEmblem;
      }
    } catch (err) {
      console.warn('[OfflineBaseline] Warning reading data_store.json:', err.message);
    }
  }

  // 3. Fallback / supplementary inspection from mysql_database.json
  const mysqlDbPath = path.join(rootDir, 'mysql_database.json');
  if (fs.existsSync(mysqlDbPath)) {
    try {
      const mysqlRaw = fs.readFileSync(mysqlDbPath, 'utf-8');
      const mysqlDb = JSON.parse(mysqlRaw);
      if (mysqlDb?.tables) {
        if (baseline.customReports.length === 0 && Array.isArray(mysqlDb.tables.mahash_reports)) {
          baseline.customReports = mysqlDb.tables.mahash_reports;
        }
        if (Object.keys(baseline.teamLogos).length === 0 && Array.isArray(mysqlDb.tables.mahash_assets)) {
          mysqlDb.tables.mahash_assets.forEach((a) => {
            if (a && a.id && a.data) {
              if (a.id.startsWith('team_') && a.id.endsWith('_logo')) {
                const teamId = a.id.replace(/^team_/, '').replace(/_logo$/, '');
                baseline.teamLogos[teamId] = a.data;
              } else if (a.id === 'mahash_official_logo') {
                baseline.mahashLogo = a.data;
              } else if (a.id === 'mahash_youth_club_emblem') {
                baseline.clubEmblem = a.data;
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[OfflineBaseline] Warning reading mysql_database.json:', err.message);
    }
  }

  // 4. Update metadata
  baseline.metadata.totalReports = baseline.customReports.length;
  baseline.metadata.totalLogos = Object.keys(baseline.teamLogos).length;
  baseline.metadata.totalConsultantPhotos = Object.keys(baseline.consultantPhotos).length;

  // 5. Mirror all media assets from uploads/ into public/uploads and dist/uploads
  const uploadsDir = path.join(rootDir, 'uploads');
  const publicUploadsDir = path.join(publicDir, 'uploads');
  const distUploadsDir = path.join(distDir, 'uploads');

  if (fs.existsSync(uploadsDir)) {
    if (!fs.existsSync(publicUploadsDir)) {
      fs.mkdirSync(publicUploadsDir, { recursive: true });
    }
    const uploadFiles = fs.readdirSync(uploadsDir);
    const deletedList = Array.isArray(baseline.deletedVideos) ? baseline.deletedVideos : [];
    let copiedCount = 0;

    for (const file of uploadFiles) {
      if (file.endsWith('.zip') || deletedList.includes(file) || deletedList.includes(`/uploads/${file}`) || deletedList.includes(`vid_${file}`)) {
        continue;
      }
      const srcFile = path.join(uploadsDir, file);
      const destFile = path.join(publicUploadsDir, file);
      try {
        if (!fs.existsSync(destFile) || fs.statSync(srcFile).size !== fs.statSync(destFile).size) {
          fs.copyFileSync(srcFile, destFile);
          copiedCount++;
        }
      } catch (err) {
        console.warn(`[OfflineBaseline] Failed copying media ${file}:`, err.message);
      }
    }
    console.log(`[OfflineBaseline] 📦 Mirrored ${uploadFiles.length} media files (${copiedCount} new/updated) to ${publicUploadsDir}`);

    if (fs.existsSync(distDir)) {
      if (!fs.existsSync(distUploadsDir)) {
        fs.mkdirSync(distUploadsDir, { recursive: true });
      }
      for (const file of uploadFiles) {
        if (deletedList.includes(file) || deletedList.includes(`/uploads/${file}`) || deletedList.includes(`vid_${file}`)) {
          continue;
        }
        const srcFile = path.join(uploadsDir, file);
        const destFile = path.join(distUploadsDir, file);
        try {
          if (!fs.existsSync(destFile) || fs.statSync(srcFile).size !== fs.statSync(destFile).size) {
            fs.copyFileSync(srcFile, destFile);
          }
        } catch {}
      }
    }
  }

  // 6. Serialize to JSON format
  const jsonContent = JSON.stringify(baseline, null, 2);

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  fs.writeFileSync(targetPublicPath, jsonContent, 'utf-8');
  console.log(`[OfflineBaseline] ✅ Saved baseline to ${targetPublicPath} (${(jsonContent.length / 1024).toFixed(1)} KB)`);

  // If dist folder exists, mirror there as well
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(targetDistPath, jsonContent, 'utf-8');
    console.log(`[OfflineBaseline] ✅ Mirrored baseline to ${targetDistPath}`);
  }

  return baseline;
}

// Direct CLI execution check
if (process.argv[1] && process.argv[1].endsWith('generate-offline-baseline.mjs')) {
  generateOfflineBaseline();
}
