
import { TransactionType } from '@/types/transaction';
import { getPeopleNames } from './people-utils';


// Fallback in case localStorage isn't ready (optional dev/testing mode)
const fallbackHierarchy: typeof CATEGORY_HIERARCHY = [
  {
    id: 'other',
    name: 'Other',
    type: 'expense' as TransactionType,
    subcategories: [{ id: 'misc', name: 'Misc' }]
  }
];


// Dynamically load from localStorage
export const getCategoryHierarchy = (): typeof fallbackHierarchy => {
  try {
    const raw = localStorage.getItem('xpensia_category_hierarchy');
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



