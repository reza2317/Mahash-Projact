const fs = require('fs');
let content = fs.readFileSync('src/components/MySQLAdminDashboard.tsx', 'utf8');

// Add imports
if (!content.includes('fetchAndMergeServerStore')) {
  content = content.replace("import { toPersianDigits } from '../utils/persianDate';", "import { toPersianDigits } from '../utils/persianDate';\nimport { fetchAndMergeServerStore, subscribeToStoreUpdates } from '../utils/reportsStore';");
}

// Add subscribeToStoreUpdates inside useEffect
const oldUseEffect = `  useEffect(() => {
    fetchMySQLHealth();
    fetchStoreData();
  }, []);`;

const newUseEffect = `  useEffect(() => {
    fetchMySQLHealth();
    fetchStoreData();
    const unsub = subscribeToStoreUpdates(() => {
      fetchStoreData();
    });
    return () => unsub();
  }, []);`;

content = content.replace(oldUseEffect, newUseEffect);

// Add fetchAndMergeServerStore after successful save
const oldSaveSuccess = `        maintenanceSuccess('ذخیره موفق در دیتابیس MySQL', 'تغییرات با موفقیت در دیتابیس MySQL و فایل پشتیبان ثبت شد.');`;
const newSaveSuccess = `        maintenanceSuccess('ذخیره موفق در دیتابیس MySQL', 'تغییرات با موفقیت در دیتابیس MySQL و فایل پشتیبان ثبت شد.');
        // Trigger global sync immediately
        fetchAndMergeServerStore(true).catch(() => {});`;

content = content.replace(oldSaveSuccess, newSaveSuccess);

fs.writeFileSync('src/components/MySQLAdminDashboard.tsx', content);
