const fs = require('fs');
let content = fs.readFileSync('src/components/MySQLAdminDashboard.tsx', 'utf8');

const search = `  const saveStoreToBackend = async (updatedConsultants: any[], updatedReports: any[]) => {
    setSavingChanges(true);
    try {
      const payload = {
        ...storeData,
        consultantsList: updatedConsultants,
        customReports: updatedReports
      };
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setStoreData(result.store || payload);
        maintenanceSuccess('ذخیره موفق در دیتابیس MySQL', 'تغییرات با موفقیت در دیتابیس MySQL و فایل پشتیبان ثبت شد.');
      } else {
        throw new Error(result.error || 'خطای سرور');
      }
    } catch (err: any) {
      showError('خطا در ذخیره‌سازی', err.message || 'خطا در ثبت تغییرات در دیتابیس MySQL');
    } finally {
      setSavingChanges(false);
    }
  };`;

const replace = `  const saveStoreToBackend = async (updatedConsultants: any[], updatedReports: any[]) => {
    setSavingChanges(true);
    try {
      const payload = {
        ...storeData,
        consultantsList: updatedConsultants,
        customReports: updatedReports
      };
      const res = await fetch('/api/store', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (result.success) {
        setStoreData(result.store || payload);
        // Force refresh lists to ensure UI is in complete sync with backend MySQL
        if (result.store) {
          if (Array.isArray(result.store.consultantsList)) setConsultants(result.store.consultantsList);
          if (Array.isArray(result.store.customReports)) setCustomReports(result.store.customReports);
        }
        maintenanceSuccess('ذخیره موفق در دیتابیس MySQL', 'تغییرات با موفقیت در دیتابیس MySQL و فایل پشتیبان ثبت شد.');
      } else {
        throw new Error(result.error || 'خطای سرور');
      }
    } catch (err: any) {
      showError('خطا در ذخیره‌سازی', err.message || 'خطا در ثبت تغییرات در دیتابیس MySQL');
    } finally {
      setSavingChanges(false);
    }
  };`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/MySQLAdminDashboard.tsx', content);
