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

/**
 * GET My Profile
 * Auth required
 */
export async function getMyProfile(): Promise<UserProfile | null> {
    const resp = await fetchApi<{ success: boolean; data: UserProfile }>(
        '/api/profiles/me',
    );

    if (resp?.data) {
        const profile = Array.isArray(resp.data) ? resp.data[0] : resp.data;
        if (profile?.avatar_url) {
            profile.avatar_url = normalizeAvatarUrl(profile.avatar_url);
        }
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
    const data = await fetchApi<UserProfile>(
        `/api/profiles/${userId}`,
    );

    if (data) {
        if (data.avatar_url) {
            data.avatar_url = normalizeAvatarUrl(data.avatar_url);
        }
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
): Promise<any[]> {
    const data = await fetchApi<any[]>(
        `/api/profiles/${userId}/posts`,
    );

    if (data) {
        const list = Array.isArray(data) ? data : (data as any).data || [];
        return list.filter((p: any) => !p.is_hidden);
    }

    // Supabase direct
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(
                '*, post_categories(categories(id, name))',
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
        if (nonHidden.length > 0) {
            const { data: prof } = await supabase
                .from('profiles')
                .select('id, username, display_name, avatar_url')
                .eq('id', userId)
                .maybeSingle();
            if (prof) {
                return nonHidden.map((p: any) => ({
                    ...p,
                    profiles: prof,
                }));
            }
        }
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
