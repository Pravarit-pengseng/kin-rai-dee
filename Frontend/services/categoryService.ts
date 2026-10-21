import { fetchApi } from './api';
import { supabase } from '@/lib/supabase';
import { FOOD_CATEGORIES, INGREDIENT_CATEGORIES, FoodCategory } from '@/constants/categories';

export async function fetchFoodCategories(): Promise<FoodCategory[]> {
  // Try Backend API first
  const data = await fetchApi<any[]>('/api/categories');
  if (data && data.length > 0) {
    return data.map((item) => ({
      id: String(item.id),
      label: item.name,
      folder: item.folder || 'general',
    }));
  }

  // Fallback to Supabase direct query
  try {
    const { data: supaData } = await supabase.from('categories').select('*').order('id');
    if (supaData && supaData.length > 0) {
      return supaData.map((item: any) => ({
        id: String(item.id),
        label: item.name,
        folder: item.folder || 'general',
      }));
    }
  } catch (e) {
    console.warn('Supabase fetch category fallback error:', e);
  }

  // Local static fallback
  return FOOD_CATEGORIES;
}

export async function fetchIngredientCategories(): Promise<FoodCategory[]> {
  const data = await fetchApi<any[]>('/api/ingredient-categories');
  if (data && data.length > 0) {
    return data.map((item) => ({
      id: String(item.id),
      label: item.name,
      folder: item.folder || 'general',
    }));
  }

  try {
    const { data: supaData } = await supabase.from('ingredient_categories').select('*').order('id');
    if (supaData && supaData.length > 0) {
      return supaData.map((item: any) => ({
        id: String(item.id),
        label: item.name,
        folder: item.folder || 'general',
      }));
    }
  } catch (e) {
    console.warn('Supabase fetch ingredient category fallback error:', e);
  }

  return INGREDIENT_CATEGORIES;
}
