const fs = require('fs');
let content = fs.readFileSync('src/pages/AdminPage.tsx', 'utf8');

const injection = `
  const handleTransferToMySQL = async (video: any) => {
    try {
      setUploadingVideoId(video.reportId);
      
      const formData = new FormData();
      formData.append('file', video.blob, video.name || 'video.mp4');

      const res = await fetch('/api/upload-file', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) throw new Error('خطا در آپلود ویدیو به سرور');
      const data = await res.json();
      
      if (data.success && data.url) {
        // Update report to use remote URL
        const allReps = getAllReports();
        const report = allReps.find((r: any) => r.id === video.reportId);
        
        if (report) {
          const updatedReport = { ...report, videoUrl: data.url };
          delete updatedReport.videoSrc; // Remove local URL
          saveReport(updatedReport, updatedReport.teamSlug);
          
          // Re-sync allReports state
          setAllReports(getAllReports());
        }

        // Delete from local IndexedDB cache
        await deleteVideoFromCache(video.reportId);
        
        // Refresh UI
        const list = await getAllCachedVideos();
        setCachedVideos(list);
        const stats = await getStorageStats();
        setStorageStats(stats);
        
        showToast('ویدیو با موفقیت به سرور MySQL منتقل شد.');
      } else {
        throw new Error(data.error || 'خطای نامشخص در آپلود');
      }
    } catch (err: any) {
      console.error(err);
      showError('خطا در انتقال', err.message);
    } finally {
      setUploadingVideoId(null);
    }
  };
`;

content = content.replace('const handleRunVideoCleanup = () => {', injection + '\n  const handleRunVideoCleanup = () => {');
fs.writeFileSync('src/pages/AdminPage.tsx', content);
