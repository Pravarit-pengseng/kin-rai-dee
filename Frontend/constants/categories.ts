export interface FoodCategory {
  id: string;
  label: string;
  folder: string;
}

export const FOOD_CATEGORIES: FoodCategory[] = [
  { id: '1', label: 'กับข้าว', folder: 'side-dish' },
  { id: '2', label: 'ของทานเล่น', folder: 'snacks' },
  { id: '3', label: 'ของหวาน', folder: 'desserts' },
  { id: '4', label: 'เครื่องดื่ม', folder: 'drinks' },
  { id: '6', label: 'เบเกอรี่', folder: 'bakery' },
  { id: '8', label: 'อาหารจานเดียว', folder: 'single-dish' },
  { id: '9', label: 'อาหารนานาชาติ', folder: 'international' },
  { id: '10', label: 'อาหารเพื่อสุขภาพ', folder: 'healthy' },
  { id: '11', label: 'อาหารมังสวิรัติ', folder: 'vegetarian' },
  { id: '12', label: 'อาหารเส้น', folder: 'noodles' },
];

export const INGREDIENT_CATEGORIES: FoodCategory[] = [
  { id: '5', label: 'เนื้อสัตว์', folder: 'meat' },
  { id: '7', label: 'ผัก', folder: 'vegetables' },
];
