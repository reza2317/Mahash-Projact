import React, { useState, useEffect, useMemo } from 'react';
import { PageId, TeamData, ActivityReport } from '../types';
import { getTeam, subscribeToStoreUpdates, isAdminAuthenticated, getMemberAvatar } from '../utils/reportsStore';
import { getTeamLogoPlaceholder } from '../utils/assets';
import { ResponsiveImage } from '../components/ResponsiveImage';
import { ImageLoader } from '../components/ImageLoader';
import { Breadcrumb } from '../components/Breadcrumb';
import { formatSmartUpdateDate, toPersianDigits, formatReportNumberDisplay } from '../utils/persianDate';
import { ReportVideoPlayer } from '../components/ReportVideoPlayer';
import { ReportAttachmentsView } from '../components/ReportAttachmentsView';
import { PrintReportButton } from '../components/PrintReportButton';
import { CommentsSection } from '../components/CommentsSection';
import { FormattedText } from '../components/FormattedText';
import { ReportVersionHistory } from '../components/ReportVersionHistory';
import { useNotification } from '../context/NotificationContext';
import {
  normalizePersianText,
  extractKeyPoints,
  generateExecutiveSummary,
  generateSubtitleScenario,
  proofreadAndPolishText
} from '../utils/persianTextProcessor';
import {
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Film,
  FileText,
  Bot,
  Copy,
  Check,
  X,
  Wand2,
  Edit3,
  Send,
  Sliders,
  History
} from 'lucide-react';

interface TeamDetailPageProps {
  teamSlug: string;
  onNavigate: (page: PageId) => void;
}

export interface TeamVideoResourceItem {
  id: string;
  reportId: string;
  reportNum: string;
  title: string;
  teamSlug: string;
  teamName: string;
  videoSrc: string;
  posterSrc?: string;
  date: string;
  summary: string;
  keyPoints?: string[];
  transcript?: any[];
  subhead?: string;
  status?: string;
  hasVideo: boolean;
  originalReport: ActivityReport;
}

export const TeamDetailPage: React.FC<TeamDetailPageProps> = ({ teamSlug, onNavigate }) => {
  const [team, setTeam] = useState<TeamData | undefined>(() => getTeam(teamSlug));
  const [activeTab, setActiveTab] = useState<'about' | 'members' | 'activities'>('about');
  const [openReportId, setOpenReportId] = useState<string | null>(() => {
    const initial = getTeam(teamSlug);
    return initial?.reports?.[0]?.id || null;
  });
  const [versionHistoryReportId, setVersionHistoryReportId] = useState<string | null>(null);

  // AI Summary Generator States
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [teamSummaryText, setTeamSummaryText] = useState<string | null>(null);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);

  // AI Report Assistant States
  const [aiSelectedReport, setAiSelectedReport] = useState<ActivityReport | null>(null);
  const [aiAssistanceMode, setAiAssistanceMode] = useState<'polish' | 'bullets' | 'summary' | 'subtitles'>('polish');
  const [aiOutputText, setAiOutputText] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [copiedAiText, setCopiedAiText] = useState<boolean>(false);
  const [showAiReportModal, setShowAiReportModal] = useState<boolean>(false);

  // Gemini Live Suggestions Box States
  const [geminiInputText, setGeminiInputText] = useState<string>('');
  const [geminiTone, setGeminiTone] = useState<'official' | 'motivational' | 'brief' | 'educational'>('official');
  const [geminiCustomPrompt, setGeminiCustomPrompt] = useState<string>('');
  const [geminiSuggestion, setGeminiSuggestion] = useState<string | null>(null);
  const [isGeminiLoading, setIsGeminiLoading] = useState<boolean>(false);
  const [copiedGemini, setCopiedGemini] = useState<boolean>(false);

  const { success: showToastSuccess, error: showToastError } = useNotification();

  // Keep open report synced when teamSlug changes, but PRESERVE user selection on store updates
  useEffect(() => {
    const initial = getTeam(teamSlug);
    setTeam(initial);
    setOpenReportId(initial?.reports?.[0]?.id || null);
    setTeamSummaryText(null);
    setShowSummaryModal(false);
    if (initial?.reports?.[0]?.summary) {
      setGeminiInputText(initial.reports[0].summary);
    } else {
      setGeminiInputText('');
    }
  }, [teamSlug]);

  // Subscribe to live updates from store without resetting user's open report
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminAuthenticated());

  useEffect(() => {
    const refresh = () => {
      const updated = getTeam(teamSlug);
      setTeam(updated);
      setIsAdmin(isAdminAuthenticated());
      setOpenReportId((prevOpen) => {
        if (prevOpen && updated?.reports?.some((r) => r.id === prevOpen)) {
          return prevOpen;
        }
        return updated?.reports?.[0]?.id || null;
      });
    };
    const unsub = subscribeToStoreUpdates(refresh);
    return () => unsub();
  }, [teamSlug]);

  // Structured transformation from raw report arrays to defined video resource objects with team metadata
  const teamVideoResources = useMemo<TeamVideoResourceItem[]>(() => {
    if (!team || !team.reports) return [];
    return (team.reports || [])
      .filter((r) => isAdmin || r.status !== 'draft')
      .map((report) => ({
        id: `${teamSlug}_${report.id}`,
        reportId: report.id,
        reportNum: report.reportNum,
        title: report.title,
        teamSlug: teamSlug,
        teamName: team.name,
        videoSrc: report.videoSrc || '',
        posterSrc: report.posterSrc,
        date: report.date,
        summary: report.summary,
        keyPoints: report.keyPoints,
        transcript: report.transcript,
        subhead: report.subhead,
        status: report.status,
        hasVideo: Boolean(report.videoSrc && report.videoSrc !== '#' && report.videoSrc.trim() !== '' && report.reportType !== 'text'),
        originalReport: report
      }));
  }, [team, teamSlug, isAdmin]);

  // Smart API Summary Generator using Server-Side Gemini endpoint
  const handleGenerateSummary = async () => {
    if (!team) return;
    setIsGeneratingSummary(true);
    setShowSummaryModal(true);

    try {
      const res = await fetch('/api/gemini/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamName: team.name,
          manager: team.manager,
          slogan: team.slogan,
          reports: (team.reports || []).map((r) => ({ title: r.title, summary: r.summary }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        setTeamSummaryText(data.summary);
      } else {
        throw new Error('API request failed');
      }
    } catch (e) {
      // Fallback generator
      const reportCount = team.reports?.length || 0;
      const memberNames = team.members.join('، ');
      const keyTitles = (team.reports || []).slice(0, 3).map((r) => `«${r.title}»`).join(' و ');

      const summaryOutput = `📌 **شناسنامه و رسالت بنیادین:**
تیم **${team.name}** یکی از کارگروه‌های ممتاز باشگاه جوانان مؤسسه محاش به سرپرستی **${team.manager}** است که با شعار راهبردی *«${team.slogan}»* در راستای توانمندسازی ناشنوایان، ارتقای مهارت‌های شغلی و توسعه تعاملات اجتماعی فعالیت می‌کند.

👥 **سرمایه انسانی و همیاران فعال:**
این کارگروه با اتکا به تلاش‌های پیوسته ${toPersianDigits(team.members.length)} عضو متعهد شامل (${memberNames})، پیوسته فضایی الهام‌بخش، پویا و علمی را برای اعتلای جامعه هدف فراهم ساخته است.

🏆 **برجسته‌ترین دستاوردها و گزارش‌های اجرایی:**
تاکنون تعداد **${toPersianDigits(reportCount)} گزارش رسمی** ویدیویی و مستند توسط این تیم ثبت شده است. از جمله برجسته‌ترین محورهای فعالیتی این تیم می‌توان به ${keyTitles || 'برگزاری سلسله کارگاه‌های آموزشی و جلسات توسعه فردی'} اشاره نمود.

🌟 **چشم‌انداز و پیام تیمی:**
تیم ${team.name} با تکیه بر انگیزه سرشار جوانان ناشنوا، گام‌های نوینی را در زمینه خودکفایی، تولید محتوای تخصصی و افزایش همبستگی اجتماعی ترسیم نموده است.`;

      setTeamSummaryText(summaryOutput);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!teamSummaryText) return;
    navigator.clipboard.writeText(teamSummaryText);
    setCopiedSummary(true);
    showToastSuccess('خلاصه هوشمند کپی شد', 'متن تاریخچه و دستاوردهای تیم در حافظه ذخیره گردید.');
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  // Open AI Report Assistant Modal
  const handleOpenAiAssistant = (report: ActivityReport, mode: 'polish' | 'bullets' | 'summary' | 'subtitles' = 'polish') => {
    setAiSelectedReport(report);
    setAiAssistanceMode(mode);
    setShowAiReportModal(true);
    runAiAssistance(report, mode);
  };

  const runAiAssistance = async (report: ActivityReport, mode: 'polish' | 'bullets' | 'summary' | 'subtitles') => {
    setIsAiLoading(true);
    setAiAssistanceMode(mode);

    const reportText = report.summary || report.title || 'گزارش فعالیت کارگروه تخصصی باشگاه';
    const tName = team?.name || 'باشگاه جوانan';

    try {
      const res = await fetch('/api/gemini/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText,
          teamName: tName,
          tone: mode === 'polish' ? 'official' : mode === 'bullets' ? 'educational' : 'brief',
          mode
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.suggestion) {
          setAiOutputText(data.suggestion);
          setIsAiLoading(false);
          return;
        }
      }

      // Advanced Persian processor fallback
      const result = proofreadAndPolishText(reportText, {
        title: report.title,
        teamName: tName,
        tone: mode === 'polish' ? 'official' : mode === 'bullets' ? 'educational' : 'brief'
      });

      if (mode === 'bullets') {
        setAiOutputText(
          `🎯 **محورها و نکات کلیدی استخراج‌شده (${tName}):**\n\n` +
          result.keyPoints.map((k) => `• ${k}`).join('\n')
        );
      } else if (mode === 'summary') {
        setAiOutputText(result.executiveSummary);
      } else if (mode === 'subtitles') {
        setAiOutputText(result.subtitleScenario);
      } else {
        setAiOutputText(result.polishedText);
      }
    } catch (e) {
      const result = proofreadAndPolishText(reportText, {
        title: report.title,
        teamName: tName
      });
      setAiOutputText(result.polishedText);
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleCopyAiOutput = () => {
    if (!aiOutputText) return;
    navigator.clipboard.writeText(aiOutputText);
    setCopiedAiText(true);
    showToastSuccess('متن هوش مصنوعی کپی شد', 'متن بازنویسی‌شده در حافظه کلیپ‌بورد ذخیره گردید.');
    setTimeout(() => setCopiedAiText(false), 2000);
  };

  // Dedicated Gemini Suggestion Request Handler
  const handleRequestGeminiSuggestion = async () => {
    if (!geminiInputText.trim()) {
      showToastError('متن الزامی است', 'لطفاً ابتدا متنی را برای تحلیل یا بازنویسی وارد نمایید.');
      return;
    }

    setIsGeminiLoading(true);
    setGeminiSuggestion(null);

    try {
      const res = await fetch('/api/gemini/suggest-improvements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportText: geminiInputText,
          teamName: team?.name || 'تیم باشگاه جوانان',
          tone: geminiTone,
          customPrompt: geminiCustomPrompt
        })
      });

      if (!res.ok) throw new Error('Gemini API Error');
      const data = await res.json();
      setGeminiSuggestion(data.suggestion || 'پاسخی از مدل دریافت نشد.');
      showToastSuccess('پیشنهاد هوشمند آماده شد', 'متن پیشنهادی با موفقیت تولید گردید.');
    } catch (err: any) {
      console.error(err);
      showToastError('خطا در ارتباط با هوش مصنوعی', 'لطفاً مجدداً تلاش فرمایید.');
    } finally {
      setIsGeminiLoading(false);
    }
  };

  const handleCopyGemini = () => {
    if (!geminiSuggestion) return;
    navigator.clipboard.writeText(geminiSuggestion);
    setCopiedGemini(true);
    showToastSuccess('کپی شد', 'پیشنهاد هوش مصنوعی در کلیپ‌بورد کپی شد.');
    setTimeout(() => setCopiedGemini(false), 2000);
  };

  if (!team) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">تیم مورد نظر پیدا نشد</h2>
        <button
          onClick={() => onNavigate('teams-hub')}
          className="px-6 py-2.5 bg-[#173b82] text-white rounded-xl font-bold text-sm cursor-pointer"
        >
          بازگشت به اسامی تیم‌ها
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'باشگاه جوانان', target: 'home' },
          { label: 'اسامی تیم‌ها', target: 'teams-hub' },
          { label: team.name }
        ]}
        onNavigate={onNavigate}
      />

      {/* Top Banner Toolbar */}
      <div className="bg-gradient-to-r from-[#0f2f6b] via-[#173b82] to-[#2563eb] rounded-3xl p-4 sm:p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-xl shrink-0">
              {team.icon}
            </span>
            <div>
              <span className="text-xs text-blue-200 font-bold block">باشگاه جوانان محاش</span>
              <h1 className="text-xl sm:text-2xl font-black text-white m-0">{team.name}</h1>
            </div>
          </div>

          {/* Action and Navigation Tabs inside toolbar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Only show AI History Generator button for Admin */}
            {isAdmin && (
              <button
                onClick={handleGenerateSummary}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-900" />
                <span>خلاصه هوشمند تاریخچه و دستاوردها (ادمین)</span>
              </button>
            )}

            <nav className="flex flex-wrap items-center gap-1 bg-black/20 p-1.5 rounded-2xl border border-white/10 text-xs">
              <button
                onClick={() => setActiveTab('about')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'about' ? 'bg-white text-[#173b82] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                معرفی
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'members' ? 'bg-white text-[#173b82] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                اعضا ({toPersianDigits(team.members.length)})
              </button>
              <button
                onClick={() => setActiveTab('activities')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                  activeTab === 'activities' ? 'bg-white text-[#173b82] shadow-xs' : 'text-white/80 hover:text-white'
                }`}
              >
                گزارش‌ها ({toPersianDigits(teamVideoResources.length)})
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Grid: Info + Reports Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Team Identity & Members */}
        <div className="lg:col-span-4 space-y-6">
          {/* Visual Logo Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 text-center shadow-xs space-y-4">
            <div className="team-logo-responsive mx-auto rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-md p-1 bg-white dark:bg-slate-800">
              <ImageLoader
                src={team.logo || getTeamLogoPlaceholder(team.id, team.name)}
                fallbackSrc={getTeamLogoPlaceholder(team.id, team.name)}
                alt={team.name}
                type="team"
                rounded="full"
                aspectRatio="square"
                showFormatBadge={true}
                className="w-full h-full object-contain rounded-full img-sharp"
                containerClassName="w-full h-full rounded-full"
                priority={true}
              />
            </div>

            <div>
              <h2 className="text-xl font-black text-[#173b82] dark:text-blue-400">{team.name}</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold mt-1">
                مدیر تیم: <span className="text-slate-800 dark:text-slate-200 font-bold">{team.manager}</span>
              </p>
            </div>

            {team.slogan && (
              <div className="bg-gradient-to-r from-[#173b82] to-[#2563eb] text-white py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold shadow-xs">
                «{team.slogan}»
              </div>
            )}

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed text-right pt-2 border-t border-slate-100 dark:border-slate-800 font-medium">
              {team.description}
            </p>

            {/* AI Summary button only for admin */}
            {isAdmin && (
              <button
                onClick={handleGenerateSummary}
                className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Bot className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>تولید خلاصه متنی تاریخچه با هوش مصنوعی</span>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  try {
                    sessionStorage.setItem('mahash_admin_preselected_team', teamSlug);
                  } catch (e) {}
                  onNavigate('admin');
                }}
                className="w-full py-2.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>مدیریت و بارگذاری گزارش برای این تیم</span>
              </button>
            )}
          </div>

          {/* Members Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-[#173b82] dark:text-blue-400" />
                <span>اعضای فعال تیم</span>
              </h3>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">{toPersianDigits(team.members.length)} نفر</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {team.members.map((member, i) => {
                const avatarSrc = getMemberAvatar(teamSlug, member);
                const isCustomImg = avatarSrc && (avatarSrc.startsWith('data:image') || avatarSrc.startsWith('http') || avatarSrc.startsWith('/'));

                return (
                  <div
                    key={i}
                    className="inline-flex items-center gap-1.5 text-xs bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 pl-3 pr-1.5 py-1 rounded-full font-medium"
                  >
                    <div className="w-5 h-5 rounded-full overflow-hidden bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 flex items-center justify-center shrink-0">
                      {isCustomImg ? (
                        <img loading="lazy" src={avatarSrc} alt={member} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[10px]">{avatarSrc || '👤'}</span>
                      )}
                    </div>
                    <span>{member}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Activities & Reports */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-xs text-[#0f766e] dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 rounded-full inline-block mb-1">
                  فعالیت‌های مستند
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-[#173b82] dark:text-blue-400">
                  گزارش فعالیت‌های {team.name}
                </h2>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-bold">
                {toPersianDigits(teamVideoResources.length)} گزارش ثبت شده
              </span>
            </div>

            {/* Reports List */}
            {teamVideoResources.length === 0 ? (
              <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                  هنوز گزارش جدیدی برای این تیم بارگذاری نشده است. به زودی فعالیت‌های جدید ثبت خواهد شد.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {teamVideoResources.map((item, rIdx) => {
                  const isOpen = openReportId === item.reportId;
                  const isLatest = rIdx === 0;
                  const report = item.originalReport;

                  return (
                    <div
                      key={item.id}
                      className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                        isOpen ? 'border-[#173b82]/30 shadow-md bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30'
                      }`}
                    >
                      {/* Report Accordion Header */}
                      <button
                        onClick={() => setOpenReportId(isOpen ? null : item.reportId)}
                        className="w-full text-right p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                          <span className="px-2.5 py-1 bg-[#173b82] text-white text-xs font-black rounded-full shrink-0">
                            {formatReportNumberDisplay(item.reportNum)}
                          </span>
                          <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-slate-100 leading-snug">
                            {item.title}
                          </h3>
                          {item.hasVideo ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              <Film className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                              <span>گزارش ویدیویی</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <FileText className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                              <span>گزارش مستند / متنی</span>
                            </span>
                          )}
                          {isLatest && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-600 text-white shadow-2xs">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>ردیف اول: جدیدترین گزارش</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                          <span className="inline-flex items-center gap-1.5 text-[11px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 font-bold px-3 py-1 rounded-full shadow-2xs">
                            <Calendar className="w-3 h-3 text-emerald-700 dark:text-emerald-400" />
                            <span>{formatSmartUpdateDate(item.date, { persianDigits: true })}</span>
                          </span>
                          <span className="w-7 h-7 rounded-full bg-slate-200/80 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-sm">
                            {isOpen ? '−' : '+'}
                          </span>
                        </div>
                      </button>

                      {/* Report Content Panel */}
                      {isOpen && (
                        <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-slate-800 space-y-4 bg-white dark:bg-slate-900">
                          <FormattedText text={item.summary} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium" />

                          {/* AI Assistant Quick Actions Bar for Report - ONLY FOR ADMIN */}
                          {isAdmin && (
                            <div className="bg-gradient-to-r from-blue-50/80 via-slate-50 to-teal-50/80 dark:from-slate-800/80 dark:via-slate-850 dark:to-teal-950/40 p-3.5 rounded-2xl border border-blue-100 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#173b82] text-white flex items-center justify-center shadow-2xs">
                                  <Sparkles className="w-3.5 h-3.5" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                                    دستیار هوش مصنوعی متن گزارش (ویژه ادمین)
                                  </span>
                                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                    کمک به نگارش، استخراج محورها و بازنویسی حرفه‌ای
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-2">
                                <button
                                  onClick={() => handleOpenAiAssistant(report, 'polish')}
                                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 text-[#173b82] dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  <Wand2 className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                                  <span>ویراستاری و بازنویسی</span>
                                </button>
                                <button
                                  onClick={() => handleOpenAiAssistant(report, 'bullets')}
                                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-slate-700 text-[#0f766e] dark:text-teal-300 border border-teal-200 dark:border-teal-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  <CheckCircle2 className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                                  <span>استخراج نکات کلیدی</span>
                                </button>
                                <button
                                  onClick={() => handleOpenAiAssistant(report, 'subtitles')}
                                  className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-purple-50 dark:hover:bg-slate-700 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
                                >
                                  <Film className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                                  <span>سناریوی زیرنویس</span>
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Video Player with Isolated State & Team Metadata */}
                          {item.hasVideo && (
                            <ReportVideoPlayer
                              report={report}
                              teamName={team.name}
                              teamSlug={teamSlug}
                              onNavigateToAdmin={() => onNavigate('admin')}
                            />
                          )}

                          {/* Key Points */}
                          {item.keyPoints && item.keyPoints.length > 0 && (
                            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-2">
                              <h4 className="text-xs font-bold text-[#173b82] dark:text-blue-400">
                                {item.subhead || 'محورهای کلیدی گزارش:'}
                              </h4>
                              <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                                {item.keyPoints.map((point, pIdx) => (
                                  <li key={pIdx} className="flex items-start gap-2">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                    <span>{point}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Attachments & Files View */}
                          <ReportAttachmentsView report={report} teamName={team.name} reportTitle={item.title} />

                          {/* Print / Archive / Version History Action Bar */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                            <span className="text-[11px] text-slate-400">
                              شناسه گزارش: <span className="font-mono">{item.reportId}</span>
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {isAdmin && (
                                <>
                                  {/* Visual 'Version History' toggle (Admin Only) */}
                                  <button
                                    onClick={() => setVersionHistoryReportId(versionHistoryReportId === report.id ? null : report.id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                                      versionHistoryReportId === report.id
                                        ? 'bg-indigo-600 text-white shadow-sm'
                                        : 'bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                    }`}
                                    title="مشاهده تاریخچه نسخه‌ها و مقایسه در دیتابیس MySQL"
                                  >
                                    <History className="w-3.5 h-3.5" />
                                    <span>تاریخچه نسخه‌ها</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      try {
                                        sessionStorage.setItem('mahash_admin_preselected_team', teamSlug);
                                      } catch (e) {}
                                      onNavigate('admin');
                                    }}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-[#173b82] dark:text-blue-400" />
                                    <span>ویرایش در مدیریت</span>
                                  </button>

                                  <PrintReportButton
                                    report={report}
                                    teamName={team.name}
                                    teamLogo={team.logo}
                                    managerName={team.manager}
                                    variant="outline"
                                  />
                                </>
                              )}
                            </div>
                          </div>

                          {/* Version History Comparison & Restore Panel (Admin Only) */}
                          {isAdmin && versionHistoryReportId === report.id && (
                            <div className="pt-2">
                              <ReportVersionHistory
                                report={report}
                                teamName={team.name}
                                isAdmin={isAdmin}
                                onVersionRestored={(restored) => {
                                  const updated = getTeam(teamSlug);
                                  setTeam(updated);
                                }}
                                onClose={() => setVersionHistoryReportId(null)}
                              />
                            </div>
                          )}

                          {/* Report Comments & Opinions Section */}
                          <CommentsSection reportId={report.id} isAdmin={isAdmin} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Gemini AI Tone & Content Suggestion Box - ONLY FOR ADMIN */}
          {isAdmin && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 border border-blue-100 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white">
                      پیشنهاد بهبود لحن و متن گزارش با هوش مصنوعی (Gemini) - ویژه مدیر
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      بازنویسی خودکار، متناسب‌سازی لحن برای افراد با افت شنوایی و غنی‌سازی ساختار گزارش
                    </p>
                  </div>
                </div>

                {/* Tone Selector */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-slate-500 font-bold hidden sm:inline">لحن:</span>
                  {[
                    { id: 'official', label: 'رسمی و اداری' },
                    { id: 'motivational', label: 'انگیزشی' },
                    { id: 'brief', label: 'موجز و خبری' },
                    { id: 'educational', label: 'آموزشی' }
                  ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setGeminiTone(t.id as any)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                        geminiTone === t.id
                          ? 'bg-[#173b82] text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Form */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    متن گزارش یا پیش‌نویس فعالیت:
                  </label>
                  <textarea
                    value={geminiInputText}
                    onChange={(e) => setGeminiInputText(e.target.value)}
                    placeholder="متن گزارش خود را اینجا تایپ کنید یا تغییر دهید تا با هوش مصنوعی بازنویسی و غنی‌سازی شود..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-hidden transition resize-y"
                  />
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <div className="w-full sm:flex-1">
                    <input
                      type="text"
                      value={geminiCustomPrompt}
                      onChange={(e) => setGeminiCustomPrompt(e.target.value)}
                      placeholder="دستور ویژه اختیاری (مثلاً: تأکید روی کارگاه زبان اشاره یا دستاورد شغلی)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-blue-500 outline-hidden"
                    />
                  </div>

                  <button
                    onClick={handleRequestGeminiSuggestion}
                    disabled={isGeminiLoading || !geminiInputText.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                  >
                    {isGeminiLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>در حال تحلیل و تولید با Gemini...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>دریافت پیشنهاد هوشمند از Gemini</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Generated Suggestion Output */}
              {geminiSuggestion && (
                <div className="mt-4 p-5 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-800/90 dark:via-indigo-950/20 dark:to-slate-850 border border-blue-200 dark:border-blue-900/60 rounded-2xl space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between pb-2 border-b border-blue-100 dark:border-blue-900/40">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        نتیجه بازنویسی و پیشنهاد هوش مصنوعی
                      </span>
                    </div>
                    <button
                      onClick={handleCopyGemini}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 shadow-2xs transition cursor-pointer"
                    >
                      {copiedGemini ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedGemini ? 'کپی شد!' : 'کپی متن کامل'}</span>
                    </button>
                  </div>

                  <div className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                    <FormattedText text={geminiSuggestion} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Back Button */}
      <div className="flex justify-end pt-4">
        <button
          onClick={() => onNavigate('teams-hub')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 hover:border-[#173b82] dark:hover:border-blue-400 text-[#173b82] dark:text-blue-400 rounded-full text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer"
        >
          <span>بازگشت به اسامی تیم‌ها</span>
          <span>←</span>
        </button>
      </div>

      {/* Smart Summary Modal for Team History */}
      {showSummaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-right max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-200 dark:border-amber-800">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    خلاصه هوشمند تاریخچه و دستاوردهای {team.name}
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    استخراج هوشمند بر مبنای مستندات و فعالیت‌های ثبت شده
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowSummaryModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isGeneratingSummary ? (
              <div className="py-12 text-center space-y-3">
                <div className="inline-block animate-spin w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  در حال تحلیل گزارش‌ها و نگارش خلاصه جامع تیم با هوش مصنوعی...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <FormattedText
                    text={teamSummaryText || ''}
                    className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-3 font-medium"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleCopySummary}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#173b82] hover:bg-[#122e66] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {copiedSummary ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedSummary ? 'کپی شد!' : 'کپی کردن خلاصه'}</span>
                  </button>

                  <button
                    onClick={() => setShowSummaryModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    بستن پنجره
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* AI Report Text Assistant Modal */}
      {showAiReportModal && aiSelectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 text-right max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#173b82] dark:text-blue-300 flex items-center justify-center border border-blue-200 dark:border-blue-800">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white">
                    دستیار هوشمند نگارش و ویرایش توضیحات گزارش
                  </h3>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    گزارش: «{aiSelectedReport.title}»
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowAiReportModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mode selection tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => runAiAssistance(aiSelectedReport, 'polish')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  aiAssistanceMode === 'polish'
                    ? 'bg-[#173b82] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Wand2 className="w-3.5 h-3.5" />
                <span>ویراستاری رسمی</span>
              </button>
              <button
                onClick={() => runAiAssistance(aiSelectedReport, 'bullets')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  aiAssistanceMode === 'bullets'
                    ? 'bg-[#173b82] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>استخراج محورها</span>
              </button>
              <button
                onClick={() => runAiAssistance(aiSelectedReport, 'summary')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  aiAssistanceMode === 'summary'
                    ? 'bg-[#173b82] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>چکیده انتشار</span>
              </button>
              <button
                onClick={() => runAiAssistance(aiSelectedReport, 'subtitles')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  aiAssistanceMode === 'subtitles'
                    ? 'bg-[#173b82] text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>سناریوی زیرنویس</span>
              </button>
            </div>

            {isAiLoading ? (
              <div className="py-10 text-center space-y-3">
                <div className="inline-block animate-spin w-8 h-8 border-3 border-[#173b82] border-t-transparent rounded-full" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  در حال پردازش هوشمند متن گزارش با Gemini...
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <FormattedText
                    text={aiOutputText}
                    className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed space-y-3 font-medium whitespace-pre-line"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handleCopyAiOutput}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#173b82] hover:bg-[#122e66] text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {copiedAiText ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedAiText ? 'کپی شد!' : 'کپی کردن خروجی'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    {isAdmin && (
                      <button
                        onClick={() => {
                          try {
                            sessionStorage.setItem('mahash_admin_preselected_team', teamSlug);
                          } catch (e) {}
                          setShowAiReportModal(false);
                          onNavigate('admin');
                        }}
                        className="px-3.5 py-2 bg-blue-50 dark:bg-blue-950/60 text-[#173b82] dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        اعمال در پنل مدیریت
                      </button>
                    )}
                    <button
                      onClick={() => setShowAiReportModal(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      بستن
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
