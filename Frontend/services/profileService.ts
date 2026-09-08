import { fetchApi } from './api';
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

/**
 * GET My Profile
 * Auth required
 */
export async function getMyProfile(): Promise<UserProfile | null> {
    const resp = await fetchApi<{ success: boolean; data: UserProfile }>(
        '/api/profiles/me',
    );

    if (resp?.data) {
        return resp.data;
    }

    // Supabase fallback
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return null;
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

        if (error) {
            console.warn(
                'Supabase get my profile fallback error:',
                error,
            );
            return null;
        }

        return profile;
    } catch (e) {
        console.warn(
            'Supabase get my profile fallback error:',
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
        return resp.data;
    }

    // Supabase fallback
    try {
        const {
            data: { user },
        } = await supabase.auth.getUser();

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
                'Supabase update profile fallback error:',
                error,
            );
            return null;
        }

        return profile;
    } catch (e) {
        console.warn(
            'Supabase update profile fallback error:',
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
        return data;
    }

    // Supabase fallback
    try {
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (error) {
            console.warn(
                'Supabase get user profile fallback error:',
                error,
            );
            return null;
        }

        return profile;
    } catch (e) {
        console.warn(
            'Supabase get user profile fallback error:',
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
        if (Array.isArray(data)) return data;
        if (!Array.isArray(data) && (data as any).data) return (data as any).data;
        return [];
    }

    // Supabase fallback
    try {
        const { data: posts, error } = await supabase
            .from('posts')
            .select(
                '*, post_categories(categories(id, name))',
            )
            .eq('user_id', userId)
            .order('created_at', {
                ascending: false,
            });

        if (error) {
            console.warn(
                'Supabase get user posts fallback error:',
                error,
            );
            return [];
        }

        return posts || [];
    } catch (e) {
        console.warn(
            'Supabase get user posts fallback error:',
            e,
        );
        return [];
    }
}