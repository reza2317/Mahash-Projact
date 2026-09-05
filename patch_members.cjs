const fs = require('fs');
let content = fs.readFileSync('src/pages/TeamDetailPage.tsx', 'utf8');

content = content.replace(
  '          {/* Visual Logo Card */}',
  '          {/* Visual Logo Card */}\n          <div className={`lg:block ${activeTab !== \'about\' ? \'hidden\' : \'block\'}`}>'
);

content = content.replace(
  '          {/* Members Card */}',
  '          </div>\n\n          {/* Members Card */}\n          <div className={`lg:block ${activeTab !== \'members\' ? \'hidden\' : \'block\'}`}>'
);

content = content.replace(
  '        {/* Right Column: Activities & Reports */}',
  '          </div>\n        </div>\n\n        {/* Right Column: Activities & Reports */}'
);

fs.writeFileSync('src/pages/TeamDetailPage.tsx', content);
console.log("Patched members");
