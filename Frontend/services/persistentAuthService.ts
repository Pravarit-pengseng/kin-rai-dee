import { Platform } from 'react-native';
import { Session } from '@supabase/supabase-js';

const DEVICE_ID_KEY = 'krd_device_hardware_id';

let cachedDeviceId: string | null = null;

// Lazy-load native modules only on native platforms (prevents Metro Web SSR unknown module errors)
function getSecureStore(): typeof import('expo-secure-store') | null {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-secure-store');
  } catch {
    return null;
  }
}

function getApplication(): typeof import('expo-application') | null {
  if (Platform.OS === 'web') return null;
  try {
    return require('expo-application');
  } catch {
    return null;
  }
}

/**
 * Get or create a persistent device identifier.
 * - On Android: Uses Settings.Secure.ANDROID_ID (persists across uninstall/reinstall of same app).
 * - On iOS: Stored in iOS Keychain with ALWAYS_THIS_DEVICE_ONLY (persists across uninstall/reinstall).
 */
export async function getPersistentDeviceId(): Promise<string> {
  if (cachedDeviceId) return cachedDeviceId;

  if (Platform.OS === 'android') {
    try {
      const app = getApplication();
      const androidId = app?.getAndroidId?.();
      if (androidId) {
        cachedDeviceId = `android_${androidId}`;
        return cachedDeviceId;
      }
    } catch (e) {
      console.warn('Could not retrieve Android ID:', e);
    }
  }

  // iOS or fallback: Read/write to SecureStore
  if (Platform.OS === 'ios') {
    try {
      const ss = getSecureStore();
      if (ss) {
        let id = await ss.getItemAsync(DEVICE_ID_KEY);
        if (!id) {
          id = `ios_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
          await ss.setItemAsync(DEVICE_ID_KEY, id);
        }
        cachedDeviceId = id;
        return cachedDeviceId;
      }
    } catch (e) {
      console.warn('SecureStore device ID error on iOS:', e);
    }
  }

  // Web or fallback
  cachedDeviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  return cachedDeviceId;
}

const CHUNK_SIZE = 1800; // เผื่อ margin สำหรับลิมิต 2048 bytes ของ SecureStore
const DEBUG_AUTH_STORAGE = __DEV__; // log การอ่าน/เขียน session เฉพาะตอน dev

function logStorage(...args: unknown[]) {
  if (DEBUG_AUTH_STORAGE) console.log('[AuthStorage]', ...args);
}

async function deleteChunks(
  ss: NonNullable<ReturnType<typeof getSecureStore>>,
  key: string,
): Promise<void> {
  const countStr = await ss.getItemAsync(`${key}_chunks`);
  if (!countStr) return;
  const count = parseInt(countStr, 10);
  // ลบตัวนับก่อน เพื่อไม่ให้ getItem ไปอ่าน chunk ที่ลบไปครึ่งๆ กลางๆ
  await ss.deleteItemAsync(`${key}_chunks`);
  if (Number.isFinite(count)) {
    for (let i = 0; i < count; i++) {
      try { await ss.deleteItemAsync(`${key}_${i}`); } catch { }
    }
  }
}

/**
 * Custom Storage Adapter for Supabase client.
 * - แบ่ง chunk อัตโนมัติเมื่อค่ายาวเกิน CHUNK_SIZE (ลิมิตของ SecureStore)
 * - ถ้าอ่าน chunk ได้ไม่ครบ คืน null (ไม่คืน JSON ที่ขาดๆ ให้ Supabase)
 * - ถ้าเขียนไม่สำเร็จ จะ throw ออกไปให้เห็น error แทนการกลืนเงียบ
 */
export const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch { }
      return null;
    }

    try {
      const ss = getSecureStore();
      if (!ss) {
        logStorage('getItem: SecureStore not available');
        return null;
      }

      // 1. ค่าที่ถูกแบ่ง chunk
      const chunkCountStr = await ss.getItemAsync(`${key}_chunks`);
      if (chunkCountStr) {
        const count = parseInt(chunkCountStr, 10);
        if (Number.isFinite(count) && count > 0) {
          const parts: string[] = [];
          for (let i = 0; i < count; i++) {
            const part = await ss.getItemAsync(`${key}_${i}`);
            if (part === null) {
              logStorage(`getItem ${key}: chunk ${i}/${count} หาย → คืน null`);
              return null;
            }
            parts.push(part);
          }
          const joined = parts.join('');
          logStorage(`getItem ${key}: ${count} chunks, length ${joined.length}`);
          return joined;
        }
      }

      // 2. ค่าปกติ
      const value = await ss.getItemAsync(key);
      logStorage(`getItem ${key}:`, value === null ? 'null' : `length ${value.length}`);
      return value;
    } catch (e) {
      console.warn('[AuthStorage] getItem error:', e);
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch { }
      return;
    }

    const ss = getSecureStore();
    if (!ss) {
      logStorage('setItem: SecureStore not available');
      return;
    }

    try {
      if (value.length > CHUNK_SIZE) {
        // ลบของเก่าก่อน แล้วเขียน chunk ให้ครบ จากนั้นค่อยเขียนตัวนับเป็นขั้นสุดท้าย
        await deleteChunks(ss, key);
        const count = Math.ceil(value.length / CHUNK_SIZE);
        for (let i = 0; i < count; i++) {
          await ss.setItemAsync(`${key}_${i}`, value.substring(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
        }
        await ss.setItemAsync(`${key}_chunks`, String(count));
        try { await ss.deleteItemAsync(key); } catch { }
        logStorage(`setItem ${key}: เขียน ${count} chunks สำเร็จ (length ${value.length})`);
      } else {
        await ss.setItemAsync(key, value);
        await deleteChunks(ss, key);
        logStorage(`setItem ${key}: เขียนสำเร็จ (length ${value.length})`);
      }
    } catch (e) {
      console.warn('[AuthStorage] setItem FAILED:', key, e);
      throw e;
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch { }
      return;
    }

    try {
      const ss = getSecureStore();
      if (!ss) return;
      try { await deleteChunks(ss, key); } catch { }
      await ss.deleteItemAsync(key);
      logStorage(`removeItem ${key}`);
    } catch (e) {
      console.warn('[AuthStorage] removeItem error:', e);
    }
  },
};

/**
 * Binds active session to device on backend so Android reinstall can recover it
 */
export async function syncDeviceSession(session: Session | null): Promise<void> {
  if (!session?.refresh_token || !session?.user?.id) return;

  try {
    const deviceId = await getPersistentDeviceId();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://kin-rai-dee-backend.onrender.com';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    await fetch(`${apiUrl}/auth/device-session/bind`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        device_id: deviceId,
        refresh_token: session.refresh_token,
        platform: Platform.OS,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    // Non-blocking sync error
    console.warn('Device session bind sync notice:', err);
  }
}

/**
 * Recovers session from backend device binding if local session was cleared by OS on uninstall
 */
export async function recoverDeviceSession(): Promise<{ access_token?: string; refresh_token?: string } | null> {
  try {
    const deviceId = await getPersistentDeviceId();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://kin-rai-dee-backend.onrender.com';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(`${apiUrl}/auth/device-session/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) return null;
    const data = await res.json();

    if (data.success && data.session?.refresh_token) {
      return {
        access_token: data.session.access_token,
        refresh_token: data.session.refresh_token,
      };
    }
  } catch (e) {
    console.warn('Device session recovery notice:', e);
  }
  return null;
}

/**
 * Unbinds device on explicit logout so user stays logged out
 */
export async function clearDeviceSession(): Promise<void> {
  try {
    const deviceId = await getPersistentDeviceId();
    const apiUrl = process.env.EXPO_PUBLIC_API_URL?.trim() || 'https://kin-rai-dee-backend.onrender.com';

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    await fetch(`${apiUrl}/auth/device-session/unbind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch (err) {
    console.warn('Device session unbind notice:', err);
  }
}