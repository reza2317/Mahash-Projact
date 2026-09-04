import React from 'react';
import { Printer, FileDown } from 'lucide-react';
import { TeamReport } from '../types';
import { printTeamReport } from '../utils/printReport';

interface PrintReportButtonProps {
  report: TeamReport;
  teamName: string;
  teamLogo?: string;
  managerName?: string;
  variant?: 'primary' | 'outline' | 'minimal';
  className?: string;
}

export const PrintReportButton: React.FC<PrintReportButtonProps> = ({
  report,
  teamName,
  teamLogo,
  managerName,
  variant = 'outline',
  className = ''
}) => {
  const handlePrint = (e: React.MouseEvent) => {
    e.stopPropagation();
    printTeamReport(report, teamName, teamLogo, managerName);
  };

  if (variant === 'primary') {
    return (
      <button
        type="button"
        onClick={handlePrint}
        aria-label={`دریافت نسخه چاپی و خروجی پی‌دی‌اف گزارش ${report.title || teamName}`}
        className={`px-3.5 py-1.5 bg-[#0f2f6b] hover:bg-[#173b82] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer ${className}`}
        title="دریافت نسخه چاپی / ذخیره به صورت PDF"
      >
        <Printer className="w-3.5 h-3.5" aria-hidden="true" />
        <span>دریافت نسخه چاپی (PDF)</span>
      </button>
    );
  }

  if (variant === 'minimal') {
    return (
      <button
        type="button"
        onClick={handlePrint}
        aria-label={`چاپ یا ذخیره پی‌دی‌اف گزارش ${report.title || teamName}`}
        className={`p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition cursor-pointer ${className}`}
        title="چاپ یا ذخیره PDF گزارش"
      >
        <Printer className="w-4 h-4" aria-hidden="true" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePrint}
      aria-label={`دریافت نسخه چاپی و خروجی پی‌دی‌اف گزارش ${report.title || teamName}`}
      className={`px-3 py-1.5 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 hover:text-blue-600 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${className}`}
      title="دریافت نسخه چاپی استاندارد و خروجی PDF جهت بایگانی"
    >
      <Printer className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
      <span>دریافت نسخه چاپی</span>
    </button>
  );
};
