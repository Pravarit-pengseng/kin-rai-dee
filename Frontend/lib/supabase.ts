import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';
import { ExpoSecureStoreAdapter } from '@/services/persistentAuthService';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

if (typeof globalThis.WebSocket === 'undefined') {
  try {
    (globalThis as any).WebSocket = require('ws');
  } catch {
    (globalThis as any).WebSocket = class {};
  }
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // H-1: ป้องกัน token ปรากฎใน URL บน mobile
  },
});

// Official Supabase React Native best practice:
// Refresh token automatically when the app comes back to the foreground
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
