import { fetchApi } from './api';
import { supabase } from '@/lib/supabase';
import { PopupPostData } from '@/components/popup-post';
import { normalizeAvatarUrl } from './profileService';
import { getBlockedUserIdsSet } from './safetyService';

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

  // 1. Array of names: ['ต้ม', 'แกง']
  if (Array.isArray(post.categories)) {
    for (const c of post.categories) {
      if (typeof c === 'string') tags.push(c);
      else if (c?.name) tags.push(c.name);
    }
    if (tags.length > 0) return tags;
  }

  // 2. Supabase nested relation: post_categories: [{ categories: { name: 'ต้ม' } }]
  if (Array.isArray(post.post_categories)) {
    for (const pc of post.post_categories) {
      const c = pc.categories;
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
    avatarUrl: normalizeAvatarUrl(profile?.avatar_url),
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

export async function attachProfilesToPosts(posts: any[]): Promise<any[]> {
  if (!posts || posts.length === 0) return [];
  const userIds = [...new Set(posts.map((p) => p.user_id).filter(Boolean))];
  if (userIds.length === 0) return posts;

  try {
    const { data: profs } = await supabase
      .from('profiles')
      .select('id, username, display_name, avatar_url')
      .in('id', userIds);

    if (profs && profs.length > 0) {
      const map = Object.fromEntries(profs.map((pr) => [pr.id, pr]));
      return posts.map((p) => ({
        ...p,
        profiles: map[p.user_id] || p.profiles || null,
      }));
    }
  } catch (err) {
    console.warn('attachProfilesToPosts error:', err);
  }
  return posts;
}

/**
 * GET Feed Posts
 * Public
 */
export async function fetchFeedPosts(
  limit: number = 20,
  offset: number = 0,
): Promise<PopupPostData[]> {
  let posts: PopupPostData[] = [];

  const data = await fetchApi<any[]>(
    `/api/posts/feed?limit=${limit}&offset=${offset}`,
  );

  if (data && data.length > 0) {
    posts = data.map(mapPostToPopup);
  } else {
    // Supabase fallback
    try {
      const { data: supaData } = await supabase
        .from('posts')
        .select('*, post_categories(categories(id, name))')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (supaData && supaData.length > 0) {
        const populated = await attachProfilesToPosts(supaData);
        posts = populated.map(mapPostToPopup);
      }
    } catch (e) {
      console.warn(
        'Supabase fetch feed posts fallback error:',
        e,
      );
    }
  }

  // ซ่อนโพสต์จากผู้ใช้ที่ถูกบล็อก
  try {
    const blockedIds = await getBlockedUserIdsSet();
    if (blockedIds.size > 0) {
      posts = posts.filter(p => !p.userId || !blockedIds.has(String(p.userId)));
    }
  } catch (err) {
    console.warn('Filter blocked posts error:', err);
  }

  return posts;
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
      .select('*, post_categories(categories(id, name))')
      .eq('id', postId)
      .maybeSingle();

    if (supaData) {
      const [populated] = await attachProfilesToPosts([supaData]);
      return mapPostToPopup(populated);
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
        'post_id, created_at, posts(*, post_categories(categories(id, name)))',
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (savedData) {
      const rawPosts = savedData.filter((item: any) => item.posts).map((item: any) => item.posts);
      const populated = await attachProfilesToPosts(rawPosts);
      return populated.map(mapPostToPopup);
    }
  } catch (e) {
    console.warn(
      'Supabase fetch saved posts fallback error:',
      e,
    );
  }

  return [];
}

// ── Comment Services ─────────────────────────────────────────────────────────

export interface CommentData {
  id: string | number;
  post_id: number;
  user_id: string;
  content: string;
  created_at?: string;
  updated_at?: string;
  profiles?: {
    id: string;
    username: string;
    display_name?: string;
    avatar_url?: string;
  };
  username?: string;
  text?: string;
}

export async function getPostComments(postId: string | number): Promise<CommentData[]> {
  let comments: CommentData[] = [];
  try {
    const resp = await fetchApi<{ success: boolean; data: CommentData[] } | CommentData[]>(
      `/api/posts/${postId}/comments`
    );
    if (Array.isArray(resp)) {
      comments = resp;
    } else if (resp && typeof resp === 'object' && 'data' in resp && Array.isArray((resp as any).data)) {
      comments = (resp as any).data;
    } else {
      // Supabase fallback for comments
      const { data: supaComments } = await supabase
        .from('comments')
        .select('*, profiles(id, username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (supaComments && supaComments.length > 0) {
        comments = supaComments as any;
      }
    }
  } catch (error) {
    console.warn(`Error fetching comments for post ${postId}:`, error);
  }

  // ซ่อนคอมเมนต์จากผู้ใช้ที่ถูกบล็อก
  try {
    const blockedIds = await getBlockedUserIdsSet();
    if (blockedIds.size > 0) {
      comments = comments.filter(c => {
        const cUserId = c.user_id || c.profiles?.id;
        return !cUserId || !blockedIds.has(String(cUserId));
      });
    }
  } catch (err) {
    console.warn('Filter blocked comments error:', err);
  }

  return comments;
}

export async function addPostComment(
  postId: string | number,
  content: string
): Promise<CommentData | null> {
  const resp = await fetchApi<{ success: boolean; data: CommentData }>(
    `/api/posts/${postId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ content }),
    }
  );
  return resp?.data || null;
}

export async function updatePostComment(
  postId: string | number,
  commentId: string | number,
  content: string
): Promise<boolean> {
  const resp = await fetchApi<{ success: boolean }>(
    `/api/posts/${postId}/comments/${commentId}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ content }),
    }
  );
  return resp?.success ?? false;
}

export async function deletePostComment(
  postId: string | number,
  commentId: string | number
): Promise<boolean> {
  const resp = await fetchApi<{ success: boolean }>(
    `/api/posts/${postId}/comments/${commentId}`,
    {
      method: 'DELETE',
    }
  );
  return resp?.success ?? false;
}