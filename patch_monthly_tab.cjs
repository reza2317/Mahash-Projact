const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

code = code.replace(
  "const [activeTab, setActiveTab] = useState<'create' | 'reports' | 'teams' | 'scores' | 'events' | 'analytics' | 'logos' | 'health' | 'storage' | 'settings'>('create');",
  "const [activeTab, setActiveTab] = useState<'create' | 'reports' | 'monthly' | 'teams' | 'scores' | 'events' | 'analytics' | 'logos' | 'health' | 'storage' | 'settings'>('create');"
);

const searchTabBtn = `        <button
          onClick={() => setActiveTab('analytics')}
          className={\`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer \${
            activeTab === 'analytics'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-sky-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }\`}
        >
          <TrendingUp className="w-4 h-4 text-sky-400" />
          <span>آمار و تحلیل بازدید ویدیوها ({toPersianDigits(totalViewsCount)})</span>
        </button>`;

const replaceTabBtn = searchTabBtn + `

        <button
          onClick={() => setActiveTab('monthly')}
          className={\`px-4 py-2.5 rounded-xl transition flex items-center gap-2 shrink-0 cursor-pointer \${
            activeTab === 'monthly'
              ? 'bg-[#173b82] text-white shadow-sm ring-2 ring-sky-400/30'
              : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
          }\`}
        >
          <Calendar className="w-4 h-4 text-indigo-400" />
          <span>گزارش‌های ماهانه</span>
        </button>`;

code = code.replace(searchTabBtn, replaceTabBtn);

fs.writeFileSync('src/pages/AdminPage.tsx', code);
