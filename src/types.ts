export type PageId =
  | 'home'
  | 'membership'
  | 'consultation'
  | 'teams-hub'
  | 'team-thinker'
  | 'team-tomorrow'
  | 'team-angels'
  | 'team-ghorbani'
  | 'team-silence'
  | 'scores'
  | 'education'
  | 'events'
  | 'about'
  | 'history'
  | 'mission'
  | 'goals'
  | 'statute'
  | 'contact'
  | 'rehab'
  | 'employment'
  | 'marriage'
  | 'social-work'
  | 'admin';

export type ThemeMode = 'light' | 'dark' | 'system';
export type TextSizeScale = 'normal' | 'large' | 'xlarge';

export interface UserPreferences {
  theme: ThemeMode;
  textSize: TextSizeScale;
  highContrast: boolean;
  reducedMotion?: boolean;
}

export interface ReportAttachment {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'word' | 'excel' | 'archive' | 'audio' | 'video' | 'file';
  extension: string;
  sizeFormatted: string;
  sizeBytes?: number;
  dataUrl?: string; // base64, blob URL, or Google Drive URL
  file?: File; // For pending uploads
  caption?: string;
  uploadDate?: string;
}

export interface TranscriptScene {
  speaker: string;
  role?: string;
  text: string;
  avatar?: string;
  seconds?: number;
  endSeconds?: number;
  time?: string;
}

export type ReportType = 'video' | 'text' | 'hybrid';

export interface BaseReportSchema {
  id: string;
  reportNum: string;
  title: string;
  date: string;
  datetimeIso: string;
  summary: string;
  reportType?: ReportType;
  teamSlug?: string;
  status?: 'published' | 'draft';
  isCustom?: boolean;
  subhead?: string;
  keyPoints?: string[];
  pdfUrl?: string;
  pdfLabel?: string;
  videoSrc?: string;
  posterSrc?: string;
  videoHint?: string;
  transcript?: TranscriptScene[];
  vttUrl?: string;
  vttContent?: string;
  images?: { src: string; caption: string }[];
  attachments?: ReportAttachment[];
  updatedAt?: number | string;
  keepVideoAttachment?: boolean;
}

export interface TextReportSchema extends BaseReportSchema {
  reportType?: 'text';
  videoSrc?: string;
  videoHint?: string;
  posterSrc?: string;
  transcript?: TranscriptScene[];
  keepVideoAttachment?: boolean;
}

export interface VideoReportSchema extends BaseReportSchema {
  reportType?: 'video';
  videoSrc?: string;
  posterSrc?: string;
  videoHint?: string;
  transcript?: TranscriptScene[];
}

export interface HybridReportSchema extends BaseReportSchema {
  reportType?: 'hybrid';
  videoSrc?: string;
  posterSrc?: string;
  videoHint?: string;
  transcript?: TranscriptScene[];
}

export type ActivityReport = BaseReportSchema;

export interface ReportDraft {
  id: string;
  reportId?: string;
  teamSlug: string;
  reportFormat: ReportType;
  title: string;
  date?: string;
  reportNum?: string;
  subhead?: string;
  summary?: string;
  keyPoints?: string[];
  pdfUrl?: string;
  pdfLabel?: string;
  videoSrc?: string;
  videoHint?: string;
  posterSrc?: string;
  transcript?: TranscriptScene[];
  vttUrl?: string;
  vttContent?: string;
  images?: { src: string; caption: string }[];
  attachments?: ReportAttachment[];
  keepVideoAttachment?: boolean;
  status: 'draft';
  updatedAt: number;
}

export type TeamReport = ActivityReport;

export interface TeamData {
  id: string;
  slug: string;
  name: string;
  manager: string;
  members: string[];
  slogan: string;
  icon: string;
  logo: string;
  tone: string;
  description: string;
  reports: ActivityReport[];
}

export interface ScoreItem {
  id: string;
  name: string;
  score: number;
  maxScore: number;
  logo: string;
  isRegistered: boolean;
}

export interface Consultant {
  name: string;
  title: string;
  avatar: string;
  image: string;
  specialty: string;
  role?: string;
  bio?: string;
  availableDays?: string[];
}

export type EventCategory = 'workshop' | 'conference' | 'youth-club' | 'webinar' | 'cultural-sports';

export interface EventItem {
  id: string;
  title: string;
  category: EventCategory;
  categoryLabel: string;
  dateJalali: string; // e.g. "۱۴۰۵/۰۶/۰۸"
  jalaliYear: number;
  jalaliMonth: number; // 1 to 12
  jalaliDay: number; // 1 to 31
  dayOfWeek: string; // e.g. "پنج‌شنبه"
  time: string; // e.g. "۱۶:۰۰ الی ۱۸:۳۰"
  locationType: 'in-person' | 'online' | 'hybrid';
  location: string;
  organizer: string;
  instructor?: string;
  description: string;
  agenda: string[];
  capacity?: number;
  registeredCount?: number;
  isFeatured?: boolean;
  registrationOpen: boolean;
  accessibilityFeatures: string[];
  cost?: string;
  icon?: string;
  coverGradient?: string;
}
