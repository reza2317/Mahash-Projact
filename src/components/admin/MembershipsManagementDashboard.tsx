import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Download,
  Plus,
  Phone,
  FileText,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  Eye,
  RefreshCw,
  Activity,
  Calendar,
  Award,
  BookOpen,
  Heart,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Sparkles,
  MessageSquare,
  MapPin,
  Briefcase,
  Layers
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { MembershipApplication, MembershipStats, MembershipStatus } from '../../types';
import {
  fetchMemberships,
  fetchMembershipStats,
  updateMembershipStatus,
  updateMembershipDetails,
  createMembership,
  deleteMembership,
  exportMembersToCSV,
  exportMembersToJSON
} from '../../services/membershipService';
import { fetchMySQLLogs } from '../../utils/mysqlLogger';

function toPersianDigits(num: string | number | undefined | null): string {
  if (num === undefined || num === null) return '۰';
  const str = String(num);
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/[0-9]/g, (w) => persianDigits[+w]);
}

const TEAM_COLORS: Record<string, { bg: string; text: string; border: string; hex: string }> = {
  'تیم مغز متفکر': { bg: 'bg-indigo-50 dark:bg-indigo-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800', hex: '#6366f1' },
  'باشگاه فردا': { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', hex: '#10b981' },
  'تیم فرشتگان ناشنوایان': { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', hex: '#f43f5e' },
  'تیم قربونی': { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', hex: '#f59e0b' },
  'تیم آوای سکوت': { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', hex: '#06b6d4' }
};

const STATUS_CONFIG: Record<
  MembershipStatus,
  { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  approved: {
    label: 'تأیید شده و عضو فعال',
    bg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-500',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
  },
  pending: {
    label: 'در انتظار بررسی',
    bg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800',
    text: 'text-amber-700 dark:text-amber-300',
    border: 'border-amber-500',
    icon: <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
  },
  reviewing: {
    label: 'در حال ارزیابی / مصاحبه',
    bg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-500',
    icon: <AlertCircle className="w-3.5 h-3.5 text-blue-500" />
  },
  rejected: {
    label: 'عدم تایید / رد شده',
    bg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-800',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-500',
    icon: <XCircle className="w-3.5 h-3.5 text-rose-500" />
  }
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6'];

export const MembershipsManagementDashboard: React.FC = () => {
  const [members, setMembers] = useState<MembershipApplication[]>([]);
  const [stats, setStats] = useState<MembershipStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedTeam, setSelectedTeam] = useState<string>('all');
  const [selectedEducation, setSelectedEducation] = useState<string>('all');
  const [activeView, setActiveView] = useState<'table' | 'analytics' | 'activities'>('table');

  // Modals & Drawers
  const [selectedMember, setSelectedMember] = useState<MembershipApplication | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [adminNoteInput, setAdminNoteInput] = useState('');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);

  // Live Club Activities
  const [clubActivities, setClubActivities] = useState<any[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);

  // New Member Form State
  const [newMemberData, setNewMemberData] = useState({
    fullName: '',
    phone: '',
    nationalId: '',
    birthDate: '',
    education: 'کارشناسی',
    fieldOfStudy: '',
    job: '',
    maritalStatus: 'مجرد',
    favoriteTeam: 'تیم مغز متفکر',
    homeAddress: '',
    workAddress: '',
    requestedServices: ['کارگاه‌های تخصصی'],
    fatherPhone: '',
    motherPhone: '',
    message: '',
    adminNotes: ''
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersRes, statsRes] = await Promise.all([
        fetchMemberships({
          status: selectedStatus,
          team: selectedTeam,
          education: selectedEducation,
          search: searchQuery
        }),
        fetchMembershipStats()
      ]);
      setMembers(membersRes.memberships);
      setDataSource(membersRes.source);
      if (statsRes) {
        setStats(statsRes);
      }
    } catch (err) {
      console.error('Error loading members data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadActivities = async () => {
    setLoadingActivities(true);
    try {
      const logsRes = await fetchMySQLLogs(40);
      if (logsRes && Array.isArray(logsRes.logs)) {
        setClubActivities(logsRes.logs);
      }
    } catch (err) {
      console.warn('Could not load club activities:', err);
    } finally {
      setLoadingActivities(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedStatus, selectedTeam, selectedEducation, searchQuery]);

  useEffect(() => {
    loadActivities();
  }, []);

  const handleStatusChange = async (memberId: string, newStatus: MembershipStatus) => {
    const res = await updateMembershipStatus(memberId, newStatus, adminNoteInput || undefined);
    if (res.success) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, status: newStatus, adminNotes: adminNoteInput || m.adminNotes } : m))
      );
      if (selectedMember && selectedMember.id === memberId) {
        setSelectedMember((prev) => (prev ? { ...prev, status: newStatus, adminNotes: adminNoteInput || prev.adminNotes } : null));
      }
      showToast(`وضعیت عضو با موفقیت به «${STATUS_CONFIG[newStatus]?.label || newStatus}» تغییر یافت.`);
      loadActivities();
    }
  };

  const handleDeleteMember = async (memberId: string, memberName: string) => {
    const res = await deleteMembership(memberId);
    if (res.success) {
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      if (selectedMember?.id === memberId) {
        setIsDetailModalOpen(false);
        setSelectedMember(null);
      }
      showToast(`پرونده «${memberName}» با موفقیت حذف شد.`);
      loadActivities();
    }
  };

  const handleSaveAdminNote = async () => {
    if (!selectedMember) return;
    const res = await updateMembershipDetails(selectedMember.id, { adminNotes: adminNoteInput });
    if (res.success) {
      setSelectedMember((prev) => (prev ? { ...prev, adminNotes: adminNoteInput } : null));
      setMembers((prev) =>
        prev.map((m) => (m.id === selectedMember.id ? { ...m, adminNotes: adminNoteInput } : m))
      );
      showToast('یادداشت محرمانه مدیر با موفقیت ذخیره شد.');
    }
  };

  const handleCreateNewMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberData.fullName.trim() || !newMemberData.phone.trim()) {
      alert('لطفاً نام کامل و شماره تماس را وارد فرمایید.');
      return;
    }
    const res = await createMembership({
      ...newMemberData,
      status: 'pending'
    });
    if (res.success && res.membership) {
      setMembers((prev) => [res.membership!, ...prev]);
      setIsAddModalOpen(false);
      showToast(`عضو جدید «${newMemberData.fullName}» با موفقیت ثبت شد.`);
      setNewMemberData({
        fullName: '',
        phone: '',
        nationalId: '',
        birthDate: '',
        education: 'کارشناسی',
        fieldOfStudy: '',
        job: '',
        maritalStatus: 'مجرد',
        favoriteTeam: 'تیم مغز متفکر',
        homeAddress: '',
        workAddress: '',
        requestedServices: ['کارگاه‌های تخصصی'],
        fatherPhone: '',
        motherPhone: '',
        message: '',
        adminNotes: ''
      });
      loadActivities();
    } else {
      alert(res.error || 'خطا در ایجاد عضو جدید');
    }
  };

  const showToast = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4500);
  };

  const copyPhoneNumber = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Prepare chart data for teams
  const teamChartData = useMemo(() => {
    if (!stats?.byTeam) return [];
    return Object.entries(stats.byTeam).map(([name, count]) => ({
      name,
      تعداد: count,
      color: TEAM_COLORS[name]?.hex || '#3b82f6'
    }));
  }, [stats]);

  // Prepare chart data for education
  const educationChartData = useMemo(() => {
    if (!stats?.byEducation) return [];
    return Object.entries(stats.byEducation).map(([name, count]) => ({
      name,
      value: count
    }));
  }, [stats]);

  // Unique list of teams and educations for filters
  const uniqueTeams = useMemo(() => {
    return ['تیم مغز متفکر', 'باشگاه فردا', 'تیم فرشتگان ناشنوایان', 'تیم قربونی', 'تیم آوای سکوت'];
  }, []);

  const uniqueEducations = useMemo(() => {
    return ['زیر دیپلم', 'دیپلم', 'کاردانی', 'کارشناسی', 'کارشناسی ارشد', 'دکتری'];
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn" id="admin-memberships-dashboard-root">
      {/* Toast Notification Alert */}
      {actionSuccessMessage && (
        <div
          role="status"
          aria-live="polite"
          className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center justify-between gap-3 text-sm font-bold border border-emerald-400/40 animate-bounce"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-200" />
            <span>{actionSuccessMessage}</span>
          </div>
          <button
            onClick={() => setActionSuccessMessage(null)}
            className="text-white/80 hover:text-white p-1"
            aria-label="بستن اعلان"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header Banner & Live Control */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-indigo-500/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>پایش برخط باشگاه جوانان محاش</span>
              </span>
              {dataSource === 'mysql_live_table' && (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[10px] font-mono">
                  MySQL Synced
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2.5">
              <Users className="w-7 h-7 text-indigo-400" />
              <span>داشبورد جامع اعضا و پایش فعالیت‌های باشگاه</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              مرکز مدیریت درخواست‌های عضویت، مصاحبه و گزینش متقاضیان، پایش حضور در تیم‌های پنج‌گانه و گزارش‌های آماری جامع ویژه مدیران.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-l from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg hover:shadow-indigo-500/25 transition flex items-center gap-2 cursor-pointer active:scale-95"
              aria-label="ثبت عضویت جدید به صورت دستی"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>ثبت متقاضی جدید</span>
            </button>

            <button
              onClick={() => exportMembersToCSV(members)}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              aria-label="خروجی فایل اکسل با فونت فارسی"
              title="خروجی فایل اکسل با فرمت CSV و کدگذاری UTF-8"
            >
              <Download className="w-4 h-4 text-emerald-400" aria-hidden="true" />
              <span>خروجی اکسل</span>
            </button>

            <button
              onClick={() => {
                loadData();
                loadActivities();
              }}
              disabled={loading}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 rounded-xl transition cursor-pointer"
              aria-label="تازه‌سازی داده‌های اعضا و فعالیت‌ها"
              title="تازه‌سازی زنده"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-400' : ''}`} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Key Metrics KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Members */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-bold">
            <span>کل متقاضیان</span>
            <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">
            {toPersianDigits(stats?.total ?? members.length)}
          </div>
          <span className="text-[10px] text-slate-400 dark:text-slate-500">پرونده‌های فعال باشگاه</span>
        </div>

        {/* Approved Members */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            <span>اعضای پذیرفته‌شده</span>
            <UserCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
            {toPersianDigits(stats?.approved ?? members.filter((m) => m.status === 'approved').length)}
          </div>
          <span className="text-[10px] text-emerald-600/80">اعضای فعال در تیم‌ها</span>
        </div>

        {/* Pending Review */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 text-xs font-bold">
            <span>در انتظار بررسی اولیه</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">
            {toPersianDigits(stats?.pending ?? members.filter((m) => m.status === 'pending').length)}
          </div>
          <span className="text-[10px] text-amber-600/80">نیاز به تماس و تعیین نوبت</span>
        </div>

        {/* Interview & Reviewing */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 text-xs font-bold">
            <span>در حال ارزیابی</span>
            <AlertCircle className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
            {toPersianDigits(stats?.reviewing ?? members.filter((m) => m.status === 'reviewing').length)}
          </div>
          <span className="text-[10px] text-blue-600/80">در مرحله مصاحبه حضوری</span>
        </div>

        {/* Approval Rate */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 text-xs font-bold">
            <span>نرخ پذیرش و گزینش</span>
            <Award className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">
            {toPersianDigits(stats?.approvalRate ?? 85)}٪
          </div>
          <span className="text-[10px] text-purple-600/80">شاخص کیفیت جذب متقاضیان</span>
        </div>
      </div>

      {/* Secondary Navigation (Table vs Charts vs Club Live Feed) */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs font-bold" role="tablist" aria-label="بخش‌های داشبورد اعضا">
          <button
            role="tab"
            aria-selected={activeView === 'table'}
            onClick={() => setActiveView('table')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'table'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
            aria-label="نمایش جدول و پرونده متقاضیان"
          >
            <FileText className="w-4 h-4" />
            <span>مدیریت متقاضیان ({toPersianDigits(members.length)})</span>
          </button>

          <button
            role="tab"
            aria-selected={activeView === 'analytics'}
            onClick={() => setActiveView('analytics')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'analytics'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
            aria-label="مشاهده نمودارها و آمار تحلیلی"
          >
            <Layers className="w-4 h-4" />
            <span>آمار تحلیلی و توزیع تیم‌ها</span>
          </button>

          <button
            role="tab"
            aria-selected={activeView === 'activities'}
            onClick={() => setActiveView('activities')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 cursor-pointer ${
              activeView === 'activities'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
            aria-label="پایش زنده فعالیت‌های باشگاه"
          >
            <Activity className="w-4 h-4 text-emerald-400" />
            <span>پایش زنده رویدادهای باشگاه</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          </button>
        </div>
      </div>

      {/* VIEW 1: APPLICATIONS TABLE & FILTERS */}
      {activeView === 'table' && (
        <div className="space-y-4">
          {/* Filter and Search Toolbar */}
          <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="search-members-input"
                type="text"
                placeholder="جستجو بر اساس نام، شماره تلفن، کدملی یا رشته تحصیلی..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pr-10 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
                aria-label="جستجو در پرونده‌های اعضا"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  aria-label="پاک کردن متن جستجو"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Status Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-bold shrink-0">
              {[
                { id: 'all', label: 'همه' },
                { id: 'pending', label: 'در انتظار', color: 'text-amber-600' },
                { id: 'reviewing', label: 'مصاحبه', color: 'text-blue-600' },
                { id: 'approved', label: 'تأیید شده', color: 'text-emerald-600' },
                { id: 'rejected', label: 'رد شده', color: 'text-rose-600' }
              ].map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-3 py-1.5 rounded-xl transition cursor-pointer whitespace-nowrap ${
                    selectedStatus === st.id
                      ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  aria-label={`فیلتر وضعیت: ${st.label}`}
                >
                  <span className={st.color}>{st.label}</span>
                </button>
              ))}
            </div>

            {/* Team Dropdown Filter */}
            <div className="flex items-center gap-2">
              <select
                id="team-filter-select"
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                aria-label="فیلتر بر اساس تیم انتخابی"
              >
                <option value="all">همه تیم‌های پنج‌گانه</option>
                {uniqueTeams.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              {/* Education Dropdown Filter */}
              <select
                id="education-filter-select"
                value={selectedEducation}
                onChange={(e) => setSelectedEducation(e.target.value)}
                className="py-2 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
                aria-label="فیلتر بر اساس مقطع تحصیلی"
              >
                <option value="all">تمام مقاطع تحصیلی</option>
                {uniqueEducations.map((ed) => (
                  <option key={ed} value={ed}>
                    {ed}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                <p className="text-xs font-bold">در حال بازیابی پرونده‌های اعضا از سرور و پایگاه داده...</p>
              </div>
            ) : members.length === 0 ? (
              <div className="p-12 text-center text-slate-500 dark:text-slate-400 space-y-3">
                <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold">هیچ پرونده‌ای با مشخصات انتخاب‌شده یافت نشد.</p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedStatus('all');
                    setSelectedTeam('all');
                    setSelectedEducation('all');
                  }}
                  className="px-4 py-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-bold hover:bg-indigo-100 transition"
                  aria-label="پاک‌سازی تمام فیلترها"
                >
                  پاک‌سازی فیلترها و مشاهده همه
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs" aria-label="جدول متقاضیان و اعضای باشگاه">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-[11px] font-black">
                    <tr>
                      <th className="p-3.5 sm:p-4">متقاضی</th>
                      <th className="p-3.5 sm:p-4">تیم انتخابی</th>
                      <th className="p-3.5 sm:p-4">تحصیلات و تخصص</th>
                      <th className="p-3.5 sm:p-4">اطلاعات تماس</th>
                      <th className="p-3.5 sm:p-4">خدمات درخواستی</th>
                      <th className="p-3.5 sm:p-4">وضعیت پرونده</th>
                      <th className="p-3.5 sm:p-4 text-center">اقدامات سریع</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {members.map((member) => {
                      const teamMeta = TEAM_COLORS[member.favoriteTeam || ''] || {
                        bg: 'bg-slate-100 dark:bg-slate-800',
                        text: 'text-slate-700 dark:text-slate-300',
                        border: 'border-slate-300'
                      };
                      const statusMeta = STATUS_CONFIG[member.status] || STATUS_CONFIG.pending;

                      return (
                        <tr
                          key={member.id}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group"
                        >
                          {/* Applicant Info */}
                          <td className="p-3.5 sm:p-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                                {member.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                                  <span>{member.fullName}</span>
                                  {member.adminNotes && (
                                    <span
                                      className="inline-block w-2 h-2 rounded-full bg-indigo-500"
                                      title="دارای یادداشت محرمانه مدیر"
                                      aria-label="دارای یادداشت محرمانه مدیر"
                                    />
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                                  {member.nationalId && <span>کدملی: {toPersianDigits(member.nationalId)}</span>}
                                  {member.birthDate && <span>متولد: {toPersianDigits(member.birthDate)}</span>}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Team */}
                          <td className="p-3.5 sm:p-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${teamMeta.bg} ${teamMeta.text} ${teamMeta.border}`}
                            >
                              {member.favoriteTeam || 'نامشخص'}
                            </span>
                          </td>

                          {/* Education & Field */}
                          <td className="p-3.5 sm:p-4">
                            <div className="font-bold text-slate-800 dark:text-slate-200">
                              {member.education || '—'}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[140px]">
                              {member.fieldOfStudy || member.job || 'بدون عنوان تخصص'}
                            </div>
                          </td>

                          {/* Contact Info */}
                          <td className="p-3.5 sm:p-4">
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`tel:${member.phone}`}
                                className="text-blue-600 dark:text-blue-400 font-mono hover:underline font-bold"
                                title="تماس تلفنی با متقاضی"
                                aria-label={`تماس با شماره ${member.phone}`}
                              >
                                {toPersianDigits(member.phone)}
                              </a>
                              <button
                                onClick={() => copyPhoneNumber(member.phone, member.id)}
                                className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 transition cursor-pointer"
                                title="کپی شماره تماس"
                                aria-label="کپی شماره تماس متقاضی"
                              >
                                {copiedPhoneId === member.id ? (
                                  <Check className="w-3 h-3 text-emerald-500" aria-hidden="true" />
                                ) : (
                                  <Copy className="w-3 h-3" aria-hidden="true" />
                                )}
                              </button>
                            </div>
                          </td>

                          {/* Requested Services */}
                          <td className="p-3.5 sm:p-4">
                            <div className="flex flex-wrap gap-1 max-w-[180px]">
                              {(member.requestedServices || []).slice(0, 2).map((srv, idx) => (
                                <span
                                  key={idx}
                                  className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded text-[10px]"
                                >
                                  {srv}
                                </span>
                              ))}
                              {(member.requestedServices || []).length > 2 && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  +{toPersianDigits((member.requestedServices || []).length - 2)}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Status Dropdown */}
                          <td className="p-3.5 sm:p-4">
                            <div className="relative inline-block">
                              <select
                                value={member.status}
                                onChange={(e) => handleStatusChange(member.id, e.target.value as MembershipStatus)}
                                className={`text-[11px] font-bold py-1 px-2.5 rounded-lg border cursor-pointer outline-none ${statusMeta.bg}`}
                                aria-label={`تغییر وضعیت متقاضی ${member.fullName}`}
                              >
                                <option value="pending">در انتظار بررسی</option>
                                <option value="reviewing">در حال ارزیابی / مصاحبه</option>
                                <option value="approved">تأیید شده و عضو فعال</option>
                                <option value="rejected">عدم تایید / رد شده</option>
                              </select>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="p-3.5 sm:p-4 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => {
                                  setSelectedMember(member);
                                  setAdminNoteInput(member.adminNotes || '');
                                  setIsDetailModalOpen(true);
                                }}
                                className="p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-lg transition cursor-pointer"
                                title="مشاهده پرونده کامل و مصاحبه"
                                aria-label={`مشاهده کامل پرونده ${member.fullName}`}
                              >
                                <Eye className="w-4 h-4" aria-hidden="true" />
                              </button>

                              <button
                                onClick={() => handleDeleteMember(member.id, member.fullName)}
                                className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-lg transition cursor-pointer"
                                title="حذف پرونده متقاضی"
                                aria-label={`حذف پرونده ${member.fullName}`}
                              >
                                <Trash2 className="w-4 h-4" aria-hidden="true" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ANALYTICS & RECHARTS CHARTS */}
      {activeView === 'analytics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Team Distribution */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <Award className="w-4 h-4 text-indigo-600" />
                  <span>توزیع متقاضیان در تیم‌های پنج‌گانه باشگاه</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">میزان استقبال از تیم‌های تخصصی جوانان محاش</p>
              </div>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teamChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                  />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
                  <Tooltip
                    formatter={(value: any) => [`${toPersianDigits(value)} نفر`, 'تعداد متقاضیان']}
                    labelStyle={{ fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', direction: 'rtl' }}
                  />
                  <Bar dataKey="تعداد" radius={[8, 8, 0, 0]}>
                    {teamChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Education Breakdown */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                  <span>ترکیب سطح تحصیلات متقاضیان</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">درصد دانش‌آموختگان مقاطع مختلف</p>
              </div>
            </div>

            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={educationChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {educationChartData.map((entry, index) => (
                      <Cell key={`cell-pie-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: any) => [`${toPersianDigits(value)} نفر`, 'تعداد']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', direction: 'rtl' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Breakdown by Requested Services */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>پرتکرارترین خدمات و توان‌افزایی‌های درخواستی جوانان</span>
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {stats?.byService &&
                Object.entries(stats.byService).map(([srvName, count]) => (
                  <div
                    key={srvName}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{srvName}</span>
                    <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-mono font-bold rounded-lg text-xs">
                      {toPersianDigits(Number(count) || 0)}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: LIVE CLUB MONITORING FEED */}
      {activeView === 'activities' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
                <span>پایش زنده و لحظه‌ای فعالیت‌های ثبت‌شده در سامانه</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                جریان کامل لاگ‌های عضویت، تغییر وضعیت متقاضیان، درخواست‌های مشاوره و تعاملات دیتابیس MySQL
              </p>
            </div>
            <button
              onClick={loadActivities}
              disabled={loadingActivities}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
              aria-label="تازه‌سازی لیست فعالیت‌ها"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingActivities ? 'animate-spin' : ''}`} />
              <span>تازه‌سازی رویدادها</span>
            </button>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {clubActivities.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                هنوز رویدادی در پایش زنده ثبت نشده است.
              </div>
            ) : (
              clubActivities.map((act: any) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3 text-xs hover:border-indigo-400 transition"
                >
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 dark:text-white">{act.title}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {act.created_at ? new Date(act.created_at).toLocaleTimeString('fa-IR') : 'هم‌اکنون'}
                      </span>
                    </div>
                    {act.details && <p className="text-slate-600 dark:text-slate-300 text-[11px]">{act.details}</p>}
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      {act.user_name && <span>ثبت‌کننده: {act.user_name}</span>}
                      {act.team_slug && <span>تیم: {act.team_slug}</span>}
                      {act.status && (
                        <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded">
                          {act.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* DETAIL & INTERVIEW MODAL */}
      {isDetailModalOpen && selectedMember && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="member-detail-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsDetailModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {selectedMember.fullName.charAt(0)}
                </div>
                <div>
                  <h2 id="member-detail-modal-title" className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    پرونده متقاضی: {selectedMember.fullName}
                  </h2>
                  <p className="text-xs text-slate-500">
                    شناسه ثبت: <span className="font-mono">{selectedMember.id}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsDetailModalOpen(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-600 transition"
                aria-label="بستن پنجره پرونده"
              >
                ✕
              </button>
            </div>

            {/* Profile Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">شماره همراه</span>
                <div className="flex items-center justify-between">
                  <a href={`tel:${selectedMember.phone}`} className="font-mono font-bold text-blue-600">
                    {toPersianDigits(selectedMember.phone)}
                  </a>
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">کد ملی</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {toPersianDigits(selectedMember.nationalId || 'ثبت نشده')}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">تیم انتخابی</span>
                <span className="font-bold text-indigo-600 dark:text-indigo-400">
                  {selectedMember.favoriteTeam || 'نامشخص'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">تحصیلات و رشته</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedMember.education} {selectedMember.fieldOfStudy ? `- ${selectedMember.fieldOfStudy}` : ''}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">شغل / وضعیت اشتغال</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedMember.job || 'جویای کار / دانشجو'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-slate-400 block mb-1">شماره تماس والدین</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {selectedMember.fatherPhone ? `پدر: ${toPersianDigits(selectedMember.fatherPhone)}` : '—'}
                </span>
              </div>
            </div>

            {/* Address & Motivation */}
            {selectedMember.homeAddress && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <span className="text-slate-400 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>آدرس و محل سکونت</span>
                </span>
                <p className="text-slate-700 dark:text-slate-300">{selectedMember.homeAddress}</p>
              </div>
            )}

            {selectedMember.message && (
              <div className="p-3.5 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-xl border border-indigo-200 dark:border-indigo-800/60 text-xs">
                <span className="text-indigo-600 dark:text-indigo-400 font-bold block mb-1 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>پیام و انگیزه متقاضی از عضویت در باشگاه</span>
                </span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedMember.message}</p>
              </div>
            )}

            {/* Admin Interview Notes Section */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <label htmlFor="admin-note-textarea" className="block text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Edit3 className="w-4 h-4 text-indigo-500" />
                <span>یادداشت محرمانه مدیر و ارزیابی مصاحبه</span>
              </label>
              <textarea
                id="admin-note-textarea"
                rows={3}
                value={adminNoteInput}
                onChange={(e) => setAdminNoteInput(e.target.value)}
                placeholder="نتیجه مصاحبه حضوری، ارزیابی توانمندی‌ها یا نکات ویژه درباره این متقاضی را اینجا یادداشت فرمایید..."
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none text-slate-900 dark:text-white"
              />
              <button
                type="button"
                onClick={handleSaveAdminNote}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                aria-label="ذخیره یادداشت مدیر"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ذخیره یادداشت مصاحبه</span>
              </button>
            </div>

            {/* Status Quick Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-slate-500">تغییر وضعیت نهایی پرونده:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleStatusChange(selectedMember.id, 'approved')}
                  className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  aria-label="تایید عضویت متقاضی"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تأیید و عضویت رسمی</span>
                </button>

                <button
                  onClick={() => handleStatusChange(selectedMember.id, 'reviewing')}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  aria-label="دعوت متقاضی به مصاحبه"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>ارجاع به مصاحبه</span>
                </button>

                <button
                  onClick={() => handleStatusChange(selectedMember.id, 'rejected')}
                  className="px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                  aria-label="رد درخواست متقاضی"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>عدم پذیرش</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW MEMBER REGISTRATION MODAL */}
      {isAddModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-member-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h2 id="add-member-modal-title" className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-500" />
                <span>ثبت متقاضی عضویت جدید توسط مدیر</span>
              </h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl text-slate-400"
                aria-label="بستن فرم ثبت متقاضی"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateNewMember} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="new-member-fullname" className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    نام و نام خانوادگی *
                  </label>
                  <input
                    id="new-member-fullname"
                    type="text"
                    required
                    value={newMemberData.fullName}
                    onChange={(e) => setNewMemberData({ ...newMemberData, fullName: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="مثال: علی کاظمی"
                  />
                </div>

                <div>
                  <label htmlFor="new-member-phone" className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    شماره تلفن همراه *
                  </label>
                  <input
                    id="new-member-phone"
                    type="tel"
                    required
                    value={newMemberData.phone}
                    onChange={(e) => setNewMemberData({ ...newMemberData, phone: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  />
                </div>

                <div>
                  <label htmlFor="new-member-nationalid" className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    کد ملی
                  </label>
                  <input
                    id="new-member-nationalid"
                    type="text"
                    value={newMemberData.nationalId}
                    onChange={(e) => setNewMemberData({ ...newMemberData, nationalId: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="۰۰۲۱۴۵۸۷۹۶"
                  />
                </div>

                <div>
                  <label htmlFor="new-member-birthdate" className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    تاریخ تولد
                  </label>
                  <input
                    id="new-member-birthdate"
                    type="text"
                    value={newMemberData.birthDate}
                    onChange={(e) => setNewMemberData({ ...newMemberData, birthDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                    placeholder="۱۳۸۲/۰۴/۱۵"
                  />
                </div>

                <div>
                  <label htmlFor="new-member-team" className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    تیم باشگاهی انتخابی
                  </label>
                  <select
                    id="new-member-team"
                    value={newMemberData.favoriteTeam}
                    onChange={(e) => setNewMemberData({ ...newMemberData, favoriteTeam: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    {uniqueTeams.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="new-member-education" className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                    مقطع تحصیلی
                  </label>
                  <select
                    id="new-member-education"
                    value={newMemberData.education}
                    onChange={(e) => setNewMemberData({ ...newMemberData, education: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  >
                    {uniqueEducations.map((ed) => (
                      <option key={ed} value={ed}>
                        {ed}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="new-member-notes" className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  یادداشت اولیه مدیر
                </label>
                <textarea
                  id="new-member-notes"
                  rows={2}
                  value={newMemberData.adminNotes}
                  onChange={(e) => setNewMemberData({ ...newMemberData, adminNotes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none"
                  placeholder="نکات اولیه یا نحوه آشنایی..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl font-bold cursor-pointer"
                  aria-label="انصراف از ثبت"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition cursor-pointer"
                  aria-label="تایید و ثبت متقاضی"
                >
                  ثبت پرونده متقاضی
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
