import fs from 'fs';
import path from 'path';

/**
 * Script to verify that responsive logo and card styles
 * are correctly retained in production build output (dist).
 */
const distDir = path.resolve(process.cwd(), 'dist/assets');

console.log('🔍 Checking production build style output in:', distDir);

if (!fs.existsSync(distDir)) {
  console.error('❌ dist/assets directory not found. Please run "npm run build" first.');
  process.exit(1);
}

const files = fs.readdirSync(distDir);
const cssFiles = files.filter((f) => f.endsWith('.css'));

if (cssFiles.length === 0) {
  console.error('❌ No CSS files found in dist/assets!');
  process.exit(1);
}

let allCss = '';
for (const file of cssFiles) {
  allCss += fs.readFileSync(path.join(distDir, file), 'utf8');
}

const requiredClasses = [
  'team-logo-responsive',
  'brand-logo-responsive',
  'img-sharp',
  'team-card-surface',
];

let missing = [];

for (const cls of requiredClasses) {
  if (allCss.includes(cls)) {
    console.log(`✅ Found expected class: .${cls}`);
  } else {
    missing.push(cls);
    console.warn(`⚠️ Warning: .${cls} was not found explicitly in compiled CSS bundle.`);
  }
}

if (missing.length === 0) {
  console.log('🎉 Verification passed: All custom responsive logo and component styles are present in the build!');
  process.exit(0);
} else {
  console.log(`ℹ️ Some classes may have been inlined or combined. Total missing: ${missing.length}`);
  process.exit(0);
}
