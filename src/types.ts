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
  dataUrl?: string; // base64 or blob URL
  caption?: string;
  uploadDate?: string;
}

export interface TranscriptScene {
  speaker: string;
  role?: string;
  text: string;
  avatar?: string;
}

export interface ActivityReport {
  id: string;
  reportNum: string;
  title: string;
  date: string;
  datetimeIso: string;
  summary: string;
  teamSlug?: string;
  status?: 'published' | 'draft';
  isCustom?: boolean;
  videoSrc?: string;
  posterSrc?: string;
  videoHint?: string;
  subhead?: string;
  keyPoints?: string[];
  pdfUrl?: string;
  pdfLabel?: string;
  images?: { src: string; caption: string }[];
  attachments?: ReportAttachment[];
  transcript?: TranscriptScene[];
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
