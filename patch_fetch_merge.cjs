const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf8');

const search = `const isTextReport = r.reportType === 'text' || !r.videoSrc || r.videoSrc === '#' || r.videoSrc.trim() === '';
        const sanitizedReport: ActivityReport & { teamSlug?: string } = {
          ...r,
          teamSlug,
          status: r.status || 'published',
          reportType: isTextReport ? 'text' : (r.reportType || 'video'),
          videoSrc: isTextReport ? undefined : ((r.videoSrc && !r.videoSrc.startsWith('blob:')) ? r.videoSrc : undefined),`;

const replace = `const rVideoSrc = r.videoSrc || r.videoUrl || r.video_url;
        const isTextReport = r.reportType === 'text' || !rVideoSrc || rVideoSrc === '#' || rVideoSrc.trim() === '';
        const sanitizedReport: ActivityReport & { teamSlug?: string } = {
          ...r,
          teamSlug,
          status: r.status || 'published',
          reportType: isTextReport ? 'text' : (r.reportType || 'video'),
          videoSrc: isTextReport ? undefined : ((rVideoSrc && !rVideoSrc.startsWith('blob:')) ? rVideoSrc : undefined),`;

if (content.includes(`const isTextReport = r.reportType === 'text' || !r.videoSrc`)) {
  content = content.replace(search, replace);
  fs.writeFileSync('src/utils/reportsStore.ts', content);
  console.log("Patched!");
} else {
  console.log("String not found");
}
