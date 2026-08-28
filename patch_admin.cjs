const fs = require('fs');
let code = fs.readFileSync('src/pages/AdminPage.tsx', 'utf-8');

// 1. Add progress state
const stateSearch = `  const [isSyncingServer, setIsSyncingServer] = useState(false);`;
const stateReplace = `  const [isSyncingServer, setIsSyncingServer] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState('');`;
code = code.replace(stateSearch, stateReplace);

// 2. Update handleSyncToServer
const syncSearch = `  const handleSyncToServer = async () => {
    setIsSyncingServer(true);
    try {
      const ok = await syncLocalDataToServer();
      if (ok) {
        showToast('تمامی لوگوها، گزارش‌ها، امتیازات و تنظیمات با موفقیت روی سرور مرکزی منتشر و ذخیره شد.');
      } else {
        showToast('خطا در انتشار روی سرور مرکزی. لطفاً اتصال اینترنت را بررسی کنید.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setIsSyncingServer(false);
    }
  };`;

const syncReplace = `  const handleSyncToServer = async () => {
    setIsSyncingServer(true);
    setSyncProgress(0);
    setSyncMessage('در حال آماده‌سازی...');
    try {
      const ok = await syncLocalDataToServer((progress, message) => {
        setSyncProgress(progress);
        setSyncMessage(message);
      });
      if (ok) {
        showToast('تمامی لوگوها، گزارش‌ها، امتیازات و تنظیمات با موفقیت روی سرور مرکزی منتشر و ذخیره شد.');
      } else {
        showToast('خطا در انتشار روی سرور مرکزی. لطفاً اتصال اینترنت را بررسی کنید.', 'error');
      }
    } catch {
      showToast('خطا در اتصال به سرور', 'error');
    } finally {
      setTimeout(() => {
        setIsSyncingServer(false);
        setSyncProgress(0);
        setSyncMessage('');
      }, 1000);
    }
  };`;
code = code.replace(syncSearch, syncReplace);

// 3. Update UI button to show progress
const btnSearch = `            <button
              type="button"
              onClick={handleSyncToServer}
              disabled={isSyncingServer}
              title="ارسال و ذخیره‌سازی دائمی تمامی لوگوها و گزارش‌ها در سرور مرکزی تا در تمام سیستم‌ها و دامنه عمومی دقیقاً یکسان نمایش داده شود"
              className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={\`w-3.5 h-3.5 \${isSyncingServer ? 'animate-spin' : ''}\`} />
              <span>{isSyncingServer ? 'در حال انتشار...' : '🚀 انتشار سراسری تغییرات و لوگوها در سرور'}</span>
            </button>`;

const btnReplace = `            <div className="relative">
              <button
                type="button"
                onClick={handleSyncToServer}
                disabled={isSyncingServer}
                title="ارسال و ذخیره‌سازی دائمی تمامی لوگوها و گزارش‌ها در سرور مرکزی تا در تمام سیستم‌ها و دامنه عمومی دقیقاً یکسان نمایش داده شود"
                className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50 relative overflow-hidden"
              >
                {isSyncingServer && (
                  <div 
                    className="absolute inset-0 bg-emerald-700/50 transition-all duration-300 z-0"
                    style={{ width: \`\${syncProgress}%\` }}
                  />
                )}
                <RefreshCw className={\`w-3.5 h-3.5 \${isSyncingServer ? 'animate-spin' : ''} relative z-10\`} />
                <span className="relative z-10">{isSyncingServer ? \`\${syncProgress}% - \${syncMessage}\` : '🚀 انتشار سراسری تغییرات و لوگوها در سرور'}</span>
              </button>
            </div>`;
code = code.replace(btnSearch, btnReplace);


fs.writeFileSync('src/pages/AdminPage.tsx', code);
