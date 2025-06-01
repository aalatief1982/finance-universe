
import { Category } from '@/types/transaction';

// Define the category hierarchy
const CATEGORY_HIERARCHY: Category[] = [
  {
    id: 'food',
    name: 'Food & Dining',
    subcategories: [
      { id: 'restaurant', name: 'Restaurant' },
      { id: 'groceries', name: 'Groceries' },
      { id: 'coffee', name: 'Coffee & Tea' }
    ]
  },
  {
    id: 'transportation',
    name: 'Transportation',
    subcategories: [
      { id: 'gas', name: 'Gas & Fuel' },
      { id: 'uber', name: 'Ride Share' },
      { id: 'parking', name: 'Parking' }
    ]
  },
  {
    id: 'shopping',
    name: 'Shopping',
    subcategories: [
      { id: 'clothing', name: 'Clothing' },
      { id: 'electronics', name: 'Electronics' },
      { id: 'home', name: 'Home & Garden' }
    ]
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    subcategories: [
      { id: 'movies', name: 'Movies' },
      { id: 'music', name: 'Music' },
      { id: 'games', name: 'Games' }
    ]
  },
  {
    id: 'utilities',
    name: 'Bills & Utilities',
    subcategories: [
      { id: 'electricity', name: 'Electricity' },
      { id: 'water', name: 'Water' },
      { id: 'internet', name: 'Internet' }
    ]
  }
];

export const getCategoryHierarchy = (): Category[] => {
  return CATEGORY_HIERARCHY;
};

export const getAllCategories = (): string[] => {
  const categories: string[] = [];
  
  CATEGORY_HIERARCHY.forEach(category => {
    categories.push(category.name);
    if (category.subcategories) {
      category.subcategories.forEach(sub => {
        categories.push(sub.name);
      });
    }
  });
  
  return categories;
};

export const getCategoryByName = (name: string): Category | undefined => {
  for (const category of CATEGORY_HIERARCHY) {
    if (category.name === name) {
      return category;
    }
    if (category.subcategories) {
      const subcategory = category.subcategories.find(sub => sub.name === name);
      if (subcategory) {
        return subcategory;
      }
    }
  }
  return undefined;
};

export { CATEGORY_HIERARCHY };
