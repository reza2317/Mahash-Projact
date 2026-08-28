const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf-8');

if (!content.includes('import multer from')) {
  content = content.replace("import express from 'express';", "import express from 'express';\nimport multer from 'multer';");
}

fs.writeFileSync('server.ts', content, 'utf-8');
