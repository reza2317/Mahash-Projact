const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `      await mysqlPool.query('DELETE FROM mahash_videos WHERE id = ?', [videoId]);
      res.json({ success: true, message: 'Video deleted successfully' });`;

const replace = `      // Find the video URL to remove from reports
      const [rows] = await mysqlPool.query('SELECT video_url FROM mahash_videos WHERE id = ?', [videoId]);
      const videoUrl = rows && rows.length > 0 ? rows[0].video_url : null;
      
      await mysqlPool.query('DELETE FROM mahash_videos WHERE id = ?', [videoId]);
      
      // Update reports in memory to remove this video
      if (videoUrl && Array.isArray(inMemoryStore.customReports)) {
        let changed = false;
        inMemoryStore.customReports.forEach((rep) => {
          if (rep.videoSrc === videoUrl || rep.videoUrl === videoUrl) {
            rep.videoSrc = '';
            rep.videoUrl = '';
            changed = true;
          }
        });
        if (changed) {
          saveStoreToDisk();
        }
      }

      res.json({ success: true, message: 'Video deleted successfully' });`;

content = content.replace(search, replace);
fs.writeFileSync('server.ts', content);
