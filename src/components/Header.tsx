import React, { useState, useEffect } from 'react';
import { PageId } from '../types';
import { ThemeToggle } from './ThemeToggle';
import { GlobalSearchModal } from './GlobalSearchModal';
import { isAdminAuthenticated, subscribeToStoreUpdates, getMahashLogo } from '../utils/reportsStore';
import { ResponsiveImage } from './ResponsiveImage';
import { MAHESH_LOGO_SVG } from '../utils/assets';
import { ChevronDown, Menu, X, Users, MessageSquare, Phone, BookOpen, UserPlus, ShieldCheck, Search } from 'lucide-react';

interface HeaderProps {
  currentPage: PageId;
  onNavigate: (page: PageId) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenu, setMobileSubmenu] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminAuthenticated());
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [logoSrc, setLogoSrc] = useState<string>(getMahashLogo());

  useEffect(() => {
    const updateHeaderState = () => {
      setIsAdmin(isAdminAuthenticated());
      setLogoSrc(getMahashLogo());
    };
    updateHeaderState();
    const unsub = subscribeToStoreUpdates(updateHeaderState);
    return () => unsub();
  }, []);

  // Global keyboard shortcut for search (Ctrl+K or /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleNav = (page: PageId) => {
    onNavigate(page);
    setMobileMenuOpen(false);
    setMobileSubmenu(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleSubmenu = (name: string) => {
    setMobileSubmenu(mobileSubmenu === name ? null : name);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[74px] gap-3">
          {/* Brand */}
          <button
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 text-right group cursor-pointer focus:outline-none"
            aria-label="صفحه اصلی موسسه محاش"
          >
            <div className="brand-logo-responsive rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-0.5 shadow-xs group-hover:shadow transition flex-shrink-0">
              <ResponsiveImage
                src={logoSrc}
                fallbackSrc={MAHESH_LOGO_SVG}
                alt="لوگوی مؤسسه محاش"
                className="w-full h-full object-contain img-sharp"
                priority={true}
              />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-[#173b82] dark:text-blue-400 text-base md:text-lg leading-snug group-hover:text-[#0f275a] dark:group-hover:text-blue-300 transition">
                موسسه محاش
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium hidden sm:inline-block">
                (حمایت از افراد با افت شنوایی)
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {/* خانه */}
            <button
              onClick={() => handleNav('home')}
              className={`relative px-3.5 py-2 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                currentPage === 'home'
                  ? 'text-[#173b82] dark:text-sky-300 bg-blue-100/80 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-b hover:from-blue-50 hover:to-indigo-50/60 dark:hover:from-blue-950/50 dark:hover:to-slate-800/60 hover:shadow-xs hover:-translate-y-0.5'
              }`}
            >
              <span>خانه</span>
            </button>

            {/* خدمات محاش Dropdown */}
            <div className="relative group">
              <button
                className={`px-3.5 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  ['rehab', 'employment', 'marriage', 'social-work', 'consultation', 'education'].includes(currentPage)
                    ? 'text-[#173b82] dark:text-sky-300 bg-blue-100/80 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-b hover:from-blue-50 hover:to-indigo-50/60 dark:hover:from-blue-950/50 dark:hover:to-slate-800/60 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span>خدمات محاش</span>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-[#1d4ed8] dark:group-hover:text-sky-300 group-hover:rotate-180 transition-all duration-200" />
              </button>

              <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100/80 dark:border-blue-900/50 p-2 flex flex-col gap-1 text-right">
                  <button
                    onClick={() => handleNav('education')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base group-hover/item:scale-110 transition-transform">🎓</span>
                      <span className="group-hover/item:font-bold">آموزش و توان‌افزایی</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('rehab')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base group-hover/item:scale-110 transition-transform">🦻</span>
                      <span className="group-hover/item:font-bold">توانبخشی و گفتاردرمانی</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('employment')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base group-hover/item:scale-110 transition-transform">💼</span>
                      <span className="group-hover/item:font-bold">اشتغال و کارآفرینی</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('marriage')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base group-hover/item:scale-110 transition-transform">💍</span>
                      <span className="group-hover/item:font-bold">ازدواج و پیوند مهر</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('social-work')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base group-hover/item:scale-110 transition-transform">🤝</span>
                      <span className="group-hover/item:font-bold">مددکاری و حمایت اجتماعی</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('consultation')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-[#0f766e] dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/50 hover:bg-gradient-to-l hover:from-teal-100 hover:to-emerald-100/90 dark:hover:from-teal-900/70 dark:hover:to-emerald-950/70 hover:text-[#115e59] dark:hover:text-teal-200 rounded-xl text-right font-bold transition-all duration-150 flex items-center justify-between cursor-pointer border border-teal-100 dark:border-teal-900/60"
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base group-hover/item:scale-110 transition-transform">🧠</span>
                      <span>مشاوره و روانشناسی</span>
                    </span>
                    <span className="text-xs text-teal-600 dark:text-teal-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                </div>
              </div>
            </div>

            {/* باشگاه جوانان Dropdown (with nested Team Names) */}
            <div className="relative group">
              <button
                className={`px-3.5 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  ['teams-hub', 'team-thinker', 'team-tomorrow', 'team-angels', 'team-ghorbani', 'team-silence', 'scores'].includes(currentPage)
                    ? 'text-[#173b82] dark:text-sky-300 bg-blue-100/80 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-b hover:from-blue-50 hover:to-indigo-50/60 dark:hover:from-blue-950/50 dark:hover:to-slate-800/60 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span>باشگاه جوانان</span>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-[#1d4ed8] dark:group-hover:text-sky-300 group-hover:rotate-180 transition-all duration-200" />
              </button>

              <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="w-64 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100/80 dark:border-blue-900/50 p-2 flex flex-col gap-1 text-right">
                  {/* Nested Team links */}
                  <div className="relative group/nested">
                    <button
                      onClick={() => handleNav('teams-hub')}
                      className="group/item w-full px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-bold transition-all duration-150 flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <span>👥</span>
                        <span>اسامی ۵ تیم باشگاه</span>
                      </span>
                      <span className="text-xs text-blue-500 dark:text-sky-400 group-hover/nested:rotate-180 transition-transform">◀</span>
                    </button>
                    {/* Nested Submenu on Left (in RTL) */}
                    <div className="absolute right-full top-0 pr-2 opacity-0 translate-x-2 pointer-events-none group-hover/nested:opacity-100 group-hover/nested:translate-x-0 group-hover/nested:pointer-events-auto transition-all duration-200">
                      <div className="w-60 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100/80 dark:border-blue-900/50 p-2 flex flex-col gap-1 text-right">
                        <button
                          onClick={() => handleNav('team-thinker')}
                          className="group/sub w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/70 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span>🧠</span>
                            <span className="group-hover/sub:font-bold">تیم مغز متفکر</span>
                          </span>
                          <span className="text-xs opacity-0 group-hover/sub:opacity-100 text-blue-600 dark:text-blue-400">◀</span>
                        </button>
                        <button
                          onClick={() => handleNav('team-tomorrow')}
                          className="group/sub w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/70 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span>🌱</span>
                            <span className="group-hover/sub:font-bold">تیم باشگاه فردا</span>
                          </span>
                          <span className="text-xs opacity-0 group-hover/sub:opacity-100 text-emerald-600 dark:text-emerald-400">◀</span>
                        </button>
                        <button
                          onClick={() => handleNav('team-angels')}
                          className="group/sub w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/70 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span>🪽</span>
                            <span className="group-hover/sub:font-bold">تیم فرشتگان ناشنوایان</span>
                          </span>
                          <span className="text-xs opacity-0 group-hover/sub:opacity-100 text-purple-600 dark:text-purple-400">◀</span>
                        </button>
                        <button
                          onClick={() => handleNav('team-ghorbani')}
                          className="group/sub w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/70 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span>🤝</span>
                            <span className="group-hover/sub:font-bold">تیم قربونی</span>
                          </span>
                          <span className="text-xs opacity-0 group-hover/sub:opacity-100 text-amber-600 dark:text-amber-400">◀</span>
                        </button>
                        <button
                          onClick={() => handleNav('team-silence')}
                          className="group/sub w-full px-3.5 py-2 text-sm text-slate-700 dark:text-slate-200 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-cyan-950/70 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                        >
                          <span className="flex items-center gap-2">
                            <span>〰️</span>
                            <span className="group-hover/sub:font-bold">تیم آوای سکوت</span>
                          </span>
                          <span className="text-xs opacity-0 group-hover/sub:opacity-100 text-cyan-600 dark:text-cyan-400">◀</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleNav('teams-hub')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>🌟</span>
                      <span className="group-hover/item:font-bold">معرفی و اهداف تیم‌ها</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('scores')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/50 hover:bg-gradient-to-l hover:from-amber-100 hover:to-orange-100/90 dark:hover:from-amber-900/70 dark:hover:to-orange-950/70 hover:text-amber-900 dark:hover:text-amber-200 rounded-xl text-right font-bold transition-all duration-150 flex items-center justify-between cursor-pointer border border-amber-200 dark:border-amber-900/60"
                  >
                    <span className="flex items-center gap-2">
                      <span>🏆</span>
                      <span>جدول امتیازات تیم‌ها</span>
                    </span>
                    <span className="text-xs text-amber-600 dark:text-amber-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                </div>
              </div>
            </div>

            {/* درباره ما Dropdown */}
            <div className="relative group">
              <button
                className={`px-3.5 py-2 text-sm font-bold rounded-xl flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
                  ['about', 'history', 'mission', 'goals', 'statute'].includes(currentPage)
                    ? 'text-[#173b82] dark:text-sky-300 bg-blue-100/80 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-200 dark:ring-blue-800'
                    : 'text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-b hover:from-blue-50 hover:to-indigo-50/60 dark:hover:from-blue-950/50 dark:hover:to-slate-800/60 hover:shadow-xs hover:-translate-y-0.5'
                }`}
              >
                <span>درباره ما</span>
                <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-400 group-hover:text-[#1d4ed8] dark:group-hover:text-sky-300 group-hover:rotate-180 transition-all duration-200" />
              </button>

              <div className="absolute right-0 top-full pt-2 opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50">
                <div className="w-56 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl shadow-2xl border border-blue-100/80 dark:border-blue-900/50 p-2 flex flex-col gap-1 text-right">
                  <button
                    onClick={() => handleNav('about')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>🏛️</span>
                      <span className="group-hover/item:font-bold">معرفی موسسه</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('history')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>📜</span>
                      <span className="group-hover/item:font-bold">تاریخچه و تاسیس</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('mission')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>🎯</span>
                      <span className="group-hover/item:font-bold">چشم‌انداز و رسالت</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('goals')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>🚀</span>
                      <span className="group-hover/item:font-bold">اهداف و برنامه‌ها</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                  <button
                    onClick={() => handleNav('statute')}
                    className="group/item w-full px-3.5 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-l hover:from-blue-50 hover:to-indigo-50/80 dark:hover:from-blue-950/70 dark:hover:to-slate-800 rounded-xl text-right font-medium transition-all duration-150 flex items-center justify-between cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <span>📑</span>
                      <span className="group-hover/item:font-bold">اساسنامه رسمی</span>
                    </span>
                    <span className="text-xs opacity-0 group-hover/item:opacity-100 text-[#1d4ed8] dark:text-sky-400 group-hover/item:translate-x-[-3px] transition-all">◀</span>
                  </button>
                </div>
              </div>
            </div>

            {/* رویدادها */}
            <button
              onClick={() => handleNav('events')}
              className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                currentPage === 'events'
                  ? 'text-[#173b82] dark:text-sky-300 bg-blue-100/80 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-b hover:from-blue-50 hover:to-indigo-50/60 dark:hover:from-blue-950/50 dark:hover:to-slate-800/60 hover:shadow-xs hover:-translate-y-0.5'
              }`}
            >
              <span>رویدادها</span>
            </button>

            {/* تماس با ما */}
            <button
              onClick={() => handleNav('contact')}
              className={`px-3.5 py-2 text-sm font-bold rounded-xl transition-all duration-200 cursor-pointer ${
                currentPage === 'contact'
                  ? 'text-[#173b82] dark:text-sky-300 bg-blue-100/80 dark:bg-blue-950/80 shadow-xs ring-1 ring-blue-200 dark:ring-blue-800'
                  : 'text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-gradient-to-b hover:from-blue-50 hover:to-indigo-50/60 dark:hover:from-blue-950/50 dark:hover:to-slate-800/60 hover:shadow-xs hover:-translate-y-0.5'
              }`}
            >
              <span>تماس با ما</span>
            </button>
          </nav>

          {/* Action Area & Theme Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* Global Search Button */}
            <button
              onClick={() => setSearchOpen(true)}
              className="p-2 sm:px-3 sm:py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-[#173b82] dark:hover:text-sky-300 transition-all flex items-center gap-2 cursor-pointer shadow-xs shrink-0"
              title="جستجوی سراسری (Ctrl+K)"
              aria-label="جستجو در سایت"
            >
              <Search className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
              <span className="text-xs font-bold hidden md:inline">جستجو</span>
              <kbd className="hidden xl:inline-block text-[10px] font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-400">
                Ctrl+K
              </kbd>
            </button>

            {/* Theme & Accessibility Switcher */}
            <ThemeToggle />

            {/* Admin Portal Shortcut Button - only visible when logged in or already on admin page */}
            {(isAdmin || currentPage === 'admin') && (
              <button
                onClick={() => handleNav('admin')}
                className={`p-2 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  currentPage === 'admin'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-100'
                }`}
                title="پنل مدیریت محاش"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span className="text-xs font-bold hidden md:inline">پنل مدیریت</span>
              </button>
            )}

            {/* Action Button (عضویت در محاش) - Fully Responsive & Non-Stretching */}
            <button
              onClick={() => handleNav('membership')}
              className="inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-black text-white bg-gradient-to-r from-[#173b82] to-[#2563eb] hover:from-[#0f275a] hover:to-[#1d4ed8] dark:from-blue-600 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:to-indigo-500 rounded-full shadow-xs hover:shadow-md hover:shadow-blue-500/20 active:scale-95 transition-all duration-200 cursor-pointer ring-1 ring-blue-300/30 whitespace-nowrap shrink-0 max-w-fit"
              title="عضویت در موسسه محاش"
            >
              <UserPlus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
              <span className="hidden sm:inline">عضویت در محاش</span>
              <span className="sm:hidden">عضویت</span>
            </button>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-slate-700 dark:text-slate-200 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-800 transition focus:outline-none cursor-pointer shrink-0"
              aria-label={mobileMenuOpen ? 'بستن منو' : 'باز کردن منو'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-[74px] bottom-0 bg-slate-900/60 backdrop-blur-xs z-50">
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 max-h-[85vh] overflow-y-auto px-4 py-6 flex flex-col gap-2 shadow-2xl transition-colors">
            {/* Mobile Search Bar inside drawer */}
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                setSearchOpen(true);
              }}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold mb-2 border border-slate-200 dark:border-slate-700 cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>جستجو در سایت و تیم‌ها...</span>
              </span>
              <span className="text-xs text-slate-400">🔍</span>
            </button>

            {/* Mobile Theme Panel inside drawer */}
            <div className="pb-3 mb-2 border-b border-slate-100 dark:border-slate-800">
              <ThemeToggle variant="expanded" />
            </div>

            <button
              onClick={() => handleNav('home')}
              className={`w-full text-right px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-between ${
                currentPage === 'home'
                  ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/70'
                  : 'text-slate-800 dark:text-slate-100 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <span>🏠 خانه</span>
              <span className="text-xs text-slate-400">◀</span>
            </button>

            {/* Mobile خدمات Accordion */}
            <div>
              <button
                onClick={() => toggleSubmenu('services')}
                className={`w-full text-right px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-between ${
                  ['rehab', 'employment', 'marriage', 'social-work', 'consultation', 'education'].includes(currentPage)
                    ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/70'
                    : 'text-slate-800 dark:text-slate-100 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50/70 dark:hover:bg-slate-800'
                }`}
              >
                <span>🏢 خدمات محاش</span>
                <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${mobileSubmenu === 'services' ? 'rotate-180 text-[#1d4ed8] dark:text-sky-300' : ''}`} />
              </button>
              {mobileSubmenu === 'services' && (
                <div className="pr-6 pl-2 py-2 flex flex-col gap-1 border-r-2 border-blue-400 dark:border-blue-600 mr-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-l-xl">
                  <button onClick={() => handleNav('education')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🎓 آموزش و توان‌افزایی</button>
                  <button onClick={() => handleNav('rehab')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🦻 توانبخشی و گفتاردرمانی</button>
                  <button onClick={() => handleNav('employment')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">💼 اشتغال و کارآفرینی</button>
                  <button onClick={() => handleNav('marriage')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">💍 ازدواج و پیوند مهر</button>
                  <button onClick={() => handleNav('social-work')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🤝 مددکاری و حمایت اجتماعی</button>
                  <button onClick={() => handleNav('consultation')} className="text-right py-2 px-2 text-sm text-[#0f766e] dark:text-teal-300 bg-teal-50/80 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 rounded-lg transition font-bold">🧠 مشاوره و روانشناسی</button>
                </div>
              )}
            </div>

            {/* Mobile باشگاه جوانان Accordion */}
            <div>
              <button
                onClick={() => toggleSubmenu('youth')}
                className={`w-full text-right px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-between ${
                  ['teams-hub', 'team-thinker', 'team-tomorrow', 'team-angels', 'team-ghorbani', 'team-silence', 'scores'].includes(currentPage)
                    ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/70'
                    : 'text-slate-800 dark:text-slate-100 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50/70 dark:hover:bg-slate-800'
                }`}
              >
                <span>👥 باشگاه جوانان</span>
                <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${mobileSubmenu === 'youth' ? 'rotate-180 text-[#1d4ed8] dark:text-sky-300' : ''}`} />
              </button>
              {mobileSubmenu === 'youth' && (
                <div className="pr-6 pl-2 py-2 flex flex-col gap-1 border-r-2 border-indigo-400 dark:border-indigo-600 mr-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-l-xl">
                  <button onClick={() => handleNav('teams-hub')} className="text-right py-2 px-2 text-sm font-bold text-[#1d4ed8] dark:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition">🌟 اسامی و معرفی تیم‌ها</button>
                  <button onClick={() => handleNav('team-thinker')} className="text-right py-1.5 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🧠 تیم مغز متفکر</button>
                  <button onClick={() => handleNav('team-tomorrow')} className="text-right py-1.5 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🌱 تیم باشگاه فردا</button>
                  <button onClick={() => handleNav('team-angels')} className="text-right py-1.5 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🪽 تیم فرشتگان ناشنوایان</button>
                  <button onClick={() => handleNav('team-ghorbani')} className="text-right py-1.5 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-300 hover:bg-amber-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🤝 تیم قربونی</button>
                  <button onClick={() => handleNav('team-silence')} className="text-right py-1.5 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 hover:bg-cyan-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">〰️ تیم آوای سکوت</button>
                  <button onClick={() => handleNav('scores')} className="text-right py-2 px-2 text-sm font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 rounded-lg transition mt-1">🏆 جمع‌بندی امتیازات تیم‌ها</button>
                </div>
              )}
            </div>

            {/* Mobile درباره ما Accordion */}
            <div>
              <button
                onClick={() => toggleSubmenu('about')}
                className={`w-full text-right px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-between ${
                  ['about', 'history', 'mission', 'goals', 'statute'].includes(currentPage)
                    ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/70'
                    : 'text-slate-800 dark:text-slate-100 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50/70 dark:hover:bg-slate-800'
                }`}
              >
                <span>🏛️ درباره ما</span>
                <ChevronDown className={`w-4 h-4 transition-transform text-slate-400 ${mobileSubmenu === 'about' ? 'rotate-180 text-[#1d4ed8] dark:text-sky-300' : ''}`} />
              </button>
              {mobileSubmenu === 'about' && (
                <div className="pr-6 pl-2 py-2 flex flex-col gap-1 border-r-2 border-slate-400 dark:border-slate-600 mr-4 bg-slate-50/60 dark:bg-slate-800/40 rounded-l-xl">
                  <button onClick={() => handleNav('about')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🏛️ معرفی موسسه</button>
                  <button onClick={() => handleNav('history')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">📜 تاریخچه و تاسیس</button>
                  <button onClick={() => handleNav('mission')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🎯 چشم‌انداز و رسالت</button>
                  <button onClick={() => handleNav('goals')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">🚀 اهداف و برنامه‌ها</button>
                  <button onClick={() => handleNav('statute')} className="text-right py-2 px-2 text-sm text-slate-700 dark:text-slate-300 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50 dark:hover:bg-slate-700/60 rounded-lg transition font-medium">📑 اساسنامه رسمی</button>
                </div>
              )}
            </div>

            <button
              onClick={() => handleNav('events')}
              className={`w-full text-right px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-between ${
                currentPage === 'events'
                  ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/70'
                  : 'text-slate-800 dark:text-slate-100 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <span>📅 رویدادها و همایش‌ها</span>
              <span className="text-xs text-slate-400">◀</span>
            </button>
            <button
              onClick={() => handleNav('contact')}
              className={`w-full text-right px-4 py-2.5 rounded-xl font-bold transition flex items-center justify-between ${
                currentPage === 'contact'
                  ? 'text-[#173b82] dark:text-sky-300 bg-blue-50 dark:bg-blue-950/70'
                  : 'text-slate-800 dark:text-slate-100 hover:text-[#1d4ed8] dark:hover:text-sky-300 hover:bg-blue-50/70 dark:hover:bg-slate-800'
              }`}
            >
              <span>📞 تماس با ما</span>
              <span className="text-xs text-slate-400">◀</span>
            </button>
            <button
              onClick={() => handleNav('membership')}
              className="w-full text-center mt-2 px-4 py-3 rounded-xl font-black text-white bg-gradient-to-r from-[#173b82] to-[#2563eb] hover:from-[#0f275a] hover:to-[#1d4ed8] dark:from-blue-600 dark:to-indigo-600 transition shadow-lg flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>فرم ثبت‌نام و عضویت محاش</span>
            </button>
          </div>
        </div>
      )}

      {/* Global Search Modal Component */}
      <GlobalSearchModal
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onNavigate={handleNav}
      />
    </header>
  );
};

