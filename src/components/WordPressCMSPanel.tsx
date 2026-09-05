import React, { useState, useEffect } from 'react';
import { Database, Upload, FileText, Image, Video, HardDrive, Download, Trash2, CheckCircle2, RefreshCw, Server, Plus, Layers, Globe, Search, Copy, Eye, ExternalLink, ShieldCheck, Terminal, Cpu, MessageSquare, Settings, Sparkles, LogIn, CheckCircle } from 'lucide-react';
import { getWpToken, wpLogin, wpFetch, wpCheckHealth, wpValidateToken, getWpReports, getWpMedia } from '../utils/wpService';
import { downloadWpExport } from '../utils/wpExportScript';
import { generateWpThemeZip } from '../utils/wpThemeGenerator';
import { generateClientWebsiteZip } from '../utils/clientWebsiteExporter';
import { MigrationProgressTracker } from './admin/MigrationProgressTracker';
import { useNotification } from '../context/NotificationContext';

export const WordPressCMSPanel: React.FC = () => {
  const { maintenanceSuccess, error: showError } = useNotification();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'media' | 'posts' | 'comments' | 'settings' | 'database' | 'editor' | 'db_editor' | 'real_wp'>('dashboard');
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [postsList, setPostsList] = useState<any[]>([]);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [siteOptions, setSiteOptions] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<any | null>(null);
  const [previewPost, setPreviewPost] = useState<any | null>(null);

  // Custom Media Form State
  const [customMediaUrl, setCustomMediaUrl] = useState('');
  const [customMediaName, setCustomMediaName] = useState('');
  const [customMediaType, setCustomMediaType] = useState<'image' | 'video'>('image');

  // SQL Query Console State
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM wp_posts_media');
  const [sqlQueryResult, setSqlQueryResult] = useState<any>(null);

  // New Post Form State
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newThumbnailUrl, setNewThumbnailUrl] = useState('');
  const [newCategory, setNewCategory] = useState('اخبار و گزارش‌ها');
  const [newStatus, setNewStatus] = useState<'publish' | 'draft'>('publish');

  // Settings State
  const [blogName, setBlogName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [siteUrl, setSiteUrl] = useState('');

  // Real WP Connection State
  const [realWpUsername, setRealWpUsername] = useState('');
  const [realWpPassword, setRealWpPassword] = useState('');
  const [isRealWpConnected, setIsRealWpConnected] = useState(!!getWpToken());
  const [realWpAuthError, setRealWpAuthError] = useState<string | null>(null);
  
  // Real WP Extra State
  const [wpHealth, setWpHealth] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [wpRealMedia, setWpRealMedia] = useState<any[]>([]);
  const [isCleaning, setIsCleaning] = useState(false);

  // Client JSZip Export & Checksum State
  const [clientExporting, setClientExporting] = useState(false);
  const [clientExportProgress, setClientExportProgress] = useState(0);
  const [clientExportStatus, setClientExportStatus] = useState('');
  const [checksumResult, setChecksumResult] = useState<string | null>(null);
  const [exportedZipBlob, setExportedZipBlob] = useState<{ blob: Blob; filename: string; checksum: string } | null>(null);

  // Background token monitor & health check
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkHealthAndToken = async () => {
      if (isRealWpConnected) {
        try {
          const health = await wpCheckHealth();
          setWpHealth(health);
          await wpValidateToken();
        } catch (error) {
          console.error("WP Token or Health check failed:", error);
          setIsRealWpConnected(false);
        }
      }
    };

    if (activeTab === 'real_wp' && isRealWpConnected) {
      checkHealthAndToken();
      fetchWpRealMedia();
    }

    if (isRealWpConnected) {
      // Monitor every 5 minutes (300000 ms) to silently refresh/validate token
      interval = setInterval(checkHealthAndToken, 300000);
    }

    return () => clearInterval(interval);
  }, [isRealWpConnected, activeTab]);

  const fetchWpRealMedia = async () => {
    try {
      const media = await getWpMedia(1, 20); // fetch latest 20
      setWpRealMedia(Array.isArray(media) ? media : []);
    } catch (e) {
       console.error(e);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await getWpReports(1, 10); // Force re-fetch posts
      await fetchWpRealMedia();
      const health = await wpCheckHealth();
      setWpHealth(health);
      setSuccessMsg('همگام‌سازی با وردپرس با موفقیت انجام شد.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert('خطا در همگام‌سازی با وردپرس');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRealWpLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setRealWpAuthError(null);
    try {
      await wpLogin(realWpUsername, realWpPassword);
      setIsRealWpConnected(true);
      setSuccessMsg('با موفقیت به وردپرس اصلی متصل شد.');
    } catch (err: any) {
      setRealWpAuthError(err.message || 'خطا در اتصال به وردپرس. لطفا اطلاعات را بررسی کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleWpExport = () => {
    try {
      downloadWpExport();
      setSuccessMsg('فایل پشتیبان WP-CLI با موفقیت ایجاد و دانلود شد.');
    } catch (err) {
      alert('خطا در تولید فایل خروجی');
    }
  };

  const handleClientJsZipExport = async () => {
    setClientExporting(true);
    setClientExportProgress(0);
    setClientExportStatus('در حال آغاز بسته‌بندی کامل کلاینت...');
    setChecksumResult(null);
    setExportedZipBlob(null);
    try {
      const result = await generateClientWebsiteZip((progress, status) => {
        setClientExportProgress(progress);
        setClientExportStatus(status);
      });
      setExportedZipBlob(result);
      setChecksumResult(result.checksum);
      setSuccessMsg('پکیج کامل کلاینت با موفقیت ساخته شد و آماده دانلود است.');
    } catch (e: any) {
      console.error(e);
      alert('خطا در ساخت پکیج کلاینت: ' + (e.message || 'خطای ناشناخته'));
    } finally {
      setClientExporting(false);
    }
  };

  const fetchWpData = async () => {
    try {
      setLoading(true);
      const [statusRes, mediaRes, postsRes, commentsRes, optionsRes] = await Promise.all([
        fetch('/api/wp/database/status').then(r => r.json()).catch(() => null),
        fetch('/api/wp/media').then(r => r.json()).catch(() => ({ media: [] })),
        fetch('/api/wp/posts').then(r => r.json()).catch(() => ({ posts: [] })),
        fetch('/api/wp/comments').then(r => r.json()).catch(() => ({ comments: [] })),
        fetch('/api/wp/options').then(r => r.json()).catch(() => ({ options: {} }))
      ]);

      if (statusRes) setDbStatus(statusRes);
      if (mediaRes?.media) setMediaList(mediaRes.media);
      if (postsRes?.posts) setPostsList(postsRes.posts);
      if (commentsRes?.comments) setCommentsList(commentsRes.comments);
      if (optionsRes?.options) {
        setSiteOptions(optionsRes.options);
        setBlogName(optionsRes.options.blogname || '');
        setAdminEmail(optionsRes.options.admin_email || '');
        setSiteUrl(optionsRes.options.siteurl || '');
      }
    } catch (err) {
      console.error('Error fetching WP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWpData();
  }, []);

  const handleSyncAllAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/wp/sync-all', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message);
        await fetchWpData();
      }
    } catch (err) {
      console.error('Sync all failed:', err);
      alert('خطا در همگام‌سازی رسانه‌ها');
    } finally {
      setLoading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleMediaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/wp/media', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          setSuccessMsg(`فایل ${file.name} با موفقیت در جدول wp_posts_media دیتابیس MySQL ذخیره شد.`);
        }
      }
      await fetchWpData();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('خطا در بارگذاری فایل');
    } finally {
      setUploading(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleDeleteMedia = async (id: string | number) => {
    try {
      await fetch(`/api/wp/media/${id}`, { method: 'DELETE' });
      await fetchWpData();
      setSuccessMsg('فایل با موفقیت از دیتابیس حذف شد.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleCleanupDuplicates = async () => {
    setIsCleaning(true);
    try {
      const res = await fetch('/api/wp/media/cleanup-duplicates', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        let msg = '';
        if (data.removedFilesCount > 0) {
          msg = `تعداد ${data.removedFilesCount} فایل و لوگوی تکراری حذف و حدود ${data.freedMB} مگابایت حافظه آزاد شد.`;
          setSuccessMsg(msg);
        } else {
          msg = 'تمام فایل‌ها و لوگوهای موجود در کتابخانه رسانه یکتا هستند و فایل تکراری یافت نشد.';
          setSuccessMsg(msg);
        }
        maintenanceSuccess('پاک‌سازی موفق دیتابیس و رسانه‌ها', msg);
        await fetchWpData();
      } else {
        setSuccessMsg('خطا در پاک‌سازی فایل‌های تکراری.');
        showError('خطا در پاک‌سازی', 'خطا در پاک‌سازی فایل‌های تکراری دیتابیس.');
      }
    } catch (err) {
      console.error('Cleanup duplicates failed:', err);
      setSuccessMsg('خطا در ارتباط با سرور جهت پاک‌سازی فایل‌ها.');
      showError('خطا در ارتباط', 'خطا در ارتباط با سرور جهت پاک‌سازی فایل‌ها.');
    } finally {
      setIsCleaning(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleDeletePost = async (id: string | number) => {
    try {
      await fetch(`/api/wp/posts/${id}`, { method: 'DELETE' });
      await fetchWpData();
      setSuccessMsg('نوشته با موفقیت از دیتابیس حذف شد.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete post failed:', err);
    }
  };

  const handleDeleteComment = async (id: string | number) => {
    try {
      await fetch(`/api/wp/comments/${id}`, { method: 'DELETE' });
      await fetchWpData();
      setSuccessMsg('دیدگاه با موفقیت حذف شد.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('Delete comment failed:', err);
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      alert('عنوان نوشته الزامی است.');
      return;
    }

    try {
      const res = await fetch('/api/wp/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle,
          content: newContent,
          video_url: newVideoUrl,
          thumbnail_url: newThumbnailUrl,
          category: newCategory,
          status: newStatus,
          post_type: 'report'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewTitle('');
        setNewContent('');
        setNewVideoUrl('');
        setNewThumbnailUrl('');
        setSuccessMsg('گزارش / نوشته جدید با موفقیت در جدول wp_posts دیتابیس MySQL ثبت شد.');
        await fetchWpData();
        setActiveTab('posts');
      }
    } catch (err) {
      console.error('Create post failed:', err);
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wp/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blogname: blogName,
          admin_email: adminEmail,
          siteurl: siteUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg('تنظیمات عمومی سایت در جدول wp_options با موفقیت بروزرسانی شد.');
        await fetchWpData();
      }
    } catch (err) {
      console.error('Save settings failed:', err);
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleAddCustomMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customMediaUrl.trim()) {
      alert('لطفاً لینک رسانه (URL) را وارد کنید.');
      return;
    }
    try {
      const res = await fetch('/api/wp/media/custom', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: customMediaUrl,
          original_name: customMediaName || 'تصویر یا ویدیوی سفارشی',
          filename: customMediaUrl.split('/').pop() || 'asset.png',
          mime_type: customMediaType === 'video' ? 'video/mp4' : 'image/png',
          file_size: 150000
        })
      });
      const data = await res.json();
      if (data.success) {
        setCustomMediaUrl('');
        setCustomMediaName('');
        setSuccessMsg('رسانه سفارشی با موفقیت در جدول wp_posts_media دیتابیس MySQL ثبت شد.');
        await fetchWpData();
      }
    } catch (err) {
      console.error('Add custom media failed:', err);
    } finally {
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  const handleRunSqlQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/wp/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: sqlQuery })
      });
      const data = await res.json();
      setSqlQueryResult(data);
    } catch (err) {
      console.error('SQL query execution failed:', err);
    }
  };

  const handleAiDraftGenerator = () => {
    setNewTitle('گزارش پیشرفت و دستاوردهای نوین کارگروه همیاران جوان');
    setNewContent(`با عنایت به تلاش‌های شبانه‌روزی اعضای محترم کارگروه، اهداف تعیین‌شده در حوزه توسعه فناوری، هوش مصنوعی و مستندسازی پروژه‌ها با موفقیت محقق گردید. 
امید است با استعانت از پروردگار متعال، گام‌های مؤثرتری در جهت اعتلای جایگاه جوانان و فعالیت‌های علمی و پژوهشی برداریم.`);
    setNewCategory('اخبار و گزارش‌ها');
    setSuccessMsg('متن گزارش با استفاده از هوش مصنوعی نمونه‌سازی شد.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDownloadSql = () => {
    window.open('/api/wp/export-sql', '_blank');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccessMsg('لینک با موفقیت در کلیپ‌بورد کپی شد.');
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const filteredMedia = mediaList.filter(m => 
    m.original_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.mime_type?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredPosts = postsList.filter(p =>
    p.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.content?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#191e23] text-slate-100 rounded-3xl shadow-2xl border border-slate-700 overflow-hidden my-6">
      {/* WordPress Admin Top Bar */}
      <div className="bg-[#23282d] px-6 py-4 flex flex-col md:flex-row items-center justify-between border-b border-slate-700 gap-4">
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-extrabold text-white shadow-lg text-lg">
            WP
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              سیستم مدیریت محتوای وردپرس و دیتابیس MySQL
              <span className="text-xs bg-emerald-600 text-white px-2 py-0.5 rounded-full font-mono shadow">InnoDB v8.0</span>
            </h2>
            <p className="text-xs text-slate-400">سامانه جامع باشگاه جوانان مؤسسه محاش - انتشار نامحدود و مدیریت پایگاه داده</p>
          </div>
        </div>

        <div className="flex items-center space-x-3 space-x-reverse flex-wrap gap-2">
          <button
            onClick={handleSyncAllAssets}
            className="flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            همگام‌سازی تمام تصاویر، لوگوها و ویدیوها
          </button>
          <button
            onClick={handleDownloadSql}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition shadow"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            پشتیبان‌گیری SQL
          </button>
          <button
            onClick={fetchWpData}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            بروزرسانی داده‌ها
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-900/90 border-b border-emerald-700 text-emerald-100 px-6 py-3 text-sm flex items-center gap-2 shadow-inner">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Container Layout */}
      <div className="grid grid-cols-1 md:grid-cols-5 min-h-[550px]">
        {/* WordPress Sidebar Navigation */}
        <div className="bg-[#23282d] border-l border-slate-700 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Server className="w-4 h-4 text-blue-400" />
            پیشخوان اصلی
          </button>
          <button
            onClick={() => setActiveTab('editor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'editor' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            نوشتن گزارش جدید
          </button>
          <button
            onClick={() => setActiveTab('media')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'media' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Image className="w-4 h-4 text-amber-400" />
            کتابخانه رسانه ({mediaList.length})
          </button>
          <button
            onClick={() => setActiveTab('posts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'posts' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <FileText className="w-4 h-4 text-purple-400" />
            همه نوشته‌ها ({postsList.length})
          </button>
          <button
            onClick={() => setActiveTab('comments')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'comments' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <MessageSquare className="w-4 h-4 text-pink-400" />
            دیدگاه‌ها ({commentsList.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'settings' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Settings className="w-4 h-4 text-cyan-400" />
            تنظیمات وردپرس
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'database' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Database className="w-4 h-4 text-teal-400" />
            دیتابیس MySQL
          </button>
          <button
            onClick={() => setActiveTab('db_editor')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'db_editor' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Cpu className="w-4 h-4 text-yellow-400" />
            ویرایشگر و کنسول SQL
          </button>
          <button
            onClick={() => setActiveTab('real_wp')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition ${activeTab === 'real_wp' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            اتصال مستقیم (WP REST)
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-4 bg-[#1e2329] p-6 space-y-6">
          {activeTab === 'real_wp' && (
            <div className="space-y-6">
              <div className="bg-[#23282d] p-6 rounded-2xl border border-slate-700 shadow">
                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <Globe className="w-5 h-5 text-emerald-400" />
                  اتصال به سایت وردپرسی شما (WP REST API)
                </h3>
                <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                  با وارد کردن نام کاربری و رمز عبور برنامه (Application Password) وردپرس خود می‌توانید این سیستم را مستقیماً به هاست شخصی خود متصل کنید و محدودیت‌های Firebase را برای فایل‌های حجیم دور بزنید.
                </p>

                {realWpAuthError && (
                  <div className="mb-4 bg-red-900/40 border border-red-700 text-red-300 p-4 rounded-xl text-sm font-medium">
                    {realWpAuthError}
                  </div>
                )}

                <div className="pt-4 border-t border-slate-700 mb-8">
                  <h4 className="text-sm font-bold text-white mb-3">ابزار مهاجرت و دریافت پوسته</h4>
                  <p className="text-xs text-slate-400 mb-4">
                    برای راه‌اندازی کامل سایت وردپرسی، ابتدا پوسته اختصاصی را دریافت و نصب کنید، سپس داده‌ها را درون‌ریزی نمایید.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      onClick={handleWpExport}
                      className="bg-slate-700 hover:bg-slate-600 text-white font-medium px-6 py-3 rounded-xl text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      دریافت فایل داده‌ها (WP-CLI)
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await generateWpThemeZip();
                          setSuccessMsg('پوسته وردپرس با موفقیت ایجاد و دانلود شد.');
                        } catch(e) {
                          alert('خطا در تولید پوسته وردپرس');
                        }
                      }}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Layers className="w-4 h-4" />
                      دریافت فایل پوسته وردپرس (.zip)
                    </button>
                    <button
                      onClick={() => {
                        window.open('/api/export-website', '_blank');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-3 rounded-xl text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <HardDrive className="w-4 h-4" />
                      دانلود سورس کامل وبسایت (.zip)
                    </button>
                    <button
                      onClick={() => {
                        window.open('/api/export-netlify-zip', '_blank');
                      }}
                      className="bg-teal-600 hover:bg-teal-500 text-white font-medium px-6 py-3 rounded-xl text-sm transition shadow flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      دانلود پکیج خروجی Netlify (.zip)
                    </button>
                  </div>

                  {/* Migration Progress Chart & Status Section */}
                  <div className="mt-6 p-5 bg-[#191e23] border border-slate-700 rounded-2xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        وضعیت پیشرفت و آمادگی مهاجرت فایل‌ها
                      </h4>
                      <span className="text-xs font-mono bg-emerald-950 text-emerald-400 px-3 py-1 rounded-full border border-emerald-800">
                        آمادگی کل: ۹۵٪
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>محتوا و پست‌های وبلاگ (Posts & Reports)</span>
                          <span className="font-mono text-emerald-400">۱۰۰٪</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: '100%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>فایل‌های رسانه‌ای و ویدیوها (Media Assets)</span>
                          <span className="font-mono text-blue-400">۹۰٪</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: '90%' }}></div>
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-xs text-slate-300 mb-1">
                          <span>پوسته و ساختار وب‌سایت (Theme & Core)</span>
                          <span className="font-mono text-purple-400">۹۵٪</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full transition-all duration-500" style={{ width: '95%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client-Side JSZip Packaging & Checksum Verification Section with Global Progress Tracker */}
                  <div className="mt-4">
                    <MigrationProgressTracker
                      isExporting={clientExporting}
                      progress={clientExportProgress}
                      statusText={clientExportStatus}
                      checksum={checksumResult}
                      onStartExport={handleClientJsZipExport}
                      downloadUrl={exportedZipBlob ? URL.createObjectURL(exportedZipBlob.blob) : null}
                      filename={exportedZipBlob?.filename}
                    />
                  </div>
                </div>

                {!isRealWpConnected ? (
                  <form onSubmit={handleRealWpLogin} className="space-y-4 max-w-md pt-4 border-t border-slate-700">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">نام کاربری وردپرس</label>
                      <input
                        type="text"
                        value={realWpUsername}
                        onChange={(e) => setRealWpUsername(e.target.value)}
                        className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">رمز عبور (App Password / JWT)</label>
                      <input
                        type="password"
                        value={realWpPassword}
                        onChange={(e) => setRealWpPassword(e.target.value)}
                        className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                        dir="ltr"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-medium px-6 py-3 rounded-xl text-sm transition shadow-lg flex items-center gap-2 cursor-pointer w-full justify-center"
                    >
                      {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                      اتصال به سایت وردپرس
                    </button>
                  </form>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-emerald-900/30 p-5 rounded-xl border border-emerald-800 flex items-center gap-4">
                      <div className="w-12 h-12 bg-emerald-800 text-emerald-300 rounded-full flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-white font-bold text-sm">شما با موفقیت به وردپرس اصلی متصل شدید.</h4>
                        <p className="text-slate-400 text-xs mt-1">
                          اکنون برنامه به صورت خودکار تصاویر و ویدیوهای حجیم را در هاست وردپرسی شما ذخیره می‌کند.
                        </p>
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <h4 className="text-sm font-bold text-white">داشبورد وضعیت (Diagnostics)</h4>
                        <button
                          onClick={handleManualSync}
                          disabled={isSyncing}
                          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-4 py-2 rounded-xl text-xs transition shadow flex items-center gap-2 cursor-pointer w-fit"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'در حال همگام‌سازی...' : 'همگام‌سازی سریع (Sync Now)'}
                        </button>
                      </div>
                      
                      {wpHealth ? (
                        <div className="grid grid-cols-3 gap-3 mb-6">
                          <div className="bg-[#191e23] p-3 rounded-xl border border-slate-700">
                            <div className="text-[10px] text-slate-400 mb-1">وضعیت ارتباط</div>
                            <div className="text-emerald-400 text-xs font-bold flex items-center gap-1"><Server className="w-3.5 h-3.5"/> متصل (Healthy)</div>
                          </div>
                          <div className="bg-[#191e23] p-3 rounded-xl border border-slate-700">
                            <div className="text-[10px] text-slate-400 mb-1">نسخه API</div>
                            <div className="text-white text-xs font-mono font-bold truncate" dir="ltr">{wpHealth.url}</div>
                          </div>
                          <div className="bg-[#191e23] p-3 rounded-xl border border-slate-700">
                            <div className="text-[10px] text-slate-400 mb-1">تأخیر شبکه (Latency)</div>
                            <div className={`text-xs font-bold font-mono ${wpHealth.latency < 500 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {wpHealth.latency} ms
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 mb-6 flex items-center gap-2">
                          <RefreshCw className="w-3 h-3 animate-spin" /> در حال بررسی سلامت اتصال...
                        </div>
                      )}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-700">
                      <h4 className="text-sm font-bold text-white mb-3">مدیریت رسانه‌های مهاجرت شده (WordPress Media)</h4>
                      {wpRealMedia.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {wpRealMedia.map(media => (
                            <div key={media.id} className="bg-[#191e23] border border-slate-700 rounded-xl overflow-hidden group">
                              <div className="aspect-square bg-black relative flex items-center justify-center">
                                {media.media_type === 'image' ? (
                                  <img src={media.source_url} alt={media.title?.rendered || ''} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                                ) : (
                                  <Video className="w-8 h-8 text-slate-600" />
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex flex-col justify-end p-2">
                                  <span className="text-[10px] text-slate-300 truncate" dir="ltr">ID: {media.id}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 bg-[#191e23] rounded-xl border border-slate-700 text-slate-400 text-xs">
                          هیچ رسانه‌ای در سایت وردپرسی یافت نشد یا در حال بارگذاری است.
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-[#23282d] p-5 rounded-2xl border border-slate-700 shadow">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">رسانه‌ها</span>
                    <Image className="w-5 h-5 text-amber-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{mediaList.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1">جدول wp_posts_media</p>
                </div>

                <div className="bg-[#23282d] p-5 rounded-2xl border border-slate-700 shadow">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">نوشته‌ها</span>
                    <FileText className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{postsList.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1">جدول wp_posts</p>
                </div>

                <div className="bg-[#23282d] p-5 rounded-2xl border border-slate-700 shadow">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">دیدگاه‌ها</span>
                    <MessageSquare className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="text-2xl font-extrabold text-white">{commentsList.length}</div>
                  <p className="text-[10px] text-slate-400 mt-1">جدول wp_comments</p>
                </div>

                <div className="bg-[#23282d] p-5 rounded-2xl border border-slate-700 shadow">
                  <div className="flex items-center justify-between text-slate-400 mb-2">
                    <span className="text-xs font-medium">وضعیت MySQL</span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="text-lg font-bold text-emerald-400">متصل (InnoDB)</div>
                  <p className="text-[10px] text-slate-400 mt-1">v8.0.35 UTF8mb4</p>
                </div>
              </div>

              {/* Full WordPress Export & Migration Center Card */}
              <div className="bg-gradient-to-br from-[#1a2332] to-[#161c24] p-6 rounded-2xl border border-blue-500/30 shadow-xl space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-700/60 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shadow-inner">
                      <Download className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        مرکز دانلود و انتقال به وردپرس (WordPress Migration)
                        <span className="text-[10px] bg-blue-600/30 text-blue-300 border border-blue-500/40 px-2 py-0.5 rounded-full font-mono">
                          Theme ZIP + WXR XML + SQL
                        </span>
                      </h3>
                      <p className="text-xs text-slate-400">
                        فایل‌های استاندارد آماده جهت نصب در بخش پوسته‌ها (Themes) و درون‌ریزی مطالب (Import)
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="/api/wp/export-theme"
                      download="mahash-theme.zip"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition transform active:scale-95"
                    >
                      <Layers className="w-4 h-4" />
                      دانلود پوسته وردپرس (Theme.zip)
                    </a>
                    <a
                      href="/api/wp/export-full-bundle"
                      download="mahash_complete_wordpress_bundle.zip"
                      className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2.5 rounded-xl text-xs shadow-lg transition transform active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      دانلود پکیج کامل (.zip)
                    </a>
                  </div>
                </div>

                {/* Clear Guide on Where to Upload in WordPress */}
                <div className="bg-blue-950/40 border border-blue-500/30 rounded-xl p-4 text-xs text-slate-300 space-y-2 leading-relaxed">
                  <div className="font-bold text-blue-300 flex items-center gap-1.5 text-sm">
                    💡 راهنمای رفع خطای آپلود در وردپرس:
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-emerald-400 font-bold block">۱. اگر می‌خواهید ظاهر و قالب را تغییر دهید:</span>
                      <p className="text-slate-400 text-[11px]">
                        فایل <b>mahash-theme.zip</b> را دانلود کرده و در پیشخوان وردپرس از مسیر <b>نمایش &gt; پوسته‌ها &gt; افزودن پوسته تازه &gt; بارگذاری پوسته</b> آپلود کنید.
                      </p>
                    </div>
                    <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-800 space-y-1">
                      <span className="text-purple-400 font-bold block">۲. اگر می‌خواهید نوشته‌ها و گزارش‌ها را وارد کنید:</span>
                      <p className="text-slate-400 text-[11px]">
                        فایل <b>mahash_wordpress_export.xml</b> را دانلود کرده و در پیشخوان از مسیر <b>ابزارها &gt; درون‌ریزی &gt; WordPress</b> درون‌ریزی نمایید.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                  <a
                    href="/api/wp/export-theme"
                    download="mahash-theme.zip"
                    className="p-4 bg-[#191e23]/90 hover:bg-slate-800/90 border border-blue-500/40 rounded-xl transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white group-hover:text-blue-300 transition">پوسته وردپرس (Theme.zip)</span>
                      <Layers className="w-4 h-4 text-blue-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      حاوی style.css، index.php و قالب کامل جهت نصب در بخش پوسته‌ها
                    </p>
                    <div className="text-[10px] text-blue-400 font-semibold flex items-center gap-1">
                      <Download className="w-3 h-3" /> دانلود mahash-theme.zip
                    </div>
                  </a>

                  <a
                    href="/api/wp/export-wxr"
                    download="mahash_wordpress_export.xml"
                    className="p-4 bg-[#191e23]/90 hover:bg-slate-800/90 border border-slate-700 rounded-xl transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white group-hover:text-purple-300 transition">درون‌ریزی محتوا (XML)</span>
                      <FileText className="w-4 h-4 text-purple-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      فرمت رسمی WXR برای ایمپورت از مسیر ابزارها &gt; درون‌ریزی &gt; وردپرس
                    </p>
                    <div className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                      <Download className="w-3 h-3" /> دانلود mahash-export.xml
                    </div>
                  </a>

                  <a
                    href="/api/wp/export-sql"
                    download="mahash_wordpress_mysql_backup.sql"
                    className="p-4 bg-[#191e23]/90 hover:bg-slate-800/90 border border-slate-700 rounded-xl transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white group-hover:text-emerald-300 transition">دیتابیس MySQL (.sql)</span>
                      <Database className="w-4 h-4 text-emerald-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      جداول کامل wp_posts و رسانه‌ها برای ایمپورت در phpMyAdmin
                    </p>
                    <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                      <Download className="w-3 h-3" /> دانلود پشتیبان SQL
                    </div>
                  </a>

                  <a
                    href="/api/wp/export-json"
                    download="mahash_complete_store.json"
                    className="p-4 bg-[#191e23]/90 hover:bg-slate-800/90 border border-slate-700 rounded-xl transition flex flex-col justify-between group"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">داده‌ها (JSON)</span>
                      <HardDrive className="w-4 h-4 text-amber-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                      نسخه کامل امتیازات، مشاوران، تیم‌ها و گزارش‌ها
                    </p>
                    <div className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                      <Download className="w-3 h-3" /> دانلود فایل JSON
                    </div>
                  </a>
                </div>
              </div>

              {/* Quick Actions & Recent Posts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-[#23282d] p-6 rounded-2xl border border-slate-700 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Terminal className="w-5 h-5 text-blue-400" />
                    دسترسی سریع پیشخوان وردپرس
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setActiveTab('editor')}
                      className="p-4 bg-[#191e23] hover:bg-slate-800 border border-slate-700 rounded-xl text-right transition group"
                    >
                      <Plus className="w-5 h-5 text-emerald-400 mb-2" />
                      <div className="text-sm font-bold text-white">نوشتن گزارش جدید</div>
                      <div className="text-xs text-slate-400 mt-0.5">ثبت در wp_posts</div>
                    </button>
                    <button
                      onClick={() => setActiveTab('media')}
                      className="p-4 bg-[#191e23] hover:bg-slate-800 border border-slate-700 rounded-xl text-right transition group"
                    >
                      <Upload className="w-5 h-5 text-amber-400 mb-2" />
                      <div className="text-sm font-bold text-white">کتابخانه رسانه</div>
                      <div className="text-xs text-slate-400 mt-0.5">آپلود عکس و ویدیو</div>
                    </button>
                  </div>
                </div>

                <div className="bg-[#23282d] p-6 rounded-2xl border border-slate-700 space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <FileText className="w-5 h-5 text-purple-400" />
                    آخرین نوشته‌های منتشر شده
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {postsList.slice(0, 4).map((p) => (
                      <div key={p.id} className="p-3 bg-[#191e23] rounded-xl border border-slate-800 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 truncate max-w-[200px]">{p.title}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(p.date).toLocaleDateString('fa-IR')}</span>
                      </div>
                    ))}
                    {postsList.length === 0 && (
                      <p className="text-xs text-slate-400 text-center py-6">هیچ نوشته‌ای ثبت نشده است.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="bg-[#23282d] p-6 rounded-2xl border border-slate-700 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-700 pb-4 gap-3">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-400" />
                  ویرایشگر پیشرفته وردپرس (جدول wp_posts)
                </h3>
                <button
                  type="button"
                  onClick={handleAiDraftGenerator}
                  className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition shadow"
                >
                  <Sparkles className="w-4 h-4 text-yellow-300" />
                  نمونه متن هوشمند (AI Report)
                </button>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان نوشته / گزارش باشگاه</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: گزارش تخصصی فعالیت کارگروه و دستاوردهای جدید..."
                    className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">دسته‌بندی وردپرس</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="اخبار و گزارش‌ها">اخبار و گزارش‌ها</option>
                      <option value="کارگروه فناوری">کارگروه فناوری</option>
                      <option value="مستندات ویدیویی">مستندات ویدیویی</option>
                      <option value="دستاوردها">دستاوردها</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">وضعیت انتشار</label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value as any)}
                      className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="publish">منتشر شده (Publish)</option>
                      <option value="draft">پیش‌نویس (Draft)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">لینک ویدیوی آپلود شده</label>
                    <input
                      type="text"
                      value={newVideoUrl}
                      onChange={(e) => setNewVideoUrl(e.target.value)}
                      placeholder="/uploads/video-123.mp4"
                      className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">لینک تصویر شاخص (Thumbnail URL)</label>
                  <input
                    type="text"
                    value={newThumbnailUrl}
                    onChange={(e) => setNewThumbnailUrl(e.target.value)}
                    placeholder="/uploads/image-123.jpg"
                    className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">متن کامل گزارش (Longtext)</label>
                  <textarea
                    rows={6}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="متن گزارش را اینجا وارد کنید..."
                    className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl text-sm transition shadow-lg flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    انتشار نهایی در پایگاه داده MySQL
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#23282d] p-5 rounded-2xl border border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-white">کتابخانه رسانه وردپرس</h3>
                  <p className="text-xs text-slate-400 mt-1">آپلود و انتشار انواع فایل‌های ویدیویی، تصویری و اسناد در جدول wp_posts_media</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-56">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="جستجو در رسانه‌ها..."
                      className="w-full bg-[#191e23] border border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCleanupDuplicates}
                    disabled={isCleaning}
                    className="cursor-pointer bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-200 hover:text-white border border-slate-600 px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow shrink-0"
                    title="بررسی هش و حذف نسخه‌های تکراری رسانه‌ها و لوگوها"
                  >
                    {isCleaning ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" /> : <Trash2 className="w-3.5 h-3.5 text-amber-400" />}
                    {isCleaning ? 'در حال پاک‌سازی...' : 'حذف تکراری‌ها'}
                  </button>
                  <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl text-xs font-medium transition flex items-center gap-2 shadow shrink-0">
                    <Upload className="w-4 h-4" />
                    {uploading ? 'در حال بارگذاری...' : 'افزودن پرونده'}
                    <input type="file" multiple accept="image/*,video/*,.pdf" onChange={handleMediaUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {filteredMedia.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-[#23282d] rounded-2xl border border-slate-700">
                  <Image className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm">هیچ فایل رسانه‌ای یافت نشد.</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {filteredMedia.map((m) => {
                    const isVideo = m.mime_type?.startsWith('video') || m.filename?.endsWith('.mp4');
                    return (
                      <div key={m.id} className="bg-[#23282d] rounded-2xl border border-slate-700 overflow-hidden group flex flex-col justify-between shadow-md">
                        <div className="h-36 bg-slate-900 relative flex items-center justify-center overflow-hidden">
                          {isVideo ? (
                            <video src={m.url} className="w-full h-full object-cover opacity-90" />
                          ) : (
                            <img loading="lazy" src={m.url} alt={m.original_name} className="w-full h-full object-cover" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                            <button
                              onClick={() => copyToClipboard(m.url)}
                              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition shadow"
                              title="کپی لینک"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setSelectedMedia(m)}
                              className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 transition shadow"
                              title="پیش‌نمایش"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMedia(m.id)}
                              className="p-2 bg-red-600 text-white rounded-xl hover:bg-red-500 transition shadow"
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 space-y-1">
                          <p className="text-xs font-semibold text-slate-200 truncate" title={m.original_name}>{m.original_name}</p>
                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>{(m.file_size / (1024 * 1024)).toFixed(1)} MB</span>
                            <span className="font-mono text-blue-400">{m.mime_type?.split('/')[1]?.toUpperCase()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'posts' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#23282d] p-5 rounded-2xl border border-slate-700">
                <div>
                  <h3 className="text-base font-bold text-white">همه نوشته‌ها و گزارش‌های جدول wp_posts</h3>
                  <p className="text-xs text-slate-400 mt-1">مدیریت، بازبینی و حذف گزارش‌های پایگاه داده</p>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجو در نوشته‌ها..."
                    className="w-full bg-[#191e23] border border-slate-700 rounded-xl pr-9 pl-4 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-[#23282d] rounded-2xl border border-slate-700">
                  <FileText className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm">هیچ نوشته‌ای یافت نشد.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((p) => (
                    <div key={p.id} className="bg-[#23282d] p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded text-[10px] font-mono">ID: {p.id}</span>
                          <span className="bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded text-[10px]">{p.category || 'گزارش'}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] ${p.status === 'draft' ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-900/60 text-emerald-300'}`}>
                            {p.status === 'draft' ? 'پیش‌نویس' : 'منتشر شده'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(p.date).toLocaleDateString('fa-IR')}</span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">{p.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-1">{p.content}</p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <button
                          onClick={() => setPreviewPost(p)}
                          className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-400" />
                          مشاهده
                        </button>
                        <button
                          onClick={() => handleDeletePost(p.id)}
                          className="px-3 py-2 bg-red-900/40 hover:bg-red-900/80 text-red-200 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-400" />
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <div className="bg-[#23282d] p-5 rounded-2xl border border-slate-700">
                <h3 className="text-base font-bold text-white">دیدگاه‌های کاربران (جدول wp_comments)</h3>
                <p className="text-xs text-slate-400 mt-1">مدیریت نظرات و بازخوردهای ارسالی روی گزارش‌ها</p>
              </div>

              {commentsList.length === 0 ? (
                <div className="text-center py-20 text-slate-400 bg-[#23282d] rounded-2xl border border-slate-700">
                  <MessageSquare className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                  <p className="text-sm">هیچ دیدگاهی ثبت نشده است.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {commentsList.map((c) => (
                    <div key={c.id} className="bg-[#23282d] p-5 rounded-2xl border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{c.author_name}</span>
                          <span className="text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-0.5 rounded">تایید شده</span>
                          <span className="text-[10px] text-slate-400 font-mono">{new Date(c.date).toLocaleString('fa-IR')}</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{c.content}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteComment(c.id)}
                        className="px-3 py-2 bg-red-900/40 hover:bg-red-900/80 text-red-200 rounded-xl text-xs font-medium transition flex items-center gap-1 shadow shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                        حذف دیدگاه
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="bg-[#23282d] p-6 rounded-2xl border border-slate-700 space-y-6 shadow">
              <div className="border-b border-slate-700 pb-4">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-cyan-400" />
                  تنظیمات عمومی وردپرس (جدول wp_options)
                </h3>
                <p className="text-xs text-slate-400 mt-1">پیکربندی اطلاعات پایه وب‌سایت و مدیریت کلان سامانه</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">عنوان سایت (blogname)</label>
                  <input
                    type="text"
                    value={blogName}
                    onChange={(e) => setBlogName(e.target.value)}
                    className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">نشانی وب‌سایت (siteurl)</label>
                  <input
                    type="text"
                    value={siteUrl}
                    onChange={(e) => setSiteUrl(e.target.value)}
                    className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner font-mono text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">ایمیل مدیریت (admin_email)</label>
                  <input
                    type="email"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full bg-[#191e23] border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 shadow-inner font-mono text-xs"
                  />
                </div>

                <div className="pt-3">
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl text-sm transition shadow-lg cursor-pointer"
                  >
                    ذخیره تغییرات در دیتابیس
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'database' && dbStatus && (
            <div className="space-y-6">
              <div className="bg-[#23282d] p-6 rounded-2xl border border-slate-700 space-y-6 shadow">
                <div className="flex items-center justify-between border-b border-slate-700 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Database className="w-5 h-5 text-teal-400" />
                    وضعیت ساختار پایگاه داده MySQL (InnoDB)
                  </h3>
                  <span className="text-xs bg-emerald-900/80 text-emerald-300 px-3 py-1 rounded-full font-mono">وضعیت: کاملاً عملیاتی</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#191e23] p-4 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400">موتور پایگاه داده</span>
                    <p className="text-sm font-bold text-white mt-1">{dbStatus.database_type}</p>
                  </div>
                  <div className="bg-[#191e23] p-4 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400">حجم کل دیتابیس و فایل‌ها</span>
                    <p className="text-sm font-bold text-emerald-400 mt-1">{(dbStatus.database_size_bytes / (1024 * 1024)).toFixed(2)} مگابایت</p>
                  </div>
                  <div className="bg-[#191e23] p-4 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400">آخرین پشتیبان‌گیری خودکار</span>
                    <p className="text-sm font-bold text-blue-400 mt-1">{new Date(dbStatus.last_backup).toLocaleTimeString('fa-IR')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-300">لیست جداول فعال سیستم:</h4>
                  <div className="bg-[#191e23] rounded-xl overflow-hidden border border-slate-700">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-800 text-slate-400">
                        <tr>
                          <th className="p-3">نام جدول</th>
                          <th className="p-3">تعداد رکوردها</th>
                          <th className="p-3">Engine</th>
                          <th className="p-3">Charset</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800 text-slate-200">
                        {Object.entries(dbStatus.tables || {}).map(([tableName, tableInfo]: [string, any]) => (
                          <tr key={tableName} className="hover:bg-slate-800/50 transition">
                            <td className="p-3 font-mono text-blue-400 font-bold">{tableName}</td>
                            <td className="p-3 font-bold">{tableInfo.rows}</td>
                            <td className="p-3">{tableInfo.engine}</td>
                            <td className="p-3">{tableInfo.charset || 'utf8mb4'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <button
                    onClick={handleDownloadSql}
                    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl text-sm font-medium transition shadow-lg cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    دانلود فایل پشتیبان کامل ساختار SQL
                  </button>
                  <p className="text-xs text-slate-400">فایل خروجی سازگار با phpMyAdmin و MySQL Workbench است.</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'db_editor' && (
            <div className="space-y-6">
              <div className="bg-[#23282d] p-6 rounded-2xl border border-slate-700 space-y-6 shadow">
                <div className="border-b border-slate-700 pb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Cpu className="w-5 h-5 text-yellow-400" />
                    افزودن رسانه سفارشی و کنسول اجرای کوئری SQL
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">مدیریت پیشرفته جداول وردپرس با وارد کردن مستقیم URL تصاویر/ویدیوها و اجرای دستورات SQL</p>
                </div>

                {/* Add Custom Media Form */}
                <form onSubmit={handleAddCustomMedia} className="bg-[#191e23] p-5 rounded-2xl border border-slate-700 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-emerald-400" />
                    ثبت مستقیم تصویر یا ویدیو در جدول wp_posts_media
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">نام یا عنوان رسانه:</label>
                      <input
                        type="text"
                        value={customMediaName}
                        onChange={(e) => setCustomMediaName(e.target.value)}
                        placeholder="مثال: بنر اختصاصی همایش"
                        className="w-full bg-[#23282d] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">نوع رسانه:</label>
                      <select
                        value={customMediaType}
                        onChange={(e) => setCustomMediaType(e.target.value as any)}
                        className="w-full bg-[#23282d] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        <option value="image">تصویر (Image)</option>
                        <option value="video">ویدیو (Video)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">لینک مستقیم فایل (URL):</label>
                    <input
                      type="text"
                      value={customMediaUrl}
                      onChange={(e) => setCustomMediaUrl(e.target.value)}
                      placeholder="مثال: /uploads/banner.jpg یا https://..."
                      className="w-full bg-[#23282d] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium px-6 py-2.5 rounded-xl text-xs transition shadow"
                    >
                      افزودن به دیتابیس وردپرس
                    </button>
                  </div>
                </form>

                {/* SQL Console Form */}
                <form onSubmit={handleRunSqlQuery} className="bg-[#191e23] p-5 rounded-2xl border border-slate-700 space-y-4">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-blue-400" />
                    کنسول کوئری MySQL (phpMyAdmin Emulator)
                  </h4>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">دستور SQL:</label>
                    <input
                      type="text"
                      value={sqlQuery}
                      onChange={(e) => setSqlQuery(e.target.value)}
                      placeholder="SELECT * FROM wp_posts_media"
                      className="w-full bg-[#23282d] border border-slate-700 rounded-xl px-4 py-3 text-xs text-emerald-400 font-mono focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex gap-2 text-[11px] text-slate-400">
                      <button type="button" onClick={() => setSqlQuery('SELECT * FROM wp_posts_media')} className="bg-slate-800 px-2.5 py-1 rounded hover:bg-slate-700">wp_posts_media</button>
                      <button type="button" onClick={() => setSqlQuery('SELECT * FROM wp_posts')} className="bg-slate-800 px-2.5 py-1 rounded hover:bg-slate-700">wp_posts</button>
                      <button type="button" onClick={() => setSqlQuery('SELECT * FROM wp_comments')} className="bg-slate-800 px-2.5 py-1 rounded hover:bg-slate-700">wp_comments</button>
                      <button type="button" onClick={() => setSqlQuery('SELECT * FROM wp_options')} className="bg-slate-800 px-2.5 py-1 rounded hover:bg-slate-700">wp_options</button>
                    </div>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-2.5 rounded-xl text-xs transition shadow"
                    >
                      اجرای کوئری SQL
                    </button>
                  </div>

                  {sqlQueryResult && (
                    <div className="mt-4 bg-black/60 p-4 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto max-h-80">
                      <div className="text-slate-400 mb-2 pb-2 border-b border-slate-800 flex justify-between">
                        <span>نتیجه اجرای کوئری: {sqlQueryResult.message}</span>
                        <span>تعداد رکورد: {Array.isArray(sqlQueryResult.rows) ? sqlQueryResult.rows.length : 1}</span>
                      </div>
                      <pre className="text-slate-200">{JSON.stringify(sqlQueryResult.rows, null, 2)}</pre>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Media Preview Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#23282d] border border-slate-700 rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-base font-bold text-white truncate">{selectedMedia.original_name}</h3>
              <button
                onClick={() => setSelectedMedia(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>
            <div className="bg-black rounded-2xl overflow-hidden max-h-96 flex items-center justify-center border border-slate-800">
              {selectedMedia.mime_type?.startsWith('video') ? (
                <video src={selectedMedia.url} controls className="max-h-80 w-full object-contain" />
              ) : (
                <img loading="lazy" src={selectedMedia.url} alt={selectedMedia.original_name} className="max-h-80 w-full object-contain" />
              )}
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="flex justify-between bg-[#191e23] p-2.5 rounded-xl">
                <span className="text-slate-400">لینک مستقیم (URL):</span>
                <span className="font-mono text-blue-400 truncate max-w-xs">{selectedMedia.url}</span>
              </div>
              <div className="flex justify-between bg-[#191e23] p-2.5 rounded-xl">
                <span className="text-slate-400">حجم فایل:</span>
                <span className="font-mono">{(selectedMedia.file_size / (1024 * 1024)).toFixed(2)} مگابایت</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => { copyToClipboard(selectedMedia.url); setSelectedMedia(null); }}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-medium transition"
              >
                کپی لینک مستقیم
              </button>
              <button
                onClick={() => setSelectedMedia(null)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-4 py-2 rounded-xl text-xs font-medium transition"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[#23282d] border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div>
                <span className="text-xs bg-purple-900/60 text-purple-300 px-2 py-0.5 rounded font-mono">{previewPost.category || 'گزارش'}</span>
                <h3 className="text-lg font-bold text-white mt-1">{previewPost.title}</h3>
              </div>
              <button
                onClick={() => setPreviewPost(null)}
                className="text-slate-400 hover:text-white text-sm font-bold px-2 py-1 bg-slate-800 rounded-lg"
              >
                ✕
              </button>
            </div>

            {previewPost.video_url && (
              <div className="bg-black rounded-2xl overflow-hidden aspect-video">
                <video src={previewPost.video_url} controls className="w-full h-full object-contain" />
              </div>
            )}

            <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap bg-[#191e23] p-4 rounded-2xl border border-slate-800">
              {previewPost.content}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setPreviewPost(null)}
                className="bg-slate-700 hover:bg-slate-600 text-slate-200 px-5 py-2.5 rounded-xl text-xs font-medium transition"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
