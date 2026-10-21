import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';

function resolveApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  // 1. If EXPO_PUBLIC_API_URL is configured and doesn't point to localhost, use it
  if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
    return envUrl;
  }

  // 2. Try to get the Metro bundler host IP (e.g. "192.168.1.38:8081" -> "192.168.1.38")
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const ip = hostUri.split(':')[0];
    if (ip) {
      return `http://${ip}:8000`;
    }
  }

  // 3. Android emulator loopback host
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }

  // 4. Default for iOS simulator and web
  return 'http://localhost:8000';
}

export const API_BASE_URL = resolveApiBaseUrl();

export async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout to quickly fallback

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
