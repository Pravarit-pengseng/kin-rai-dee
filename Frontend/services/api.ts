import { supabase } from '@/lib/supabase';

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    // ดึง JWT จาก Supabase session อัตโนมัติ
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      // caller สามารถ override ได้ เช่น ใส่ token อื่น หรือลบ Content-Type
      ...(options?.headers as Record<string, string>),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      console.warn(`API Error ${response.status} for ${endpoint}`);
      return null;
    }

    // 204 No Content — ไม่มี body ให้ parse
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    console.warn(`Fetch error for ${endpoint}:`, error);
    return null;
  }
}

