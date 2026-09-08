import fs from 'fs';

function normalizePersianText(str) {
  if (!str) return '';
  return str
    .replace(/[«»"'()؛:،,.\-—–!?/\\#]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ۀ/g, 'ه')
    .replace(/آ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/إ/g, 'ا')
    .replace(/انیمه/g, 'انیمیشن')
    .replace(/پر\s*انرژی/g, 'پرانرژی')
    .replace(/رویایی\s*کافه/g, 'رویای کافه')
    .replace(/رویایی\s*یک\s*کافه/g, 'رویای یک کافه')
    .replace(/خود\s*مراقبتی/g, 'خودمراقبتی')
    .replace(/خود\s*باوری/g, 'خودباوری')
    .trim()
    .toLowerCase();
}

function getReportSemanticKey(r) {
  const norm = normalizePersianText(r.title);
  const team = (r.teamSlug || '').replace(/^team-/, '');

  if (norm.includes('اینفوگرافیک') || norm.includes('اینفوگرافی') || norm.includes('جلسات اول تا چهارم') || r.id === 'tomorrow-02') {
    return `${team}___infographic`;
  }
  if (norm.includes('خودمراقبتی') || r.id === 'tomorrow-03') {
    return `${team}___self_care_video`;
  }
  if (norm.includes('مسیر تیم سازی') || norm.includes('گزارش جامع فعالیت') || norm.includes('گزارش کامل فعالیت') || r.id === 'tomorrow-01') {
    return `${team}___comprehensive_doc`;
  }
  if (norm.includes('کافه') || norm.includes('رویای کافه') || r.id === 'angels-01' || r.id === 'thinker-02') {
    return `${team}___cafe_dream`;
  }
  if (norm.includes('مسیر یک رویا') || norm.includes('فتح سکوی قهرمانی')) {
    return `${team}___champion_path`;
  }
  if (norm.includes('معرفی اعضای') && (norm.includes('فرشتگان') || team === 'angels')) {
    return `${team}___angels_members`;
  }
  if (norm.includes('اپلیکیشن') || norm.includes('برنامه ریزی و راه اندازی اپلیکیشن')) {
    return `${team}___app_report`;
  }
  if (norm.includes('پیام ویدیویی') && (norm.includes('شروعی برای همکاری') || norm.includes('خبرهای خوب') || r.id === 'thinker-01')) {
    return `${team}___collab_video`;
  }
  if (norm.includes('تانگرام') || norm.includes('پازل هندسی')) {
    return `${team}___tangram`;
  }
  if (norm.includes('حدس کارت')) {
    return `${team}___card_guess`;
  }
  if (norm.includes('معرفی اعضا') && (norm.includes('مغز متفکر') || team === 'thinker')) {
    return `${team}___thinker_members`;
  }

  // Fallback to normalized title
  return `${team}___${norm}`;
}

function getReportTimestamp(r) {
  if (r.id && r.id.startsWith('report-')) {
    const num = Number(r.id.replace('report-', ''));
    if (!isNaN(num)) return num;
  }
  if (r.updatedAt && typeof r.updatedAt === 'number') {
    return r.updatedAt;
  }
  if (r.datetimeIso) {
    const d = new Date(r.datetimeIso).getTime();
    if (!isNaN(d)) return d;
  }
  return 0;
}

function mergeDuplicateReports(preferred, secondary) {
  return {
    ...secondary,
    ...preferred,
    // Preserve transcript if secondary has it and preferred does not
    transcript: (preferred.transcript && preferred.transcript.length > 0) ? preferred.transcript : (secondary.transcript || []),
    // Preserve attachments if preferred doesn't have any
    attachments: (preferred.attachments && preferred.attachments.length > 0) ? preferred.attachments : (secondary.attachments || []),
    // Preserve keyPoints if preferred lacks them
    keyPoints: (preferred.keyPoints && preferred.keyPoints.length > 0) ? preferred.keyPoints : (secondary.keyPoints || []),
    // Preferred video takes precedence if present
    videoSrc: preferred.videoSrc || secondary.videoSrc,
    videoHint: preferred.videoHint || secondary.videoHint,
    posterSrc: preferred.posterSrc || secondary.posterSrc,
  };
}

function deduplicateReportsList(reports) {
  const byKey = new Map();

  for (const r of reports) {
    if (!r || !r.title) continue;
    const key = getReportSemanticKey(r);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, r);
    } else {
      const tsCurr = getReportTimestamp(r);
      const tsExisting = getReportTimestamp(existing);
      
      let preferred = r;
      let secondary = existing;
      if (tsExisting > tsCurr) {
        preferred = existing;
        secondary = r;
      }
      
      const merged = mergeDuplicateReports(preferred, secondary);
      byKey.set(key, merged);
    }
  }

  return Array.from(byKey.values());
}

const ds = JSON.parse(fs.readFileSync('./data_store.json', 'utf8'));
console.log('Original count in data_store.json:', ds.customReports.length);
const clean = deduplicateReportsList(ds.customReports);
console.log('Deduplicated count:', clean.length);

clean.forEach((r, idx) => {
  console.log(`[${idx + 1}] Team: ${r.teamSlug} | ID: ${r.id}`);
  console.log(`     Title: ${r.title}`);
  console.log(`     Date: ${r.date}`);
  console.log(`     Video: ${r.videoSrc ? 'YES (' + r.videoSrc + ')' : 'NO'}`);
  console.log(`     Attachments: ${r.attachments?.length || 0}`);
  console.log(`     Transcript: ${r.transcript?.length || 0} lines`);
});
