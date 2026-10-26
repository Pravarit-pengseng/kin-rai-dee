import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type UserProfile = {
  id: string;
  email: string;
  displayName?: string;
  username?: string;
  bio?: string;
  avatarUrl?: string;
};

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

// ── Session-level cache (ลด Supabase egress) ───────────────────────────────
let _profileCheckCache: { userId: string; isAdmin: boolean; isSuspended: boolean } | null = null;

function normalizeAvatar(url?: string | null): string | undefined {
  if (!url) return undefined;
  const marker = '/storage/v1/object/public/avatars/';
  if (url.includes(marker)) {
    const idx = url.indexOf(marker);
    const path = url.substring(idx);
    if (SUPABASE_URL) {
      return `${SUPABASE_URL.replace(/\/$/, '')}${path}`;
    }
  }
  return url;
}

interface AuthContextType {
  isLoggedIn: boolean;
  user: UserProfile | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // แปลง Supabase user → UserProfile พร้อมดึง avatar จาก profiles
  async function syncUserProfile(supabaseUser: Session['user'] | null) {
    if (!supabaseUser) {
      setUser(null);
      _profileCheckCache = null; // ล้าง cache เมื่อ logout
      return;
    }

    let initialProfile: UserProfile = {
      id: supabaseUser.id,
      email: supabaseUser.email ?? '',
      displayName: supabaseUser.user_metadata?.display_name,
      username: supabaseUser.user_metadata?.username,
      bio: supabaseUser.user_metadata?.bio,
      avatarUrl: normalizeAvatar(supabaseUser.user_metadata?.avatar_url),
    };

    setUser(initialProfile);

    // ดึงข้อมูลเพิ่มเติมจาก profiles table
    try {
      // ใช้ cache ถ้าเป็น user คนเดิม (ลด query ทุก token refresh)
      if (_profileCheckCache?.userId === supabaseUser.id) {
        if (_profileCheckCache.isAdmin || _profileCheckCache.isSuspended) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          _profileCheckCache = null;
        }
        return;
      }

      // 1. บึง admins + profiles พร้อมกัน (2 queries → 1 round-trip ต่อการ login ใหม่)
      const [adminRes, profileRes] = await Promise.all([
        supabase
          .from('admins')
          .select('id, is_active')
          .eq('user_id', supabaseUser.id)
          .eq('is_active', true)
          .maybeSingle(),
        supabase
          .from('profiles')
          .select('display_name, username, bio, avatar_url, is_suspended')
          .eq('id', supabaseUser.id)
          .single(),
      ]);

      const adminRecord = adminRes.data;
      const data = profileRes.data;

      // บันทึก cache
      _profileCheckCache = {
        userId: supabaseUser.id,
        isAdmin: !!adminRecord,
        isSuspended: !!data?.is_suspended,
      };

      if (adminRecord || data?.is_suspended) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        _profileCheckCache = null;
        return;
      }

      if (data) {
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email ?? '',
          displayName: data.display_name || initialProfile.displayName,
          username: data.username || initialProfile.username,
          bio: data.bio || initialProfile.bio,
          avatarUrl: normalizeAvatar(data.avatar_url) || initialProfile.avatarUrl,
        });
      }
    } catch (e) {
      // ignore profiles fetch error, initialProfile is already set
    }
  }

  useEffect(() => {
    // ดึง session ปัจจุบันตอน mount
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      syncUserProfile(currentSession?.user ?? null).finally(() => setLoading(false));
    });

    // ฟัง auth state เปลี่ยนแปลง (login / logout / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      syncUserProfile(newSession?.user ?? null).finally(() => setLoading(false));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { error: error.message };
    }

    if (authData?.user) {
      try {
        // 1. ตรวจสอบว่าเป็นบัญชี Admin หรือไม่ — ป้องกันการเข้าสู่ระบบผ่านแอพพลิเคชันทั่วไป
        // บึง admins + profiles พร้อมกันเพื่อลด round-trip
        const [adminRes, profileRes] = await Promise.all([
          supabase
            .from('admins')
            .select('id, is_active')
            .eq('user_id', authData.user.id)
            .eq('is_active', true)
            .maybeSingle(),
          supabase
            .from('profiles')
            .select('is_suspended')
            .eq('id', authData.user.id)
            .maybeSingle(),
        ]);

        const adminRecord = adminRes.data;
        const profile = profileRes.data;

        // บันทึก cache สำหรับใช้ใน syncUserProfile
        _profileCheckCache = {
          userId: authData.user.id,
          isAdmin: !!adminRecord,
          isSuspended: !!profile?.is_suspended,
        };

        if (adminRecord) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          return {
            error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
          };
        }

        if (profile?.is_suspended) {
          await supabase.auth.signOut();
          setUser(null);
          setSession(null);
          return { error: 'บัญชีของคุณถูกระงับการใช้งาน หากคิดว่าเป็นข้อผิดพลาด สามารถติดต่อฝ่ายสนับสนุนได้ที่ phatsachon25488@gmail.com' };
        }
      } catch (err) {
        console.warn('Error checking profile suspension / admin role:', err);
      }
    }

    return { error: null };
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    const { data: { session: currentSession } } = await supabase.auth.getSession();
    await syncUserProfile(currentSession?.user ?? null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn: !!session,
        user,
        session,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
