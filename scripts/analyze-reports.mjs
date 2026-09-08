import fs from 'fs';

function normalizeTitle(t) {
  if (!t) return '';
  return t
    .replace(/[«»"'()؛:،]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/ی/g, 'ی')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/انیمه/g, 'انیمیشن')
    .trim();
}

const ds = JSON.parse(fs.readFileSync('./data_store.json', 'utf8'));
console.log('Original reports count:', ds.customReports.length);

const grouped = {};
for (const r of ds.customReports) {
  const norm = normalizeTitle(r.title);
  const team = r.teamSlug || 'unknown';
  let topic = norm;
  if (norm.includes('کافه') || norm.includes('رویای یک کافه') || norm.includes('رویایی یک کافه') || norm.includes('رویایی کافه')) {
    topic = 'رویای یک کافه';
  } else if (norm.includes('مسیر یک رویا') || norm.includes('فتح سکوی قهرمانی')) {
    topic = 'مسیر یک رویا';
  } else if (norm.includes('معرفی اعضای') && norm.includes('فرشتگان')) {
    topic = 'معرفی اعضای فرشتگان ناشنوایان';
  } else if (norm.includes('اپلیکیشن') || norm.includes('برنامه ریزی و راه اندازی اپلیکیشن')) {
    topic = 'اپلیکیشن اختصاصی محاش';
  } else if (norm.includes('پیام ویدیویی') && (norm.includes('شروعی برای همکاری') || norm.includes('خبرهای خوب'))) {
    topic = 'پیام ویدیویی شروعی برای همکاری';
  } else if (norm.includes('تانگرام') || norm.includes('پازل هندسی')) {
    topic = 'بازی تانگرام';
  } else if (norm.includes('حدس کارت')) {
    topic = 'بازی حدس کارت';
  } else if (norm.includes('معرفی اعضا') && norm.includes('مغز متفکر')) {
    topic = 'معرفی اعضای مغز متفکر';
  } else if (norm.includes('خودمراقبتی')) {
    topic = 'آموزش خودمراقبتی';
  } else if (norm.includes('روایت مسیر تیم سازی') || norm.includes('گزارش جامع فعالیت های باشگاه جوانان')) {
    topic = 'گزارش جامع فعالیت های باشگاه فردا';
  } else if (norm.includes('اینفوگرافیک') || norm.includes('جلسات اول تا چهارم')) {
    topic = 'اینفوگرافیک جلسات باشگاه فردا';
  }

  const key = `${team}___${topic}`;
  if (!grouped[key]) grouped[key] = [];
  grouped[key].push(r);
}

for (const [key, list] of Object.entries(grouped)) {
  console.log(`\n----------------- ${key} (count: ${list.length}) -----------------`);
  list.forEach((r, idx) => {
    console.log(`  [${idx}] id: ${r.id} | date: ${r.date} | title: "${r.title}" | video: ${r.videoSrc ? 'YES (' + r.videoSrc + ')' : 'NO'}`);
  });
}
