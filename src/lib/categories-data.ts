
import { TransactionType, CategoryType } from '@/types/transaction.d';

// List of categories by transaction type
export const CATEGORY_HIERARCHY = [
  // Income categories
  {
    id: 'salary',
    name: 'Salary',
    subcategories: [
      { id: 'main-salary', name: 'Main Salary' },
      { id: 'benefit', name: 'Benefit' },
      { id: 'bonus', name: 'Bonus' }
    ],
    type: 'income' as TransactionType
  },
  {
    id: 'transfer-contacts',
    name: 'Transfer from Contacts',
    subcategories: [
      { id: 'loan-return', name: 'Loan Return' }
    ],
    type: 'income' as TransactionType
  },
  {
    id: 'investment',
    name: 'Investment',
    subcategories: [
      { id: 'sukuk', name: 'Sukuk' },
      { id: 'stocks', name: 'Stocks' }
    ],
    type: 'income' as TransactionType
  },
  
  // Expense categories
  {
    id: 'shopping',
    name: 'Shopping',
    subcategories: [
      { id: 'grocery', name: 'Grocery' },
      { id: 'clothing', name: 'Clothing' },
      { id: 'appliances', name: 'Appliances' },
      { id: 'misc', name: 'Misc' }
    ],
    type: 'expense' as TransactionType
  },
  {
    id: 'car',
    name: 'Car',
    subcategories: [
      { id: 'gas', name: 'Gas' },
      { id: 'maintenance', name: 'Maintenance' }
    ],
    type: 'expense' as TransactionType
  },
  {
    id: 'health',
    name: 'Health',
    subcategories: [
      { id: 'hospital', name: 'Hospital' },
      { id: 'pharmacy', name: 'Pharmacy' },
      { id: 'gym', name: 'Gym' },
      { id: 'tennis', name: 'Tennis' },
      { id: 'swimming', name: 'Swimming' }
    ],
    type: 'expense' as TransactionType
  },
  {
    id: 'education',
    name: 'Education',
    subcategories: [
      { id: 'school', name: 'School' },
      { id: 'course', name: 'Course' }
    ],
    type: 'expense' as TransactionType
  },
  {
    id: 'others',
    name: 'Others',
    subcategories: [
      { id: 'misc', name: 'Misc' }
    ],
    type: 'expense' as TransactionType
  },
  
  // Transfer categories
  {
    id: 'local-bank',
    name: 'Local Bank',
    subcategories: [],
    type: 'transfer' as TransactionType
  },
  {
    id: 'international-bank',
    name: 'International Bank',
    subcategories: [],
    type: 'transfer' as TransactionType
  }
];

export const PEOPLE = ['Ahmed', 'Marwa', 'Youssef', 'Salma', 'Mazen'];

export const CURRENCIES = ['SAR', 'EGP', 'USD', 'BHD', 'AED'];

// Helper function to get categories for a specific transaction type
export const getCategoriesForType = (type: TransactionType): string[] => {
  return CATEGORY_HIERARCHY
    .filter(category => category.type === type)
    .map(category => category.name);
};

// Helper function to get subcategories for a specific category
export const getSubcategoriesForCategory = (categoryName: string): string[] => {
  const category = CATEGORY_HIERARCHY.find(cat => cat.name === categoryName);
  return category 
    ? category.subcategories.map(sub => sub.name) 
    : [];
};
