import React, { useState, useEffect } from 'react';
import { PageId, TeamData } from '../types';
import { getAllTeamsList, subscribeToStoreUpdates } from '../utils/reportsStore';
import { Breadcrumb } from '../components/Breadcrumb';
import { TeamCard } from '../components/TeamCard';
import { toPersianDigits } from '../utils/persianDate';
import { Users, Award, Sparkles } from 'lucide-react';

interface TeamsHubPageProps {
  onNavigate: (page: PageId) => void;
}

export const TeamsHubPage: React.FC<TeamsHubPageProps> = ({ onNavigate }) => {
  const [teams, setTeams] = useState<TeamData[]>(() => getAllTeamsList());

  useEffect(() => {
    const refresh = () => setTeams(getAllTeamsList());
    const unsub = subscribeToStoreUpdates(refresh);
    return () => unsub();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: 'باشگاه جوانان', target: 'home' },
          { label: 'اسامی تیم‌ها' }
        ]}
        onNavigate={onNavigate}
      />

      {/* Page Heading */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100/80 dark:bg-blue-950/80 text-[#173b82] dark:text-blue-300 text-xs font-bold border border-blue-200 dark:border-blue-800">
          <Users className="w-3.5 h-3.5" />
          <span>باشگاه جوانان محاش</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
          اسامی و کارگروه‌های تیم‌های جوانان محاش
        </h1>
        <div className="w-16 h-1.5 bg-gradient-to-r from-[#173b82] to-[#0f766e] rounded-full mx-auto"></div>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
          در باشگاه جوانان محاش، هر تیم یک خانواده پویا برای یادگیری، دوستی، خلاقیت و اثرگذاری است. برای مشاهده فعالیت‌ها، گزارش‌ها و ویدیوهای هر تیم روی کارت اختصاصی آن کلیک نمایید.
        </p>
      </div>

      {/* 5 Official Team Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {teams.map((team, idx) => (
          <TeamCard
            key={team.id}
            team={team}
            onNavigate={onNavigate}
            className={teams.length === 5 && idx === 4 ? 'md:col-span-2 lg:col-span-1' : ''}
          />
        ))}
      </div>

      {/* Direct link to scores summary */}
      <div className="max-w-3xl mx-auto bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shrink-0 shadow-xs">
            🏆
          </div>
          <div>
            <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">جمع‌بندی امتیازات تیم‌های باشگاه</h3>
            <p className="text-xs text-amber-800 dark:text-amber-400">مشاهده جدول رتبه‌بندی، امتیازات و درصد پیشرفت تیم‌ها</p>
          </div>
        </div>
        <button
          onClick={() => onNavigate('scores')}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition shrink-0 cursor-pointer"
        >
          مشاهده امتیازات ←
        </button>
      </div>
    </div>
  );
};
