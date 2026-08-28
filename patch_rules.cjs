const fs = require('fs');
let rules = fs.readFileSync('firestore.rules', 'utf-8');
rules = rules.replace(/function true\(\) \{ return request\.auth \!= null; \}/, "function isAnon() { return request.auth != null; }");
fs.writeFileSync('firestore.rules', rules, 'utf-8');
console.log('Fixed firestore.rules function.');
