import { fetchApi } from './api';
import { supabase } from '@/lib/supabase';
import { PopupPostData } from '@/components/popup-post';

export async function fetchFeedPosts(limit: number = 20, offset: number = 0): Promise<PopupPostData[]> {
  const data = await fetchApi<any[]>(`/api/posts/feed?limit=${limit}&offset=${offset}`);

  if (data && data.length > 0) {
    return data.map((post) => ({
      id: String(post.id),
      image: post.image_url ? { uri: post.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
      userId: post.user_id || 'unknown',
      title: post.food_name || 'ไม่มีชื่อเมนู',
      description: post.description || '',
      location: post.restaurant_url || '',
      tag: post.post_categories?.[0]?.categories?.name || 'อาหารทั่วไป',
      timeAgo: post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : 'เมื่อเร็วๆ นี้',
    }));
  }

  try {
    const { data: supaData } = await supabase
      .from('posts')
      .select('*, profiles(id, username, display_name, avatar_url), post_categories(categories(id, name))')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (supaData && supaData.length > 0) {
      return supaData.map((post: any) => ({
        id: String(post.id),
        image: post.image_url ? { uri: post.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
        userId: post.user_id || 'unknown',
        title: post.food_name || 'ไม่มีชื่อเมนู',
        description: post.description || '',
        location: post.restaurant_url || '',
        tag: post.post_categories?.[0]?.categories?.name || 'อาหารทั่วไป',
        timeAgo: post.created_at ? new Date(post.created_at).toLocaleDateString('th-TH') : 'เมื่อเร็วๆ นี้',
      }));
    }
  } catch (e) {
    console.warn('Supabase fetch feed posts fallback error:', e);
  }

  return [];
}
