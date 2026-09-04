/**
 * Advanced File Validation Utility for Mahash Youth Club System
 * Performs deep checks on MIME types, file extensions, size limits, and corruption before upload/save.
 */
import { formatFileSize } from './attachmentsStorage';
import { toPersianDigits } from './persianDate';
import { ReportAttachment } from '../types';

export const MAX_VIDEO_SIZE_BYTES = 100 * 1024 * 1024; // 100 MB
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB
export const MIN_FILE_SIZE_BYTES = 1; // At least 1 byte (non-empty)

// Whitelisted file extensions
export const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp', 'avif'];
export const ALLOWED_DOC_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'ppt', 'pptx'];
export const ALLOWED_SPREADSHEET_EXTENSIONS = ['xls', 'xlsx', 'csv', 'ods'];
export const ALLOWED_ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz'];
export const ALLOWED_AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac'];
export const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', '3gp'];

// Blacklisted dangerous executable/script extensions
export const FORBIDDEN_EXTENSIONS = [
  'exe', 'bat', 'sh', 'cmd', 'scr', 'dll', 'msi', 'vbs', 'js', 'mjs', 'php', 'py', 'rb',
  'asp', 'aspx', 'jsp', 'cgi', 'com', 'pif', 'application', 'gadget', 'ws', 'wsf'
];

export interface FileValidationResult {
  isValid: boolean;
  errorTitle?: string;
  errorMessage?: string;
  errorDetails?: string;
}

async function checkVideoMagicNumbers(file: File): Promise<boolean> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = (e) => {
      const arr = new Uint8Array(e.target?.result as ArrayBuffer);
      if (arr.length < 8) return resolve(false);
      
      // Check WebM (1A 45 DF A3)
      if (arr[0] === 0x1A && arr[1] === 0x45 && arr[2] === 0xDF && arr[3] === 0xA3) {
        return resolve(true);
      }
      
      // Check MP4 (starts with 4 byte length, then 'ftyp' which is 66 74 79 70)
      if (arr[4] === 0x66 && arr[5] === 0x74 && arr[6] === 0x79 && arr[7] === 0x70) {
        return resolve(true);
      }

      // Other formats like quicktime might have 'moov' or similar, but for MP4/WebM strict validation we look for these.
      resolve(false);
    };
    reader.onerror = () => resolve(false);
    reader.readAsArrayBuffer(file.slice(0, 12));
  });
}

/**
 * Validates an uploaded video file (now checks magic numbers for MP4/WebM)
 */
export async function validateVideoFile(file: File): Promise<FileValidationResult> {
  if (!file) {
    return { isValid: false, errorTitle: 'فایل ناموجود', errorMessage: 'هیچ فایلی انتخاب نشده است.' };
  }

  // 1. Check size: empty or corrupted
  if (file.size < MIN_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      errorTitle: 'فایل ویدیو خراب یا خالی است',
      errorMessage: `فایل ویدیویی «${file.name}» فاقد محتوا بوده و حجم آن ۰ بایت است.`,
      errorDetails: 'لطفاً از سلامت فایل ویدیویی خود در دستگاه اطمینان حاصل کرده و مجدداً انتخاب فرمایید.'
    };
  }

  // 2. Check maximum size
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return {
      isValid: false,
      errorTitle: 'حجم ویدیو بیش از حد مجاز است',
      errorMessage: `حجم فایل انتخابی (${formatFileSize(file.size)}) بیشتر از سقف مجاز ۱۰۰ مگابایت است.`,
      errorDetails: 'برای بهبود سرعت بارگذاری و حفظ فضای حافظه مرورگر، لطفاً حجم ویدیو را کاهش دهید یا نسخه کم‌حجم‌تری انتخاب فرمایید.'
    };
  }

  // 3. Check extension
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      errorTitle: 'فرمت غیرمجاز و ناامن',
      errorMessage: `پسوند «.${ext}» به عنوان فایل اجرایی یا اسکریپت شناسایی شده و مجاز به بارگذاری نیست.`,
      errorDetails: 'لطفاً تنها از فرمت‌های استاندارد ویدیویی نظیر MP4 یا WebM استفاده نمایید.'
    };
  }

  if (!ALLOWED_VIDEO_EXTENSIONS.includes(ext) && !file.type.startsWith('video/')) {
    return {
      isValid: false,
      errorTitle: 'فرمت ویدیویی نامعتبر',
      errorMessage: `فرمت فایل «${file.name}» به عنوان ویدیوی معتبر شناسایی نشد.`,
      errorDetails: `فرمت‌های مجاز ویدیویی: ${ALLOWED_VIDEO_EXTENSIONS.join('، ')}`
    };
  }
  
  // 4. Validate Headers (Magic Numbers) for MP4 and WebM
  const isValidHeader = await checkVideoMagicNumbers(file);
  if (!isValidHeader) {
    return {
      isValid: false,
      errorTitle: 'ساختار نامعتبر فایل ویدیو',
      errorMessage: `فایل «${file.name}» یک ویدیوی معتبر MP4 یا WebM نیست یا هدر آن خراب شده است.`,
      errorDetails: 'برای جلوگیری از مشکلات پخش در بخش عمومی، تنها فایل‌های استاندارد و سالم پذیرفته می‌شوند.'
    };
  }

  return { isValid: true };
}

/**
 * Validates an uploaded attachment file (PDF, Image, Doc, Excel, Archive, etc.)
 */
export function validateAttachmentFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, errorTitle: 'فایل ناموجود', errorMessage: 'هیچ فایلی انتخاب نشده است.' };
  }

  // 1. Check size: empty or corrupted
  if (file.size < MIN_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      errorTitle: 'فایل ضمیمه خراب یا خالی است',
      errorMessage: `فایل «${file.name}» خالی (۰ بایت) یا آسیب‌دیده است.`,
      errorDetails: 'فایل‌های خالی امکان ذخیره‌سازی و نمایش در گزارش را ندارند.'
    };
  }

  // 2. Check maximum size (25MB)
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      isValid: false,
      errorTitle: 'حجم فایل ضمیمه بیش از حد مجاز است',
      errorMessage: `حجم فایل «${file.name}» برابر با ${formatFileSize(file.size)} است که از سقف مجاز ۲۵ مگابایت بیشتر است.`,
      errorDetails: 'لطفاً فایل را فشرده کرده یا فایلی با حجم کمتر از ۲۵ مگابایت پیوست نمایید.'
    };
  }

  // 3. Check forbidden extensions
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (FORBIDDEN_EXTENSIONS.includes(ext)) {
    return {
      isValid: false,
      errorTitle: 'نوع فایل غیرمجاز و ناامن',
      errorMessage: `پسوند «.${ext}» برای فایل «${file.name}» غیرمجاز و مسدود می‌باشد.`,
      errorDetails: 'بارگذاری فایل‌های اجرایی یا کدهای برنامه‌نویسی در سامانه مجاز نیست.'
    };
  }

  // 4. Check if extension is in allowed lists
  const allAllowed = [
    ...ALLOWED_IMAGE_EXTENSIONS,
    ...ALLOWED_DOC_EXTENSIONS,
    ...ALLOWED_SPREADSHEET_EXTENSIONS,
    ...ALLOWED_ARCHIVE_EXTENSIONS,
    ...ALLOWED_AUDIO_EXTENSIONS,
    ...ALLOWED_VIDEO_EXTENSIONS
  ];

  if (!allAllowed.includes(ext)) {
    return {
      isValid: false,
      errorTitle: 'پسوند فایل پشتیبانی نمی‌شود',
      errorMessage: `پسوند «.${ext}» در لیست فرمت‌های مجاز پیوست گزارش قرار ندارد.`,
      errorDetails: 'فرمت‌های پشتیبانی‌شده: PDF, Word, Excel, JPG, PNG, WebP, ZIP, RAR, MP3, MP4'
    };
  }

  return { isValid: true };
}

/**
 * Validates entire report payload before final database submission
 */
export async function validateFullReportSubmission(
  reportTitle: string,
  videoFile: File | null,
  attachments: ReportAttachment[]
): Promise<FileValidationResult> {
  if (!reportTitle || reportTitle.trim().length === 0) {
    return {
      isValid: false,
      errorTitle: 'عنوان گزارش الزامی است',
      errorMessage: 'لطفاً عنوان کامل گزارش فعالیت را وارد فرمایید.'
    };
  }

  // Validate video if provided
  if (videoFile) {
    const videoRes = await validateVideoFile(videoFile);
    if (!videoRes.isValid) return videoRes;
  }

  // Validate existing attachments data integrity
  for (const att of attachments) {
    if (!att.name || att.name.trim().length === 0) {
      return {
        isValid: false,
        errorTitle: 'نام فایل پیوست نامعتبر است',
        errorMessage: 'یکی از فایل‌های پیوست فاقد نام معتبر می‌باشد.'
      };
    }

    const ext = att.extension || att.name.split('.').pop()?.toLowerCase() || '';
    if (FORBIDDEN_EXTENSIONS.includes(ext)) {
      return {
        isValid: false,
        errorTitle: 'فایل پیوست نامعتبر شناسایی شد',
        errorMessage: `فایل «${att.name}» با پسوند غیرمجاز ${ext} شناسایی شد.`
      };
    }
  }

  return { isValid: true };
}
