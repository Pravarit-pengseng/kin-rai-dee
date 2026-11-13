import { fetchApi, USE_DIRECT_SUPABASE } from './api';
import { supabase } from '@/lib/supabase';
import { FOOD_CATEGORIES, INGREDIENT_CATEGORIES, FoodCategory } from '@/constants/categories';

let _foodCategoriesCache: FoodCategory[] | null = null;
let _ingredientCategoriesCache: FoodCategory[] | null = null;

export async function fetchFoodCategories(): Promise<FoodCategory[]> {
  if (_foodCategoriesCache && _foodCategoriesCache.length > 0) {
    return _foodCategoriesCache;
  }

  // 1. Direct Supabase query if enabled
  if (USE_DIRECT_SUPABASE) {
    try {
      const { data: supaData } = await supabase.from('categories').select('*').order('id');
      if (supaData && supaData.length > 0) {
        const result = supaData.map((item: any) => ({
          id: String(item.id),
          label: item.name,
          folder: item.folder || 'general',
        }));
        _foodCategoriesCache = result;
        return result;
      }
    } catch (e) {
      console.warn('Supabase fetch category error:', e);
    }
    return FOOD_CATEGORIES;
  }

  // Try Backend API first
  const data = await fetchApi<any[]>('/api/categories');
  if (data && data.length > 0) {
    const result = data.map((item) => ({
      id: String(item.id),
      label: item.name,
      folder: item.folder || 'general',
    }));
    _foodCategoriesCache = result;
    return result;
  }

  // Fallback to Supabase direct query
  try {
    const { data: supaData } = await supabase.from('categories').select('*').order('id');
    if (supaData && supaData.length > 0) {
      const result = supaData.map((item: any) => ({
        id: String(item.id),
        label: item.name,
        folder: item.folder || 'general',
      }));
      _foodCategoriesCache = result;
      return result;
    }
  } catch (e) {
    console.warn('Supabase fetch category fallback error:', e);
  }

  // Local static fallback
  return FOOD_CATEGORIES;
}

export async function fetchIngredientCategories(): Promise<FoodCategory[]> {
  if (_ingredientCategoriesCache && _ingredientCategoriesCache.length > 0) {
    return _ingredientCategoriesCache;
  }

  if (USE_DIRECT_SUPABASE) {
    try {
      const { data: supaData } = await supabase.from('ingredient_categories').select('*').order('id');
      if (supaData && supaData.length > 0) {
        const result = supaData.map((item: any) => ({
          id: String(item.id),
          label: item.name,
          folder: item.folder || 'general',
        }));
        _ingredientCategoriesCache = result;
        return result;
      }
    } catch (e) {
      console.warn('Supabase fetch ingredient category error:', e);
    }
    return INGREDIENT_CATEGORIES;
  }

  const data = await fetchApi<any[]>('/api/ingredient-categories');
  if (data && data.length > 0) {
    const result = data.map((item) => ({
      id: String(item.id),
      label: item.name,
      folder: item.folder || 'general',
    }));
    _ingredientCategoriesCache = result;
    return result;
  }

  try {
    const { data: supaData } = await supabase.from('ingredient_categories').select('*').order('id');
    if (supaData && supaData.length > 0) {
      const result = supaData.map((item: any) => ({
        id: String(item.id),
        label: item.name,
        folder: item.folder || 'general',
      }));
      _ingredientCategoriesCache = result;
      return result;
    }
  } catch (e) {
    console.warn('Supabase fetch ingredient category fallback error:', e);
  }

  return INGREDIENT_CATEGORIES;
}
