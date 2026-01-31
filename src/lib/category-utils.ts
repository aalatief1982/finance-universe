/**
 * @file category-utils.ts
 * @description Category hierarchy helpers for lists and filters.
 *
 * @module lib/category-utils
 *
 * @responsibilities
 * 1. Load category hierarchy from storage
 * 2. Provide category/subcategory lists for UI filters
 * 3. Expose PEOPLE/CURRENCIES constants
 *
 * @storage-keys
 * - xpensia_category_hierarchy: stored hierarchy JSON
 *
 * @dependencies
 * - safe-storage.ts: localStorage wrapper
 * - people-utils.ts: People list
 *
 * @review-tags
 * - @risk: missing or malformed hierarchy data
 *
 * @review-checklist
 * - [ ] Storage parse errors return empty arrays
 * - [ ] Type filtering uses TransactionType
 * - [ ] Subcategory list returns empty when missing
 */

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
