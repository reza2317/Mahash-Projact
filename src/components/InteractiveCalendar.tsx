import React, { useState, useMemo, useEffect } from 'react';
import { EventItem, EventCategory, PageId } from '../types';
import { EVENT_CATEGORIES } from '../data/eventsData';
import { getAllEvents, subscribeToStoreUpdates } from '../utils/reportsStore';
import {
  PERSIAN_MONTHS,
  PERSIAN_WEEKDAYS,
  toPersianDigits,
  getJalaliMonthDays,
  getJalaliFirstDayOfWeek
} from '../utils/persianDate';
import {
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronLeft,
  Clock,
  MapPin,
  User,
  CheckCircle2,
  Share2,
  CalendarPlus,
  Search,
  Filter,
  Layers,
  Sparkles,
  Award,
  Video,
  Users,
  Info,
  X,
  Send,
  Ticket,
  Check
} from 'lucide-react';

interface InteractiveCalendarProps {
  onNavigate?: (page: PageId) => void;
  compact?: boolean;
  initialCategory?: string;
  className?: string;
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({
  onNavigate,
  compact = false,
  initialCategory = 'all',
  className = ''
}) => {
  // Calendar Navigation State (Default to Shahrivar 1405 = Month 6)
  const [currentYear, setCurrentYear] = useState<number>(1405);
  const [currentMonth, setCurrentMonth] = useState<number>(6); // 6 = Shahrivar
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Filters & View Modes
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>(compact ? 'list' : 'calendar');

  // Modal State for Event Details & Registration
  const [activeEventModal, setActiveEventModal] = useState<EventItem | null>(null);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [registrationForm, setRegistrationForm] = useState({
    fullName: '',
    phone: '',
    email: '',
    needsSignLanguage: true,
    needsFrontSeat: false,
    attendeesCount: '1',
    notes: ''
  });

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
    setSelectedDay(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
    setSelectedDay(null);
  };

  const handleResetToToday = () => {
    setCurrentYear(1405);
    setCurrentMonth(6);
    setSelectedDay(6); // Default highlight Shahrivar 6
  };

  // Dynamic events from store
  const [allEvents, setAllEvents] = useState<EventItem[]>(() => getAllEvents());

  useEffect(() => {
    const refresh = () => setAllEvents(getAllEvents());
    const unsub = subscribeToStoreUpdates(refresh);
    return () => unsub();
  }, []);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Category filter
      if (selectedCategory !== 'all' && event.category !== selectedCategory) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = event.title.toLowerCase().includes(query);
        const matchesDesc = event.description.toLowerCase().includes(query);
        const matchesInstructor = event.instructor?.toLowerCase().includes(query) || false;
        const matchesLocation = event.location.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesInstructor && !matchesLocation) {
          return false;
        }
      }
      return true;
    });
  }, [selectedCategory, searchQuery]);

  // Events for the current month in view
  const currentMonthEvents = useMemo(() => {
    return filteredEvents.filter(
      (e) => e.jalaliYear === currentYear && e.jalaliMonth === currentMonth
    );
  }, [filteredEvents, currentYear, currentMonth]);

  // Events on the selected day (or all month events if no day selected)
  const displayedEvents = useMemo(() => {
    if (viewMode === 'list') {
      return filteredEvents;
    }
    if (selectedDay !== null) {
      return currentMonthEvents.filter((e) => e.jalaliDay === selectedDay);
    }
    return currentMonthEvents;
  }, [viewMode, filteredEvents, currentMonthEvents, selectedDay]);

  // Calendar Grid Computations
  const daysInCurrentMonth = getJalaliMonthDays(currentYear, currentMonth);
  const firstDayOfWeek = getJalaliFirstDayOfWeek(currentYear, currentMonth);

  // Map of events by day number
  const eventsByDay = useMemo(() => {
    const map: Record<number, EventItem[]> = {};
    currentMonthEvents.forEach((ev) => {
      if (!map[ev.jalaliDay]) {
        map[ev.jalaliDay] = [];
      }
      map[ev.jalaliDay].push(ev);
    });
    return map;
  }, [currentMonthEvents]);

  // Registration handler
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!registrationForm.fullName || !registrationForm.phone) {
      showToast('لطفاً نام و شماره تماس خود را وارد نمایید.');
      return;
    }
    setIsRegistering(true);
    setTimeout(() => {
      setIsRegistering(false);
      setRegistrationSuccess(true);
    }, 800);
  };

  // Export event to ICS / Calendar reminder
  const handleAddToCalendar = (event: EventItem) => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Mahash Youth Club//Event Calendar//FA',
      'BEGIN:VEVENT',
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description.replace(/\n/g, ' ')}`,
      `LOCATION:${event.location}`,
      `STATUS:CONFIRMED`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `mahash-event-${event.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('فایل تقویم (.ics) با موفقیت دریافت شد.');
  };

  // Share Event
  const handleShareEvent = (event: EventItem) => {
    const text = `رویداد موسسه محاش: ${event.title}\n📅 تاریخ: ${event.dateJalali} (${event.dayOfWeek}) - ساعت ${event.time}\n📍 مکان: ${event.location}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      showToast('مشخصات رویداد در کلیپ‌بورد کپی شد!');
    } else {
      showToast('اطلاعات رویداد آماده اشتراک‌گذاری است.');
    }
  };

  const getCategoryBadgeClass = (category: EventCategory) => {
    switch (category) {
      case 'workshop':
        return 'bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'conference':
        return 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'youth-club':
        return 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      case 'webinar':
        return 'bg-teal-100 dark:bg-teal-950/80 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-800';
      case 'cultural-sports':
        return 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      default:
        return 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className={`space-y-6 ${className}`} id="interactive-calendar-section">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 dark:bg-slate-100/95 text-white dark:text-slate-900 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold backdrop-blur-md animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 1. Header & Controls */}
      <div className="bg-white dark:bg-slate-800 rounded-3xl p-4 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Title and Badge */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-[#173b82] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>تقویم تعاملی برنامه‌ها</span>
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-600">
                {toPersianDigits(filteredEvents.length)} برنامه ثبت‌شده
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
              رویدادها، همایش‌ها و کارگاه‌های آموزشی محاش
            </h2>
          </div>

          {/* View Mode & Jump to Current Month */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleResetToToday}
              aria-label="پرش به ماه جاری تقویم، شهریور ۱۴۰۵"
              className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-200/60 dark:border-slate-600"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
              <span>ماه جاری (شهریور ۱۴۰۵)</span>
            </button>

            <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-xl flex items-center gap-1 border border-slate-200 dark:border-slate-600" role="group" aria-label="انتخاب نحوه نمایش رویدادها">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                aria-pressed={viewMode === 'calendar'}
                aria-label="نمایش نمای تقویم ماهانه"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-800 text-[#173b82] dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                <span>تقویم ماهانه</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-pressed={viewMode === 'list'}
                aria-label="نمایش فهرست و تایم‌لاین رویدادها"
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-800 text-[#173b82] dark:text-blue-300 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" aria-hidden="true" />
                <span>فهرست رویدادها</span>
              </button>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Pills */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute right-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
            <input
              type="text"
              role="searchbox"
              aria-label="جستجو در عنوان برنامه، نام مدرس، موضوع یا مکان برگزاری"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در عنوان برنامه، نام مدرس، موضوع یا مکان برگزاری..."
              className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#173b82] dark:focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="پاک کردن متن جستجوی رویدادها"
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Categories Horizontal Scroll */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs" role="group" aria-label="فیلتر دسته‌بندی برنامه‌ها">
            <span className="text-slate-400 dark:text-slate-500 font-bold shrink-0 flex items-center gap-1" aria-hidden="true">
              <Filter className="w-3 h-3" />
              دسته‌بندی:
            </span>
            {EVENT_CATEGORIES.map((cat) => {
              const count =
                cat.id === 'all'
                  ? allEvents.length
                  : allEvents.filter((e) => e.category === cat.id).length;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  aria-pressed={isSelected}
                  aria-label={`فیلتر رویدادهای ${cat.label} (${count} مورد)`}
                  className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#173b82] text-white shadow-md scale-102 dark:bg-blue-600'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <span aria-hidden="true">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                    aria-hidden="true"
                  >
                    {toPersianDigits(count)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Main Calendar Layout */}
      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Interactive Month Grid (7 cols) */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-5 transition-colors">
            {/* Month Header Switcher */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition cursor-pointer"
                aria-label="ماه قبل"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="text-center">
                <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100">
                  {PERSIAN_MONTHS[currentMonth - 1]} {toPersianDigits(currentYear)}
                </h3>
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
                  {toPersianDigits(currentMonthEvents.length)} برنامه در این ماه
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                aria-label="ماه بعد"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Weekday Labels */}
            <div className="grid grid-cols-7 gap-1 text-center font-black text-xs text-slate-400 dark:text-slate-500 pb-2 border-b border-slate-100 dark:border-slate-800" aria-hidden="true">
              {PERSIAN_WEEKDAYS.map((wd) => (
                <div
                  key={wd.full}
                  className={`py-1 ${wd.isWeekend ? 'text-rose-500 dark:text-rose-400' : ''}`}
                >
                  <span className="hidden sm:inline">{wd.full}</span>
                  <span className="sm:hidden">{wd.short}</span>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {/* Empty leading cells */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div
                  key={`empty-${idx}`}
                  className="aspect-square rounded-2xl bg-slate-50/40 dark:bg-slate-900/30 opacity-40"
                  aria-hidden="true"
                />
              ))}

              {/* Month Days */}
              {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const dayEvents = eventsByDay[dayNum] || [];
                const hasEvents = dayEvents.length > 0;
                const isSelected = selectedDay === dayNum;
                const isToday = currentYear === 1405 && currentMonth === 6 && dayNum === 6; // Marked event day

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => {
                      if (selectedDay === dayNum) {
                        setSelectedDay(null); // toggle off
                      } else {
                        setSelectedDay(dayNum);
                      }
                    }}
                    aria-label={`روز ${dayNum} ${PERSIAN_MONTHS[currentMonth - 1]} ${currentYear}${hasEvents ? `، دارای ${dayEvents.length} برنامه` : '، بدون برنامه'}${isSelected ? '، انتخاب شده' : ''}`}
                    aria-pressed={isSelected}
                    className={`aspect-square relative p-1 sm:p-2 rounded-2xl flex flex-col items-center justify-between border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#173b82] text-white border-[#173b82] shadow-md scale-105 z-10 dark:bg-blue-600 dark:border-blue-500'
                        : hasEvents
                        ? 'bg-blue-50/80 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 text-slate-900 dark:text-slate-100 font-bold'
                        : 'bg-white dark:bg-slate-900/60 border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {/* Day Number */}
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isSelected ? 'text-white' : isToday ? 'text-[#173b82] dark:text-blue-400' : ''
                      }`}
                    >
                      {toPersianDigits(dayNum)}
                    </span>

                    {/* Today Badge / Event Dots */}
                    {hasEvents ? (
                      <div className="flex items-center gap-0.5 mt-auto" aria-hidden="true">
                        {dayEvents.map((ev, i) => (
                          <span
                            key={i}
                            className={`w-1.5 h-1.5 rounded-full ${
                              isSelected
                                ? 'bg-amber-300'
                                : ev.category === 'conference'
                                ? 'bg-purple-500'
                                : ev.category === 'workshop'
                                ? 'bg-blue-600'
                                : ev.category === 'youth-club'
                                ? 'bg-amber-500'
                                : ev.category === 'webinar'
                                ? 'bg-teal-500'
                                : 'bg-emerald-500'
                            }`}
                          />
                        ))}
                      </div>
                    ) : isToday ? (
                      <span className="text-[9px] font-bold text-amber-500" aria-hidden="true">امروز</span>
                    ) : null}
                  </button>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  <span>کارگاه</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                  <span>همایش</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                  <span>باشگاه</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-teal-500"></span>
                  <span>وبینار</span>
                </span>
              </div>
              <span className="text-slate-400">روی هر روز برای مشاهده برنامه‌ها کلیک کنید</span>
            </div>
          </div>

          {/* Right Column: Selected Day / Month Events (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between px-1">
              <h4 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#173b82] dark:text-blue-400" />
                <span>
                  {selectedDay
                    ? `برنامه‌های ${toPersianDigits(selectedDay)} ${PERSIAN_MONTHS[currentMonth - 1]}`
                    : `تمام رویدادهای ${PERSIAN_MONTHS[currentMonth - 1]} (${toPersianDigits(displayedEvents.length)} مورد)`}
                </span>
              </h4>
              {selectedDay && (
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  aria-label="نمایش تمام برنامه‌های این ماه"
                  className="text-xs font-bold text-[#173b82] dark:text-blue-400 hover:underline"
                >
                  نمایش همه ماه
                </button>
              )}
            </div>

            {/* List of cards */}
            {displayedEvents.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-400 mx-auto flex items-center justify-center text-xl" aria-hidden="true">
                  📅
                </div>
                <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  در این تاریخ برنامه‌ای ثبت نشده است
                </h5>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  می‌توانید روزهای دیگر تقویم را بررسی کنید یا فیلتر دسته‌بندی را تغییر دهید.
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  aria-label="مشاهده همه برنامه‌های این ماه"
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition border border-slate-200/60 dark:border-slate-600"
                >
                  مشاهده همه برنامه‌های این ماه
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                {displayedEvents.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 shadow-xs hover:shadow-md transition-all space-y-3"
                  >
                    {/* Badge & Date */}
                    <div className="flex items-start justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getCategoryBadgeClass(
                          event.category
                        )}`}
                      >
                        <span aria-hidden="true">{event.icon}</span>
                        <span>{event.categoryLabel}</span>
                      </span>

                      <div className="text-left">
                        <span className="block text-xs font-black text-slate-900 dark:text-slate-100">
                          {event.dateJalali}
                        </span>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {event.dayOfWeek}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                      {event.title}
                    </h4>

                    {/* Meta info */}
                    <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.instructor && (
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                          <span className="truncate">{event.instructor}</span>
                        </div>
                      )}
                    </div>

                    {/* Accessibility Highlights */}
                    <div className="flex flex-wrap gap-1 pt-1">
                      {event.accessibilityFeatures.slice(0, 2).map((feat, fi) => (
                        <span
                          key={fi}
                          className="inline-flex items-center gap-1 text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-md"
                        >
                          <Check className="w-2.5 h-2.5 text-teal-600 dark:text-teal-400" aria-hidden="true" />
                          <span>{feat}</span>
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveEventModal(event);
                          setRegistrationSuccess(false);
                        }}
                        aria-label={`مشاهده جزئیات و ثبت‌نام صندلی رویداد ${event.title}`}
                        className="px-4 py-2 bg-[#173b82] hover:bg-[#0f275a] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
                      >
                        جزئیات و ثبت‌نام صندلی ←
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleAddToCalendar(event)}
                          title="افزودن به تقویم (.ics)"
                          aria-label={`افزودن رویداد ${event.title} به تقویم با فایل آی‌سی‌اس`}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareEvent(event)}
                          title="اشتراک‌گذاری"
                          aria-label={`اشتراک‌گذاری اطلاعات رویداد ${event.title}`}
                          className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                        >
                          <Share2 className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* 3. Timeline / List View Mode */
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getCategoryBadgeClass(
                        event.category
                      )}`}
                    >
                      <span aria-hidden="true">{event.icon}</span>
                      <span>{event.categoryLabel}</span>
                    </span>

                    <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-xl text-xs font-black text-[#173b82] dark:text-blue-400">
                      {event.dateJalali} ({event.dayOfWeek})
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                    {event.title}
                  </h3>

                  {/* Description */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {event.description}
                  </p>

                  {/* Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span>{event.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{event.location}</span>
                    </div>
                    {event.instructor && (
                      <div className="flex items-center gap-1.5 sm:col-span-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>مدرس / ارائه‌دهنده: {event.instructor}</span>
                      </div>
                    )}
                  </div>

                  {/* Capacity Bar */}
                  {event.capacity && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400">
                        <span>
                          ظرفیت ثبت‌نام: {toPersianDigits(event.registeredCount || 0)} از{' '}
                          {toPersianDigits(event.capacity)} نفر
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {toPersianDigits(event.capacity - (event.registeredCount || 0))} صندلی خالی
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden" role="progressbar" aria-valuenow={event.registeredCount || 0} aria-valuemin={0} aria-valuemax={event.capacity} aria-label={`ظرفیت تکمیل شده ${Math.round(((event.registeredCount || 0) / event.capacity) * 100)} درصد`}>
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-[#173b82] dark:from-blue-400 dark:to-blue-600 rounded-full"
                          style={{
                            width: `${Math.round(((event.registeredCount || 0) / event.capacity) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveEventModal(event);
                      setRegistrationSuccess(false);
                    }}
                    aria-label={`مشاهده سرفصل‌ها و ثبت‌نام در ${event.title}`}
                    className="px-4 py-2.5 bg-[#0f766e] hover:bg-[#115e59] dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Ticket className="w-4 h-4" aria-hidden="true" />
                    <span>مشاهده سرفصل‌ها و ثبت‌نام</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddToCalendar(event)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title="دانلود تقویم"
                      aria-label={`دانلود فایل تقویم رویداد ${event.title}`}
                    >
                      <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShareEvent(event)}
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title="اشتراک‌گذاری"
                      aria-label={`اشتراک‌گذاری اطلاعات رویداد ${event.title}`}
                    >
                      <Share2 className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Event Detailed Modal & Registration Dialog */}
      {activeEventModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto animate-fade-in"
          role="dialog"
          aria-modal="true"
          aria-label={`جزئیات و ثبت‌نام در رویداد ${activeEventModal.title}`}
        >
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8 transition-colors">
            {/* Modal Header */}
            <div className={`p-6 bg-gradient-to-r ${activeEventModal.coverGradient || 'from-blue-600 to-indigo-800'} text-white relative`}>
              <button
                type="button"
                onClick={() => setActiveEventModal(null)}
                aria-label="بستن پنجره جزئیات رویداد"
                className="absolute left-4 top-4 w-9 h-9 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>

              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold backdrop-blur-xs">
                  <span aria-hidden="true">{activeEventModal.icon}</span>
                  <span>{activeEventModal.categoryLabel}</span>
                </span>
                <h3 className="text-xl sm:text-2xl font-black leading-snug">
                  {activeEventModal.title}
                </h3>
                <div className="flex flex-wrap items-center gap-3 text-xs text-white/90 pt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <CalendarIcon className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>{activeEventModal.dateJalali} ({activeEventModal.dayOfWeek})</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>ساعت {activeEventModal.time}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {registrationSuccess ? (
                /* Registration Success Card */
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto text-3xl" aria-hidden="true">
                    ✓
                  </div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-slate-100">
                    ثبت‌نام شما با موفقیت انجام شد!
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto leading-relaxed">
                    کارت ورود دیجیتال و اطلاعات تکمیلی حضور در برنامه برای شماره تماس{' '}
                    <strong className="text-slate-900 dark:text-white font-mono">{toPersianDigits(registrationForm.phone)}</strong> ارسال
                    شد.
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-right text-xs space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">نام شرکت‌کننده:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{registrationForm.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">محل برگزاری:</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{activeEventModal.location}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">وضعیت دسترسی‌پذیری:</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">مترجم اشاره هماهنگ شد</span>
                    </div>
                  </div>

                  <div className="pt-3 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleAddToCalendar(activeEventModal)}
                      aria-label="افزودن رویداد به تقویم گوشی با فایل آی‌سی‌اس"
                      className="px-5 py-2.5 bg-[#173b82] dark:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                    >
                      <CalendarPlus className="w-4 h-4" aria-hidden="true" />
                      <span>افزودن به تقویم گوشی</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveEventModal(null)}
                      aria-label="بستن پیام موفقیت"
                      className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Overview */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-[#173b82] dark:text-blue-400 uppercase tracking-wide">
                      درباره این برنامه
                    </h5>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                      {activeEventModal.description}
                    </p>
                  </div>

                  {/* Location & Speaker */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-xs">
                    <div className="space-y-1">
                      <span className="text-slate-400 font-bold block">مکان و شیوه برگزاری:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{activeEventModal.location}</span>
                    </div>
                    {activeEventModal.instructor && (
                      <div className="space-y-1">
                        <span className="text-slate-400 font-bold block">مدرس / کارشناس:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{activeEventModal.instructor}</span>
                      </div>
                    )}
                  </div>

                  {/* Agenda / Topics */}
                  {activeEventModal.agenda && activeEventModal.agenda.length > 0 && (
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-[#173b82] dark:text-blue-400 uppercase tracking-wide">
                        سرفصل‌ها و محورهای برنامه
                      </h5>
                      <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                        {activeEventModal.agenda.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" aria-hidden="true" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Accessibility Support */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-teal-700 dark:text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                      <span aria-hidden="true">♿</span>
                      <span>امکانات و خدمات دسترسی‌پذیری این رویداد</span>
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeEventModal.accessibilityFeatures.map((feat, fi) => (
                        <div
                          key={fi}
                          className="flex items-center gap-2 p-2.5 rounded-xl bg-teal-50/70 dark:bg-teal-950/40 border border-teal-100 dark:border-teal-900/60 text-xs text-teal-900 dark:text-teal-200 font-medium"
                        >
                          <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" aria-hidden="true" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Registration Form */}
                  <form onSubmit={handleRegisterSubmit} className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <h5 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-[#0f766e] dark:text-teal-400" aria-hidden="true" />
                      <span>فرم رزرو صندلی و ثبت‌نام سریع</span>
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          نام و نام خانوادگی <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={registrationForm.fullName}
                          onChange={(e) =>
                            setRegistrationForm({ ...registrationForm, fullName: e.target.value })
                          }
                          placeholder="مثلاً: سارا احمدی"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#173b82]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                          شماره تماس (جهت پیامک کارت ورود) <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="tel"
                          required
                          value={registrationForm.phone}
                          onChange={(e) =>
                            setRegistrationForm({ ...registrationForm, phone: e.target.value })
                          }
                          placeholder="۰۹۱۲XXXXXXX"
                          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-[#173b82]"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={registrationForm.needsSignLanguage}
                          onChange={(e) =>
                            setRegistrationForm({
                              ...registrationForm,
                              needsSignLanguage: e.target.checked
                            })
                          }
                          className="rounded text-[#173b82]"
                        />
                        <span className="text-slate-700 dark:text-slate-300">
                          نیاز به هماهنگی با مترجم زبان اشاره فارسی در جایگاه دارم
                        </span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={registrationForm.needsFrontSeat}
                          onChange={(e) =>
                            setRegistrationForm({
                              ...registrationForm,
                              needsFrontSeat: e.target.checked
                            })
                          }
                          className="rounded text-[#173b82]"
                        />
                        <span className="text-slate-700 dark:text-slate-300">
                          درخواست ردیف جلو جهت لب‌خوانی و دید بهتر به نمایشگر زیرنویس
                        </span>
                      </label>
                    </div>

                    <div className="pt-2 flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setActiveEventModal(null)}
                        aria-label="انصراف و بستن فرم"
                        className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200"
                      >
                        انصراف
                      </button>
                      <button
                        type="submit"
                        disabled={isRegistering}
                        className="px-6 py-2.5 rounded-xl bg-[#0f766e] hover:bg-[#115e59] dark:bg-teal-600 dark:hover:bg-teal-500 text-white text-xs font-bold shadow-md flex items-center gap-2 cursor-pointer"
                      >
                        {isRegistering ? (
                          <span>در حال ثبت...</span>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>تأیید و دریافت کارت ورود رایگان</span>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
