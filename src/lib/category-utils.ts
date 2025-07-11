import { safeStorage } from "@/utils/safe-storage";
import { TransactionType } from '@/types/transaction';
import { getPeopleNames } from './people-utils';

export const PEOPLE = getPeopleNames();
export const CURRENCIES = ['SAR', 'EGP', 'USD', 'BHD', 'AED'];

type TransactionCategory = {
  id: string;
  name: string;
  type: TransactionType;
  subcategories: { id: string; name: string }[];
};

export const getAllCategories = (): { category: string; type: string }[] => {
  return getCategoryHierarchy().map(cat => ({
    category: cat.name,
    type: cat.type
  }));
};

export const getCategoryHierarchy = (): TransactionCategory[] => {
  try {
    const raw = safeStorage.getItem('xpensia_category_hierarchy');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const getCategoriesForType = (type: TransactionType): string[] => {
  return getCategoryHierarchy()
    .filter(category => category.type === type)
    .map(category => category.name);
};

export const getSubcategoriesForCategory = (categoryName: string): string[] => {
  const category = getCategoryHierarchy().find(cat => cat.name === categoryName);
  return category ? category.subcategories.map(sub => sub.name) : [];
};
