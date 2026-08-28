const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

if (!content.includes('import multer')) {
  content = content.replace('import path from "path";', 'import path from "path";\nimport multer from "multer";');
}

if (!content.includes('const upload = multer')) {
  content = content.replace('const UPLOADS_DIR = path.join(process.cwd(), \'public\', \'uploads\');', 'const UPLOADS_DIR = path.join(process.cwd(), \'public\', \'uploads\');\n\nconst storage = multer.diskStorage({\n  destination: function (req, file, cb) {\n    cb(null, UPLOADS_DIR)\n  },\n  filename: function (req, file, cb) {\n    const uniqueSuffix = Date.now() + \'-\' + Math.round(Math.random() * 1E9)\n    const ext = path.extname(file.originalname) || \'.mp4\';\n    cb(null, file.fieldname + \'-\' + uniqueSuffix + ext)\n  }\n});\nconst upload = multer({ storage: storage, limits: { fileSize: 500 * 1024 * 1024 } });\n');
}

if (!content.includes('/api/upload-file')) {
  content = content.replace('// Upload image/logo/asset endpoint', `// Upload video or large file via multipart
app.post('/api/upload-file', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }
    const publicUrl = \`/uploads/\${req.file.filename}\`;
    res.json({ success: true, url: publicUrl, filename: req.file.filename });
  } catch (err: any) {
    console.error('File Upload Error:', err);
    res.status(500).json({ error: 'Failed to save file', details: err?.message });
  }
});

// Upload image/logo/asset endpoint`);
}

fs.writeFileSync('server.ts', content, 'utf-8');
