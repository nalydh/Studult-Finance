export const MAX_CATEGORIES = 5;
export const MAX_CATEGORY_TABS = 4;

export const COLOR_PALETTE = [
  { name: "Red",    bg: "bg-red-100 dark:bg-red-950",    text: "text-red-700 dark:text-red-300",    dot: "bg-red-500" },
  { name: "Orange", bg: "bg-orange-100 dark:bg-orange-950", text: "text-orange-700 dark:text-orange-300", dot: "bg-orange-500" },
  { name: "Amber",  bg: "bg-amber-100 dark:bg-amber-950",  text: "text-amber-700 dark:text-amber-300",  dot: "bg-amber-500" },
  { name: "Green",  bg: "bg-emerald-100 dark:bg-emerald-950", text: "text-emerald-700 dark:text-emerald-300", dot: "bg-emerald-500" },
  { name: "Teal",   bg: "bg-teal-100 dark:bg-teal-950",   text: "text-teal-700 dark:text-teal-300",   dot: "bg-teal-500" },
  { name: "Blue",   bg: "bg-blue-100 dark:bg-blue-950",   text: "text-blue-700 dark:text-blue-300",   dot: "bg-blue-500" },
  { name: "Indigo", bg: "bg-indigo-100 dark:bg-indigo-950", text: "text-indigo-700 dark:text-indigo-300", dot: "bg-indigo-500" },
  { name: "Purple", bg: "bg-purple-100 dark:bg-purple-950", text: "text-purple-700 dark:text-purple-300", dot: "bg-purple-500" },
  { name: "Pink",   bg: "bg-pink-100 dark:bg-pink-950",   text: "text-pink-700 dark:text-pink-300",   dot: "bg-pink-500" },
  { name: "Slate",  bg: "bg-slate-100 dark:bg-slate-800",  text: "text-slate-700 dark:text-slate-300",  dot: "bg-slate-500" },
];

export interface CategoryItem {
  id: number;
  name: string;
  colorIndex: number;
}

export interface Asset {
  id: number;
  name: string;
  category: string;
  purchase_price: number;
  market_value: number | null;
  is_sold: boolean;
  sale_price: number | null;
  date_acquired: string;
  date_sold: string | null;
  net_profit: number | null;
}

export function getCategoryColor(categories: CategoryItem[], categoryName: string) {
  const cat = categories.find((c) => c.name === categoryName);
  const idx = cat ? cat.colorIndex : 0;
  return COLOR_PALETTE[idx % COLOR_PALETTE.length];
}
