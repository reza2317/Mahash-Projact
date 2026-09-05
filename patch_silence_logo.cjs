const fs = require('fs');
let content = fs.readFileSync('src/utils/assets.ts', 'utf8');

const oldLogoStart = 'export const TEAM_SILENCE_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`';
const nextLogoStart = 'export const MAHASH_YOUTH_CLUB_FALLBACK_LOGO_SVG';

const startIdx = content.indexOf(oldLogoStart);
const endIdx = content.indexOf(nextLogoStart);

if (startIdx !== -1 && endIdx !== -1) {
  const before = content.substring(0, startIdx);
  const after = content.substring(endIdx);
  
  const newLogo = 'export const TEAM_SILENCE_LOGO_SVG = `data:image/svg+xml;utf8,${encodeURIComponent(`\n' +
    '  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 240" width="240" height="240">\n' +
    '    <rect width="240" height="240" fill="#1e3a8a"/>\n' +
    '    <g stroke-linecap="round" stroke-linejoin="round">\n' +
    '      <path d="M100 45 C150 45 180 80 180 120 C180 160 150 190 120 190 C100 190 85 175 85 155 C85 140 95 130 110 130 C130 130 140 145 140 160 C140 120 115 85 85 85 C65 85 55 105 55 125" fill="none" stroke="#ffffff" stroke-width="16"/>\n' +
    '      <path d="M90 75 C115 75 130 95 130 125" fill="none" stroke="#ffffff" stroke-width="12"/>\n' +
    '    </g>\n' +
    '    <line x1="30" y1="210" x2="210" y2="30" stroke="#1e3a8a" stroke-width="56"/>\n' +
    '    <line x1="20" y1="220" x2="220" y2="20" stroke="#ffffff" stroke-width="36"/>\n' +
    '  </svg>`)}`;\n\n/**\n * Official Mahash Youth Club Fallback Logo SVG (نشان گرافیکی پیش‌فرض باشگاه جوانان محاش)\n * Used as a stylish, high-contrast vector fallback for any team with unuploaded or pending logos.\n */\n';
    
  fs.writeFileSync('src/utils/assets.ts', before + newLogo + after.substring(after.indexOf('export const')));
  console.log('Logo replaced successfully.');
} else {
  console.log('Could not find boundaries.');
}
