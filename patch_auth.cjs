const fs = require('fs');

// 1. Update firestore.rules
let rules = fs.readFileSync('firestore.rules', 'utf-8');
rules = rules.replace(/isAnon\(\)/g, "true");
fs.writeFileSync('firestore.rules', rules, 'utf-8');

// 2. Update firebaseSync.ts
let sync = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');
sync = sync.replace(/import \{ getAuth, signInAnonymously \} from 'firebase\/auth';/, "import { getAuth } from 'firebase/auth';");
sync = sync.replace(/let authReady = false;\n\nexport async function ensureAuth\(\) \{[\s\S]*?\}\n\n/, "");
sync = sync.replace(/await ensureAuth\(\);\n    /, "");
fs.writeFileSync('src/utils/firebaseSync.ts', sync, 'utf-8');

console.log('Removed anonymous auth requirement.');
