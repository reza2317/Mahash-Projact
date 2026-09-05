const fs = require('fs');
let content = fs.readFileSync('src/pages/TeamDetailPage.tsx', 'utf8');

content = content.replace(
  '<div className="lg:col-span-4 space-y-6">',
  '<div className={`lg:col-span-4 space-y-6 ${activeTab === \'activities\' ? \'hidden lg:block\' : \'block\'}`}>'
);

content = content.replace(
  '<div className="lg:col-span-8 space-y-6">',
  '<div className={`lg:col-span-8 space-y-6 ${activeTab === \'about\' || activeTab === \'members\' ? \'hidden lg:block\' : \'block\'}`}>'
);

fs.writeFileSync('src/pages/TeamDetailPage.tsx', content);
console.log("Patched tabs");
