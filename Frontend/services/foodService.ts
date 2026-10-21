import { fetchApi } from './api';
import { supabase } from '@/lib/supabase';
import { FOOD_LIST, FoodItem } from '@/constants/foodData';

export interface FoodApiItem {
  id: number | string;
  name: string;
  image_url?: string;
  category_id: number | string;
}

export async function fetchFoods(categoryId?: string): Promise<FoodApiItem[]> {
  const queryParam = categoryId ? `?category_id=${categoryId}` : '';
  const data = await fetchApi<FoodApiItem[]>(`/api/foods${queryParam}`);
  if (data && data.length > 0) return data;

  try {
    let query = supabase.from('foods').select('*');
    if (categoryId) query = query.eq('category_id', categoryId);
    const { data: supaData } = await query;
    if (supaData && supaData.length > 0) return supaData;
  } catch (e) {
    console.warn('Supabase fetch foods fallback error:', e);
  }

  return [];
}

export async function getRandomFood(categoryIds: string[]): Promise<FoodItem | null> {
  const queryParam = categoryIds.length > 0 ? `?category_ids=${categoryIds.join(',')}` : '';
  const data = await fetchApi<FoodApiItem>(`/api/random/food${queryParam}`);

  if (data) {
    return {
      id: String(data.id),
      name: data.name,
      categoryId: String(data.category_id),
      image: data.image_url ? { uri: data.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
    };
  }

  // Local fallback logic using FOOD_LIST
  const pool = categoryIds.length > 0
    ? FOOD_LIST.filter(item => categoryIds.includes(item.categoryId))
    : FOOD_LIST;

  if (pool.length > 0) {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return null;
}

export async function getRandomIngredient(veg: boolean, meat: boolean): Promise<{ veg: FoodItem | null; meat: FoodItem | null }> {
  const params = new URLSearchParams();
  if (veg) params.append('veg', 'true');
  if (meat) params.append('meat', 'true');

  const data = await fetchApi<{ veg: FoodApiItem | null; meat: FoodApiItem | null }>(`/api/random/ingredient?${params.toString()}`);

  if (data) {
    return {
      veg: data.veg ? {
        id: String(data.veg.id),
        name: data.veg.name,
        categoryId: String(data.veg.category_id),
        image: data.veg.image_url ? { uri: data.veg.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
      } : null,
      meat: data.meat ? {
        id: String(data.meat.id),
        name: data.meat.name,
        categoryId: String(data.meat.category_id),
        image: data.meat.image_url ? { uri: data.meat.image_url } : require('@/assets/images/StirFriedHolyBasil.png'),
      } : null,
    };
  }

  // Local fallback logic
  let resVeg: FoodItem | null = null;
  let resMeat: FoodItem | null = null;

  if (veg) {
    const vegPool = FOOD_LIST.filter(item => item.categoryId === '7'); // 7 = ผัก
    if (vegPool.length > 0) resVeg = vegPool[Math.floor(Math.random() * vegPool.length)];
  }
  if (meat) {
    const meatPool = FOOD_LIST.filter(item => item.categoryId === '5'); // 5 = เนื้อสัตว์
    if (meatPool.length > 0) resMeat = meatPool[Math.floor(Math.random() * meatPool.length)];
  }

  return { veg: resVeg, meat: resMeat };
}
