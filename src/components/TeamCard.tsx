import React from 'react';
import { TeamData, PageId } from '../types';
import { getTeamLogoPlaceholder } from '../utils/assets';
import { toPersianDigits } from '../utils/persianDate';
import { FileText, ArrowLeft, Users } from 'lucide-react';
import { ResponsiveImage } from './ResponsiveImage';
import { ImageLoader } from './ImageLoader';

interface TeamCardProps {
  team: TeamData;
  onNavigate: (page: PageId) => void;
  variant?: 'grid' | 'featured' | 'compact';
  className?: string;
}

export const TeamCard: React.FC<TeamCardProps> = ({
  team,
  onNavigate,
  variant = 'grid',
  className = '',
}) => {
  const fallbackLogo = getTeamLogoPlaceholder(team.id, team.name);
  const rawSrc = team.logo || fallbackLogo;
  const reportsCount = team.reports?.length || 0;
  const targetPage = (team.slug || `team-${team.id}`) as PageId;

  if (variant === 'compact') {
    return (
      <div
        onClick={() => onNavigate(targetPage)}
        className={`flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md transition-all cursor-pointer group ${className}`}
      >
        <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-0.5 flex-shrink-0 relative">
          <ImageLoader
            src={rawSrc}
            fallbackSrc={fallbackLogo}
            alt={team.name}
            type="team"
            rounded="full"
            aspectRatio="square"
            className="w-full h-full object-contain rounded-full img-sharp"
            containerClassName="w-full h-full rounded-full"
          />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
            {team.name}
          </h4>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {toPersianDigits(reportsCount)} گزارش
          </span>
        </div>
        <ArrowLeft className="w-4 h-4 text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:-translate-x-1 transition-transform" />
      </div>
    );
  }

  return (
    <div
      className={`team-card-surface flex flex-col bg-white dark:bg-slate-800 rounded-3xl p-5 sm:p-6 border border-slate-200/90 dark:border-slate-700 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group ${className}`}
    >
      {/* Top Badge & Reports Count */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/80 px-2.5 py-1 rounded-full border border-teal-200 dark:border-teal-800">
          <FileText className="w-3 h-3" />
          <span>{toPersianDigits(reportsCount)} گزارش ثبت‌شده</span>
        </div>
        <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-md border border-slate-200 dark:border-slate-600">
          {team.id}
        </span>
      </div>

      {/* Team Logo with Responsive Scaling & WebP Lazy Loading */}
      <div className="flex justify-center mb-4 sm:mb-5 relative">
        <div className="team-logo-responsive rounded-full overflow-hidden border-3 border-slate-100 dark:border-slate-700 shadow-md p-1 bg-white dark:bg-slate-700 group-hover:scale-105 group-hover:shadow-lg transition-all duration-300 relative">
          <ImageLoader
            src={rawSrc}
            fallbackSrc={fallbackLogo}
            alt={team.name}
            type="team"
            rounded="full"
            aspectRatio="square"
            className="w-full h-full object-contain rounded-full img-sharp"
            containerClassName="w-full h-full rounded-full"
          />
        </div>
      </div>

      {/* Team Info */}
      <div className="text-center space-y-2.5 flex-1 flex flex-col">
        <h3 className="text-lg sm:text-xl font-black text-[#173b82] dark:text-blue-300 group-hover:text-blue-600 dark:group-hover:text-blue-200 transition-colors">
          {team.name}
        </h3>

        <div className="inline-flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-200 bg-slate-100 dark:bg-slate-700/80 border border-slate-200/60 dark:border-slate-600 py-1 px-3 rounded-full self-center">
          <span className="text-slate-400 dark:text-slate-400">مدیر تیم:</span>
          <strong className="text-slate-800 dark:text-slate-100 font-bold">{team.manager}</strong>
        </div>

        {team.slogan && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50/70 dark:from-slate-700/90 dark:to-indigo-950/60 border border-blue-100/80 dark:border-slate-600 text-[#173b82] dark:text-blue-200 text-xs font-bold py-2 px-3 rounded-xl line-clamp-2">
            «{team.slogan}»
          </div>
        )}

        {/* Members Preview */}
        {team.members && team.members.length > 0 && (
          <div className="pt-2">
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-400 mb-1.5">
              <Users className="w-3 h-3" />
              <span>اعضای اصلی ({toPersianDigits(team.members.length)} نفر)</span>
            </div>
            <div className="flex flex-wrap justify-center gap-1">
              {team.members.slice(0, 5).map((m, i) => (
                <span
                  key={i}
                  className="text-[11px] bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded-full font-medium"
                >
                  {m}
                </span>
              ))}
              {team.members.length > 5 && (
                <span className="text-[11px] bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-200 px-1.5 py-0.5 rounded-full font-bold">
                  +{toPersianDigits(team.members.length - 5)}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action Button */}
      <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700">
        <button
          onClick={() => onNavigate(targetPage)}
          className="w-full py-2.5 px-4 bg-[#173b82] hover:bg-[#0f275a] dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group-hover:gap-3 cursor-pointer"
        >
          <span>مشاهده صفحه و گزارش‌های تیم</span>
          <ArrowLeft className="w-4 h-4 transition-transform" />
        </button>
      </div>
    </div>
  );
};
