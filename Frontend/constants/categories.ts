export interface FoodCategory {
  id: string;
  label: string;
  folder: string;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: '1', label: 'อาหารจานเดียว', folder: 'single-dish' },
  { id: '2', label: 'กับข้าว', folder: 'side-dish' },
  { id: '3', label: 'อาหารเส้น', folder: 'noodles' },
  { id: '4', label: 'ของทานเล่น', folder: 'snacks' },
  { id: '5', label: 'ของหวาน', folder: 'desserts' },
  { id: '6', label: 'เบเกอรี่', folder: 'bakery' },
  { id: '7', label: 'อาหารมังสวิรัติ', folder: 'vegetarian' },
  { id: '8', label: 'อาหารเพื่อสุขภาพ', folder: 'healthy' },
  { id: '10', label: 'เครื่องดื่ม', folder: 'drinks' },
  { id: '12', label: 'อาหารนานาชาติ', folder: 'international' },
];

export const INGREDIENT_CATEGORIES: FoodCategory[] = [
  { id: '1', label: 'เนื้อสัตว์', folder: 'meat' },
  { id: '2', label: 'ผัก', folder: 'vegetables' },
];