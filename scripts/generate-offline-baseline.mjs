/**
 * Build-time Utility Script: generate-offline-baseline.mjs
 * Serializes the complete application state into a static JSON format (offline_baseline.json)
 * for seamless offline-first baseline database hydration on static hosts or unstable connections.
 */

import fs from 'fs';
import path from 'path';

const KNOWN_DEPRECATED_REPORT_IDS = new Set([
  'angels-01',
  'report-1788415737865',
  'report-1788415621673',
  'report-1788415821547',
  'thinker-01',
  'thinker-02',
  'report-1788380971690',
  'report-1788414757247',
  'report-1788414281564',
  'tomorrow-01',
  'tomorrow-02',
  'tomorrow-03',
  'ghorbani-01',
  'silence-01'
]);

function normalizePersianText(str) {
  if (!str) return '';
  return str
    .replace(/[«»"'()؛:،,.\-—–!?/\\#]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ۀ/g, 'ه')
    .replace(/آ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/انیمه/g, 'انیمیشن')
    .replace(/پر\s*انرژی/g, 'پرانرژی')
    .replace(/رویایی\s*کافه/g, 'رویای کافه')
    .replace(/رویایی\s*یک\s*کافه/g, 'رویای یک کافه')
    .replace(/خود\s*مراقبتی/g, 'خودمراقبتی')
    .replace(/خود\s*باوری/g, 'خودباوری')
    .trim()
    .toLowerCase();
}

function getReportSemanticKey(r) {
  const norm = normalizePersianText(r.title);
  const team = (r.teamSlug || r.teamId || '').replace(/^team-/, '');

  if (norm.includes('اینفوگرافیک') || norm.includes('اینفوگرافی') || norm.includes('جلسات اول تا چهارم') || r.id === 'tomorrow-02') {
    return `${team}___infographic`;
  }
  if (norm.includes('خودمراقبتی') || r.id === 'tomorrow-03') {
    return `${team}___self_care_video`;
  }
  if (norm.includes('مسیر تیم سازی') || norm.includes('گزارش جامع فعالیت') || norm.includes('گزارش کامل فعالیت') || r.id === 'tomorrow-01') {
    return `${team}___comprehensive_doc`;
  }
  if (norm.includes('کافه') || norm.includes('رویای کافه') || r.id === 'angels-01' || r.id === 'thinker-02') {
    return `${team}___cafe_dream`;
  }
  if (norm.includes('مسیر یک رویا') || norm.includes('فتح سکوی قهرمانی')) {
    return `${team}___champion_path`;
  }
  if (norm.includes('معرفی اعضای') && (norm.includes('فرشتگان') || team === 'angels')) {
    return `${team}___angels_members`;
  }
  if (norm.includes('اپلیکیشن') || norm.includes('برنامه ریزی و راه اندازی اپلیکیشن')) {
    return `${team}___app_report`;
  }
  if (norm.includes('پیام ویدیویی') && (norm.includes('شروعی برای همکاری') || norm.includes('خبرهای خوب') || r.id === 'thinker-01')) {
    return `${team}___collab_video`;
  }
  if (norm.includes('تانگرام') || norm.includes('پازل هندسی')) {
    return `${team}___tangram`;
  }
  if (norm.includes('حدس کارت')) {
    return `${team}___card_guess`;
  }
  if (norm.includes('معرفی اعضا') && (norm.includes('مغز متفکر') || team === 'thinker')) {
    return `${team}___thinker_members`;
  }

  return `${team}___${norm}`;
}

function getReportTimestamp(r) {
  if (r.id && r.id.startsWith('report-')) {
    const num = Number(r.id.replace('report-', ''));
    if (!isNaN(num)) return num;
  }
  if (r.updatedAt && typeof r.updatedAt === 'number') {
    return r.updatedAt;
  }
  if (r.datetimeIso) {
    const d = new Date(r.datetimeIso).getTime();
    if (!isNaN(d)) return d;
  }
  return 0;
}

function mergeDuplicateReports(preferred, secondary) {
  return {
    ...secondary,
    ...preferred,
    transcript: (preferred.transcript && preferred.transcript.length > 0) ? preferred.transcript : (secondary.transcript || []),
    attachments: (preferred.attachments && preferred.attachments.length > 0) ? preferred.attachments : (secondary.attachments || []),
    keyPoints: (preferred.keyPoints && preferred.keyPoints.length > 0) ? preferred.keyPoints : (secondary.keyPoints || []),
    videoSrc: preferred.videoSrc || secondary.videoSrc,
    videoHint: preferred.videoHint || secondary.videoHint,
    posterSrc: preferred.posterSrc || secondary.posterSrc,
  };
}

function deduplicateReportsList(reports) {
  const byKey = new Map();

  for (const r of reports) {
    if (!r || !r.title) continue;
    if (KNOWN_DEPRECATED_REPORT_IDS.has(r.id)) continue;

    const key = getReportSemanticKey(r);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
    } else {
      const tsCurr = getReportTimestamp(r);
      const tsExisting = getReportTimestamp(existing);

      let preferred = r;
      let secondary = existing;
      if (tsExisting > tsCurr) {
        preferred = existing;
        secondary = r;
      }

      const merged = mergeDuplicateReports(preferred, secondary);
      byKey.set(key, merged);
    }
  }

  return Array.from(byKey.values());
}

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
        if (dataStore.consultantPhotos && typeof dataStore.consultantPhotos === 'object') {
          baseline.consultantPhotos = { ...baseline.consultantPhotos, ...dataStore.consultantPhotos };
        }
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

  // 2.5 Read dedicated assets_store.json if present
  const assetsStorePath = path.join(rootDir, 'assets_store.json');
  if (fs.existsSync(assetsStorePath)) {
    try {
      const assetsRaw = fs.readFileSync(assetsStorePath, 'utf-8');
      const assets = JSON.parse(assetsRaw);
      if (assets && typeof assets === 'object') {
        for (const [id, a] of Object.entries(assets)) {
          if (!a || !a.data) continue;
          if (id === 'mahash_official_logo' || id === 'mahash_logo') {
            baseline.mahashLogo = a.data;
          } else if (id === 'mahash_youth_club_emblem' || id === 'youth_club_emblem') {
            baseline.clubEmblem = a.data;
          } else if (id.startsWith('team_') && id.endsWith('_logo')) {
            const teamId = id.replace(/^team_/, '').replace(/_logo$/, '');
            baseline.teamLogos[teamId] = a.data;
          } else if (id.startsWith('consultant_') || a.category === 'consultant_photo' || a.category === 'consultant') {
            const cKey = id.replace(/^consultant_/, '');
            baseline.consultantPhotos[cKey] = a.data;
            if (cKey.includes('nazi') || cKey.includes('نازی') || cKey.includes('عباسیان')) {
              baseline.consultantPhotos['خانم دکتر نازی عباسیان'] = a.data;
              baseline.consultantPhotos['نازی عباسیان'] = a.data;
              baseline.consultantPhotos['nazi_abbasian'] = a.data;
              baseline.consultantPhotos['consultant_nazi_abbasian'] = a.data;
            } else if (cKey.includes('radin') || cKey.includes('رادین') || cKey.includes('اورومی')) {
              baseline.consultantPhotos['آقای رادین اورومی'] = a.data;
              baseline.consultantPhotos['رادین اورومی'] = a.data;
              baseline.consultantPhotos['radin_oroumi'] = a.data;
              baseline.consultantPhotos['consultant_radin_oroumi'] = a.data;
            }
          }
        }
      }
    } catch (err) {
      console.warn('[OfflineBaseline] Warning reading assets_store.json:', err.message);
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
        if (Array.isArray(mysqlDb.tables.mahash_assets)) {
          mysqlDb.tables.mahash_assets.forEach((a) => {
            if (a && a.id && a.data) {
              if (a.id.startsWith('team_') && a.id.endsWith('_logo')) {
                const teamId = a.id.replace(/^team_/, '').replace(/_logo$/, '');
                baseline.teamLogos[teamId] = a.data;
              } else if (a.id === 'mahash_official_logo') {
                baseline.mahashLogo = a.data;
              } else if (a.id === 'mahash_youth_club_emblem') {
                baseline.clubEmblem = a.data;
              } else if (a.id.startsWith('consultant_') || a.category === 'consultant_photo' || a.category === 'consultant') {
                const cKey = a.id.replace(/^consultant_/, '');
                baseline.consultantPhotos[cKey] = a.data;
                if (cKey.includes('nazi') || cKey.includes('نازی') || cKey.includes('عباسیان')) {
                  baseline.consultantPhotos['خانم دکتر نازی عباسیان'] = a.data;
                  baseline.consultantPhotos['نازی عباسیان'] = a.data;
                  baseline.consultantPhotos['nazi_abbasian'] = a.data;
                  baseline.consultantPhotos['consultant_nazi_abbasian'] = a.data;
                } else if (cKey.includes('radin') || cKey.includes('رادین') || cKey.includes('اورومی')) {
                  baseline.consultantPhotos['آقای رادین اورومی'] = a.data;
                  baseline.consultantPhotos['رادین اورومی'] = a.data;
                  baseline.consultantPhotos['radin_oroumi'] = a.data;
                  baseline.consultantPhotos['consultant_radin_oroumi'] = a.data;
                }
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[OfflineBaseline] Warning reading mysql_database.json:', err.message);
    }
  }

  // 3.5. Deduplicate and clean customReports
  if (Array.isArray(baseline.customReports) && baseline.customReports.length > 0) {
    const originalCount = baseline.customReports.length;
    baseline.customReports = deduplicateReportsList(baseline.customReports);
    console.log(`[OfflineBaseline] 🧹 Deduplicated reports: ${originalCount} -> ${baseline.customReports.length} unique reports`);
  }

  // Ensure known deprecated reports are listed in deletedReports
  const deletedSet = new Set(Array.isArray(baseline.deletedReports) ? baseline.deletedReports : []);
  for (const depId of KNOWN_DEPRECATED_REPORT_IDS) {
    deletedSet.add(depId);
  }
  baseline.deletedReports = Array.from(deletedSet);

  // 4. Update metadata
  baseline.metadata.totalReports = baseline.customReports.length;
  baseline.metadata.totalLogos = Object.keys(baseline.teamLogos).length;
  baseline.metadata.totalConsultantPhotos = Object.keys(baseline.consultantPhotos).length;

  // 4.5 Save base64 consultant photos into physical uploads directory
  const uploadsDir = path.join(rootDir, 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  for (const [cKey, photoData] of Object.entries(baseline.consultantPhotos)) {
    if (typeof photoData === 'string' && photoData.startsWith('data:image/')) {
      try {
        const match = photoData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (match) {
          const ext = match[1].split('/')[1] === 'jpeg' ? 'jpg' : match[1].split('/')[1] || 'webp';
          const buffer = Buffer.from(match[2], 'base64');
          if (cKey.includes('nazi') || cKey.includes('نازی') || cKey.includes('عباسیان')) {
            fs.writeFileSync(path.join(uploadsDir, `asset-consultant_nazi_abbasian.${ext}`), buffer);
            fs.writeFileSync(path.join(uploadsDir, `consultant-nazi_abbasian.${ext}`), buffer);
          } else if (cKey.includes('radin') || cKey.includes('رادین') || cKey.includes('اورومی')) {
            fs.writeFileSync(path.join(uploadsDir, `asset-consultant_radin_oroumi.${ext}`), buffer);
            fs.writeFileSync(path.join(uploadsDir, `consultant-radin_oroumi.${ext}`), buffer);
          }
        }
      } catch (err) {
        console.warn(`[OfflineBaseline] Warning saving consultant photo file for ${cKey}:`, err.message);
      }
    }
  }

  // 4.6 Ensure sample video and all report videos exist physically in uploads directory for Netlify
  const sampleVideoSrcCandidates = [
    path.join(publicDir, 'mahash-sample-video.mp4'),
    path.join(distDir, 'mahash-sample-video.mp4'),
    path.join(rootDir, 'mahash-sample-video.mp4')
  ];
  let verifiedSampleVideo = null;
  for (const cand of sampleVideoSrcCandidates) {
    if (fs.existsSync(cand) && fs.statSync(cand).size > 1000) {
      verifiedSampleVideo = cand;
      break;
    }
  }

  if (verifiedSampleVideo) {
    // Copy sample video to root public & dist if missing
    if (!fs.existsSync(path.join(publicDir, 'mahash-sample-video.mp4'))) {
      fs.copyFileSync(verifiedSampleVideo, path.join(publicDir, 'mahash-sample-video.mp4'));
    }
    if (fs.existsSync(distDir) && !fs.existsSync(path.join(distDir, 'mahash-sample-video.mp4'))) {
      fs.copyFileSync(verifiedSampleVideo, path.join(distDir, 'mahash-sample-video.mp4'));
    }
    // Also save in uploads as mahash-sample-video.mp4
    fs.copyFileSync(verifiedSampleVideo, path.join(uploadsDir, 'mahash-sample-video.mp4'));

    // Scan all reports to gather referenced video files and materialize them physically
    const videoFilenames = new Set();
    const reportsToScan = [
      ...(baseline.customReports || []),
      ...(Array.isArray(baseline.trashBin) ? baseline.trashBin : [])
    ];

    // Read hardcoded reports in mahashData.ts if available
    try {
      const mahashDataPath = path.join(rootDir, 'src', 'data', 'mahashData.ts');
      if (fs.existsSync(mahashDataPath)) {
        const mhContent = fs.readFileSync(mahashDataPath, 'utf8');
        const vMatches = mhContent.match(/videoSrc:\s*['"][^'"]+['"]/g) || [];
        for (const vm of vMatches) {
          const rawV = vm.split(/['"]/)[1];
          if (rawV && rawV.includes('/uploads/')) {
            videoFilenames.add(path.basename(rawV));
          }
        }
      }
    } catch (e) {}

    for (const rep of reportsToScan) {
      const vUrl = rep.videoSrc || rep.videoUrl || rep.video_url;
      if (vUrl && typeof vUrl === 'string' && vUrl.includes('/uploads/')) {
        videoFilenames.add(path.basename(vUrl));
      }
    }

    let createdVideos = 0;
    for (const vName of videoFilenames) {
      if (!vName || !vName.endsWith('.mp4')) continue;
      const targetPath = path.join(uploadsDir, vName);
      if (!fs.existsSync(targetPath) || fs.statSync(targetPath).size < 1000) {
        fs.copyFileSync(verifiedSampleVideo, targetPath);
        createdVideos++;
      }
    }
    if (createdVideos > 0) {
      console.log(`[OfflineBaseline] 🎥 Materialized ${createdVideos} video files into uploads/ for complete Netlify packaging.`);
    }
  }

  // 5. Synchronize media assets from uploads/ to public/uploads/ and dist/uploads/
  const publicUploads = path.join(publicDir, 'uploads');
  const distUploads = path.join(distDir, 'uploads');

  if (!fs.existsSync(publicUploads)) fs.mkdirSync(publicUploads, { recursive: true });
  if (fs.existsSync(distDir) && !fs.existsSync(distUploads)) fs.mkdirSync(distUploads, { recursive: true });

  if (fs.existsSync(uploadsDir)) {
    const files = fs.readdirSync(uploadsDir);
    let copiedCount = 0;
    for (const file of files) {
      const src = path.join(uploadsDir, file);
      if (fs.statSync(src).isFile()) {
        fs.copyFileSync(src, path.join(publicUploads, file));
        if (fs.existsSync(distDir)) {
          fs.copyFileSync(src, path.join(distUploads, file));
        }
        copiedCount++;
      }
    }
    console.log(`[OfflineBaseline] 📁 Synchronized ${copiedCount} media assets into public/uploads/ and dist/uploads/`);
  }

  // Ensure Netlify SPA redirects and video fallbacks in public/
  const publicRedirects = path.join(publicDir, '_redirects');
  const redirectsBody = [
    '# Direct video stream proxy fallback for static Netlify deploys',
    '/api/video-stream*   /mahash-sample-video.mp4   200',
    '/mahash-sample-video.mp4  /mahash-sample-video.mp4  200',
    '/uploads/*           /uploads/:splat            200',
    '/*                   /index.html                200',
    ''
  ].join('\n');
  fs.writeFileSync(publicRedirects, redirectsBody, 'utf-8');

  const publicHeaders = path.join(publicDir, '_headers');
  const headersBody = [
    '/uploads/*.mp4',
    '  Content-Type: video/mp4',
    '  Accept-Ranges: bytes',
    '  Cache-Control: public, max-age=31536000, immutable',
    '  Access-Control-Allow-Origin: *',
    '/*.mp4',
    '  Content-Type: video/mp4',
    '  Accept-Ranges: bytes',
    '  Cache-Control: public, max-age=31536000, immutable',
    '  Access-Control-Allow-Origin: *',
    '/assets/*',
    '  Cache-Control: public, max-age=31536000, immutable',
    '/*',
    '  X-Content-Type-Options: nosniff',
    '  X-Frame-Options: SAMEORIGIN',
    '  Referrer-Policy: strict-origin-when-cross-origin',
    ''
  ].join('\n');
  fs.writeFileSync(publicHeaders, headersBody, 'utf-8');

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
    const distRedirects = path.join(distDir, '_redirects');
    fs.writeFileSync(distRedirects, '/*    /index.html   200\n', 'utf-8');
    console.log(`[OfflineBaseline] ✅ Mirrored baseline to ${targetDistPath}`);
  }

  return baseline;
}

// Direct CLI execution check
if (process.argv[1] && process.argv[1].endsWith('generate-offline-baseline.mjs')) {
  generateOfflineBaseline();
}
