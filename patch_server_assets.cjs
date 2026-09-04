const fs = require('fs');
let content = fs.readFileSync('server.ts', 'utf8');

const search = `    app.use(express.static(distPath));
    app.get('*', (req, res) => {`;

const replace = `    app.use(express.static(distPath));
    // Return 404 for missing assets instead of fallback index.html to prevent SyntaxErrors
    app.use('/assets', (req, res) => res.status(404).send('Not found'));
    app.use('/uploads', (req, res) => res.status(404).send('Not found'));
    app.get('*', (req, res) => {`;

content = content.replace(search, replace);
fs.writeFileSync('server.ts', content);
