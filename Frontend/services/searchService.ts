import { fetchApi, getAuthUser } from './api';
import { supabase } from '@/lib/supabase';
import { PopupPostData } from '@/components/popup-post';
import { resolveCategoryNames, mapPostToPopup, attachProfilesToPosts } from './postService';

import { getBlockedUserIdsSet, subscribeUserBlocked, subscribeUserUnblocked } from './safetyService';

export interface SearchHistoryItem {
  id: number | string;
  user_id: string;
  query: string;
  created_at?: string;
}

// ── Categories Cache (ลด round-trip ตอนค้นหา) ────────────────────────────────
let _categoriesCache: { id: number | string; name: string }[] | null = null;
let _categoriesCacheTime = 0;
const CATEGORIES_CACHE_TTL = 5 * 60 * 1000;

// ── Search Posts & History Cache ──────────────────────────────────────────────
const _searchPostsCache = new Map<string, { data: PopupPostData[]; timestamp: number }>();
const SEARCH_POSTS_CACHE_TTL = 60 * 1000; // 60 วินาที
const MAX_SEARCH_CACHE_ENTRIES = 20;

let _searchHistoryCache: { data: SearchHistoryItem[]; timestamp: number } | null = null;
const SEARCH_HISTORY_CACHE_TTL = 60 * 1000; // 60 วินาที

export function invalidateSearchHistoryCache() {
  _searchHistoryCache = null;
}

subscribeUserBlocked(() => {
  _searchPostsCache.clear();
});

subscribeUserUnblocked(() => {
  _searchPostsCache.clear();
});

async function getCachedCategories() {
  const now = Date.now();
  if (_categoriesCache && now - _categoriesCacheTime < CATEGORIES_CACHE_TTL) {
    return _categoriesCache;
  }
  const { data } = await supabase.from('categories').select('id, name');
  if (data) {
    _categoriesCache = data;
    _categoriesCacheTime = now;
  }
  return _categoriesCache || [];
}

export async function searchPosts(query: string): Promise<PopupPostData[]> {
  let result: PopupPostData[] = [];
  const lowerQuery = query.toLowerCase();
  const cacheKey = lowerQuery.trim();
  const cached = _searchPostsCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < SEARCH_POSTS_CACHE_TTL) {
    return cached.data;
  }

  const [resp, blockedIds] = await Promise.all([
    fetchApi<any>(`/api/search?q=${encodeURIComponent(query)}`),
    getBlockedUserIdsSet().catch(() => new Set<string>()),
  ]);

  let data = resp;
  if (resp && !Array.isArray(resp) && resp.data) {
    data = resp.data;
  }

  if (data && Array.isArray(data) && data.length > 0) {
    result = data.filter((p: any) => !p.is_hidden).map(mapPostToPopup);
  } else {
    // Supabase Direct Query (joined profiles + cached categories)
    try {
      const allCats = await getCachedCategories();
      const matchedCatIds = allCats
        .filter((c) => c.name?.toLowerCase().includes(lowerQuery))
        .map((c) => c.id);

      let catPostIds: any[] = [];
      if (matchedCatIds.length > 0) {
        const { data: pcData } = await supabase
          .from('post_categories')
          .select('post_id')
          .in('category_id', matchedCatIds);
        if (pcData && pcData.length > 0) {
          catPostIds = pcData.map((pc: any) => pc.post_id);
        }
      }

      const orConds = [`food_name.ilike.%${query}%`, `description.ilike.%${query}%`];
      if (catPostIds.length > 0) {
        orConds.push(`id.in.(${catPostIds.join(',')})`);
      }

      const { data: posts, error } = await supabase
        .from('posts')
        .select('id, user_id, food_name, description, image_url, restaurant_url, is_hidden, created_at, profiles(id, username, display_name, avatar_url), post_categories(categories(id, name))')
        .or('is_hidden.is.null,is_hidden.eq.false')
        .or(orConds.join(','))
        .order('created_at', { ascending: false })
        .limit(20);

      if (!error && posts && posts.length > 0) {
        const nonHidden = posts.filter((p: any) => !p.is_hidden);
        const needsProfiles = nonHidden.some((p: any) => !p.profiles && p.user_id);
        const populated = needsProfiles ? await attachProfilesToPosts(nonHidden) : nonHidden;
        result = populated.map(mapPostToPopup);
      }
    } catch (e) {
      console.warn('Supabase search posts fallback error:', e);
    }
  }

  // ซ่อนโพสต์จากผู้ใช้ที่ถูกบล็อก
  if (blockedIds.size > 0) {
    result = result.filter(p => !p.userId || !blockedIds.has(String(p.userId)));
  }

  if (_searchPostsCache.size >= MAX_SEARCH_CACHE_ENTRIES) {
    const oldestKey = _searchPostsCache.keys().next().value;
    if (oldestKey !== undefined) {
      _searchPostsCache.delete(oldestKey);
    }
  }
  _searchPostsCache.set(cacheKey, { data: result, timestamp: Date.now() });

  return result;
}

// user_id ไม่ต้องส่งจาก Frontend — Backend ดึงจาก JWT เอง
export async function fetchSearchHistory(): Promise<SearchHistoryItem[]> {
  if (_searchHistoryCache && Date.now() - _searchHistoryCache.timestamp < SEARCH_HISTORY_CACHE_TTL) {
    return _searchHistoryCache.data;
  }

  const data = await fetchApi<{ success: boolean; data: SearchHistoryItem[] }>('/api/search/history');
  if (data?.data) {
    _searchHistoryCache = { data: data.data, timestamp: Date.now() };
    return data.data;
  }

  // Supabase fallback: ดึง userId จาก session แทน
  try {
    const user = await getAuthUser();
    const userId = user?.id;
    if (!userId) return [];

    const { data: supaData } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    if (supaData) {
      _searchHistoryCache = { data: supaData, timestamp: Date.now() };
      return supaData;
    }
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
  if (res) {
    invalidateSearchHistoryCache();
    return true;
  }

  // Supabase fallback
  try {
    const user = await getAuthUser();
    const userId = user?.id;
    if (!userId) return false;

    await supabase.from('search_history').insert({ user_id: userId, query: queryText });
    invalidateSearchHistoryCache();
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
  if (res) {
    invalidateSearchHistoryCache();
    return true;
  }

  try {
    await supabase.from('search_history').delete().eq('id', historyId);
    invalidateSearchHistoryCache();
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
  if (res) {
    invalidateSearchHistoryCache();
    return true;
  }

  try {
    const user = await getAuthUser();
    const userId = user?.id;
    if (!userId) return false;

    await supabase.from('search_history').delete().eq('user_id', userId);
    invalidateSearchHistoryCache();
    return true;
  } catch (e) {
    console.warn('Supabase clear search history error:', e);
    return false;
  }
}
