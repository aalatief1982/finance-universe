
import { CategoryWithSubcategories, TransactionType } from '@/types/transaction';

export const CATEGORY_HIERARCHY: CategoryWithSubcategories[] = [
  // Income categories
  {
    name: 'Salary',
    subcategories: ['Main Salary', 'Benefit', 'Bonus'],
    transactionType: 'income'
  },
  {
    name: 'Transfer from Contacts',
    subcategories: ['Loan Return'],
    transactionType: 'income'
  },
  {
    name: 'Investment',
    subcategories: ['Sukuk', 'Stocks'],
    transactionType: 'income'
  },
  
  // Expense categories
  {
    name: 'Shopping',
    subcategories: ['Grocery', 'Clothing', 'Appliances', 'Misc'],
    transactionType: 'expense'
  },
  {
    name: 'Car',
    subcategories: ['Gas', 'Maintenance'],
    transactionType: 'expense'
  },
  {
    name: 'Health',
    subcategories: ['Hospital', 'Pharmacy', 'Gym', 'Tennis', 'Swimming'],
    transactionType: 'expense'
  },
  {
    name: 'Education',
    subcategories: ['School', 'Course'],
    transactionType: 'expense'
  },
  {
    name: 'Others',
    subcategories: ['Misc'],
    transactionType: 'expense'
  },
  
  // Transfer categories
  {
    name: 'Local Bank',
    subcategories: [],
    transactionType: 'transfer'
  },
  {
    name: 'International Bank',
    subcategories: [],
    transactionType: 'transfer'
  }
];

export const PEOPLE = ['Ahmed', 'Marwa', 'Youssef', 'Salma', 'Mazen'];

export const CURRENCIES = ['SAR', 'EGP', 'USD', 'BHD', 'AED'];

// Helper function to get categories for a specific transaction type
export const getCategoriesForType = (type: TransactionType): string[] => {
  return CATEGORY_HIERARCHY
    .filter(category => category.transactionType === type)
    .map(category => category.name);
};

// Helper function to get subcategories for a specific category
export const getSubcategoriesForCategory = (categoryName: string): string[] => {
  const category = CATEGORY_HIERARCHY.find(cat => cat.name === categoryName);
  return category ? category.subcategories : [];
};
