import React, { useState, useMemo } from 'react';
import { 
  Film, Play, Search, Filter, Calendar, Eye, 
  ChevronRight, X, Volume2, 
  Share2, FileText
} from 'lucide-react';
import { ActivityReport, TeamData } from '../types';
import { getAllVideoReports, getAllTeams, getReportViews, incrementReportViews } from '../utils/reportsStore';
import { toPersianDigits } from '../utils/persianDate';
import { ReportVideoPlayer } from './ReportVideoPlayer';

interface VideoGalleryViewProps {
  reports?: ActivityReport[];
  teams?: Record<string, TeamData>;
  onSelectReport?: (report: ActivityReport, teamSlug: string) => void;
  onClose?: () => void;
  initialTeamSlug?: string;
}

export const VideoGalleryView: React.FC<VideoGalleryViewProps> = ({
  reports,
  teams: propTeams,
  onSelectReport,
  onClose,
  initialTeamSlug = 'all'
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string>(initialTeamSlug);
  const [searchQuery, setSearchQuery] = useState('');
  const [activePlayingReport, setActivePlayingReport] = useState<{ report: ActivityReport; teamSlug: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const teams = useMemo(() => propTeams || getAllTeams(), [propTeams]);
  const allVideos = useMemo(() => {
    if (reports && reports.length > 0) {
      return reports.filter(r => (r.videoSrc && r.videoSrc !== '#') || r.reportType === 'video' || r.reportType === 'hybrid');
    }
    return getAllVideoReports();
  }, [reports]);

  // Filtered reports
  const filteredVideos = useMemo(() => {
    return allVideos.filter((rep) => {
      // Team filter
      if (selectedTeam !== 'all') {
        const teamMatch = rep.teamSlug === selectedTeam || rep.id.startsWith(selectedTeam.replace('team-', ''));
        if (!teamMatch) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = (rep.title || '').toLowerCase().includes(q);
        const summaryMatch = (rep.summary || '').toLowerCase().includes(q);
        const teamName = rep.teamSlug ? (teams[rep.teamSlug]?.name || '') : '';
        const teamMatch = teamName.toLowerCase().includes(q);
        const transcriptMatch = (rep.transcript || []).some(t => (t.text || '').toLowerCase().includes(q) || (t.speaker || '').toLowerCase().includes(q));
        if (!titleMatch && !summaryMatch && !teamMatch && !transcriptMatch) return false;
      }

      return true;
    });
  }, [allVideos, selectedTeam, searchQuery, teams]);

  const handlePlayVideo = (report: ActivityReport, teamSlug: string) => {
    incrementReportViews(report.id);
    setActivePlayingReport({ report, teamSlug });
  };

  const handleShareLink = (reportId: string) => {
    const url = `${window.location.origin}/#report-${reportId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(reportId);
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {});
  };

  return (
    <div id="video-gallery-container" className="w-full max-w-7xl mx-auto px-4 py-8 space-y-8 animate-fade-in text-right" dir="rtl">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 border border-indigo-500/20 p-8 shadow-2xl">
        <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-semibold">
              <Film className="w-4 h-4 text-indigo-400 animate-pulse" aria-hidden="true" />
              <span>مرکز چندرسانه‌ای و نگارخانه گزارشات ویدیویی</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              نگارخانه گزارشات ویدیویی تیم‌های باشگاه مَه‌اَش
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-2xl leading-relaxed">
              مشاهده، جستجو و بازپخش مستقیم تمام مستندات و گزارش‌های ویدیویی تیم‌ها به همراه زیرنویس همگام فارسی، خلاصه تفسیری و آرشیو پیوست‌ها.
            </p>
          </div>

          <div className="flex items-center gap-3 self-stretch md:self-auto">
            <div className="px-5 py-3 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center gap-3">
              <Film className="w-6 h-6 text-cyan-400" aria-hidden="true" />
              <div>
                <div className="text-xl font-bold text-white">
                  {toPersianDigits(allVideos.length)}
                </div>
                <div className="text-xs text-slate-400">ویدیوی فعال</div>
              </div>
            </div>
            {onClose && (
              <button
                id="close-gallery-btn"
                type="button"
                onClick={onClose}
                aria-label="بستن نگارخانه ویدیوها"
                className="p-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                title="بستن نگارخانه"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 backdrop-blur-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" aria-hidden="true" />
          <input
            id="gallery-search-input"
            type="text"
            role="searchbox"
            aria-label="جستجو در عناوین، متن و زیرنویس‌های ویدیویی"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در عنوان، متن خلاصه یا زیرنویس‌های فارسی..."
            className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pr-10 pl-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="پاک کردن متن جستجو"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>

        {/* Team Selector Tabs / Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none" role="group" aria-label="فیلتر بر اساس تیم‌های باشگاه">
          <button
            id="filter-team-all"
            type="button"
            onClick={() => setSelectedTeam('all')}
            aria-pressed={selectedTeam === 'all'}
            aria-label={`نمایش همه تیم‌ها، مجموع ${toPersianDigits(allVideos.length)} ویدیو`}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedTeam === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
            }`}
          >
            <Filter className="w-3.5 h-3.5" aria-hidden="true" />
            <span>همه تیم‌ها ({toPersianDigits(allVideos.length)})</span>
          </button>

          {(Object.entries(teams) as [string, TeamData][]).map(([slug, team]) => {
            const teamVideoCount = allVideos.filter(v => v.teamSlug === slug || v.id.startsWith(slug.replace('team-', ''))).length;
            const isSelected = selectedTeam === slug;
            return (
              <button
                key={slug}
                id={`filter-team-${slug}`}
                type="button"
                onClick={() => setSelectedTeam(slug)}
                aria-pressed={isSelected}
                aria-label={`فیلتر تیم ${team?.name || slug}، ${toPersianDigits(teamVideoCount)} ویدیو`}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                <span>{team?.name || slug}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/30 opacity-80">
                  {toPersianDigits(teamVideoCount)}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="p-16 text-center rounded-3xl bg-slate-900/40 border border-dashed border-slate-800 space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto" aria-hidden="true">
            <Film className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">هیچ گزارش ویدیویی مطابق با فیلتر یافت نشد</h3>
          <p className="text-sm text-slate-400 max-w-md mx-auto">
            می‌توانید عبارت جستجو را تغییر دهید یا فیلتر تیم را روی «همه تیم‌ها» تنظیم فرمایید.
          </p>
          {(searchQuery || selectedTeam !== 'all') && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelectedTeam('all'); }}
              aria-label="پاک کردن فیلترها و نمایش همه ویدیوها"
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-500 transition-colors"
            >
              پاک کردن فیلترها
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => {
            const team = teams[video.teamSlug || 'team-thinker'] || teams['team-thinker'];
            const viewCount = getReportViews(video.id);
            const transcriptCount = video.transcript?.length || 0;

            return (
              <div
                key={video.id}
                id={`video-card-${video.id}`}
                className="group relative flex flex-col rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 overflow-hidden hover:shadow-xl hover:shadow-indigo-500/10"
              >
                {/* Video Poster & Play Thumbnail */}
                <div 
                  className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer"
                  role="button"
                  tabIndex={0}
                  aria-label={`پخش ویدیوی ${video.title} تیم ${team?.name || 'باشگاه'}`}
                  onClick={() => handlePlayVideo(video, video.teamSlug || 'team-thinker')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePlayVideo(video, video.teamSlug || 'team-thinker');
                    }
                  }}
                >
                  {video.posterSrc ? (
                    <img loading="lazy" 
                      src={video.posterSrc} 
                      alt={video.title} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-tr from-slate-950 via-indigo-950/40 to-slate-900 flex items-center justify-center">
                      <Film className="w-12 h-12 text-slate-700 group-hover:text-indigo-400 group-hover:scale-110 transition-all duration-300" aria-hidden="true" />
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                  {/* Play Button Overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg shadow-indigo-600/40 group-hover:scale-115 group-hover:bg-indigo-500 transition-all duration-300">
                      <Play className="w-6 h-6 fill-current mr-0.5" aria-hidden="true" />
                    </div>
                  </div>

                  {/* Top Badges */}
                  <div className="absolute top-3 right-3 left-3 flex items-center justify-between pointer-events-none">
                    <span className="px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[11px] font-bold text-white border border-white/10">
                      {video.reportNum || 'گزارش'}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600/80 backdrop-blur-md text-[11px] font-semibold text-white border border-indigo-400/30">
                      {team?.name || 'تیم باشگاه'}
                    </span>
                  </div>

                  {/* Bottom Badges */}
                  <div className="absolute bottom-3 right-3 left-3 flex items-center justify-between text-[11px] text-slate-300 pointer-events-none">
                    <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-md">
                      <Calendar className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                      <span>{toPersianDigits(video.date || '۱۴۰۵/۰۶/۰۸')}</span>
                    </span>
                    {transcriptCount > 0 && (
                      <span className="flex items-center gap-1 bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px]">
                        <Volume2 className="w-3 h-3" aria-hidden="true" />
                        <span>زیرنویس همگام ({toPersianDigits(transcriptCount)})</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <button
                      type="button"
                      className="font-bold text-base text-right text-slate-100 hover:text-indigo-300 transition-colors line-clamp-1 cursor-pointer w-full"
                      onClick={() => handlePlayVideo(video, video.teamSlug || 'team-thinker')}
                      aria-label={`پخش ویدیوی ${video.title}`}
                    >
                      {video.title}
                    </button>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {video.summary || video.subhead || 'بدون خلاصه متنی'}
                    </p>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1" title="تعداد مشاهده" aria-label={`${toPersianDigits(viewCount)} مشاهده`}>
                        <Eye className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                        <span>{toPersianDigits(viewCount)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleShareLink(video.id); }}
                        className="hover:text-indigo-300 transition-colors flex items-center gap-1"
                        title="اشتراک‌گذاری لینک ویدیو"
                        aria-label={`اشتراک‌گذاری لینک ویدیوی ${video.title}`}
                      >
                        <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{copiedId === video.id ? 'کپی شد!' : 'اشتراک'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      {onSelectReport && (
                        <button
                          type="button"
                          onClick={() => onSelectReport(video, video.teamSlug || 'team-thinker')}
                          aria-label={`مشاهده صفحه کامل گزارش ${video.title}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors flex items-center gap-1"
                        >
                          <FileText className="w-3 h-3" aria-hidden="true" />
                          <span>صفحه گزارش</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handlePlayVideo(video, video.teamSlug || 'team-thinker')}
                        aria-label={`پخش ویدیوی ${video.title}`}
                        className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-sm"
                      >
                        <Play className="w-3 h-3 fill-current" aria-hidden="true" />
                        <span>پخش</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Active Video Player Modal */}
      {activePlayingReport && (
        <div 
          id="video-player-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in"
          onClick={() => setActivePlayingReport(null)}
          role="dialog"
          aria-modal="true"
          aria-label={`پخش ویدیوی ${activePlayingReport.report.title}`}
        >
          <div 
            id="video-player-modal-content"
            className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
            dir="rtl"
          >
            {/* Modal Header */}
            <div className="p-4 md:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30" aria-hidden="true">
                  <Film className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-100 text-base md:text-lg">
                    {activePlayingReport.report.title}
                  </h3>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>{activePlayingReport.report.reportNum}</span>
                    <span>•</span>
                    <span>{teams[activePlayingReport.teamSlug]?.name || 'تیم باشگاه'}</span>
                    <span>•</span>
                    <span>{toPersianDigits(activePlayingReport.report.date || '')}</span>
                  </div>
                </div>
              </div>

              <button
                id="close-video-modal-btn"
                type="button"
                onClick={() => setActivePlayingReport(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                title="بستن پنجره"
                aria-label="بستن پنجره پخش ویدیو"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            {/* Modal Body: Video Player With Persian Subtitles */}
            <div className="p-4 md:p-6 space-y-6">
              <ReportVideoPlayer
                report={activePlayingReport.report}
                teamName={teams[activePlayingReport.teamSlug]?.name || 'تیم باشگاه'}
                teamSlug={activePlayingReport.teamSlug}
              />

              {/* Summary and Description */}
              {activePlayingReport.report.summary && (
                <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
                  <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>خلاصه و نکات کلیدی گزارش</span>
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {activePlayingReport.report.summary}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                باشگاه اندیشه‌ورزان و کارآفرینان مَه‌اَش
              </div>
              <div className="flex items-center gap-2">
                {onSelectReport && (
                  <button
                    type="button"
                    onClick={() => {
                      const sel = activePlayingReport;
                      setActivePlayingReport(null);
                      onSelectReport(sel.report, sel.teamSlug);
                    }}
                    aria-label="مشاهده جزئیات کامل و پیوست‌های این گزارش"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    <span>مشاهده جزئیات کامل و پیوست‌ها</span>
                    <ChevronRight className="w-4 h-4 rotate-180" aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActivePlayingReport(null)}
                  aria-label="بستن پنجره"
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                >
                  بستن
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoGalleryView;
