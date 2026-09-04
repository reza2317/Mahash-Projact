import { MembershipApplication, MembershipStats, MembershipStatus } from '../types';

const API_BASE = '/api/memberships';

export async function fetchMemberships(filter?: {
  status?: string;
  team?: string;
  education?: string;
  search?: string;
  limit?: number;
}): Promise<{ memberships: MembershipApplication[]; source: string }> {
  try {
    const params = new URLSearchParams();
    if (filter?.status && filter.status !== 'all') params.append('status', filter.status);
    if (filter?.team && filter.team !== 'all') params.append('team', filter.team);
    if (filter?.education && filter.education !== 'all') params.append('education', filter.education);
    if (filter?.search) params.append('search', filter.search);
    if (filter?.limit) params.append('limit', String(filter.limit));

    const queryStr = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}${queryStr}`);
    if (!res.ok) {
      throw new Error(`Failed to fetch memberships: ${res.statusText}`);
    }
    const data = await res.json();
    return {
      memberships: data.memberships || [],
      source: data.source || 'api'
    };
  } catch (err) {
    console.warn('⚠️ API fetch failed, falling back to local storage cache:', err);
    const cached = localStorage.getItem('mahash_memberships_cache');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        return { memberships: parsed, source: 'local_cache' };
      } catch {}
    }
    return { memberships: [], source: 'empty' };
  }
}

export async function fetchMembershipStats(): Promise<MembershipStats | null> {
  try {
    const res = await fetch(`${API_BASE}/stats`);
    if (!res.ok) throw new Error(`Stats fetch failed: ${res.statusText}`);
    const data = await res.json();
    return data.stats || null;
  } catch (err) {
    console.warn('⚠️ Could not load stats from API:', err);
    return null;
  }
}

export async function createMembership(
  appData: Partial<MembershipApplication>
): Promise<{ success: boolean; membership?: MembershipApplication; error?: string }> {
  try {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(appData)
    });
    const data = await res.json();
    if (!res.ok) {
      return { success: false, error: data.error || 'خطا در ثبت درخواست' };
    }
    return { success: true, membership: data.membership };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطای اتصال به سرور' };
  }
}

export async function updateMembershipStatus(
  id: string,
  status: MembershipStatus,
  adminNotes?: string
): Promise<{ success: boolean; membership?: MembershipApplication; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, adminNotes })
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'خطا در به‌روزرسانی' };
    return { success: true, membership: data.membership };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطای اتصال' };
  }
}

export async function updateMembershipDetails(
  id: string,
  updates: Partial<MembershipApplication>
): Promise<{ success: boolean; membership?: MembershipApplication; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'خطا در ویرایش پرونده' };
    return { success: true, membership: data.membership };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطای سرور' };
  }
}

export async function deleteMembership(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) return { success: false, error: data.error || 'خطا در حذف پرونده' };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطای شبکه' };
  }
}

/**
 * Export members list as Excel-compatible CSV with Persian UTF-8 BOM
 */
export function exportMembersToCSV(members: MembershipApplication[], filename = 'mahash_members_export.csv'): void {
  const headers = [
    'شناسه',
    'نام و نام خانوادگی',
    'شماره تماس',
    'کد ملی',
    'تاریخ تولد',
    'مقطع تحصیلی',
    'رشته تحصیلی',
    'شغل / تخصص',
    'وضعیت تاهل',
    'تیم انتخابی',
    'وضعیت پذیرش',
    'خدمات درخواستی',
    'روش‌های ارتباطی',
    'شماره تماس پدر',
    'شماره تماس مادر',
    'آدرس منزل',
    'آدرس محل کار',
    'پیام متقاضی',
    'یادداشت مدیر',
    'تاریخ ثبت‌نام'
  ];

  const statusLabels: Record<string, string> = {
    approved: 'تأیید شده',
    pending: 'در انتظار بررسی',
    reviewing: 'در حال ارزیابی / مصاحبه',
    rejected: 'رد شده'
  };

  const rows = members.map((m) => [
    m.id,
    `"${(m.fullName || '').replace(/"/g, '""')}"`,
    `"${(m.phone || '').replace(/"/g, '""')}"`,
    `"${(m.nationalId || '').replace(/"/g, '""')}"`,
    `"${(m.birthDate || '').replace(/"/g, '""')}"`,
    `"${(m.education || '').replace(/"/g, '""')}"`,
    `"${(m.fieldOfStudy || '').replace(/"/g, '""')}"`,
    `"${(m.job || '').replace(/"/g, '""')}"`,
    `"${(m.maritalStatus || '').replace(/"/g, '""')}"`,
    `"${(m.favoriteTeam || '').replace(/"/g, '""')}"`,
    `"${statusLabels[m.status] || m.status}"`,
    `"${(m.requestedServices || []).join(' | ').replace(/"/g, '""')}"`,
    `"${(m.communicationMethods || []).join(' | ').replace(/"/g, '""')}"`,
    `"${(m.fatherPhone || '').replace(/"/g, '""')}"`,
    `"${(m.motherPhone || '').replace(/"/g, '""')}"`,
    `"${(m.homeAddress || '').replace(/"/g, '""')}"`,
    `"${(m.workAddress || '').replace(/"/g, '""')}"`,
    `"${(m.message || '').replace(/"/g, '""')}"`,
    `"${(m.adminNotes || '').replace(/"/g, '""')}"`,
    `"${m.createdAt ? new Date(m.createdAt).toLocaleDateString('fa-IR') : ''}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export members as JSON
 */
export function exportMembersToJSON(members: MembershipApplication[], filename = 'mahash_members_export.json'): void {
  const dataStr = JSON.stringify(members, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
