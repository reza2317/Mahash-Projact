const fs = require('fs');
let content = fs.readFileSync('src/pages/TeamDetailPage.tsx', 'utf8');

// Undo my previous patches using regex
content = content.replace(/<div className={`lg:col-span-4 space-y-6 \${activeTab === 'activities' \? 'hidden lg:block' : 'block'}`}>\n\s*{\/\* Visual Logo Card \*\/}\n\s*<div className={`lg:block \${activeTab !== 'about' \? 'hidden' : 'block'}`}>\n\s*<div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center shadow-xs space-y-4">/g, '<div className={`lg:col-span-4 space-y-6 ${activeTab === \'activities\' ? \'hidden lg:block\' : \'block\'}`}>\n          {/* Visual Logo Card */}\n          <div className={`lg:block ${activeTab !== \'about\' ? \'hidden\' : \'block\'}`}>\n          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center shadow-xs space-y-4">');

// I will just use regex to clean up the extra divs before Right Column
content = content.replace(
  /          <\/div>\n        <\/div>\n          <\/div>\n        <\/div>\n\n        {\/\* Right Column: Activities & Reports \*\/}/g,
  '          </div>\n        </div>\n        </div>\n\n        {/* Right Column: Activities & Reports */}'
);

fs.writeFileSync('src/pages/TeamDetailPage.tsx', content);
console.log("Fixed extra div");
