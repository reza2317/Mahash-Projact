const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

content = "import { saveToFirebaseStore, loadFromFirebaseStore } from './firebaseSync';\n" + content;

fs.writeFileSync('src/utils/reportsStore.ts', content, 'utf-8');
console.log('Fixed imports again.');
