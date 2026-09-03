import React from 'react';

export type SkeletonVariant =
  | 'home'
  | 'teams-hub'
  | 'team-detail'
  | 'scores'
  | 'membership'
  | 'consultation'
  | 'education'
  | 'events'
  | 'contact'
  | 'rehab'
  | 'employment'
  | 'marriage'
  | 'social-work'
  | 'about'
  | 'history'
  | 'mission'
  | 'goals'
  | 'statute'
  | 'admin'
  | 'generic';

interface PageLoaderProps {
  variant?: SkeletonVariant | string;
  message?: string;
}

// Shimmer base class with accessible contrast in light and dark modes
const shimmerBox = 'bg-slate-200/80 dark:bg-slate-800/80 animate-pulse rounded-xl';
const shimmerText = 'bg-slate-200/80 dark:bg-slate-800/80 animate-pulse rounded-md';

// 1. Home Page Skeleton
export const HomeSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200" dir="rtl">
      {/* Hero Banner Skeleton */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-900/20 via-slate-800/20 to-indigo-900/20 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 space-y-6">
        <div className="flex flex-col items-center text-center space-y-4 max-w-3xl mx-auto">
          <div className={`w-36 h-6 ${shimmerText} rounded-full`} />
          <div className={`w-3/4 sm:w-2/3 h-10 ${shimmerText} rounded-2xl`} />
          <div className={`w-full sm:w-4/5 h-4 ${shimmerText}`} />
          <div className={`w-2/3 h-4 ${shimmerText}`} />
          <div className="flex items-center gap-3 pt-2">
            <div className={`w-32 h-10 ${shimmerBox} rounded-xl`} />
            <div className={`w-32 h-10 ${shimmerBox} rounded-xl`} />
          </div>
        </div>
      </div>

      {/* Fast Navigation Bar Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-3 shadow-xs">
            <div className={`w-10 h-10 ${shimmerBox} rounded-xl shrink-0`} />
            <div className="space-y-1.5 flex-1">
              <div className={`w-16 h-3.5 ${shimmerText}`} />
              <div className={`w-10 h-2.5 ${shimmerText}`} />
            </div>
          </div>
        ))}
      </div>

      {/* 2-Column Section: Teams Carousel & Latest Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Teams Preview Skeleton */}
        <div className="lg:col-span-1 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className={`w-28 h-5 ${shimmerText}`} />
            <div className={`w-14 h-4 ${shimmerText}`} />
          </div>
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className={`w-24 h-24 ${shimmerBox} rounded-full`} />
            <div className={`w-32 h-6 ${shimmerText}`} />
            <div className={`w-48 h-3.5 ${shimmerText}`} />
            <div className={`w-full h-12 ${shimmerBox} rounded-xl`} />
          </div>
        </div>

        {/* Latest Reports List Skeleton */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
            <div className={`w-36 h-5 ${shimmerText}`} />
            <div className={`w-20 h-4 ${shimmerText}`} />
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-4">
                <div className={`w-full sm:w-36 h-24 ${shimmerBox} rounded-xl shrink-0`} />
                <div className="space-y-2.5 flex-1">
                  <div className="flex items-center justify-between">
                    <div className={`w-24 h-4 ${shimmerText}`} />
                    <div className={`w-16 h-3 ${shimmerText}`} />
                  </div>
                  <div className={`w-3/4 h-4 ${shimmerText}`} />
                  <div className={`w-full h-3 ${shimmerText}`} />
                  <div className={`w-2/3 h-3 ${shimmerText}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// 2. Teams Hub Skeleton
export const TeamsHubSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200" dir="rtl">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2">
        <div className={`w-16 h-3.5 ${shimmerText}`} />
        <div className={`w-3 h-3 ${shimmerText}`} />
        <div className={`w-24 h-3.5 ${shimmerText}`} />
      </div>

      {/* Heading Skeleton */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className={`w-32 h-6 ${shimmerText} mx-auto rounded-full`} />
        <div className={`w-72 h-8 ${shimmerText} mx-auto rounded-xl`} />
        <div className={`w-full h-4 ${shimmerText}`} />
        <div className={`w-3/4 h-4 ${shimmerText} mx-auto`} />
      </div>

      {/* Teams Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className={`w-14 h-14 ${shimmerBox} rounded-2xl`} />
              <div className={`w-16 h-6 ${shimmerBox} rounded-full`} />
            </div>
            <div className="space-y-2">
              <div className={`w-28 h-5 ${shimmerText}`} />
              <div className={`w-full h-3.5 ${shimmerText}`} />
              <div className={`w-4/5 h-3.5 ${shimmerText}`} />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
              <div className="flex -space-x-2 space-x-reverse">
                <div className={`w-7 h-7 ${shimmerBox} rounded-full`} />
                <div className={`w-7 h-7 ${shimmerBox} rounded-full`} />
                <div className={`w-7 h-7 ${shimmerBox} rounded-full`} />
              </div>
              <div className={`w-20 h-7 ${shimmerBox} rounded-lg`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 3. Team Detail Skeleton
export const TeamDetailSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className={`w-16 h-3.5 ${shimmerText}`} />
        <div className={`w-3 h-3 ${shimmerText}`} />
        <div className={`w-20 h-3.5 ${shimmerText}`} />
        <div className={`w-3 h-3 ${shimmerText}`} />
        <div className={`w-28 h-3.5 ${shimmerText}`} />
      </div>

      {/* Team Header Banner */}
      <div className="p-6 sm:p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className={`w-24 h-24 sm:w-28 sm:h-28 ${shimmerBox} rounded-3xl shrink-0`} />
          <div className="space-y-3 flex-1 text-center sm:text-right">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <div className={`w-32 h-7 ${shimmerText} rounded-xl`} />
              <div className={`w-20 h-6 ${shimmerBox} rounded-full`} />
            </div>
            <div className={`w-full max-w-xl h-4 ${shimmerText}`} />
            <div className={`w-3/4 max-w-md h-4 ${shimmerText}`} />
            {/* Counselor & Stats Pills */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2">
              <div className={`w-36 h-8 ${shimmerBox} rounded-xl`} />
              <div className={`w-28 h-8 ${shimmerBox} rounded-xl`} />
              <div className={`w-32 h-8 ${shimmerBox} rounded-xl`} />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area: Video/Report Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-4">
              <div className={`w-40 h-5 ${shimmerText}`} />
              <div className={`w-24 h-4 ${shimmerText}`} />
            </div>
            {/* Media Player Skeleton Frame */}
            <div className={`w-full aspect-video ${shimmerBox} rounded-2xl flex items-center justify-center`}>
              <div className="w-12 h-12 rounded-full bg-slate-300 dark:bg-slate-700 animate-ping opacity-30" />
            </div>
            {/* Text description lines */}
            <div className="space-y-2 pt-2">
              <div className={`w-full h-4 ${shimmerText}`} />
              <div className={`w-5/6 h-4 ${shimmerText}`} />
              <div className={`w-2/3 h-4 ${shimmerText}`} />
            </div>
          </div>
        </div>

        {/* Sidebar / Members Skeleton */}
        <div className="space-y-6">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
            <div className={`w-28 h-5 ${shimmerText} border-b border-slate-100 dark:border-slate-800/80 pb-3`} />
            <div className="space-y-3">
              {[...Array(4)].map((_, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60">
                  <div className={`w-10 h-10 ${shimmerBox} rounded-full shrink-0`} />
                  <div className="space-y-1.5 flex-1">
                    <div className={`w-20 h-3.5 ${shimmerText}`} />
                    <div className={`w-14 h-2.5 ${shimmerText}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 4. Scores Page Skeleton
export const ScoresSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200" dir="rtl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2">
        <div className={`w-16 h-3.5 ${shimmerText}`} />
        <div className={`w-3 h-3 ${shimmerText}`} />
        <div className={`w-28 h-3.5 ${shimmerText}`} />
      </div>

      {/* Heading */}
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className={`w-36 h-6 ${shimmerText} mx-auto rounded-full`} />
        <div className={`w-64 h-8 ${shimmerText} mx-auto rounded-xl`} />
        <div className={`w-80 max-w-full h-4 ${shimmerText} mx-auto`} />
      </div>

      {/* Top 3 Podium Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto items-end pt-6">
        {[2, 1, 3].map((rank) => (
          <div
            key={rank}
            className={`p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 text-center shadow-xs ${
              rank === 1 ? 'md:-translate-y-4 border-amber-300 dark:border-amber-700/50' : ''
            }`}
          >
            <div className={`w-16 h-16 ${shimmerBox} rounded-full mx-auto`} />
            <div className={`w-24 h-5 ${shimmerText} mx-auto`} />
            <div className={`w-16 h-8 ${shimmerBox} rounded-xl mx-auto`} />
            <div className={`w-full h-3 ${shimmerText}`} />
          </div>
        ))}
      </div>

      {/* Full Scores Table Skeleton */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 max-w-4xl mx-auto shadow-xs">
        <div className={`w-36 h-5 ${shimmerText} border-b border-slate-100 dark:border-slate-800/80 pb-3`} />
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-950/60 rounded-2xl flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 ${shimmerBox} rounded-full shrink-0`} />
                <div className={`w-10 h-10 ${shimmerBox} rounded-xl shrink-0`} />
                <div className={`w-28 h-4 ${shimmerText}`} />
              </div>
              <div className="flex-1 max-w-xs hidden sm:block">
                <div className={`w-full h-2.5 ${shimmerBox} rounded-full`} />
              </div>
              <div className={`w-14 h-7 ${shimmerBox} rounded-lg`} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 5. Membership / Form Page Skeleton
export const MembershipSkeleton: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200" dir="rtl">
      <div className="text-center space-y-3">
        <div className={`w-32 h-6 ${shimmerText} mx-auto rounded-full`} />
        <div className={`w-64 h-8 ${shimmerText} mx-auto rounded-xl`} />
        <div className={`w-80 max-w-full h-4 ${shimmerText} mx-auto`} />
      </div>

      {/* Stepper skeleton */}
      <div className="flex items-center justify-center gap-4 py-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 ${shimmerBox} rounded-full`} />
            <div className={`w-16 h-3 ${shimmerText} hidden sm:block`} />
          </div>
        ))}
      </div>

      {/* Form Container Skeleton */}
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="space-y-2">
              <div className={`w-24 h-3.5 ${shimmerText}`} />
              <div className={`w-full h-11 ${shimmerBox} rounded-xl`} />
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <div className={`w-32 h-3.5 ${shimmerText}`} />
          <div className={`w-full h-28 ${shimmerBox} rounded-xl`} />
        </div>
        <div className={`w-full sm:w-48 h-11 ${shimmerBox} rounded-xl mx-auto`} />
      </div>
    </div>
  );
};

// 6. Consultation Page Skeleton
export const ConsultationSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200" dir="rtl">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className={`w-36 h-6 ${shimmerText} mx-auto rounded-full`} />
        <div className={`w-72 h-8 ${shimmerText} mx-auto rounded-xl`} />
        <div className={`w-96 max-w-full h-4 ${shimmerText} mx-auto`} />
      </div>

      {/* Filter Tabs Skeleton */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {[...Array(4)].map((_, i) => (
          <div key={i} className={`w-24 h-9 ${shimmerBox} rounded-xl`} />
        ))}
      </div>

      {/* Consultants Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs text-center">
            <div className={`w-20 h-20 ${shimmerBox} rounded-full mx-auto`} />
            <div className={`w-32 h-5 ${shimmerText} mx-auto`} />
            <div className={`w-24 h-3.5 ${shimmerText} mx-auto`} />
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className={`w-20 h-6 ${shimmerBox} rounded-full`} />
              <div className={`w-20 h-6 ${shimmerBox} rounded-full`} />
            </div>
            <div className={`w-full h-10 ${shimmerBox} rounded-xl mt-2`} />
          </div>
        ))}
      </div>
    </div>
  );
};

// 7. Events / Education Page Skeleton
export const EventsSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200" dir="rtl">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className={`w-32 h-6 ${shimmerText} mx-auto rounded-full`} />
        <div className={`w-64 h-8 ${shimmerText} mx-auto rounded-xl`} />
        <div className={`w-80 max-w-full h-4 ${shimmerText} mx-auto`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
            <div className={`w-full h-48 ${shimmerBox} rounded-none`} />
            <div className="p-5 space-y-3 flex-1">
              <div className="flex items-center justify-between">
                <div className={`w-20 h-4 ${shimmerText}`} />
                <div className={`w-16 h-3 ${shimmerText}`} />
              </div>
              <div className={`w-4/5 h-5 ${shimmerText}`} />
              <div className={`w-full h-3.5 ${shimmerText}`} />
              <div className={`w-2/3 h-3.5 ${shimmerText}`} />
            </div>
            <div className="p-5 pt-0">
              <div className={`w-full h-10 ${shimmerBox} rounded-xl`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 8. Services / About Page Skeleton
export const ServicesAboutSkeleton: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200" dir="rtl">
      {/* Header banner */}
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs text-center">
        <div className={`w-16 h-16 ${shimmerBox} rounded-2xl mx-auto`} />
        <div className={`w-48 h-7 ${shimmerText} mx-auto`} />
        <div className={`w-96 max-w-full h-4 ${shimmerText} mx-auto`} />
      </div>

      {/* Tabs navigation shimmer if about page */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`w-24 h-9 ${shimmerBox} rounded-xl`} />
        ))}
      </div>

      {/* Content blocks */}
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6 shadow-xs">
        <div className={`w-36 h-6 ${shimmerText}`} />
        <div className="space-y-3">
          <div className={`w-full h-4 ${shimmerText}`} />
          <div className={`w-full h-4 ${shimmerText}`} />
          <div className={`w-5/6 h-4 ${shimmerText}`} />
          <div className={`w-4/5 h-4 ${shimmerText}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
          <div className={`w-full h-32 ${shimmerBox} rounded-2xl`} />
          <div className={`w-full h-32 ${shimmerBox} rounded-2xl`} />
        </div>
      </div>
    </div>
  );
};

// 9. Contact Page Skeleton
export const ContactSkeleton: React.FC = () => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-in fade-in duration-200" dir="rtl">
      <div className="text-center space-y-3">
        <div className={`w-32 h-6 ${shimmerText} mx-auto rounded-full`} />
        <div className={`w-64 h-8 ${shimmerText} mx-auto rounded-xl`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center gap-4">
              <div className={`w-12 h-12 ${shimmerBox} rounded-xl shrink-0`} />
              <div className="space-y-2 flex-1">
                <div className={`w-20 h-4 ${shimmerText}`} />
                <div className={`w-32 h-3.5 ${shimmerText}`} />
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-2 p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-5">
          <div className={`w-32 h-5 ${shimmerText}`} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={`w-full h-11 ${shimmerBox} rounded-xl`} />
            <div className={`w-full h-11 ${shimmerBox} rounded-xl`} />
          </div>
          <div className={`w-full h-32 ${shimmerBox} rounded-xl`} />
          <div className={`w-36 h-11 ${shimmerBox} rounded-xl`} />
        </div>
      </div>
    </div>
  );
};

// 10. Admin Dashboard Skeleton
export const AdminSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-200" dir="rtl">
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
        <div className="space-y-2">
          <div className={`w-40 h-6 ${shimmerText}`} />
          <div className={`w-56 h-3.5 ${shimmerText}`} />
        </div>
        <div className={`w-28 h-9 ${shimmerBox} rounded-xl`} />
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className={`w-16 h-3.5 ${shimmerText}`} />
              <div className={`w-8 h-8 ${shimmerBox} rounded-lg`} />
            </div>
            <div className={`w-20 h-7 ${shimmerText}`} />
          </div>
        ))}
      </div>

      {/* Tabs & Table Skeleton */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`w-24 h-8 ${shimmerBox} rounded-lg`} />
          ))}
        </div>
        <div className="space-y-2 pt-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className={`w-full h-12 ${shimmerBox} rounded-xl`} />
          ))}
        </div>
      </div>
    </div>
  );
};

// 11. Generic Page Skeleton Fallback
export const GenericPageSkeleton: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-200" dir="rtl">
      <div className="text-center max-w-2xl mx-auto space-y-3">
        <div className={`w-32 h-5 ${shimmerText} mx-auto rounded-full`} />
        <div className={`w-64 h-8 ${shimmerText} mx-auto rounded-xl`} />
        <div className={`w-80 max-w-full h-4 ${shimmerText} mx-auto`} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl space-y-4 shadow-xs">
            <div className={`w-12 h-12 ${shimmerBox} rounded-2xl`} />
            <div className={`w-32 h-5 ${shimmerText}`} />
            <div className="space-y-2">
              <div className={`w-full h-3.5 ${shimmerText}`} />
              <div className={`w-4/5 h-3.5 ${shimmerText}`} />
            </div>
            <div className={`w-full h-10 ${shimmerBox} rounded-xl`} />
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Main PageLoader component: dynamically renders the precise component-specific
 * skeleton screen based on the active route/variant, or custom message.
 */
export const PageLoader: React.FC<PageLoaderProps> = ({ variant = 'generic' }) => {
  const v = (variant || 'generic').toLowerCase();

  if (v === 'home') return <HomeSkeleton />;
  if (v === 'teams-hub') return <TeamsHubSkeleton />;
  if (v.startsWith('team-') || ['thinker', 'tomorrow', 'angels', 'ghorbani', 'silence'].includes(v)) {
    return <TeamDetailSkeleton />;
  }
  if (v === 'scores') return <ScoresSkeleton />;
  if (v === 'membership') return <MembershipSkeleton />;
  if (v === 'consultation') return <ConsultationSkeleton />;
  if (v === 'education' || v === 'events') return <EventsSkeleton />;
  if (['rehab', 'employment', 'marriage', 'social-work', 'about', 'history', 'mission', 'goals', 'statute'].includes(v)) {
    return <ServicesAboutSkeleton />;
  }
  if (v === 'contact') return <ContactSkeleton />;
  if (v === 'admin') return <AdminSkeleton />;

  return <GenericPageSkeleton />;
};
