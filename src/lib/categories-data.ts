import { safeStorage } from "@/utils/safe-storage";

import { TransactionType } from '@/types/transaction';
import { getPeopleNames } from './people-utils';


// Define the base category hierarchy structure
interface CategoryHierarchy {
  id: string;
  name: string;
  type: TransactionType;
  subcategories: Array<{ id: string; name: string; user?: boolean }>;
  user?: boolean;
}

// Fallback in case localStorage isn't ready (optional dev/testing mode)
const fallbackHierarchy: CategoryHierarchy[] = [
  {
    id: 'other',
    name: 'Other',
    type: 'expense' as TransactionType,
    subcategories: [{ id: 'misc', name: 'Misc' }]
  }
];

// Export the hierarchy constant for backward compatibility
export const CATEGORY_HIERARCHY = fallbackHierarchy;


// Dynamically load from localStorage
export const getCategoryHierarchy = (): typeof fallbackHierarchy => {
  try {
    const raw = safeStorage.getItem('xpensia_category_hierarchy');
    return raw ? JSON.parse(raw) : fallbackHierarchy;
  } catch {
    return fallbackHierarchy;
  }
};

// Get categories by transaction type
export const getCategoriesForType = (type: TransactionType): string[] => {
  return getCategoryHierarchy()
    .filter(category => category.type === type)
    .map(category => category.name);
};

// Get subcategories for a given category
export const getSubcategoriesForCategory = (categoryName: string): string[] => {
  const category = getCategoryHierarchy().find(cat => cat.name === categoryName);
  return category ? category.subcategories.map(sub => sub.name) : [];
};
export const PEOPLE = getPeopleNames();

export const CURRENCIES = ['SAR', 'EGP', 'USD', 'BHD', 'AED'];



