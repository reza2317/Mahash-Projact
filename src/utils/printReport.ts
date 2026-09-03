import { TeamReport } from '../types';
import { getMahashLogo } from './reportsStore';
import { MAHESH_LOGO_SVG, getTeamLogoPlaceholder } from './assets';
import { formatSmartUpdateDate, toPersianDigits, formatReportNumberDisplay } from './persianDate';

function formatMarkdownForPrint(text: string): string {
  if (!text) return '';
  const lines = text.split('\n');
  return lines
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return '<br />';
      
      // Inline formatting
      let formatted = trimmed
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/__(.*?)__/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/_(.*?)_/g, '<em>$1</em>')
        .replace(/~~(.*?)~~/g, '<del>$1</del>');

      if (trimmed.startsWith('# ')) {
        return `<h2 style="font-size: 15px; font-weight: 900; color: #0f2f6b; margin: 10px 0 4px 0;">${formatted.replace(/^#\s+/, '')}</h2>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h3 style="font-size: 14px; font-weight: 800; color: #1e3a8a; margin: 8px 0 4px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 2px;">${formatted.replace(/^##\s+/, '')}</h3>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h4 style="font-size: 13px; font-weight: bold; color: #2563eb; margin: 6px 0 2px 0;">${formatted.replace(/^###\s+/, '')}</h4>`;
      }
      if (trimmed.startsWith('> ')) {
        return `<blockquote style="border-right: 3px solid #2563eb; padding: 4px 10px; background: #f1f5f9; margin: 6px 0; border-radius: 4px; font-style: italic;">${formatted.replace(/^>\s+/, '')}</blockquote>`;
      }
      if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return `<div style="display: flex; align-items: flex-start; gap: 6px; margin: 3px 0;"><span style="color: #2563eb; font-weight: bold;">•</span><span>${formatted.replace(/^[•\-\*]\s+/, '')}</span></div>`;
      }
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        const numContent = numMatch[2]
          .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
          .replace(/__(.*?)__/g, '<strong>$1</strong>')
          .replace(/\*(.*?)\*/g, '<em>$1</em>')
          .replace(/_(.*?)_/g, '<em>$1</em>');
        return `<div style="display: flex; align-items: flex-start; gap: 6px; margin: 3px 0;"><span style="color: #2563eb; font-weight: bold;">${toPersianDigits(numMatch[1])}.</span><span>${numContent}</span></div>`;
      }

      return `<p style="margin: 4px 0; line-height: 1.8;">${formatted}</p>`;
    })
    .join('');
}

export function printTeamReport(report: TeamReport, teamName: string, teamLogo?: string, managerName?: string) {
  const mahashLogo = getMahashLogo() || MAHESH_LOGO_SVG;
  const effectiveTeamLogo = teamLogo || getTeamLogoPlaceholder(report.teamSlug || 'team', teamName);
  const formattedDate = formatSmartUpdateDate(report.date, { persianDigits: true });
  const printDate = new Date().toLocaleDateString('fa-IR');

  const printWindow = window.open('', '_blank', 'width=850,height=900');
  if (!printWindow) {
    alert('لطفاً اجازه باز شدن پنجره پاپ‌آپ (Pop-up) را برای چاپ گزارش صادر فرمایید.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
  <meta charset="UTF-8">
  <title>نسخه چاپی و بایگانی - ${report.title}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 15mm 15mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, "Vazirmatn", "Segoe UI", Roboto, Tahoma, sans-serif;
      background: #ffffff;
      color: #1e293b;
      line-height: 1.6;
      margin: 0;
      padding: 20px;
      direction: rtl;
    }
    .print-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f2f6b;
      padding-bottom: 15px;
      margin-bottom: 20px;
    }
    .print-header-brand {
      display: flex;
      align-items: center;
      gap: 15px;
    }
    .mahash-logo {
      width: 70px;
      height: 70px;
      object-fit: contain;
    }
    .team-logo {
      width: 60px;
      height: 60px;
      object-fit: contain;
      border-radius: 50%;
      border: 1px solid #cbd5e1;
      padding: 2px;
    }
    .title-group h1 {
      margin: 0;
      font-size: 18px;
      color: #0f2f6b;
      font-weight: 900;
    }
    .title-group p {
      margin: 3px 0 0 0;
      font-size: 12px;
      color: #64748b;
    }
    .meta-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      font-size: 12px;
    }
    .meta-item strong {
      color: #0f2f6b;
    }
    .report-title-section {
      margin-bottom: 18px;
    }
    .report-number-badge {
      display: inline-block;
      background: #0f2f6b;
      color: #ffffff;
      padding: 3px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      margin-bottom: 6px;
    }
    .report-title {
      font-size: 16px;
      font-weight: 900;
      color: #0f172a;
      margin: 4px 0 10px 0;
      line-height: 1.4;
    }
    .report-summary {
      font-size: 13px;
      line-height: 1.8;
      color: #334155;
      background: #ffffff;
      text-align: justify;
      white-space: pre-line;
      margin-bottom: 20px;
    }
    .section-box {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 13px;
      font-weight: bold;
      color: #0f2f6b;
      margin: 0 0 10px 0;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 5px;
    }
    .key-points-list {
      margin: 0;
      padding-right: 20px;
      font-size: 12px;
      color: #334155;
    }
    .key-points-list li {
      margin-bottom: 6px;
    }
    .attachments-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
      margin-top: 10px;
    }
    .attachment-card {
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px;
      display: flex;
      align-items: center;
      gap: 10px;
      background: #ffffff;
      font-size: 11px;
    }
    .attachment-img {
      width: 45px;
      height: 45px;
      object-fit: cover;
      border-radius: 6px;
    }
    .print-footer {
      margin-top: 35px;
      padding-top: 15px;
      border-top: 1px solid #cbd5e1;
      display: flex;
      justify-content: space-between;
      font-size: 11px;
      color: #64748b;
    }
    .signature-area {
      display: flex;
      justify-content: space-around;
      margin-top: 30px;
      padding-top: 20px;
    }
    .signature-box {
      text-align: center;
      font-size: 11px;
      color: #475569;
      width: 180px;
      border-top: 1px dashed #94a3b8;
      padding-top: 8px;
    }
    @media print {
      body {
        padding: 0;
      }
      .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print" style="margin-bottom: 20px; text-align: left;">
    <button onclick="window.print()" style="background: #0f2f6b; color: #fff; border: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; cursor: pointer;">
      🖨️ چاپ یا ذخیره PDF
    </button>
    <button onclick="window.close()" style="background: #e2e8f0; color: #334155; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; margin-right: 8px;">
      بستن پنجره
    </button>
  </div>

  <div class="print-header">
    <div class="print-header-brand">
      <img loading="lazy" src="${mahashLogo}" alt="لوگوی موسسه محاش" class="mahash-logo" />
      <div class="title-group">
        <h1>مؤسسه توانبخشی و پیشگیری محاش</h1>
        <p>باشگاه جوانان ناشنوا و کم‌شنوا — سامانه بایگانی اسناد و گزارش‌ها</p>
      </div>
    </div>
    <div style="display: flex; align-items: center; gap: 10px;">
      <img loading="lazy" src="${effectiveTeamLogo}" alt="${teamName}" class="team-logo" />
      <div style="text-align: left; font-size: 11px;">
        <strong style="color: #0f2f6b; display: block;">${teamName}</strong>
        ${managerName ? `<span style="color: #64748b;">مدیر: ${managerName}</span>` : ''}
      </div>
    </div>
  </div>

  <div class="meta-box">
    <div class="meta-item">
      <span>تیم مربوطه:</span> <strong>${teamName}</strong>
    </div>
    <div class="meta-item">
      <span>تاریخ انتشار گزارش:</span> <strong>${formattedDate}</strong>
    </div>
    <div class="meta-item">
      <span>شناسه یکتای گزارش:</span> <strong style="font-family: monospace;">${report.id}</strong>
    </div>
  </div>

  <div class="report-title-section">
    <span class="report-number-badge">${formatReportNumberDisplay(report.reportNum)}</span>
    <h2 class="report-title">${report.title}</h2>
  </div>

  <div class="report-summary">
    ${formatMarkdownForPrint(report.summary)}
  </div>

  ${
    report.keyPoints && report.keyPoints.length > 0
      ? `
    <div class="section-box">
      <h3 class="section-title">محورها و نکات کلیدی گزارش:</h3>
      <ul class="key-points-list">
        ${report.keyPoints.map((pt) => `<li>${pt}</li>`).join('')}
      </ul>
    </div>
  `
      : ''
  }

  ${
    report.attachments && report.attachments.length > 0
      ? `
    <div class="section-box">
      <h3 class="section-title">فایل‌ها و تصاویر پیوست شده (${toPersianDigits(report.attachments.length)} مورد):</h3>
      <div class="attachments-grid">
        ${report.attachments
          .map(
            (att) => `
          <div class="attachment-card">
            ${att.type === 'image' && att.dataUrl ? `<img loading="lazy" src="${att.dataUrl}" class="attachment-img" />` : '<span style="font-size: 20px;">📄</span>'}
            <div style="min-width: 0;">
              <strong style="display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${att.name}</strong>
              <span style="color: #64748b; font-size: 10px;">${att.sizeFormatted} • ${att.extension.toUpperCase()}</span>
              ${att.caption ? `<div style="font-size: 10px; color: #0f2f6b;">${att.caption}</div>` : ''}
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    </div>
  `
      : ''
  }

  <div class="signature-area">
    <div class="signature-box">
      مهر و امضای مدیر تیم<br />
      <strong>${managerName || teamName}</strong>
    </div>
    <div class="signature-box">
      تأییدیه باشگاه جوانان محاش<br />
      <strong>مدیریت نظارت و ارزیابی</strong>
    </div>
  </div>

  <div class="print-footer">
    <span>سامانه رسمی پرتال جوانان مؤسسه محاش</span>
    <span>تاریخ صدور نسخه چاپی: ${printDate}</span>
    <span>صفحه ۱ از ۱</span>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}
