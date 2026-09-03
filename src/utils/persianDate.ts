/**
 * Persian / Jalali (Solar Hijri) Date Utility
 * Provides smart date formatting, conversion and Iranian numeral representations
 */

export const PERSIAN_MONTHS = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند'
];

export const PERSIAN_WEEKDAYS = [
  { short: 'ش', full: 'شنبه', index: 0 },
  { short: 'ی', full: 'یکشنبه', index: 1 },
  { short: 'د', full: 'دوشنبه', index: 2 },
  { short: 'س', full: 'سه‌شنبه', index: 3 },
  { short: 'چ', full: 'چهارشنبه', index: 4 },
  { short: 'پ', full: 'پنج‌شنبه', index: 5 },
  { short: 'ج', full: 'جمعه', index: 6, isWeekend: true }
];

/**
 * Converts English digits to Persian numerals
 */
export function toPersianDigits(value: string | number): string {
  const str = String(value);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[parseInt(w, 10)]);
}

/**
 * Formats report number without duplicating the word 'گزارش'
 * e.g. "گزارش ۲" -> "گزارش ۲"
 * "گزارش شماره ۲" -> "گزارش ۲"
 * "گزارش گزارش ۲" -> "گزارش ۲"
 * "۲" -> "گزارش ۲"
 * "پیام ویدیویی" -> "پیام ویدیویی"
 */
export function formatReportNumberDisplay(reportNum?: string | number): string {
  if (reportNum === undefined || reportNum === null) return '';
  const str = String(reportNum).trim();
  if (!str) return '';

  // If pure numbers / digits (e.g. "2" or "۲" or 2)
  const isPureNumber = /^[0-9۰-۹٠-٩]+$/.test(str);
  if (isPureNumber) {
    return `گزارش ${toPersianDigits(str)}`;
  }

  // If starts with "گزارش" or "گزارش شماره"
  if (/^گزارش/i.test(str)) {
    // Strip duplicate leading "گزارش", "شماره", colons, dashes or whitespace
    const withoutWord = str.replace(/^(?:گزارش\s*(?:شماره\s*)?[:\-\.]*\s*)+/g, '').trim();
    if (!withoutWord) return 'گزارش';
    return `گزارش ${toPersianDigits(withoutWord)}`;
  }

  // If custom title or type (e.g., "پیام ویدئویی", "نشست ۱", "جلسه ویژه")
  return toPersianDigits(str);
}

/**
 * Safely extracts the numeric report sequence number from any report object or string.
 * Supports Persian, Arabic, and English digits, prefixed with 'گزارش', 'گزارش شماره', or pure numbers.
 * e.g. "گزارش ۳" -> 3, "گزارش شماره ۴" -> 4, "۲" -> 2, "report-123" -> 123
 */
export function extractReportSequenceNumber(reportOrNum?: any): number {
  if (!reportOrNum) return 0;

  if (typeof reportOrNum === 'number') {
    return isNaN(reportOrNum) ? 0 : Math.floor(reportOrNum);
  }

  let targetStr = '';
  if (typeof reportOrNum === 'object') {
    if (reportOrNum.reportNum) {
      targetStr = String(reportOrNum.reportNum);
    } else if (reportOrNum.title) {
      targetStr = String(reportOrNum.title);
    } else if (reportOrNum.id) {
      targetStr = String(reportOrNum.id);
    }
  } else {
    targetStr = String(reportOrNum);
  }

  if (!targetStr) return 0;

  // Normalize Persian and Arabic digits to English
  const normalized = targetStr
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

  // 1. Look for explicit pattern "گزارش (شماره) X"
  const matchGozarish = normalized.match(/گزارش\s*(?:شماره\s*)?(\d+)/i);
  if (matchGozarish && matchGozarish[1]) {
    const p = parseInt(matchGozarish[1], 10);
    if (!isNaN(p)) return p;
  }

  // 2. Look for any number in string
  const matchDigits = normalized.match(/\d+/);
  if (matchDigits) {
    const p = parseInt(matchDigits[0], 10);
    if (!isNaN(p)) return p;
  }

  return 0;
}

/**
 * Returns total days in a Jalali month
 */
export function getJalaliMonthDays(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  // Check for leap year in Jalali
  const isLeap = [1, 5, 9, 13, 17, 22, 26, 30].includes(jy % 33);
  return isLeap ? 30 : 29;
}

/**
 * Exact Jalali to Gregorian conversion (Borkowski algorithm)
 */
export function jalaliToGregorianObj(jy: number, jm: number, jd: number): { gy: number; gm: number; gd: number } {
  const jyCalculated = jy + 1595;
  let days = -355668 + (365 * jyCalculated) + (Math.floor(jyCalculated / 33) * 8) + Math.floor(((jyCalculated % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  let gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
    gd -= sal_a[gm];
  }
  return { gy, gm, gd };
}

/**
 * Converts Jalali date (year, month 1-12, day) to Gregorian Date object
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  const { gy, gm, gd } = jalaliToGregorianObj(jy, jm, jd);
  return new Date(gy, gm - 1, gd);
}

/**
 * Returns Iranian day index of week (0 = Saturday ... 6 = Friday)
 */
export function getJalaliDayOfWeekIndex(jy: number, jm: number, jd: number): number {
  const gDate = jalaliToGregorian(jy, jm, jd);
  const jsDay = gDate.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  // Map to Iran week: Saturday = 0, Sunday = 1, Monday = 2, Tuesday = 3, Wednesday = 4, Thursday = 5, Friday = 6
  return (jsDay + 1) % 7;
}

/**
 * Returns full Persian day name ('شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه')
 */
export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): string {
  const idx = getJalaliDayOfWeekIndex(jy, jm, jd);
  return PERSIAN_WEEKDAYS[idx]?.full || 'شنبه';
}

/**
 * Gets starting day index in Iranian week (0 = Saturday ... 6 = Friday)
 */
export function getJalaliFirstDayOfWeek(jy: number, jm: number): number {
  return getJalaliDayOfWeekIndex(jy, jm, 1);
}

/**
 * Gregorian to Jalali conversion algorithm
 */
export function gregorianToJalali(gDate?: Date | string | number | null): {
  year: number;
  month: number;
  day: number;
  monthName: string;
  hours: number;
  minutes: number;
} {
  let d: Date;
  if (gDate instanceof Date) {
    d = isNaN(gDate.getTime()) ? new Date() : gDate;
  } else if (typeof gDate === 'number') {
    d = new Date(gDate);
    if (isNaN(d.getTime())) d = new Date();
  } else if (typeof gDate === 'string' && gDate.trim()) {
    d = new Date(gDate);
    if (isNaN(d.getTime())) d = new Date();
  } else {
    d = new Date();
  }

  const g_y = d.getFullYear();
  const g_m = d.getMonth() + 1;
  const g_d = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes();

  const g_days_in_month = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const j_days_in_month = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  const isLeapG = (g_y % 4 === 0 && g_y % 100 !== 0) || g_y % 400 === 0;
  if (isLeapG) g_days_in_month[1] = 29;

  let gy = g_y - 1600;
  let gm = g_m - 1;
  let gd = g_d - 1;

  let g_day_no = 365 * gy + Math.floor((gy + 3) / 4) - Math.floor((gy + 99) / 100) + Math.floor((gy + 399) / 400);

  for (let i = 0; i < gm; ++i) g_day_no += g_days_in_month[i];
  g_day_no += gd;

  let j_day_no = g_day_no - 79;

  let j_np = Math.floor(j_day_no / 12053);
  j_day_no %= 12053;

  let jy = 979 + 33 * j_np + 4 * Math.floor(j_day_no / 1461);
  j_day_no %= 1461;

  if (j_day_no >= 366) {
    jy += Math.floor((j_day_no - 1) / 365);
    j_day_no = (j_day_no - 1) % 365;
  }

  let jm = 0;
  for (let i = 0; i < 11 && j_day_no >= j_days_in_month[i]; ++i) {
    j_day_no -= j_days_in_month[i];
    jm = i + 1;
  }
  let jd = j_day_no + 1;

  const validYear = isNaN(jy) ? 1405 : jy;
  const validMonth = isNaN(jm) ? 4 : jm; // Default to Mordad (index 4) if NaN
  const validDay = isNaN(jd) ? 26 : jd;

  return {
    year: validYear,
    month: validMonth + 1,
    day: validDay,
    monthName: PERSIAN_MONTHS[validMonth] || 'مرداد',
    hours: isNaN(hours) ? 0 : hours,
    minutes: isNaN(minutes) ? 0 : minutes
  };
}

export interface SmartDateOptions {
  persianDigits?: boolean;
  prefix?: string;
  includeTime?: boolean;
}

/**
 * Formats a date into the smart format:
 * "بروزرسانی شده در ۲۶ مرداد ۱۴۰۵"
 * Handles any input type safely without ever returning NaN.
 */
export function formatSmartUpdateDate(
  dateInput?: Date | string | number | null,
  options: SmartDateOptions = {}
): string {
  const {
    persianDigits = true,
    prefix = 'بروزرسانی شده در',
    includeTime = false
  } = options;

  if (!dateInput) {
    const j = gregorianToJalali(new Date());
    const dateText = `${j.day} ${j.monthName} ${j.year}`;
    const result = prefix ? `${prefix} ${dateText}` : dateText;
    return persianDigits ? toPersianDigits(result) : result;
  }

  // Handle String inputs
  if (typeof dateInput === 'string') {
    let cleanStr = dateInput.trim();

    // If empty after trim
    if (!cleanStr) {
      const j = gregorianToJalali(new Date());
      const dateText = `${j.day} ${j.monthName} ${j.year}`;
      const result = prefix ? `${prefix} ${dateText}` : dateText;
      return persianDigits ? toPersianDigits(result) : result;
    }

    // Strip out existing prefix if already present to avoid duplication
    cleanStr = cleanStr.replace(/^(بروزرسانی شده در|به‌روزرسانی شده در|بروزرسانی:|به‌روزرسانی:|تاریخ:)\s*/i, '').trim();

    // Check if it already contains ANY Persian month name
    const hasMonth = PERSIAN_MONTHS.some((m) => cleanStr.includes(m));
    if (hasMonth) {
      const fullText = prefix ? `${prefix} ${cleanStr}` : cleanStr;
      return persianDigits ? toPersianDigits(fullText) : fullText;
    }

    // Normalize Persian digits to English digits for regex parsing
    const engDigits = cleanStr.replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);

    // Check for Jalali YYYY/MM/DD, YYYY-MM-DD, or DD/MM/YYYY
    const slashMatch = engDigits.match(/^(\d{2,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
    if (slashMatch) {
      let p1 = parseInt(slashMatch[1], 10);
      let p2 = parseInt(slashMatch[2], 10);
      let p3 = parseInt(slashMatch[3], 10);

      // Pattern: YYYY/MM/DD (e.g. 1405/05/24)
      if (p1 >= 1300 && p1 <= 1500) {
        const year = p1;
        const monthIdx = Math.max(0, Math.min(11, p2 - 1));
        const day = Math.max(1, Math.min(31, p3));
        const formatted = `${day} ${PERSIAN_MONTHS[monthIdx]} ${year}`;
        const fullText = prefix ? `${prefix} ${formatted}` : formatted;
        return persianDigits ? toPersianDigits(fullText) : fullText;
      }

      // Pattern: DD/MM/YYYY (e.g. 24/05/1405)
      if (p3 >= 1300 && p3 <= 1500) {
        const year = p3;
        const monthIdx = Math.max(0, Math.min(11, p2 - 1));
        const day = Math.max(1, Math.min(31, p1));
        const formatted = `${day} ${PERSIAN_MONTHS[monthIdx]} ${year}`;
        const fullText = prefix ? `${prefix} ${formatted}` : formatted;
        return persianDigits ? toPersianDigits(fullText) : fullText;
      }
    }

    // If it's a valid standard Gregorian date string (like ISO 2026-08-24...)
    const parsedDate = new Date(cleanStr);
    if (!isNaN(parsedDate.getTime())) {
      const j = gregorianToJalali(parsedDate);
      let dateText = `${j.day} ${j.monthName} ${j.year}`;
      if (includeTime) {
        const timeFormatted = `${String(j.hours).padStart(2, '0')}:${String(j.minutes).padStart(2, '0')}`;
        dateText += ` (ساعت ${timeFormatted})`;
      }
      const fullText = prefix ? `${prefix} ${dateText}` : dateText;
      return persianDigits ? toPersianDigits(fullText) : fullText;
    }

    // If it's plain text without month/number match (fallback to safe string)
    if (cleanStr.length > 0 && isNaN(Number(cleanStr))) {
      const fullText = prefix ? `${prefix} ${cleanStr}` : cleanStr;
      return persianDigits ? toPersianDigits(fullText) : fullText;
    }
  }

  // Fallback to Date object conversion
  let dateObj: Date;
  if (dateInput instanceof Date) {
    dateObj = isNaN(dateInput.getTime()) ? new Date() : dateInput;
  } else if (typeof dateInput === 'number') {
    dateObj = new Date(dateInput);
    if (isNaN(dateObj.getTime())) dateObj = new Date();
  } else {
    dateObj = new Date();
  }

  const j = gregorianToJalali(dateObj);
  let dateText = `${j.day} ${j.monthName} ${j.year}`;
  if (includeTime) {
    const timeFormatted = `${String(j.hours).padStart(2, '0')}:${String(j.minutes).padStart(2, '0')}`;
    dateText += ` (ساعت ${timeFormatted})`;
  }

  const result = prefix ? `${prefix} ${dateText}` : dateText;
  return persianDigits ? toPersianDigits(result) : result;
}

/**
 * Standard fixed latest update date for the Mahash Youth Club release (26 Mordad 1405)
 */
export const DEFAULT_MAHASH_UPDATE_DATE = 'بروزرسانی شده در ۲۶ مرداد ۱۴۰۵';
export const DEFAULT_MAHASH_UPDATE_DATE_EN = 'بروزرسانی شده در 26 مرداد 1405';

export function getSmartCurrentDate(): string {
  const j = gregorianToJalali(new Date());
  return `${j.day} ${j.monthName} ${j.year}`;
}

/**
 * Safely parses any report's date / datetimeIso / id to a numeric timestamp for accurate chronological sorting.
 */
export function parseReportTimestamp(report: { date?: string; datetimeIso?: string; id?: string }): number {
  if (!report) return 0;

  // 1. If valid datetimeIso
  if (report.datetimeIso) {
    const t = new Date(report.datetimeIso).getTime();
    if (!isNaN(t) && t > 0) return t;
  }

  // 2. If id contains epoch timestamp like report-1740000000000
  if (report.id) {
    const match = report.id.match(/(\d{10,13})/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 1000000000) {
        return num.toString().length === 10 ? num * 1000 : num;
      }
    }
  }

  // 3. If Persian date string
  if (report.date && typeof report.date === 'string') {
    const cleanStr = report.date.trim();
    // Normalize Persian digits
    const engDigits = cleanStr.replace(/[۰-۹]/g, (d) => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)]);

    // Check for YYYY/MM/DD or YYYY-MM-DD
    const slashMatch = engDigits.match(/(\d{2,4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,4})/);
    if (slashMatch) {
      const p1 = parseInt(slashMatch[1], 10);
      const p2 = parseInt(slashMatch[2], 10);
      const p3 = parseInt(slashMatch[3], 10);
      if (p1 >= 1300 && p1 <= 1500) {
        // Jalali YYYY/MM/DD
        const gDate = jalaliToGregorian(p1, Math.max(1, Math.min(12, p2)), Math.max(1, Math.min(31, p3)));
        return gDate.getTime();
      } else if (p3 >= 1300 && p3 <= 1500) {
        // Jalali DD/MM/YYYY
        const gDate = jalaliToGregorian(p3, Math.max(1, Math.min(12, p2)), Math.max(1, Math.min(31, p1)));
        return gDate.getTime();
      }
    }

    // Check for "۲۶ مرداد ۱۴۰۵"
    const monthFound = PERSIAN_MONTHS.findIndex((m) => cleanStr.includes(m));
    if (monthFound >= 0) {
      const nums = engDigits.match(/\d+/g);
      if (nums && nums.length >= 2) {
        let day = parseInt(nums[0], 10);
        let year = parseInt(nums[1], 10);
        if (day > 1000) {
          // Inverted
          const tmp = day;
          day = year;
          year = tmp;
        }
        if (year >= 1300 && year <= 1500) {
          const gDate = jalaliToGregorian(year, monthFound + 1, Math.max(1, Math.min(31, day)));
          return gDate.getTime();
        }
      }
    }

    // Standard Gregorian parsed date fallback
    const parsed = new Date(cleanStr).getTime();
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  return 0;
}

