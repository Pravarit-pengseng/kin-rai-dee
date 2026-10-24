/**
 * Admin API Client for Kin-Rai-Dee FastAPI Backend
 */

import { supabase } from './supabaseClient';

export interface AdminStats {
  total_reports: number;
  pending_reports: number;
  in_review: number;
  action_taken: number;
  dismissed: number;
  urgent_reports: number;
  total_users: number;
  total_posts: number;
  total_comments: number;
}

export interface AdminApiResponse<T> {
  success: boolean;
  data: T;
  total?: number;
  message?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  // Fetch current Supabase session token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  try {
    let { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      // Attempt refresh if session is missing or expired
      const refreshRes = await supabase.auth.refreshSession();
      session = refreshRes.data.session;
    }

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      localStorage.removeItem('kinraidee_admin_auth');
      sessionStorage.removeItem('kinraidee_admin_auth');
      window.dispatchEvent(new CustomEvent('admin:unauthorized'));
      throw new Error('ไม่พบเซสชันการเข้าสู่ระบบ กำลังนำกลับไปหน้าเข้าสู่ระบบ...');
    }
  } catch (err: any) {
    localStorage.removeItem('kinraidee_admin_auth');
    sessionStorage.removeItem('kinraidee_admin_auth');
    window.dispatchEvent(new CustomEvent('admin:unauthorized'));
    throw new Error('ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
  }

  const res = await fetch(url, {
    headers: {
      ...headers,
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('kinraidee_admin_auth');
      sessionStorage.removeItem('kinraidee_admin_auth');
      supabase.auth.signOut().catch(() => {});
      window.dispatchEvent(new CustomEvent('admin:unauthorized'));
      throw new Error('เซสชันผู้ดูแลระบบหมดอายุ กำลังนำกลับไปหน้าเข้าสู่ระบบ...');
    }

    let errMessage = `HTTP ${res.status}: ${res.statusText}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errMessage = errJson.detail;
      else if (errJson.message) errMessage = errJson.message;
    } catch {
      // fallback to status text
    }
    throw new Error(errMessage);
  }

  return res.json() as Promise<T>;
}

export const adminApi = {
  // 1. Stats Overview
  getStats: () => request<AdminStats>('/api/admin/stats'),

  // 2. Reports
  getReportsQueue: (params?: {
    status?: string;
    priority?: string;
    target_type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.priority && params.priority !== 'all') q.set('priority', params.priority);
    if (params?.target_type && params.target_type !== 'all') q.set('target_type', params.target_type);
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<AdminApiResponse<any[]>>(`/api/admin/reports${queryStr}`);
  },

  assignReport: (
    reportId: number,
    payload: { moderator_id?: string; moderator_name?: string }
  ) =>
    request<AdminApiResponse<null>>(`/api/admin/reports/${reportId}/assign`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  applyReportDecision: (
    reportId: number,
    payload: {
      action_type: string;
      reason_code: string;
      internal_note?: string;
      notify_user?: boolean;
      moderator_id?: string;
      moderator_name?: string;
    }
  ) =>
    request<AdminApiResponse<null>>(`/api/admin/reports/${reportId}/decision`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // 3. Posts Management
  getPosts: (params?: { search?: string; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<AdminApiResponse<any[]>>(`/api/admin/posts${queryStr}`);
  },

  setPostVisibility: (
    postId: number,
    isHidden: boolean,
    moderator?: { id?: string; name?: string }
  ) =>
    request<AdminApiResponse<null>>(`/api/admin/posts/${postId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({
        is_hidden: isHidden,
        moderator_id: moderator?.id || 'admin',
        moderator_name: moderator?.name || 'ผู้ดูแลระบบ',
      }),
    }),

  deletePost: (postId: number, moderator?: { id?: string; name?: string }) => {
    const q = new URLSearchParams();
    if (moderator?.id) q.set('moderator_id', moderator.id);
    if (moderator?.name) q.set('moderator_name', moderator.name);
    const queryStr = q.toString() ? `?${q.toString()}` : '';

    return request<AdminApiResponse<null>>(`/api/admin/posts/${postId}${queryStr}`, {
      method: 'DELETE',
    });
  },

  // 4. Comments Management
  getComments: (params?: { post_id?: number; limit?: number; offset?: number }) => {
    const q = new URLSearchParams();
    if (params?.post_id) q.set('post_id', String(params.post_id));
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<AdminApiResponse<any[]>>(`/api/admin/comments${queryStr}`);
  },

  setCommentVisibility: (
    commentId: number,
    isHidden: boolean,
    moderator?: { id?: string; name?: string }
  ) =>
    request<AdminApiResponse<null>>(`/api/admin/comments/${commentId}/visibility`, {
      method: 'PATCH',
      body: JSON.stringify({
        is_hidden: isHidden,
        moderator_id: moderator?.id || 'admin',
        moderator_name: moderator?.name || 'ผู้ดูแลระบบ',
      }),
    }),

  deleteComment: (commentId: number, moderator?: { id?: string; name?: string }) => {
    const q = new URLSearchParams();
    if (moderator?.id) q.set('moderator_id', moderator.id);
    if (moderator?.name) q.set('moderator_name', moderator.name);
    const queryStr = q.toString() ? `?${q.toString()}` : '';

    return request<AdminApiResponse<null>>(`/api/admin/comments/${commentId}${queryStr}`, {
      method: 'DELETE',
    });
  },

  // 5. Users Management
  getUsers: (params?: {
    search?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    const q = new URLSearchParams();
    if (params?.search) q.set('search', params.search);
    if (params?.status && params.status !== 'all') q.set('status', params.status);
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.offset) q.set('offset', String(params.offset));

    const queryStr = q.toString() ? `?${q.toString()}` : '';
    return request<AdminApiResponse<any[]>>(`/api/admin/users${queryStr}`);
  },

  setUserStatus: (
    userId: string,
    status: 'active' | 'suspended',
    reason?: string,
    moderator?: { id?: string; name?: string }
  ) =>
    request<AdminApiResponse<null>>(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        status,
        reason: reason || undefined,
        moderator_id: moderator?.id || 'admin',
        moderator_name: moderator?.name || 'ผู้ดูแลระบบ',
      }),
    }),

  // 6. Audit Logs
  getAuditLogs: (limit: number = 100, offset: number = 0) =>
    request<AdminApiResponse<any[]>>(
      `/api/admin/audit-logs?limit=${limit}&offset=${offset}`
    ),
};
