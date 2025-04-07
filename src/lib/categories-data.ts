
import { CategoryWithSubcategories, TransactionType } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

// Define the category hierarchy
export const categoryHierarchy: CategoryWithSubcategories[] = [
  {
    id: 'income',
    name: 'Income',
    description: 'Money coming in',
    icon: 'trending-up',
    color: 'green',
    transactionType: 'income',
    subcategories: [
      {
        id: 'salary',
        name: 'Salary',
        parentId: 'income',
        description: 'Regular employment income',
        icon: 'briefcase',
        color: 'green'
      },
      {
        id: 'freelance',
        name: 'Freelance',
        parentId: 'income',
        description: 'Project-based income',
        icon: 'code',
        color: 'teal'
      },
      {
        id: 'investments',
        name: 'Investments',
        parentId: 'income',
        description: 'Returns from investments',
        icon: 'trending-up',
        color: 'blue'
      }
    ]
  },
  {
    id: 'expense',
    name: 'Expenses',
    description: 'Money going out',
    icon: 'trending-down',
    color: 'red',
    transactionType: 'expense',
    subcategories: [
      {
        id: 'housing',
        name: 'Housing',
        parentId: 'expense',
        icon: 'home',
        color: 'blue',
        subcategories: [
          {
            id: 'rent',
            name: 'Rent',
            parentId: 'housing',
            icon: 'key',
            color: 'blue'
          },
          {
            id: 'mortgage',
            name: 'Mortgage',
            parentId: 'housing',
            icon: 'home',
            color: 'blue'
          },
          {
            id: 'utilities',
            name: 'Utilities',
            parentId: 'housing',
            icon: 'zap',
            color: 'yellow'
          }
        ]
      },
      {
        id: 'food',
        name: 'Food',
        parentId: 'expense',
        icon: 'coffee',
        color: 'orange',
        subcategories: [
          {
            id: 'groceries',
            name: 'Groceries',
            parentId: 'food',
            icon: 'shopping-cart',
            color: 'green'
          },
          {
            id: 'restaurants',
            name: 'Restaurants',
            parentId: 'food',
            icon: 'utensils',
            color: 'red'
          }
        ]
      },
      {
        id: 'transportation',
        name: 'Transportation',
        parentId: 'expense',
        icon: 'navigation',
        color: 'purple',
        subcategories: [
          {
            id: 'public-transport',
            name: 'Public Transport',
            parentId: 'transportation',
            icon: 'bus',
            color: 'purple'
          },
          {
            id: 'fuel',
            name: 'Fuel',
            parentId: 'transportation',
            icon: 'droplet',
            color: 'yellow'
          },
          {
            id: 'car-maintenance',
            name: 'Car Maintenance',
            parentId: 'transportation',
            icon: 'tool',
            color: 'gray'
          }
        ]
      }
    ]
  }
];

// Get top level categories
export const getTopLevelCategories = (): CategoryWithSubcategories[] => {
  return categoryHierarchy;
};

// Get categories by transaction type
export const getCategoriesByType = (type: TransactionType): CategoryWithSubcategories[] => {
  return categoryHierarchy.filter(category => 
    category.transactionType === type
  );
};

// Flatten category hierarchy to array
export const flattenedCategories: CategoryWithSubcategories[] = (() => {
  const result: CategoryWithSubcategories[] = [];
  
  const flatten = (categories: CategoryWithSubcategories[], result: CategoryWithSubcategories[]) => {
    for (const category of categories) {
      result.push(category);
      if (category.subcategories && category.subcategories.length > 0) {
        flatten(category.subcategories, result);
      }
    }
  };
  
  flatten(categoryHierarchy, result);
  return result;
})();

// Export category names for quick lookup
export const categoryNames: Record<string, string> = (() => {
  const result: Record<string, string> = {};
  for (const category of flattenedCategories) {
    result[category.id] = category.name;
  }
  return result;
})();

// Get category by ID
export const getCategoryById = (id: string): CategoryWithSubcategories | undefined => {
  return flattenedCategories.find(category => category.id === id);
};

// Get path to category (for breadcrumbs)
export const getCategoryPath = (id: string): string[] => {
  const path: string[] = [];
  
  const findPath = (categories: CategoryWithSubcategories[], targetId: string, currentPath: string[] = []): boolean => {
    for (const category of categories) {
      const newPath = [...currentPath, category.name];
      
      if (category.id === targetId) {
        path.push(...newPath);
        return true;
      }
      
      if (category.subcategories && findPath(category.subcategories, targetId, newPath)) {
        return true;
      }
    }
    
    return false;
  };
  
  findPath(categoryHierarchy, id);
  return path;
};
