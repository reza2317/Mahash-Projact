const fs = require('fs');
let code = fs.readFileSync('src/utils/firebaseSync.ts', 'utf-8');

const search = `    // Simple string hash function
    const hashCode = (s) => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0).toString();
    const dataHash = hashCode(dataStr);`;

const replace = `    // Simple string hash function (memory efficient)
    let hash = 0;
    for (let i = 0, len = dataStr.length; i < len; i++) {
        let chr = dataStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    const dataHash = hash.toString();`;

code = code.replace(search, replace);

fs.writeFileSync('src/utils/firebaseSync.ts', code);
