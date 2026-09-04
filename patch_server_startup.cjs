const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `      if (assetRows && Array.isArray(assetRows)) {
        for (const row of assetRows) {
          inMemoryAssets[row.id] = row;
        }`;

const replace = `      if (assetRows && Array.isArray(assetRows)) {
        for (const row of assetRows) {
          inMemoryAssets[row.id] = row;
          // Restore physical files for uploads so express.static works with Range requests
          if (row.id.startsWith('upload_') && row.data && row.name) {
            try {
              const match = row.data.match(/^data:(.*?);base64,(.*)$/);
              if (match) {
                const buffer = Buffer.from(match[2], 'base64');
                fs.writeFileSync(path.join(UPLOADS_DIR, row.name), buffer);
              }
            } catch (err) {
              console.warn('Failed to restore physical file for asset:', row.id, err.message);
            }
          }
        }`;

if (content.includes(search)) {
  content = content.replace(search, replace);
  fs.writeFileSync('server.ts', content);
  console.log("Patched server.ts!");
} else {
  console.log("Search string not found in server.ts");
}
