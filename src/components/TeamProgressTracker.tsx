import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import { TeamData } from '../types';
import { toPersianDigits } from '../utils/persianDate';
import { Award, CheckCircle2, TrendingUp } from 'lucide-react';

interface TeamProgressTrackerProps {
  team: TeamData;
}

interface MetricItem {
  id: string;
  name: string;
  progress: number;
  target: number;
  percentage: number;
  color: string;
  description: string;
}

export const TeamProgressTracker: React.FC<TeamProgressTrackerProps> = ({ team }) => {
  const metricsData = useMemo<MetricItem[]>(() => {
    const reportCount = team.reports?.length || 0;
    const memberCount = team.members?.length || 4;

    // Seed realistic, structured progress metrics tailored to the team's domain and report activity
    const baseProgress = Math.min(95, 45 + reportCount * 12);

    return [
      {
        id: 'workshops',
        name: 'برگزاری کارگاه‌ها و جلسات',
        progress: Math.min(10, 2 + reportCount * 2),
        target: 10,
        percentage: Math.min(100, Math.round(((2 + reportCount * 2) / 10) * 100)),
        color: '#10b981', // emerald
        description: 'برنامه‌ریزی، آموزش مهارت‌ها و تشکیل نشست‌های هم‌اندیشی',
      },
      {
        id: 'videos',
        name: 'تولید محتوای ویدیویی و گزارش‌ها',
        progress: Math.min(12, 3 + reportCount * 3),
        target: 12,
        percentage: Math.min(100, Math.round(((3 + reportCount * 3) / 12) * 100)),
        color: '#3b82f6', // blue
        description: 'ثبت ویدیوهای مستند با زیرنویس فارسی هم‌تراز',
      },
      {
        id: 'engagement',
        name: 'مشارکت اعضای فعال ناشنوا',
        progress: memberCount * 2,
        target: 15,
        percentage: Math.min(100, Math.round(((memberCount * 2) / 15) * 100)),
        color: '#8b5cf6', // purple
        description: 'همکاری مستقیم ناشنوایان در کارگروه‌ها و فعالیت‌های میدانی',
      },
      {
        id: 'rehab_skills',
        name: 'پروژه‌های مهارت‌آموزی و توانبخشی',
        progress: Math.min(8, 2 + Math.floor(reportCount * 1.5)),
        target: 8,
        percentage: Math.min(100, Math.round(((2 + Math.floor(reportCount * 1.5)) / 8) * 100)),
        color: '#f59e0b', // amber
        description: 'طرح‌های ارتقای فردی، کارآفرینی و تعاملات اجتماعی',
      },
      {
        id: 'documentation',
        name: 'مستندسازی و آرشیو رسمی',
        progress: Math.min(100, baseProgress),
        target: 100,
        percentage: Math.min(100, baseProgress),
        color: '#06b6d4', // cyan
        description: 'تدوین فایل‌های مکتوب، پیوست‌ها و تأییدیه‌های مدیریتی',
      },
    ];
  }, [team]);

  const overallAverage = useMemo(() => {
    const sum = metricsData.reduce((acc, curr) => acc + curr.percentage, 0);
    return Math.round(sum / metricsData.length);
  }, [metricsData]);

  // Custom Persian tooltip for recharts
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: MetricItem = payload[0].payload;
      return (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-2xl shadow-xl text-xs space-y-1 z-50">
          <p className="font-black text-slate-800 dark:text-slate-100">{data.name}</p>
          <p className="text-slate-600 dark:text-slate-300">{data.description}</p>
          <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 font-bold">
            <span className="text-slate-500">میزان پیشرفت:</span>
            <span className="text-emerald-600 dark:text-emerald-400">
              {toPersianDigits(data.percentage)}٪
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-200 dark:border-emerald-800">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
              نمودار وضعیت و ره‌نگار پیشرفت فعالیت‌های {team.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              پایش عملکرد دوره‌ای و ارزیابی شاخص‌های کلیدی کارگروه
            </p>
          </div>
        </div>

        {/* Overall Progress Badge */}
        <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 px-4 py-2 rounded-2xl self-start sm:self-auto">
          <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-medium block">
              میانگین پیشرفت اهداف
            </span>
            <span className="text-base font-black text-emerald-800 dark:text-emerald-200">
              {toPersianDigits(overallAverage)}٪ تحقق یافته
            </span>
          </div>
        </div>
      </div>

      {/* Visual Recharts Bar Graph */}
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={metricsData}
            layout="vertical"
            margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
          >
            <XAxis
              type="number"
              domain={[0, 100]}
              tickFormatter={(val) => `${toPersianDigits(val)}٪`}
              tick={{ fontSize: 11, fill: '#64748b' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={140}
              tick={{ fontSize: 11, fill: '#475569', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="percentage" radius={[0, 10, 10, 0]} barSize={18}>
              {metricsData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Progress Cards Detail Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
        {metricsData.map((metric) => (
          <div
            key={metric.id}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between gap-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {metric.name}
              </span>
              <span
                className="text-xs font-black px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${metric.color}20`, color: metric.color }}
              >
                {toPersianDigits(metric.percentage)}٪
              </span>
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${metric.percentage}%`,
                  backgroundColor: metric.color,
                }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
              <span>{metric.description}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
