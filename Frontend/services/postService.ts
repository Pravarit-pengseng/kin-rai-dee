import { fetchApi } from './api';
import { supabase } from '@/lib/supabase';
import { PopupPostData } from '@/components/popup-post';

const DEFAULT_IMAGE = require('@/assets/images/StirFriedHolyBasil.png');

export interface PostPayload {
  food_name: string;
  description?: string;
  restaurant_url?: string;
  image_url?: string;
  category_ids?: number[];
}

export interface PostUpdatePayload {
  food_name?: string;
  description?: string;
  restaurant_url?: string;
  image_url?: string;
  category_ids?: number[];
}

export function resolveCategoryNames(post: any): string[] {
  const tags: string[] = [];

  // 1. post_categories: [{ categories: { name } }]  (Supabase join หรือ API)
  if (post.post_categories?.length > 0) {
    for (const pc of post.post_categories) {
      if (pc?.categories?.name) tags.push(pc.categories.name);
      else if (typeof pc?.categories === 'string') tags.push(pc.categories);
      else if (pc?.category_name) tags.push(pc.category_name);
    }
    if (tags.length > 0) return tags;
  }

  // 2. categories: [{ name }]  (API direct)
  if (post.categories?.length > 0) {
    for (const c of post.categories) {
      if (c?.name) tags.push(c.name);
      else if (typeof c === 'string') tags.push(c);
    }
    if (tags.length > 0) return tags;
  }

  // 3. category_name หรือ category โดยตรง
  if (post.category_name) return [post.category_name];
  if (post.category) return [post.category];

  return ['อาหารทั่วไป'];
}

export function mapPostToPopup(post: any): PopupPostData {
  const profile = post.profiles;
  return {
    id: String(post.id),
    image: post.image_url
      ? { uri: post.image_url }
      : DEFAULT_IMAGE,
    userId: post.user_id || 'unknown',
    avatarUrl: profile?.avatar_url || undefined,
    displayName: profile?.display_name || undefined,
    username: profile?.username || undefined,
    title: post.food_name || 'ไม่มีชื่อเมนู',
    description: post.description || '',
    location: post.restaurant_url || '',
    tags: resolveCategoryNames(post),
    timeAgo: post.created_at
      ? new Date(post.created_at).toLocaleDateString('th-TH')
      : 'เมื่อเร็วๆ นี้',
  };
}

/**
 * GET Feed Posts
 * Public
 */
export async function fetchFeedPosts(
  limit: number = 20,
  offset: number = 0,
): Promise<PopupPostData[]> {
  const data = await fetchApi<any[]>(
    `/api/posts/feed?limit=${limit}&offset=${offset}`,
  );

  if (data && data.length > 0) {
    return data.map(mapPostToPopup);
  }

  // Supabase fallback
  try {
    const { data: supaData } = await supabase
      .from('posts')
      .select(
        '*, profiles(id, username, display_name, avatar_url), post_categories(categories(id, name))',
      )
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (supaData && supaData.length > 0) {
      return supaData.map(mapPostToPopup);
    }
  } catch (e) {
    console.warn(
      'Supabase fetch feed posts fallback error:',
      e,
    );
  }

  return [];
}

/**
 * GET Post Detail
 * Public
 */
export async function getPostDetail(
  postId: number | string,
): Promise<PopupPostData | null> {
  const data = await fetchApi<any>(
    `/api/posts/${postId}`,
  );

  if (data) {
    return mapPostToPopup(data);
  }

  // Supabase fallback
  try {
    const { data: supaData } = await supabase
      .from('posts')
      .select(
        '*, profiles(id, username, display_name, avatar_url), post_categories(categories(id, name))',
      )
      .eq('id', postId)
      .maybeSingle();

    if (supaData) {
      return mapPostToPopup(supaData);
    }
  } catch (e) {
    console.warn(
      'Supabase fetch post detail fallback error:',
      e,
    );
  }

  return null;
}

/**
 * CREATE Post
 * Auth required
 */
export async function createPost(
  payload: PostPayload,
): Promise<any | null> {
  const data = await fetchApi<any>(
    '/api/posts',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );

  if (data) {
    return data;
  }

  // Supabase fallback
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { category_ids, ...postData } = payload;

    const { data: post, error } = await supabase
      .from('posts')
      .insert({
        ...postData,
        user_id: user.id,
      })
      .select()
      .single();

    if (error || !post) {
      console.warn(
        'Supabase create post fallback error:',
        error,
      );
      return null;
    }

    if (category_ids && category_ids.length > 0) {
      await supabase
        .from('post_categories')
        .insert(
          category_ids.map((categoryId) => ({
            post_id: post.id,
            category_id: categoryId,
          })),
        );
    }

    return {
      success: true,
      data: post,
    };
  } catch (e) {
    console.warn(
      'Supabase create post fallback error:',
      e,
    );
    return null;
  }
}

/**
 * UPDATE Post
 * Auth required + owner only
 */
export async function updatePost(
  postId: number | string,
  payload: PostUpdatePayload,
): Promise<any | null> {
  const data = await fetchApi<any>(
    `/api/posts/${postId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );

  if (data) {
    return data;
  }

  // Supabase fallback
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return null;
    }

    const { category_ids, ...updateData } = payload;

    if (Object.keys(updateData).length > 0) {
      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) {
        console.warn(
          'Supabase update post fallback error:',
          error,
        );
        return null;
      }
    }

    if (category_ids !== undefined) {
      await supabase
        .from('post_categories')
        .delete()
        .eq('post_id', postId);

      if (category_ids.length > 0) {
        await supabase
          .from('post_categories')
          .insert(
            category_ids.map((categoryId) => ({
              post_id: postId,
              category_id: categoryId,
            })),
          );
      }
    }

    return {
      success: true,
      id: postId,
    };
  } catch (e) {
    console.warn(
      'Supabase update post fallback error:',
      e,
    );
    return null;
  }
}

/**
 * DELETE Post
 * Auth required + owner only
 */
export async function deletePost(
  postId: number | string,
): Promise<boolean> {
  const data = await fetchApi<any>(
    `/api/posts/${postId}`,
    {
      method: 'DELETE',
    },
  );

  if (data) {
    return true;
  }

  // Supabase fallback
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('posts')
      .delete()
      .eq('id', postId)
      .eq('user_id', user.id);

    if (error) {
      console.warn(
        'Supabase delete post fallback error:',
        error,
      );
      return false;
    }

    return true;
  } catch (e) {
    console.warn(
      'Supabase delete post fallback error:',
      e,
    );
    return false;
  }
}

/**
 * POST Bookmark
 * Auth required
 */
export async function bookmarkPost(
  postId: number | string,
): Promise<boolean> {
  const data = await fetchApi<any>(
    `/api/posts/${postId}/bookmark`,
    {
      method: 'POST',
    },
  );

  if (data) {
    return true;
  }

  // Supabase fallback
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('saved_posts')
      .upsert(
        {
          user_id: user.id,
          post_id: postId,
        },
        {
          onConflict: 'user_id,post_id',
        },
      );

    if (error) {
      console.warn(
        'Supabase bookmark fallback error:',
        error,
      );
      return false;
    }

    return true;
  } catch (e) {
    console.warn(
      'Supabase bookmark fallback error:',
      e,
    );
    return false;
  }
}

/**
 * DELETE Bookmark
 * Auth required
 */
export async function unbookmarkPost(
  postId: number | string,
): Promise<boolean> {
  const data = await fetchApi<any>(
    `/api/posts/${postId}/bookmark`,
    {
      method: 'DELETE',
    },
  );

  if (data) {
    return true;
  }

  // Supabase fallback
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { error } = await supabase
      .from('saved_posts')
      .delete()
      .eq('user_id', user.id)
      .eq('post_id', postId);

    if (error) {
      console.warn(
        'Supabase unbookmark fallback error:',
        error,
      );
      return false;
    }

    return true;
  } catch (e) {
    console.warn(
      'Supabase unbookmark fallback error:',
      e,
    );
    return false;
  }
}

/**
 * GET Saved Posts
 * Auth required
 */
export async function getSavedPosts(): Promise<PopupPostData[]> {
  const resp = await fetchApi<{ success: boolean; data: any[] } | any[]>(
    '/api/posts/saved',
  );

  // รองรับทั้ง array โดยตรง และ { success, data: [...] }
  if (Array.isArray(resp)) {
    return resp.map(mapPostToPopup);
  }
  if (resp && !Array.isArray(resp) && (resp as any)?.data) {
    return (resp as any).data.map(mapPostToPopup);
  }

  // Supabase fallback
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data: savedData } = await supabase
      .from('saved_posts')
      .select(
        'post_id, created_at, posts(*, profiles(id, username, display_name, avatar_url), post_categories(categories(id, name)))',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savedData) {
      return savedData
        .filter((item: any) => item.posts)
        .map((item: any) =>
          mapPostToPopup(item.posts),
        );
    }
  } catch (e) {
    console.warn(
      'Supabase fetch saved posts fallback error:',
      e,
    );
  }

  return [];
}