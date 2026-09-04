const fs = require('fs');
let content = fs.readFileSync('src/components/MySQLAdminDashboard.tsx', 'utf8');

const search = `  const handleDeleteReport = (id: string | number) => {
    const updated = customReports.filter(r => String(r.id) !== String(id));
    setCustomReports(updated);
    saveStoreToBackend(consultants, updated);
  };`;

const replace = `  const handleDeleteReport = async (id: string | number) => {
    try {
      const res = await fetch(\`/api/reports/\${id}?permanent=true\`, { method: 'DELETE' });
      if (res.ok) {
        const updated = customReports.filter(r => String(r.id) !== String(id));
        setCustomReports(updated);
        // We can just fetch the store data again to ensure everything is synced
        fetchStoreData();
      } else {
        throw new Error('Failed to delete report from MySQL backend');
      }
    } catch (err: any) {
      showError('خطا در حذف', err.message || 'خطا در حذف گزارش');
    }
  };`;

content = content.replace(search, replace);
fs.writeFileSync('src/components/MySQLAdminDashboard.tsx', content);
