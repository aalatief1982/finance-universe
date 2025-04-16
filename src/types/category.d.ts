
export interface CategoryType {
  id: string;
  name: string;
  parentId?: string | null;
  subcategories?: CategoryType[];
  color?: string;
  icon?: string;
  type?: 'income' | 'expense' | 'transfer' | 'all';
}

// String union type for simple categories
export type SimpleCategory = string;

// Combined union type
export type Category = CategoryType | SimpleCategory;
