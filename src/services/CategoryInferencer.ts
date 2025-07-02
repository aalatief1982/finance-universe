
// src/services/CategoryInferencer.ts
// A simple service to infer transaction categories based on vendor names

interface CategoryInfo {
  category: string;
  subcategory: string;
}

/**
 * Simple mapping between vendor keywords and categories
 */
const vendorCategoryMap: Record<string, CategoryInfo> = {
  // Food & Dining
  'restaurant': { category: 'Food & Dining', subcategory: 'Restaurants' },
  'cafe': { category: 'Food & Dining', subcategory: 'Coffee Shops' },
  'starbucks': { category: 'Food & Dining', subcategory: 'Coffee Shops' },
  'mcdonald': { category: 'Food & Dining', subcategory: 'Fast Food' },
  'kfc': { category: 'Food & Dining', subcategory: 'Fast Food' },
  'pizza': { category: 'Food & Dining', subcategory: 'Fast Food' },
  
  // Shopping
  'amazon': { category: 'Shopping', subcategory: 'Online Shopping' },
  'ikea': { category: 'Shopping', subcategory: 'Home Goods' },
  'market': { category: 'Shopping', subcategory: 'Groceries' },
  'grocery': { category: 'Shopping', subcategory: 'Groceries' },
  'supermarket': { category: 'Shopping', subcategory: 'Groceries' },
  'panda': { category: 'Shopping', subcategory: 'Groceries' },
  'tamimi': { category: 'Shopping', subcategory: 'Groceries' },
  'danube': { category: 'Shopping', subcategory: 'Groceries' },
  'carrefour': { category: 'Shopping', subcategory: 'Groceries' },
  'lulu': { category: 'Shopping', subcategory: 'Groceries' },
  'mall': { category: 'Shopping', subcategory: 'Retail' },
  
  // Transportation
  'uber': { category: 'Transportation', subcategory: 'Ride Sharing' },
  'careem': { category: 'Transportation', subcategory: 'Ride Sharing' },
  'taxi': { category: 'Transportation', subcategory: 'Taxi' },
  'gas': { category: 'Transportation', subcategory: 'Fuel' },
  'petrol': { category: 'Transportation', subcategory: 'Fuel' },
  'fuel': { category: 'Transportation', subcategory: 'Fuel' },
  'aldrees': { category: 'Transportation', subcategory: 'Fuel' },
  
  // Utilities
  'electric': { category: 'Utilities', subcategory: 'Electricity' },
  'water': { category: 'Utilities', subcategory: 'Water' },
  'internet': { category: 'Utilities', subcategory: 'Internet' },
  'phone': { category: 'Utilities', subcategory: 'Phone' },
  'mobile': { category: 'Utilities', subcategory: 'Phone' },
  'stc': { category: 'Utilities', subcategory: 'Phone' },
  'zain': { category: 'Utilities', subcategory: 'Phone' },
  'mobily': { category: 'Utilities', subcategory: 'Phone' },
  
  // Entertainment
  'netflix': { category: 'Entertainment', subcategory: 'Streaming Services' },
  'spotify': { category: 'Entertainment', subcategory: 'Streaming Services' },
  'cinema': { category: 'Entertainment', subcategory: 'Movies' },
  'theater': { category: 'Entertainment', subcategory: 'Movies' },
  
  // Health
  'pharmacy': { category: 'Health', subcategory: 'Pharmacy' },
  'doctor': { category: 'Health', subcategory: 'Doctor' },
  'hospital': { category: 'Health', subcategory: 'Hospital' },
  'clinic': { category: 'Health', subcategory: 'Doctor' },
  'medical': { category: 'Health', subcategory: 'Medical Services' },
};

/**
 * Type-specific default categories when no category match is found
 */
const defaultCategories: Record<string, CategoryInfo> = {
  'income': { category: 'Income', subcategory: 'Other Income' },
  'expense': { category: 'Miscellaneous', subcategory: 'Other Expenses' },
};

/**
 * Finds the appropriate category for a given vendor name
 * @param vendorName The vendor name to categorize
 * @param type The transaction type (income or expense)
 * @returns The category and subcategory for the vendor
 */
export function findCategoryForVendor(vendorName: string, type: string): CategoryInfo {
  // Check if we can match based on vendor name
  const normalizedVendor = vendorName.trim().toLowerCase();
  
  // Try to find a match in our vendor-category mapping
  for (const [keyword, categoryInfo] of Object.entries(vendorCategoryMap)) {
    if (normalizedVendor.includes(keyword)) {
      return categoryInfo;
    }
  }
  
  // Default category based on transaction type
  return defaultCategories[type] || defaultCategories['expense'];
}
