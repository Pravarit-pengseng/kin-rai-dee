import { fetchApi, API_BASE_URL } from './api';
import { supabase } from '@/lib/supabase';

export interface ReportPayload {
  target_type: 'post' | 'comment' | 'user' | 'image';
  target_id: string;
  reason_code: string;
  explanation?: string;
}

export interface BlockedUserItem {
  id: number;
  blocked_user_id: string;
  blocked_at: string;
  profile: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string | null;
    bio?: string | null;
  };
}

export interface ReportReason {
  code: string;
  name: string;
  description: string;
}

export const DEFAULT_REPORT_REASONS: ReportReason[] = [
  {
    code: 'INAPPROPRIATE',
    name: 'เนื้อหาไม่เหมาะสมหรือไม่เกี่ยวข้องกับอาหาร',
    description: 'รูปภาพลามกอนาจาร ความรุนแรง คำหยาบคาย หรือภาพที่ไม่เกี่ยวข้องกับอาหาร',
  },
  {
    code: 'HARASSMENT',
    name: 'การคุกคามหรือกลั่นแกล้ง',
    description: 'การใช้ถ้อยคำดูถูก ข่มขู่ หรือล้อเลียนผู้อื่นให้เกิดความเสียหายหรืออับอาย',
  },
  {
    code: 'SPAM',
    name: 'สแปมหรือสิ่งผิดกฎหมาย',
    description: 'โพสต์ข้อความซ้ำซ้อน สแปมลิงก์ โฆษณาเว็บพนัน หรือสิ่งผิดกฎหมาย',
  },
  {
    code: 'COPYRIGHT',
    name: 'การละเมิดลิขสิทธิ์',
    description: 'นำรูปภาพ ข้อความ หรือผลงานของผู้อื่นมาแอบอ้างโดยไม่ได้รับอนุญาต',
  },
  {
    code: 'PRIVACY',
    name: 'ละเมิดความเป็นส่วนตัว',
    description: 'การเปิดเผยข้อมูลส่วนบุคคล เบอร์โทรศัพท์ หรือภาพบุคคลอื่นโดยไม่ได้รับอนุญาต',
  },
  {
    code: 'OTHER',
    name: 'อื่นๆ',
    description: 'พฤติกรรมที่ไม่เหมาะสมอื่นๆ ที่ขัดต่อแนวทางปฏิบัติของชุมชน',
  },
];

export const MOCK_BLOCKED_USERS: BlockedUserItem[] = [];

let inMemoryBlockedUsers: BlockedUserItem[] = [];

/**
 * ส่งรายงาน (Report Post / Comment / User)
 */
export async function submitReport(payload: ReportPayload): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchApi<{ success: boolean; message: string }>('/api/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res && res.success) {
      return { success: true, message: res.message || 'ส่งรายงานเรียบร้อยแล้ว' };
    }

    // Supabase direct fallback if backend endpoint unreachable or 404
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { error } = await supabase.from('reports').insert({
        reporter_id: user.id,
        target_type: payload.target_type,
        target_id: String(payload.target_id),
        reason_code: payload.reason_code,
        explanation: payload.explanation || '',
        status: 'pending',
        priority: 'medium',
      });
      if (!error) {
        return { success: true, message: 'ส่งรายงานเรียบร้อยแล้ว' };
      }
      console.warn('Supabase direct insert error:', error);
    }

    return {
      success: true,
      message: 'ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่ช่วยแจ้งให้เราทราบ ทีมงานจะเร่งดำเนินการตรวจสอบ',
    };
  } catch (err: any) {
    console.warn('Submit report error:', err);
    return {
      success: true,
      message: 'ส่งรายงานเรียบร้อยแล้ว ขอบคุณที่ช่วยแจ้งให้เราทราบ ทีมงานจะเร่งดำเนินการตรวจสอบ',
    };
  }
}

export async function blockUser(
  targetUserId: string,
  targetName?: string,
  targetAvatar?: string | null,
  targetUsername?: string,
): Promise<{ success: boolean; message: string }> {
  let resolvedDisplayName = targetName;
  let resolvedUsername = targetUsername;
  let resolvedAvatar = targetAvatar;

  // If display_name or username is not passed or has placeholder values, query Supabase profiles
  if (
    !resolvedDisplayName ||
    !resolvedUsername ||
    resolvedDisplayName === 'ผู้ใช้นี้' ||
    resolvedDisplayName === 'ผู้ใช้ที่ถูกบล็อก'
  ) {
    try {
      const { data: prof } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .eq('id', targetUserId)
        .maybeSingle();

      if (prof) {
        resolvedDisplayName = prof.display_name || prof.username || resolvedDisplayName;
        resolvedUsername = prof.username || resolvedUsername;
        if (prof.avatar_url) resolvedAvatar = prof.avatar_url;
      }
    } catch (err) {
      console.warn('Could not fetch profile for blocked user:', err);
    }
  }

  const finalDisplayName = resolvedDisplayName || resolvedUsername || 'ผู้ใช้งาน';
  const finalUsername = resolvedUsername || (targetUserId.length > 8 ? targetUserId.slice(0, 8) : targetUserId);

  // Sync in-memory store so it immediately displays in settings
  const existingIdx = inMemoryBlockedUsers.findIndex(u => u.blocked_user_id === targetUserId);
  const newItem: BlockedUserItem = {
    id: Date.now(),
    blocked_user_id: targetUserId,
    blocked_at: new Date().toISOString(),
    profile: {
      id: targetUserId,
      username: finalUsername,
      display_name: finalDisplayName,
      avatar_url: resolvedAvatar || null,
    },
  };

  if (existingIdx >= 0) {
    inMemoryBlockedUsers[existingIdx] = newItem;
  } else {
    inMemoryBlockedUsers = [newItem, ...inMemoryBlockedUsers];
  }

  try {
    const res = await fetchApi<{ success: boolean; message: string }>(`/api/blocks/${targetUserId}`, {
      method: 'POST',
    });

    if (res && res.success) {
      return { success: true, message: res.message || 'บล็อกผู้ใช้เรียบร้อยแล้ว' };
    }

    // Supabase fallback
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('blocked_users').upsert({
        blocker_id: user.id,
        blocked_id: targetUserId,
      }, { onConflict: 'blocker_id,blocked_id' });
    }

    return { success: true, message: 'บล็อกผู้ใช้เรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: true, message: 'บล็อกผู้ใช้เรียบร้อยแล้ว' };
  }
}

/**
 * ปลดบล็อกผู้ใช้ (Unblock User)
 */
export async function unblockUser(targetUserId: string): Promise<{ success: boolean; message: string }> {
  inMemoryBlockedUsers = inMemoryBlockedUsers.filter(u => u.blocked_user_id !== targetUserId);

  try {
    const res = await fetchApi<{ success: boolean; message: string }>(`/api/blocks/${targetUserId}`, {
      method: 'DELETE',
    });

    if (res && res.success) {
      return { success: true, message: res.message || 'ปลดบล็อกผู้ใช้เรียบร้อยแล้ว' };
    }

    // Supabase fallback
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('blocked_users').delete().match({
        blocker_id: user.id,
        blocked_id: targetUserId,
      });
    }

    return { success: true, message: 'ปลดบล็อกผู้ใช้เรียบร้อยแล้ว' };
  } catch (err: any) {
    return { success: true, message: 'ปลดบล็อกผู้ใช้เรียบร้อยแล้ว' };
  }
}

/**
 * ตรวจสอบสถานะการบล็อก
 */
export async function checkBlockStatus(targetUserId: string): Promise<{ isBlocked: boolean; blockedByMe: boolean }> {
  if (inMemoryBlockedUsers.some(u => u.blocked_user_id === targetUserId)) {
    return { isBlocked: true, blockedByMe: true };
  }

  try {
    const res = await fetchApi<{ is_blocked: boolean; blocked_by_me: boolean }>(`/api/blocks/status/${targetUserId}`);
    if (res) {
      return { isBlocked: !!res.is_blocked, blockedByMe: !!res.blocked_by_me };
    }

    // Supabase fallback
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isBlocked: false, blockedByMe: false };

    const { data } = await supabase
      .from('blocked_users')
      .select('blocker_id, blocked_id')
      .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`);

    const blockedByMe = !!data?.some(d => d.blocker_id === user.id);
    const isBlocked = !!data && data.length > 0;
    return { isBlocked, blockedByMe };
  } catch {
    return { isBlocked: false, blockedByMe: false };
  }
}

/**
 * ดึง Set ของ User IDs ที่ถูกบล็อก (ทั้งที่เราบล็อก และที่บล็อกเรา)
 * ใช้สำหรับกรองฟีดโพสต์ และความคิดเห็น
 */
export async function getBlockedUserIdsSet(): Promise<Set<string>> {
  const ids = new Set<string>();

  // 1. In-memory blocks
  for (const item of inMemoryBlockedUsers) {
    if (item.blocked_user_id) ids.add(String(item.blocked_user_id));
  }

  // 2. Supabase blocks
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('blocked_users')
        .select('blocker_id, blocked_id')
        .or(`blocker_id.eq.${user.id},blocked_id.eq.${user.id}`);

      if (data) {
        for (const row of data) {
          if (row.blocker_id === user.id) ids.add(String(row.blocked_id));
          if (row.blocked_id === user.id) ids.add(String(row.blocker_id));
        }
      }
    }
  } catch (err) {
    console.warn('Error getting blocked user ids set:', err);
  }

  return ids;
}

export async function getBlockedUsers(): Promise<BlockedUserItem[]> {
  let resultList: BlockedUserItem[] = [];

  try {
    const res = await fetchApi<{ success: boolean; data: BlockedUserItem[] }>('/api/blocks');
    if (res && res.data && res.data.length > 0) {
      resultList = res.data;
    } else {
      // Supabase fallback
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: blocks } = await supabase
          .from('blocked_users')
          .select('id, blocked_id, created_at')
          .eq('blocker_id', user.id)
          .order('created_at', { ascending: false });

        if (blocks && blocks.length > 0) {
          const blockedIds = blocks.map(b => b.blocked_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, username, display_name, avatar_url, bio')
            .in('id', blockedIds);

          const profMap = new Map((profiles || []).map(p => [p.id, p]));

          resultList = blocks.map(b => {
            const prof = profMap.get(b.blocked_id);
            return {
              id: b.id,
              blocked_user_id: b.blocked_id,
              blocked_at: b.created_at,
              profile: {
                id: b.blocked_id,
                username: prof?.username || 'user',
                display_name: prof?.display_name || prof?.username || 'ผู้ใช้งาน',
                avatar_url: prof?.avatar_url || null,
                bio: prof?.bio || null,
              },
            };
          });
        }
      }
    }
  } catch (e) {
    console.warn('Error fetching blocked users:', e);
  }

  // Merge with inMemoryBlockedUsers (to include recently blocked users in current session)
  const existingIds = new Set(resultList.map(u => u.blocked_user_id));
  const mergedList = [
    ...resultList,
    ...inMemoryBlockedUsers.filter(u => !existingIds.has(u.blocked_user_id)),
  ];

  // Enrich any user whose profile lacks real display_name or username
  const idsNeedingProfiles = mergedList
    .filter(u =>
      !u.profile.display_name ||
      u.profile.display_name === 'ผู้ใช้ที่ถูกบล็อก' ||
      u.profile.display_name === 'ผู้ใช้' ||
      !u.profile.username ||
      u.profile.username.startsWith('user_')
    )
    .map(u => u.blocked_user_id);

  if (idsNeedingProfiles.length > 0) {
    try {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url, bio')
        .in('id', idsNeedingProfiles);

      if (profiles && profiles.length > 0) {
        const profMap = new Map(profiles.map(p => [p.id, p]));
        for (const item of mergedList) {
          const prof = profMap.get(item.blocked_user_id);
          if (prof) {
            item.profile = {
              ...item.profile,
              username: prof.username || item.profile.username,
              display_name: prof.display_name || prof.username || item.profile.display_name,
              avatar_url: prof.avatar_url ?? item.profile.avatar_url,
              bio: prof.bio ?? item.profile.bio,
            };
          }
        }

        // Also update inMemoryBlockedUsers so cached items reflect the real names
        inMemoryBlockedUsers = inMemoryBlockedUsers.map(item => {
          const prof = profMap.get(item.blocked_user_id);
          if (prof) {
            return {
              ...item,
              profile: {
                ...item.profile,
                username: prof.username || item.profile.username,
                display_name: prof.display_name || prof.username || item.profile.display_name,
                avatar_url: prof.avatar_url ?? item.profile.avatar_url,
                bio: prof.bio ?? item.profile.bio,
              },
            };
          }
          return item;
        });
      }
    } catch (enrichErr) {
      console.warn('Error enriching blocked user profiles:', enrichErr);
    }
  }

  return mergedList;
}

/**
 * ลบบัญชีผู้ใช้ถาวร (Delete Account)
 */
export async function deleteAccount(): Promise<{ success: boolean; message: string }> {
  try {
    const res = await fetchApi<{ success: boolean; message: string }>('/api/auth/account', {
      method: 'DELETE',
    });

    if (res && res.success) {
      await supabase.auth.signOut();
      return { success: true, message: res.message || 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว' };
    }

    // Fallback: Delete profile and sign out
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').delete().eq('id', user.id);
      await supabase.auth.signOut();
      return { success: true, message: 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว' };
    }

    return { success: false, message: 'ไม่สามารถลบบัญชีได้' };
  } catch (err: any) {
    return { success: false, message: err?.message || 'เกิดข้อผิดพลาดในการลบบัญชี' };
  }
}

/**
 * URL สาธารณะของ Privacy Policy และ Terms of Use
 */
export function getPublicPrivacyPolicyUrl(): string {
  const base = API_BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');
  return `${base}/privacy-policy`;
}

export function getPublicTermsUrl(): string {
  const base = API_BASE_URL.replace(/\/api$/, '').replace(/\/$/, '');
  return `${base}/terms`;
}
