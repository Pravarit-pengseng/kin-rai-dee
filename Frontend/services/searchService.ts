import { fetchApi } from './api';
import { supabase } from '@/lib/supabase';
import { PopupPostData } from '@/components/popup-post';

export interface SearchHistoryItem {
  id: number | string;
  user_id: string;
  query: string;
  created_at?: string;
}

export async function searchPosts(query: string): Promise<PopupPostData[]> {
  const data = await fetchApi<any[]>(`/api/search?q=${encodeURIComponent(query)}`);

  if (data && data.length > 0) {
    return data.map((post) => ({
      id: String(post.id),
      image: post.image_url ? { uri: post.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
      userId: post.user_id || 'unknown',
      title: post.food_name || 'ไม่มีชื่อเมนู',
      description: post.description || '',
      location: post.restaurant_url || '',
      tag: post.post_categories?.[0]?.categories?.name || 'ทั่วไป',
      timeAgo: post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : 'เมื่อเร็วๆ นี้',
    }));
  }

  return [];
}

export async function fetchSearchHistory(userId: string): Promise<SearchHistoryItem[]> {
  const data = await fetchApi<SearchHistoryItem[]>(`/api/search/history?user_id=${userId}`);
  if (data) return data;

  try {
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

export async function addSearchHistory(userId: string, queryText: string): Promise<boolean> {
  const res = await fetchApi<any>('/api/search/history', {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, query: queryText }),
  });
  if (res) return true;

  try {
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

export async function clearAllSearchHistory(userId: string): Promise<boolean> {
  const res = await fetchApi<any>(`/api/search/history?user_id=${userId}`, {
    method: 'DELETE',
  });
  if (res) return true;

  try {
    await supabase.from('search_history').delete().eq('user_id', userId);
    return true;
  } catch (e) {
    console.warn('Supabase clear search history error:', e);
    return false;
  }
}
