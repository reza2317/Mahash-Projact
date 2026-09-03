import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { fetchAndMergeServerStore } from './utils/reportsStore';
import { OfflineBanner } from './components/OfflineBanner';
import { usePerformanceMonitor } from './hooks/usePerformanceMonitor';
import { reportIndexedDBDatabases } from './utils/indexedDBHelper';
import { migrateAllClientMediaToWordPress } from './utils/mediaMigration';
import { initStorageMonitor } from './utils/storageMonitor';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
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

  // Handle URL hash routing if present
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
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

      {/* Main Page Body */}
      <main id="mahesh-main-content" className="flex-1 overflow-x-hidden">
        <motion.div
          key={currentPage}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          {renderContent()}
        </motion.div>
      </main>

      {/* Footer */}
      <Footer onNavigate={navigateTo} />

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

    const handleFocusOrVisible = () => {
      if (document.visibilityState === 'visible') {
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
