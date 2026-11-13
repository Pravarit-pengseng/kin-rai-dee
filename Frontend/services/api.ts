import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

const PRODUCTION_API_URL = 'https://kin-rai-dee-backend.onrender.com';

/**
 * Direct Supabase Mode:
 * เมื่อเปิดใช้งาน (true) จะส่งคำขอตรงเข้า Supabase ทันที ไม่ต้องรอ Render Backend spin up / timeout (4 วินาที)
 * ทำให้แอปตอบสนองได้เร็วมาก (~100-250ms)
 */
export const USE_DIRECT_SUPABASE = process.env.EXPO_PUBLIC_USE_DIRECT_SUPABASE !== 'false';

/**
 * Helper ดึง user ปัจจุบันจาก Session ในหน่วยความจำ (0ms) แทนที่จะยิง HTTP ไป Supabase Auth ทุกครั้ง
 */
export async function getAuthUser() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return session.user;
    const { data: { user } } = await supabase.auth.getUser();
    return user ?? null;
  } catch {
    return null;
  }
}

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // 1. In Production build (!__DEV__), strictly enforce HTTPS to protect data in transit (Google Play requirement)
  if (!__DEV__) {
    if (envUrl && envUrl.startsWith('https://')) {
      return envUrl;
    }
    return PRODUCTION_API_URL;
  }

  // 2. Development: If EXPO_PUBLIC_API_URL is configured and doesn't point to localhost, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 3. Try to get the Metro bundler host IP (e.g. "192.168.1.38:8081" -> "192.168.1.38")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:8000`;
    }
  }

  // 4. Android emulator loopback host
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  // 5. Default for iOS simulator and web
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export interface FetchApiOptions extends RequestInit {
  forceBackend?: boolean;
}

export async function fetchApi<T>(endpoint: string, options?: FetchApiOptions): Promise<T | null> {
  // เมื่อเปิด Direct Supabase และไม่ได้บังคับ forceBackend ให้ข้ามไปใช้ Supabase ทันทีโดยไม่ติด timeout 4s
  if (USE_DIRECT_SUPABASE && !options?.forceBackend) {
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 2000); // ลด timeout เหลือ 2s

  try {
    // ดึง JWT จาก Supabase session อัตโนมัติ
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers as Record<string, string>),
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    // 204 No Content — ไม่มี body ให้ parse
    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (error) {
    clearTimeout(timeoutId);
    // Don't log yellow-box warnings in terminal/app; callers gracefully fallback
    return null;
  }
}
