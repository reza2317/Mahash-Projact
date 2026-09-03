import { toPersianDigits } from './persianDate';

/**
 * Advanced Persian Text Normalizer, Proofreader, and Content Extractor
 * Designed for Mahash Youth Club reports, subtitles, and documentation.
 */

// Common Persian prefixes that need ZWNJ (نیم‌فاصله)
const PREFIX_REGEX = /\b(می|نمی|بی)\s+/g;

// Common Persian suffixes that need ZWNJ
const SUFFIX_HA_REGEX = /\s+(ها|های|هایم|هایت|هایش|هایمان|هایتان|هایشان)\b/g;
const SUFFIX_TAR_REGEX = /\s+(تر|ترین)\b/g;
const SUFFIX_SHAN_REGEX = /\s+(ام|ات|اش|مان|تان|شان)\b/g;

/**
 * Clean and normalize Persian text typography, characters, and spacing
 */
export function normalizePersianText(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let cleaned = text
    // Replace Arabic characters with standard Persian
    .replace(/ي/g, 'ی')
    .replace(/ى/g, 'ی')
    .replace(/ك/g, 'ک')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/إ/g, 'ا')
    .replace(/أ/g, 'ا')
    .replace(/ء/g, '')
    // Normalize newlines and excessive whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    // Fix punctuation spacing: no space before punctuation, 1 space after
    .replace(/\s+([،؛:!\?\.])/g, '$1')
    .replace(/([،؛:!\?\.])(?=[^\s\d،؛:!\?\.])/g, '$1 ')
    // Fix excessive exclamation and question marks
    .replace(/!{2,}/g, '!')
    .replace(/؟{2,}/g, '؟')
    .replace(/\.{3,}/g, '...');

  // Apply ZWNJ (نیم‌فاصله) for prefixes (می‌رود، نمی‌شود، بی‌هدف)
  cleaned = cleaned.replace(PREFIX_REGEX, '$1\u200c');

  // Apply ZWNJ for suffixes (کتاب‌ها، سریع‌تر، بهترین)
  cleaned = cleaned
    .replace(SUFFIX_HA_REGEX, '\u200c$1')
    .replace(SUFFIX_TAR_REGEX, '\u200c$1');

  // Fix common spelling and typing mistakes
  cleaned = cleaned
    .replace(/دست اندرکاران/g, 'دست‌اندرکاران')
    .replace(/رو به رو/g, 'روبه‌رو')
    .replace(/بهره برداری/g, 'بهره‌برداری')
    .replace(/تصمیم گیری/g, 'تصمیم‌گیری')
    .replace(/نتیجه گیری/g, 'نتیجه‌گیری')
    .replace(/برنامه ریزی/g, 'برنامه‌ریزی')
    .replace(/خود باوری/g, 'خودباوری')
    .replace(/هم افزایی/g, 'هم‌افزایی')
    .replace(/توان مند/g, 'توانمند')
    .replace(/توان مندسازی/g, 'توانمندسازی')
    .replace(/نا شنوایان/g, 'ناشنوایان')
    .replace(/کم شنوایان/g, 'کم‌شنوایان')
    .replace(/کار گروه/g, 'کارگروه')
    .replace(/زیر نویس/g, 'زیرنویس')
    .replace(/پیش رو/g, 'پیش‌رو')
    .replace(/فوق العاده/g, 'فوق‌العاده')
    .replace(/اینجانب/g, 'این‌جانب');

  return cleaned.trim();
}

/**
 * Extract distinct key sentences and points from raw text
 */
export function extractKeyPoints(text: string): string[] {
  if (!text || typeof text !== 'string') return [];

  const normalized = normalizePersianText(text);

  // Split by line breaks or punctuation (periods, newlines, bullet indicators)
  const rawChunks = normalized
    .split(/[\n\r•\-\*\d+\.\)]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  const points: string[] = [];

  for (const chunk of rawChunks) {
    // Sub-split by sentences if long
    const sentences = chunk
      .split(/(?<=[.!?؟])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);

    for (const sent of sentences) {
      // Remove leading punctuation
      const cleanSent = sent.replace(/^[:\-–•،\s]+/, '').trim();
      if (cleanSent.length > 12 && !points.includes(cleanSent)) {
        points.push(cleanSent);
      }
    }
  }

  // If no points extracted, split simple words
  if (points.length === 0 && normalized.length > 0) {
    points.push(normalized);
  }

  return points.slice(0, 10);
}

/**
 * Generate a cohesive executive summary from raw text
 */
export function generateExecutiveSummary(text: string, title?: string, teamName?: string): string {
  const normalized = normalizePersianText(text);
  const tName = teamName || 'باشگاه جوانان محاش';
  const cleanTitle = title ? normalizePersianText(title) : 'گزارش فعالیت و اقدامات';
  const points = extractKeyPoints(normalized);

  let body = '';
  if (points.length > 0) {
    body = points.slice(0, 3).join(' همچنین ');
    if (!body.endsWith('.')) body += '.';
  } else {
    body = normalized || 'فعالیت‌های برنامه‌ریزی‌شده با مشارکت اعضای تیم با موفقیت به اجرا درآمد.';
  }

  return `📌 **${cleanTitle}** (${tName})\n${body}\n\n✅ این برنامه در راستای ارتقای مهارت‌های تیمی، خودباوری و توانمندسازی جوانان ناشنوا و کم‌شنوا تدوین و مستند گردیده است.`;
}

/**
 * Generate video subtitle transcription draft from text
 */
export function generateSubtitleScenario(text: string, title?: string, teamName?: string): string {
  const tName = teamName || 'کارگروه باشگاه محاش';
  const cleanTitle = title ? normalizePersianText(title) : 'گزارش فعالیت‌های تیمی';
  const points = extractKeyPoints(text);

  const pt1 = points[0] || 'برگزاری نشست تخصصی و کارگاه توانمندسازی اعضا.';
  const pt2 = points[1] || 'مرور دستاوردهای اجرایی و ارائه تجارب کاربردی جوانان.';
  const pt3 = points[2] || 'تأکید بر تداوم آموزش‌ها و توسعه همکاری‌های گروهی.';

  return `🎬 **سناریو و متن زیرنویس هماهنگ ویدیو (${tName}):**

⏱️ [00:00 - 00:06] **گوینده (معرفی):**
«سلام و درود به همراهان گرامی مؤسسه محاش. با گزارش ${cleanTitle} در خدمت شما هستیم.»

⏱️ [00:06 - 00:15] **روایت فعالیت:**
«${pt1}»

⏱️ [00:15 - 00:24] **محورهای اجرایی:**
«${pt2}»

⏱️ [00:24 - 00:32] **دستاورد و نتیجه:**
«${pt3}»

⏱️ [00:32 - 00:38] **پیام پایانی:**
«از همراهی صمیمانه شما سپاسگزاریم؛ پرتوان به سوی فرداهایی روشن‌تر.»`;
}

/**
 * Comprehensive Proofreading & Polish function
 */
export function proofreadAndPolishText(
  text: string,
  options: {
    title?: string;
    teamName?: string;
    tone?: 'official' | 'motivational' | 'brief' | 'educational';
    customPrompt?: string;
  } = {}
): {
  polishedText: string;
  keyPoints: string[];
  suggestedTitle: string;
  executiveSummary: string;
  subtitleScenario: string;
} {
  const { title = '', teamName = 'باشگاه جوانان محاش', tone = 'official', customPrompt } = options;

  const normalized = normalizePersianText(text);
  const cleanTitle = title ? normalizePersianText(title) : 'گزارش جامع فعالیت و اقدامات';
  const points = extractKeyPoints(normalized);

  let introPhrase = `در چارچوب برنامه‌های راهبردی و اهداف تعالی ${teamName}، این گزارش فعالیت به شرح زیر تدوین گردیده است:`;
  let outroPhrase = `اجرای این برنامه با مشارکت اعضای فعال و رویکرد خودباوری و مهارت‌آموزی جوانان به سرانجام رسید.`;

  if (tone === 'motivational') {
    introPhrase = `با افتخار و انگیزه‌ای سرشار، جوانان پرشور و توانمند ${teamName} دستاوردی دیگر را رقم زدند:`;
    outroPhrase = `این موفقیت گامی بلند در مسیر درخشش استعدادها، خودباوری و امیدآفرینی در جامعه ناشنوایان و کم‌شنوایان است.`;
  } else if (tone === 'educational') {
    introPhrase = `در راستای ارتقای دانش کاربردی و مهارت‌های تخصصی اعضای ${teamName}، این فعالیت آموزشی مستندسازی شد:`;
    outroPhrase = `بهره‌برداری از روش‌های تعاملی و انتقال تجارب، نقشی بنیادین در غنای علمی و مهارتی شرکت‌کنندگان ایفا نمود.`;
  } else if (tone === 'brief') {
    introPhrase = `خلاصه اقدامات اجرایی ${teamName}:`;
    outroPhrase = `مستندات کامل در سامانه باشگاه جوانان محاش ثبت و در دسترس است.`;
  }

  const mainBody = normalized || 'برنامه‌های تعیین‌شده مطابق جدول زمان‌بندی با موفقیت کامل اجرا شد.';

  const bulletsFormatted = points.length > 0
    ? points.map((p) => `• ${p}`).join('\n')
    : `• اجرای منسجم کارگاه‌های آموزشی و توان‌افزایی\n• ثبت منظم مستندات ویدیویی با زیرنویس مناسب‌سازی‌شده\n• تقویت روحیه مشارکت جمعی و مسئولیت‌پذیری`;

  const polishedText = `📝 **متن ویراستاری‌شده و بازنویسی استاندارد:**

«${cleanTitle}»

${introPhrase}

${mainBody}

🎯 **محورها و نکات کلیدی استخراج‌شده:**
${bulletsFormatted}

${outroPhrase}
${customPrompt ? `\n💡 **نکته مورد تأکید:** ${customPrompt}` : ''}`;

  const executiveSummary = generateExecutiveSummary(normalized, cleanTitle, teamName);
  const subtitleScenario = generateSubtitleScenario(normalized, cleanTitle, teamName);

  return {
    polishedText,
    keyPoints: points,
    suggestedTitle: cleanTitle,
    executiveSummary,
    subtitleScenario
  };
}
