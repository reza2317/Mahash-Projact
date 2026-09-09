import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { fetchAndMergeServerStore, getAllReports, subscribeToStoreUpdates } from './utils/reportsStore';
import { globalEventBus } from './utils/eventBus';
import { OfflineBanner } from './components/OfflineBanner';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { reportIndexedDBDatabases } from './utils/indexedDBHelper';
import { migrateAllClientMediaToWordPress } from './utils/mediaMigration';
import { initStorageMonitor } from './utils/storageMonitor';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider, useNotification } from './context/NotificationContext';
import { StatusNotification } from './components/StatusNotification';
import { ProgressTracker } from './components/ProgressTracker';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { MobileBottomBar } from './components/MobileBottomBar';
import { NewsTicker } from './components/NewsTicker';
import { BackToTop } from './components/BackToTop';
import { NetworkStatusIndicator } from './components/NetworkStatusIndicator';

import { HomePage } from './pages/HomePage';
import { TeamsHubPage } from './pages/TeamsHubPage';
import { TeamDetailPage } from './pages/TeamDetailPage';
import { ScoresPage } from './pages/ScoresPage';
import { MembershipPage } from './pages/MembershipPage';
import { ConsultationPage } from './pages/ConsultationPage';
import { EducationPage } from './pages/EducationPage';
import { EventsPage } from './pages/EventsPage';
import { ContactPage } from './pages/ContactPage';
import { ServicesPage } from './pages/ServicesPages';
import { AboutPages } from './pages/AboutPages';
import { AdminPage } from './pages/AdminPage';

function MainApp() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const { error: notifyError, warning: notifyWarning, success: notifySuccess, info: notifyInfo } = useNotification();

  // Listen for database write/sync failures and display clear user notifications
  useEffect(() => {
    const handleDbWriteError = (data?: { title?: string; message?: string }) => {
      notifyError(
        data?.title || 'خطا در ثبت پایگاه داده MySQL',
        data?.message || 'عملیات ذخیره‌سازی در پایگاه داده مرکزی با خطا مواجه شد و ثبت نشد.',
        6500
      );
    };

    const handleDbSyncError = (data?: { title?: string; message?: string }) => {
      notifyWarning(
        data?.title || 'خطا در همگام‌سازی اطلاعات',
        data?.message || 'دریافت یا ارسال اطلاعات به پایگاه داده با خطا مواجه شد.',
        5000
      );
    };

    const handleGenericNotification = (data?: { type?: 'success' | 'error' | 'warning' | 'info'; title?: string; message?: string; duration?: number }) => {
      if (!data) return;
      if (data.type === 'error') {
        notifyError(data.title || 'خطا', data.message, data.duration);
      } else if (data.type === 'warning') {
        notifyWarning(data.title || 'هشدار', data.message, data.duration);
      } else if (data.type === 'success') {
        notifySuccess(data.title || 'عملیات موفق', data.message, data.duration);
      } else {
        notifyInfo(data.title || 'اطلاعیه', data.message, data.duration);
      }
    };

    globalEventBus.on('DATABASE_WRITE_ERROR', handleDbWriteError);
    globalEventBus.on('DATABASE_SYNC_ERROR', handleDbSyncError);
    globalEventBus.on('SHOW_APP_NOTIFICATION', handleGenericNotification);

    return () => {
      globalEventBus.off('DATABASE_WRITE_ERROR', handleDbWriteError);
      globalEventBus.off('DATABASE_SYNC_ERROR', handleDbSyncError);
      globalEventBus.off('SHOW_APP_NOTIFICATION', handleGenericNotification);
    };
  }, [notifyError, notifyWarning, notifySuccess, notifyInfo]);

  // Auto-subscribe to reports store updates to immediately re-resolve links when server sync completes
  const [, setStoreVersion] = useState<number>(0);
  useEffect(() => {
    const unsub = subscribeToStoreUpdates(() => {
      setStoreVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  // Handle URL hash routing if present
  useEffect(() => {
    const handleHash = () => {
      const rawHash = window.location.hash;
      const hash = rawHash.replace(/^#\/?/, '').replace(/^#/, '');
      if (hash && hash !== '') {
        setCurrentPage(hash as string);
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const navigateTo = (page: string) => {
    setCurrentPage(page);
    window.location.hash = `#/${page}`;
    window.scrollTo(0, 0);
  };

  // Keyboard navigation across main pages
  useKeyboardNav({
    currentPage,
    onNavigate: navigateTo,
    enabled: true,
  });

  const renderContent = () => {
    // Dynamic report direct link hash routing
    // Handles formats:
    // - #/report-1788629792288
    // - #/team-thinker/report-1788629792288
    // - #report-report-1788629792288
    // - #/team-thinker#report-1788629792288
    const isReportRoute =
      currentPage.startsWith('report-') ||
      currentPage.includes('/report-') ||
      currentPage.includes('#report-') ||
      currentPage.includes('?report=');

    if (isReportRoute) {
      let explicitTeamSlug: string | undefined;
      let rawReportId = currentPage;

      if (currentPage.includes('/') || currentPage.includes('#')) {
        const segments = currentPage.split(/[/#]/);
        const teamSeg = segments.find((p) => p.startsWith('team-') || ['thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'].includes(p));
        if (teamSeg) {
          explicitTeamSlug = teamSeg.startsWith('team-') ? teamSeg : `team-${teamSeg}`;
        }
        const repSeg = segments.find((p) => p.includes('report-') || p.startsWith('rep-'));
        if (repSeg) rawReportId = repSeg;
      }

      const cleanReportId = rawReportId.replace(/^[#/]+/, '').replace(/^report-/, '').replace(/^report-/, '');
      const possibleIds = [
        rawReportId,
        cleanReportId,
        `report-${cleanReportId}`,
        `rep-${cleanReportId}`
      ];

      const allReports = getAllReports();
      const matchedReport = allReports.find((r) =>
        possibleIds.includes(r.id) ||
        possibleIds.some((pid) => r.id.endsWith(pid) || pid.endsWith(r.id))
      );
      
      let targetTeamSlug = matchedReport?.teamSlug || explicitTeamSlug;
      if (!targetTeamSlug) {
        if (currentPage.includes('angel') || currentPage.includes('فرشتگان')) {
          targetTeamSlug = 'team-angels';
        } else if (currentPage.includes('thinker') || currentPage.includes('متفکر')) {
          targetTeamSlug = 'team-thinker';
        } else if (currentPage.includes('tomorrow') || currentPage.includes('فردا')) {
          targetTeamSlug = 'team-tomorrow';
        } else if (currentPage.includes('ghorbani') || currentPage.includes('هادی')) {
          targetTeamSlug = 'team-ghorbani';
        } else if (currentPage.includes('silence') || currentPage.includes('سکوت')) {
          targetTeamSlug = 'team-silence';
        } else {
          targetTeamSlug = 'team-thinker';
        }
      }

      return (
        <TeamDetailPage
          teamSlug={targetTeamSlug}
          targetReportId={matchedReport?.id || (rawReportId.startsWith('report-') ? rawReportId : `report-${cleanReportId}`)}
          onNavigate={navigateTo}
        />
      );
    }

    // Dynamic team slug routing
    if (
      currentPage.startsWith('team-') ||
      ['thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'].includes(currentPage)
    ) {
      const cleanSlug = currentPage.startsWith('team-') ? currentPage : `team-${currentPage}`;
      return <TeamDetailPage teamSlug={cleanSlug} onNavigate={navigateTo} />;
    }

    switch (currentPage) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'teams-hub':
        return <TeamsHubPage onNavigate={navigateTo} />;
      case 'scores':
        return <ScoresPage onNavigate={navigateTo} />;
      case 'membership':
        return <MembershipPage onNavigate={navigateTo} />;
      case 'consultation':
        return <ConsultationPage onNavigate={navigateTo} />;
      case 'education':
        return <EducationPage onNavigate={navigateTo} />;
      case 'events':
        return <EventsPage onNavigate={navigateTo} />;
      case 'contact':
        return <ContactPage onNavigate={navigateTo} />;
      case 'rehab':
        return <ServicesPage pageType="rehab" onNavigate={navigateTo} />;
      case 'employment':
        return <ServicesPage pageType="employment" onNavigate={navigateTo} />;
      case 'marriage':
        return <ServicesPage pageType="marriage" onNavigate={navigateTo} />;
      case 'social-work':
        return <ServicesPage pageType="social-work" onNavigate={navigateTo} />;
      case 'about':
        return <AboutPages pageType="about" onNavigate={navigateTo} />;
      case 'history':
        return <AboutPages pageType="history" onNavigate={navigateTo} />;
      case 'mission':
        return <AboutPages pageType="mission" onNavigate={navigateTo} />;
      case 'goals':
        return <AboutPages pageType="goals" onNavigate={navigateTo} />;
      case 'statute':
        return <AboutPages pageType="statute" onNavigate={navigateTo} />;
      case 'admin':
        return <AdminPage onNavigate={navigateTo} />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
      <>
      <OfflineBanner />
      <div className="min-h-screen flex flex-col bg-[#f8fafc] dark:bg-slate-950 text-[#1e293b] dark:text-slate-100 font-sans antialiased selection:bg-[#173b82] dark:selection:bg-blue-600 selection:text-white pb-16 lg:pb-0 transition-colors duration-200">
      {/* Top Header Navigation */}
      <Header currentPage={currentPage} onNavigate={navigateTo} />

      {/* Live News Ticker */}
      <NewsTicker onNavigate={navigateTo} />

      {/* Main Page Body with Enhanced Page Transitions */}
      <main id="mahesh-main-content" className="flex-1 overflow-x-hidden relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, y: 8, scale: 0.998 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.998 }}
            transition={{
              duration: 0.22,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="w-full flex-1"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} currentPage={currentPage} />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomBar currentPage={currentPage} onNavigate={navigateTo} />

      {/* Floating Back to Top Button */}
      <BackToTop />

      {/* Toast Notifications */}
      <StatusNotification />

      {/* Network Status Offline/Online Warning Indicator */}
      <NetworkStatusIndicator />
    </div>
      </>
    );
}

export default function App() {
  usePerformanceMonitor();
  React.useEffect(() => { 
    // Quick initial sync with server store
    fetchAndMergeServerStore().catch(() => {});

    const cleanupStorage = initStorageMonitor();

    let lastRefocusSync = Date.now();
    const handleFocusOrVisible = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - lastRefocusSync > 30000) {
        lastRefocusSync = now;
        fetchAndMergeServerStore().catch(() => {});
      }
    };

    window.addEventListener('focus', handleFocusOrVisible);
    document.addEventListener('visibilitychange', handleFocusOrVisible);
    window.addEventListener('online', handleFocusOrVisible);

    // Periodic live sync every 45s only when tab is visible
    const syncInterval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchAndMergeServerStore().catch(() => {});
      }
    }, 45000);

    return () => {
      cleanupStorage();
      window.removeEventListener('focus', handleFocusOrVisible);
      document.removeEventListener('visibilitychange', handleFocusOrVisible);
      window.removeEventListener('online', handleFocusOrVisible);
      clearInterval(syncInterval);
    };
  }, []);

  return (
    <ThemeProvider>
      <NotificationProvider>
        <MainApp />
      </NotificationProvider>
    </ThemeProvider>
  );
}
