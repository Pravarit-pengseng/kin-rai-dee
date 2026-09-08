import { fetchApi } from './api';
import { supabase } from '@/lib/supabase';
import { PopupPostData } from '@/components/popup-post';
import { resolveCategoryNames } from './postService';

export interface SearchHistoryItem {
  id: number | string;
  user_id: string;
  query: string;
  created_at?: string;
}

export async function searchPosts(query: string): Promise<PopupPostData[]> {
  const resp = await fetchApi<any>(`/api/search?q=${encodeURIComponent(query)}`);

  let data = resp;
  if (resp && !Array.isArray(resp) && resp.data) {
    data = resp.data;
  }

  if (data && Array.isArray(data) && data.length > 0) {
    return data.map((post) => ({
      id: String(post.id),
      image: post.image_url ? { uri: post.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
      userId: post.user_id || 'unknown',
      title: post.food_name || 'ไม่มีชื่อเมนู',
      description: post.description || '',
      location: post.restaurant_url || '',
      tags: resolveCategoryNames(post),
      timeAgo: post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : 'เมื่อเร็วๆ นี้',
    }));
  }

  // Supabase fallback
  try {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('*, post_categories(categories(id, name))')
      .ilike('food_name', `%${query}%`)
      .order('created_at', { ascending: false });

    if (!error && posts && posts.length > 0) {
      return posts.map((post: any) => ({
        id: String(post.id),
        image: post.image_url ? { uri: post.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
        userId: post.user_id || 'unknown',
        title: post.food_name || 'ไม่มีชื่อเมนู',
        description: post.description || '',
        location: post.restaurant_url || '',
        tags: resolveCategoryNames(post),
        timeAgo: post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : 'เมื่อเร็วๆ นี้',
      }));
    }
  } catch (e) {
    console.warn('Supabase search posts fallback error:', e);
  }

  return [];
}

// user_id ไม่ต้องส่งจาก Frontend — Backend ดึงจาก JWT เอง
export async function fetchSearchHistory(): Promise<SearchHistoryItem[]> {
  const data = await fetchApi<{ success: boolean; data: SearchHistoryItem[] }>('/api/search/history');
  if (data?.data) return data.data;

  // Supabase fallback: ดึง userId จาก session แทน
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return [];

    const { data: supaData } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (supaData) return supaData;
  } catch (e) {
    console.warn('Supabase search history error:', e);
  }

  return [];
}

export async function addSearchHistory(queryText: string): Promise<boolean> {
  const res = await fetchApi<any>('/api/search/history', {
    method: 'POST',
    body: JSON.stringify({ query: queryText }),
  });
  if (res) return true;

  // Supabase fallback
  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return false;

    await supabase.from('search_history').insert({ user_id: userId, query: queryText });
    return true;
  } catch (e) {
    console.warn('Supabase add search history error:', e);
    return false;
  }
}

export async function deleteSearchHistoryItem(historyId: number | string): Promise<boolean> {
  const res = await fetchApi<any>(`/api/search/history/${historyId}`, {
    method: 'DELETE',
  });
  if (res) return true;

  try {
    await supabase.from('search_history').delete().eq('id', historyId);
    return true;
  } catch (e) {
    console.warn('Supabase delete search history error:', e);
    return false;
  }
}

// user_id ไม่ต้องส่งจาก Frontend — Backend ดึงจาก JWT เอง
export async function clearAllSearchHistory(): Promise<boolean> {
  const res = await fetchApi<any>('/api/search/history', {
    method: 'DELETE',
  });
  if (res) return true;

  try {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) return false;

    await supabase.from('search_history').delete().eq('user_id', userId);
    return true;
  } catch (e) {
    console.warn('Supabase clear search history error:', e);
    return false;
  }
}
