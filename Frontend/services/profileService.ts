import { fetchApi, getAuthUser } from './api';
import { supabase } from '@/lib/supabase';

export interface UserProfile {
    id: string;
    username: string;
    display_name?: string | null;
    bio?: string | null;
    avatar_url?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface UpdateProfilePayload {
    username?: string;
    display_name?: string;
    bio?: string | null;
    avatar_url?: string;
}

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';

export function normalizeAvatarUrl(url?: string | null): string | undefined {
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

// ── Profile Caches ──────────────────────────────────────────────────────────
let _myProfileCache: { data: UserProfile; timestamp: number } | null = null;
const MY_PROFILE_CACHE_TTL = 45 * 1000; // 45 วินาที

export function invalidateMyProfileCache() {
    _myProfileCache = null;
}

let _userPostsCache: Record<string, { data: any[]; timestamp: number }> = {};
const USER_POSTS_CACHE_TTL = 45 * 1000; // 45 วินาที
const MAX_USER_POSTS_CACHE = 12;

let _otherProfilesCache: Record<string, { data: UserProfile; timestamp: number }> = {};
const OTHER_PROFILE_CACHE_TTL = 60 * 1000; // 60 วินาที
const MAX_OTHER_PROFILES_CACHE = 30;

function setBoundedCache<T>(
    cache: Record<string, { data: T; timestamp: number }>,
    key: string,
    data: T,
    maxEntries: number,
) {
    const keys = Object.keys(cache);
    if (!cache[key] && keys.length >= maxEntries) {
        delete cache[keys[0]];
    }
    cache[key] = { data, timestamp: Date.now() };
}

export function invalidateOtherProfileCache(userId?: string) {
    if (userId) {
        delete _otherProfilesCache[userId];
    } else {
        _otherProfilesCache = {};
    }
}

export function getCachedUserPosts(userId: string): any[] | null {
    const item = _userPostsCache[userId];
    if (item && Date.now() - item.timestamp < USER_POSTS_CACHE_TTL) {
        return item.data;
    }
    return null;
}

export function invalidateUserPostsCache(userId?: string) {
    if (userId) {
        delete _userPostsCache[userId];
    } else {
        _userPostsCache = {};
    }
}

/**
 * GET My Profile
 * Auth required
 */
export async function getMyProfile(forceRefresh: boolean = false): Promise<UserProfile | null> {
    const now = Date.now();
    if (!forceRefresh && _myProfileCache && now - _myProfileCache.timestamp < MY_PROFILE_CACHE_TTL) {
        return _myProfileCache.data;
    }

    const resp = await fetchApi<{ success: boolean; data: UserProfile }>(
        '/api/profiles/me',
    );

    if (resp?.data) {
        const profile = Array.isArray(resp.data) ? resp.data[0] : resp.data;
        if (profile?.avatar_url) {
            profile.avatar_url = normalizeAvatarUrl(profile.avatar_url);
        }
        _myProfileCache = { data: profile, timestamp: now };
        return profile;
    }

    // Supabase direct
    try {
        const user = await getAuthUser();
        if (!user) {
            return null;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, bio, avatar_url, is_suspended, created_at, updated_at')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.warn(
                'Supabase get my profile error:',
                error,
            );
            return null;
        }

        if (profile?.avatar_url) {
            profile.avatar_url = normalizeAvatarUrl(profile.avatar_url);
        }
        if (profile) {
            _myProfileCache = { data: profile, timestamp: now };
        }
        return profile;
    } catch (e) {
        console.warn(
            'Supabase get my profile error:',
            e,
        );
        return null;
    }
}

/**
 * UPDATE My Profile
 * Auth required
 */
export async function updateMyProfile(
    payload: UpdateProfilePayload,
): Promise<UserProfile | null> {
    const resp = await fetchApi<{ success: boolean; data: UserProfile }>(
        '/api/profiles/me',
        {
            method: 'PATCH',
            body: JSON.stringify(payload),
        },
    );

    if (resp?.data) {
        const profile = Array.isArray(resp.data) ? resp.data[0] : resp.data;
        if (profile?.avatar_url) {
            profile.avatar_url = normalizeAvatarUrl(profile.avatar_url);
        }
        invalidateMyProfileCache();
        return profile;
    }

    // Supabase direct
    try {
        const user = await getAuthUser();
        if (!user) {
            return null;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .update(payload)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            console.warn(
                'Supabase update profile error:',
                error,
            );
            return null;
        }

        if (profile?.avatar_url) {
            profile.avatar_url = normalizeAvatarUrl(profile.avatar_url);
        }
        invalidateMyProfileCache();
        return profile;
    } catch (e) {
        console.warn(
            'Supabase update profile error:',
            e,
        );
        return null;
    }
}

/**
 * GET User Profile
 * Public
 */
export async function getUserProfile(
    userId: string,
): Promise<UserProfile | null> {
    const cached = _otherProfilesCache[userId];
    if (cached && Date.now() - cached.timestamp < OTHER_PROFILE_CACHE_TTL) {
        return cached.data;
    }

    const data = await fetchApi<UserProfile>(
        `/api/profiles/${userId}`,
    );

    if (data) {
        if (data.avatar_url) {
            data.avatar_url = normalizeAvatarUrl(data.avatar_url);
        }
        setBoundedCache(_otherProfilesCache, userId, data, MAX_OTHER_PROFILES_CACHE);
        return data;
    }

    // Supabase direct
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('id, username, display_name, bio, avatar_url, is_suspended, created_at, updated_at')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.warn(
                'Supabase get user profile error:',
                error,
            );
            return null;
        }

        if (profile?.avatar_url) {
            profile.avatar_url = normalizeAvatarUrl(profile.avatar_url);
        }
        if (profile) {
            setBoundedCache(_otherProfilesCache, userId, profile, MAX_OTHER_PROFILES_CACHE);
        }
        invalidateMyProfileCache();
        return profile;
    } catch (e) {
        console.warn(
            'Supabase get user profile error:',
            e,
        );
        return null;
    }
}

/**
 * GET User Posts
 * Public
 */
export async function getUserPosts(
    userId: string,
    forceRefresh: boolean = false,
): Promise<any[]> {
    const now = Date.now();
    if (!forceRefresh && _userPostsCache[userId] && now - _userPostsCache[userId].timestamp < USER_POSTS_CACHE_TTL) {
        return _userPostsCache[userId].data;
    }

    const data = await fetchApi<any[]>(
        `/api/profiles/${userId}/posts`,
    );

    if (data) {
        const list = Array.isArray(data) ? data : (data as any).data || [];
        const filtered = list.filter((p: any) => !p.is_hidden);
        _userPostsCache[userId] = { data: filtered, timestamp: now };
        return filtered;
    }

    // Supabase direct with joined profiles in a single query
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(
                'id, user_id, food_name, description, image_url, restaurant_url, is_hidden, created_at, profiles(id, username, display_name, avatar_url), post_categories(categories(id, name))',
            )
            .eq('user_id', userId)
            .or('is_hidden.is.null,is_hidden.eq.false')
            .order('created_at', {
                ascending: false,
            });

        if (error) {
            console.warn(
                'Supabase get user posts error:',
                error,
            );
            return [];
        }

        const nonHidden = (posts || []).filter((p: any) => !p.is_hidden);
        setBoundedCache(_userPostsCache, userId, nonHidden, MAX_USER_POSTS_CACHE);
        return nonHidden;
    } catch (e) {
        console.warn(
            'Supabase get user posts error:',
            e,
        );
        return [];
    }
}

/**
 * DELETE My Account
 * Auth required
 */
export async function deleteMyAccount(): Promise<{ success: boolean; message?: string }> {
    const data = await fetchApi<{ success: boolean; message?: string }>(
        '/api/profiles/me',
        {
            method: 'DELETE',
        },
    );

    if (data && data.success) {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('Signout after account deletion error:', e);
        }
        return { success: true, message: data.message || 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว' };
    }

    // Fallback via /api/auth/account with forceBackend
    const authData = await fetchApi<{ success: boolean; message?: string }>(
        '/api/auth/account',
        {
            method: 'DELETE',
            forceBackend: true,
        },
    );

    if (authData && authData.success) {
        try {
            await supabase.auth.signOut();
        } catch (e) {
            console.warn('Signout after account deletion error:', e);
        }
        return { success: true, message: authData.message || 'ลบบัญชีผู้ใช้เรียบร้อยแล้ว' };
    }

    // Direct Supabase account deletion request fallback
    try {
        const user = await getAuthUser();
        if (user) {
            await supabase.from('account_deletion_requests').insert({
                user_id: user.id,
                email: user.email || '',
                status: 'pending',
                notes: 'Requested via mobile app direct Supabase'
            });
            await supabase.auth.signOut();
            return { success: true, message: 'ส่งคำขอลบบัญชีผู้ใช้เรียบร้อยแล้ว' };
        }
    } catch (e) {
        console.warn('Supabase account deletion request error:', e);
    }

    return { success: false, message: 'ไม่สามารถลบบัญชีได้ กรุณาลองใหม่อีกครั้ง' };
}
