
import { CategoryWithSubcategories } from '@/types/transaction';

// Define main category hierarchy
export const categoryHierarchy: CategoryWithSubcategories[] = [
  {
    id: 'income',
    name: 'Income',
    transactionType: 'income',
    subcategories: [
      { id: 'salary', name: 'Salary', parentId: 'income' },
      { id: 'freelance', name: 'Freelance', parentId: 'income' },
      { id: 'investments', name: 'Investments', parentId: 'income' }
    ]
  },
  {
    id: 'food',
    name: 'Food & Dining',
    transactionType: 'expense',
    subcategories: [
      { id: 'groceries', name: 'Groceries', parentId: 'food' }
    ]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    transactionType: 'expense',
    subcategories: [
      { id: 'gas', name: 'Gas', parentId: 'transportation' },
      { id: 'public_transport', name: 'Public Transport', parentId: 'transportation' }
    ]
  },
  {
    id: 'housing',
    name: 'Housing',
    transactionType: 'expense',
    subcategories: [
      { id: 'rent', name: 'Rent', parentId: 'housing' },
      { id: 'mortgage', name: 'Mortgage', parentId: 'housing' },
      { id: 'utilities', name: 'Utilities', parentId: 'housing' },
      { id: 'maintenance', name: 'Maintenance', parentId: 'housing' }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    transactionType: 'expense',
    subcategories: [
      { id: 'movies', name: 'Movies', parentId: 'entertainment' }
    ]
  },
  {
    id: 'shopping',
    name: 'Shopping',
    transactionType: 'expense',
    subcategories: [
      { id: 'clothing', name: 'Clothing', parentId: 'shopping' },
      { id: 'electronics', name: 'Electronics', parentId: 'shopping' },
      { id: 'gifts', name: 'Gifts', parentId: 'shopping' },
      { id: 'other_shopping', name: 'Other', parentId: 'shopping' },
      { id: 'personal', name: 'Personal', parentId: 'shopping' }
    ]
  },
  {
    id: 'misc',
    name: 'Miscellaneous',
    transactionType: 'expense',
    subcategories: [
      { id: 'other', name: 'Other', parentId: 'misc' }
    ]
  }
];

// Get all categories flattened into an array
export const getAllCategories = (): CategoryWithSubcategories[] => {
  const allCategories: CategoryWithSubcategories[] = [];
  
  categoryHierarchy.forEach(category => {
    allCategories.push({ ...category, subcategories: [] });
    
    if (category.subcategories) {
      category.subcategories.forEach(subcategory => {
        allCategories.push({ ...subcategory });
      });
    }
  });
  
  return allCategories;
};

// Get categories by transaction type (income, expense, transfer)
export const getCategoriesByType = (type: 'income' | 'expense' | 'transfer'): CategoryWithSubcategories[] => {
  return categoryHierarchy.filter(category => category.transactionType === type);
};

// Get subcategories for a specific category
export const getSubcategoriesForCategory = (categoryId: string): CategoryWithSubcategories[] => {
  const category = categoryHierarchy.find(cat => cat.id === categoryId);
  return category?.subcategories || [];
};

// For use in dropdown menus
export const PEOPLE = ['none', 'Ahmed', 'Marwa', 'Youssef', 'Salma', 'Mazen'];

// Currency options
export const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD'];
