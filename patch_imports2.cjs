const fs = require('fs');
let content = fs.readFileSync('src/utils/reportsStore.ts', 'utf-8');

// Add imports
if (!content.includes('loadFromFirebaseStore')) {
  content = "import { saveToFirebaseStore, loadFromFirebaseStore } from './firebaseSync';\n" + content;
}

// Fix keys
content = content.replace(/CUSTOM_BADGES_KEY/g, "'mahash_custom_badges_v1'");
content = content.replace(/CONSULTANTS_LIST_KEY/g, "CONSULTANTS_STORAGE_KEY");
content = content.replace(/getScoresList\(\)/g, "getAllScores()");

fs.writeFileSync('src/utils/reportsStore.ts', content, 'utf-8');
console.log('Fixed imports and keys.');
