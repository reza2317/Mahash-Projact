import React, { useState, useMemo } from 'react';
import { ActivityReport } from '../types';
import { Calendar, Filter, FileText, PlayCircle } from 'lucide-react';
import { toPersianDigits } from '../utils/persianDigitsHandler';

interface MonthlyReportsProps {
  allReports: (ActivityReport & { teamName: string; teamSlug: string })[];
}

export const MonthlyReports: React.FC<MonthlyReportsProps> = ({ allReports }) => {
  // Extract unique months from reports
  const months = useMemo(() => {
    const monthSet = new Set<string>();
    allReports.forEach(r => {
      if (r.date) {
        // Assuming date is in format "YYYY/MM/DD"
        const parts = r.date.split('/');
        if (parts.length >= 2) {
          monthSet.add(`${parts[0]}/${parts[1]}`);
        }
      }
    });
    return Array.from(monthSet).sort((a, b) => b.localeCompare(a)); // Descending order
  }, [allReports]);

  const [selectedMonth, setSelectedMonth] = useState<string>(months.length > 0 ? months[0] : '');

  // Filter reports by selected month
  const monthlyReports = useMemo(() => {
    if (!selectedMonth) return [];
    return allReports.filter(r => {
      if (!r.date) return false;
      const parts = r.date.split('/');
      if (parts.length >= 2) {
        return `${parts[0]}/${parts[1]}` === selectedMonth;
      }
      return false;
    });
  }, [allReports, selectedMonth]);

  // Convert month "1405/06" to a readable label like "شهریور ۱۴۰۵"
  const getMonthLabel = (monthStr: string) => {
    const parts = monthStr.split('/');
    if (parts.length < 2) return monthStr;
    const year = parts[0];

    const toEnglishDigits = (str: string) => {
      const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
      return str.replace(/[۰-۹]/g, (w) => persianDigits.indexOf(w).toString());
    };
    const monthNum = parseInt(toEnglishDigits(parts[1]), 10);

    const monthNames = [
      'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
      'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
    ];
    const monthName = monthNames[monthNum - 1] || parts[1];
    return `${monthName} ${year}`;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <span>گزارش‌های ماهانه</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              دسته بندی و مشاهده تفکیک شده گزارش‌های تمامی تیم‌ها بر اساس ماه‌های سال
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {months.length === 0 ? (
            <div className="text-sm text-slate-500">هیچ تاریخی برای دسته‌بندی یافت نشد.</div>
          ) : (
            months.map(m => (
              <button
                key={m}
                onClick={() => setSelectedMonth(m)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                  selectedMonth === m
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                }`}
              >
                {toPersianDigits(getMonthLabel(m))}
              </button>
            ))
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-md font-bold text-slate-800 dark:text-slate-200">
            لیست گزارش‌های {selectedMonth ? toPersianDigits(getMonthLabel(selectedMonth)) : ''}
          </h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            {toPersianDigits(monthlyReports.length)} گزارش
          </span>
        </div>

        {monthlyReports.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium text-sm">هیچ گزارشی در این ماه ثبت نشده است.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {monthlyReports.map((report, idx) => (
              <div key={report.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-black shrink-0">
                    {toPersianDigits(idx + 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white line-clamp-1">{report.title}</h4>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                      <span className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300 px-2 py-0.5 rounded flex items-center gap-1">
                        {report.teamName}
                      </span>
                      <span>گزارش شماره {toPersianDigits(report.reportNum)}</span>
                      <span>تاریخ: {toPersianDigits(report.date || '')}</span>
                    </div>
                  </div>
                </div>
                {report.videoSrc && report.videoSrc !== '#' && (
                  <div className="shrink-0 flex items-center gap-2 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-400 px-3 py-1.5 rounded-lg text-sm font-bold self-start sm:self-auto">
                    <PlayCircle className="w-4 h-4" />
                    <span>دارای ویدیو</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
