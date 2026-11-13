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

  // iOS or fallback: Read/write to Keychain
  if (Platform.OS === 'ios') {
    try {
      const ss = getSecureStore();
      if (ss) {
        let id = await ss.getItemAsync(DEVICE_ID_KEY, {
          keychainAccessible: ss.ALWAYS_THIS_DEVICE_ONLY,
        });
        if (!id) {
          id = `ios_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
          await ss.setItemAsync(DEVICE_ID_KEY, id, {
            keychainAccessible: ss.ALWAYS_THIS_DEVICE_ONLY,
          });
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

/**
 * Custom Storage Adapter for Supabase client.
 * Configured with ALWAYS_THIS_DEVICE_ONLY so on iOS, Keychain items persist across app uninstallation.
 */
export const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch {}
      return null;
    }

    try {
      const ss = getSecureStore();
      if (!ss) return null;
      return await ss.getItemAsync(key, {
        keychainAccessible: ss.ALWAYS_THIS_DEVICE_ONLY,
      });
    } catch {
      return null;
    }
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch {}
      return;
    }

    try {
      const ss = getSecureStore();
      if (!ss) return;
      await ss.setItemAsync(key, value, {
        keychainAccessible: ss.ALWAYS_THIS_DEVICE_ONLY,
      });
    } catch (e) {
      console.warn('SecureStore setItem error:', e);
    }
  },

  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch {}
      return;
    }

    try {
      const ss = getSecureStore();
      if (!ss) return;
      await ss.deleteItemAsync(key, {
        keychainAccessible: ss.ALWAYS_THIS_DEVICE_ONLY,
      });
    } catch (e) {
      console.warn('SecureStore deleteItem error:', e);
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
    });
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

    const res = await fetch(`${apiUrl}/auth/device-session/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    });

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

    await fetch(`${apiUrl}/auth/device-session/unbind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId }),
    });
  } catch (err) {
    console.warn('Device session unbind notice:', err);
  }
}
