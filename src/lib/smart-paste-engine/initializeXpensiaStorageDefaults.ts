import { safeStorage } from "@/utils/safe-storage";
import { TransactionType } from '@/types/transaction';
import vendorFallbackData from '../../data/ksa_all_vendors_clean_final.json';
import { saveVendorFallbacks } from './vendorFallbackUtils';
import { checkForVendorUpdates, getVendorData } from '@/services/VendorSyncService';



	  export const CATEGORY_HIERARCHY = [
  {
    id: 'bills', name: 'Bills', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'electricity', name: 'Electricity' },
      { id: 'gas', name: 'Gas' },
      { id: 'internet', name: 'Internet' },
      { id: 'mobile', name: 'Mobile' },
      { id: 'tv-subscription', name: 'TV Subscription' },
      { id: 'telecom', name: 'Telecom' },
      { id: 'utilities', name: 'Utilities' },
      { id: 'waste-management', name: 'Waste Management' },
      { id: 'government', name: 'Government' },
      { id: 'water', name: 'Water' },
      { id: 'cloud', name: 'Cloud' },
    ]
  },
  {
    id: 'education', name: 'Education', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'books-and-materials', name: 'Books & Materials' },
      { id: 'course', name: 'Course' },
      { id: 'online-courses', name: 'Online Courses' },
      { id: 'school', name: 'School' },
      { id: 'university', name: 'University' },
      { id: 'workshops', name: 'Workshops' },
    ]
  },
  {
    id: 'entertainment', name: 'Entertainment', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'cinema', name: 'Cinema' },
      { id: 'events-and-activities', name: 'Events & Activities' },
      { id: 'gaming', name: 'Gaming' },
      { id: 'music-and-podcasts', name: 'Music & Podcasts' },
      { id: 'streaming-services', name: 'Streaming Services' },
      { id: 'subscription', name: 'Subscription' },
    ]
  },
  {
    id: 'food', name: 'Food', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'bakery', name: 'Bakery' },
      { id: 'café', name: 'Café' },
      { id: 'catering', name: 'Catering' },
      { id: 'dining', name: 'Dining' },
      { id: 'dining-out', name: 'Dining Out' },
      { id: 'fast-food', name: 'Fast Food' },
      { id: 'groceries', name: 'Groceries' },
      { id: 'meal-subscription', name: 'Meal Subscription' },
      { id: 'snacks-and-beverages', name: 'Snacks & Beverages' },
      { id: 'sweet', name: 'Sweet' },
	    { id: 'delivery-apps', name: 'Delivery Apps' },
    ]
  },
  {
    id: 'gifts-&-donations', name: 'Gifts & Donations', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'charity', name: 'Charity' },
      { id: 'gifts', name: 'Gifts' },
      { id: 'tips', name: 'Tips' },
      { id: 'sadakah', name: 'Sadakah' },
      { id: 'zakat', name: 'Zakat' },
    ]
  },
  {
    id: 'health', name: 'Health', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'clinic', name: 'Clinic' },
      { id: 'dental', name: 'Dental' },
      { id: 'doctor-visits', name: 'Doctor Visits' },
      { id: 'health-insurance', name: 'Health Insurance' },
      { id: 'hospital', name: 'Hospital' },
      { id: 'optical', name: 'Optical' },
      { id: 'pharmacy', name: 'Pharmacy' },
    ]
  },
  {
    id: 'housing', name: 'Housing', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'furniture', name: 'Furniture' },
      { id: 'home-insurance', name: 'Home Insurance' },
      { id: 'maintenance', name: 'Maintenance' },
      { id: 'property-tax', name: 'Property Tax' },
      { id: 'real-estate', name: 'Real Estate' },
      { id: 'rent', name: 'Rent' },
      { id: 'installment', name: 'Installment' },
      { id: 'utilities', name: 'Utilities' },
    ]
  },
  {
    id: 'kids', name: 'Kids', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'babysitting', name: 'Babysitting' },
      { id: 'clothes', name: 'Clothes' },
      { id: 'school-supplies', name: 'School Supplies' },
      { id: 'toys', name: 'Toys' },
    ]
  },
  {
    id: 'personal-care', name: 'Personal Care', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'cosmetics', name: 'Cosmetics' },
      { id: 'fitness-and-gym', name: 'Fitness & Gym' },
      { id: 'salon-and-spa', name: 'Salon & Spa' },
      { id: 'skincare', name: 'Skincare' },
      { id: 'barber', name: 'Barber' },
      { id: 'swimming', name: 'Swimming' },
      { id: 'tennis', name: 'Tennis' },
    ]
  },
  {
    id: 'shopping', name: 'Shopping', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'books-and-stationery', name: 'Books & Stationery' },
      { id: 'clothing', name: 'Clothing' },
      { id: 'electronics', name: 'Electronics' },
      { id: 'footwear', name: 'Footwear' },
      { id: 'furniture', name: 'Furniture' },
      { id: 'grocery', name: 'Grocery' },
      { id: 'home-goods', name: 'Home Goods' },
      { id: 'malls', name: 'Malls' },
      { id: 'pet-supplies', name: 'Pet Supplies' },
    ]
  },
  {
    id: 'transportation', name: 'Transportation', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'car-loan', name: 'Car Loan' },
      { id: 'car-maintenance', name: 'Car Maintenance' },
      { id: 'fuel', name: 'Fuel' },
      { id: 'parking-fees', name: 'Parking Fees' },
      { id: 'public-transport', name: 'Public Transport' },
      { id: 'apps', name: 'Apps' },
      { id: 'taxi', name: 'Taxi' },
      { id: 'car-rental', name: 'Car Rental' },
      { id: 'metro', name: 'Metro' },
    ]
  },
  {
      id: 'other', name: 'Other', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'misc', name: 'Miscellaneous' }
    ]
  },
  {
    id: 'travel', name: 'Travel', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'car-rental', name: 'Car Rental' },
      { id: 'flights', name: 'Flights' },
      { id: 'hotels', name: 'Hotels' },
      { id: 'local-travel', name: 'Local Travel' },
      { id: 'travel-agencies', name: 'Travel Agencies' },
      { id: 'travel-insurance', name: 'Travel Insurance' },
      { id: 'visa-fees', name: 'Visa Fees' },
    ]
  },
  {
    id: 'services', name: 'Services', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'electricity', name: 'Electricity' },
      { id: 'telecom', name: 'Telecom' },
      { id: 'water', name: 'Water' },
      { id: 'laundry', name: 'Laundry' },
      { id: 'subscription', name: 'Subscription' },
    ]
  },
  {
    id: 'earnings', name: 'Earnings', type: 'income' as TransactionType,
    subcategories: [
      { id: 'bonus', name: 'Bonus' },
      { id: 'benefits', name: 'Benefits' },
      { id: 'dividends', name: 'Dividends' },
      { id: 'freelance', name: 'Freelance' },
      { id: 'investment', name: 'Investment' },
      { id: 'pension', name: 'Pension' },
      { id: 'refunds', name: 'Refunds' },
      { id: 'rental-income', name: 'Rental Income' },
      { id: 'salary', name: 'Salary' },
      { id: 'scholarship', name: 'Scholarship' },
    ]
  },
  {
    id: 'transfer', name: 'Transfer', type: 'transfer' as TransactionType,
    subcategories: [
      { id: 'bank-transfer', name: 'Bank Transfer' },
      { id: 'credit-card-payment', name: 'Credit Card Payment' },
      { id: 'family-support', name: 'Family Support' },
      { id: 'from-savings', name: 'From Savings' },
      { id: 'international-bank', name: 'International Bank' },
      { id: 'local-bank', name: 'Local Bank' },
      { id: 'money-transfer', name: 'Money Transfer' },
      { id: 'to-savings', name: 'To Savings' },
    ]
  },
];
  


export async function initializeXpensiaStorageDefaults() {
  // Ensure structure templates store exists
  if (!safeStorage.getItem('xpensia_structure_templates')) {
    safeStorage.setItem('xpensia_structure_templates', JSON.stringify([]));
    if (import.meta.env.MODE === 'development') {
      console.log('[Init] xpensia_structure_templates initialized');
    }
  }

  // Ensure vendor map store exists
  if (!safeStorage.getItem('xpensia_vendor_map')) {
    safeStorage.setItem('xpensia_vendor_map', JSON.stringify({}));
    if (import.meta.env.MODE === 'development') {
      console.log('[Init] xpensia_vendor_map initialized');
    }
  }

  // Check for vendor updates before initializing fallback data
  await checkForVendorUpdates();
  
  // Ensure vendor fallback data exists
  if (!safeStorage.getItem('xpensia_vendor_fallbacks')) {
    // Use updated data if available, otherwise fallback to imported data
    const updatedData = getVendorData();
    const dataToUse = updatedData || ((vendorFallbackData as any).default ?? vendorFallbackData);
    
    saveVendorFallbacks(dataToUse);
    if (import.meta.env.MODE === 'development') {
      console.log('[Init] xpensia_vendor_fallbacks initialized');
    }
  }

  // Ensure type keyword bank exists
  if (!safeStorage.getItem('xpensia_type_keywords')) {
    safeStorage.setItem('xpensia_type_keywords', JSON.stringify([
      { "keyword": "purchase", "type": "expense" },
      { "keyword": "pos", "type": "expense" },
      { "keyword": "mada", "type": "expense" },
      { "keyword": "spent", "type": "expense" },
      { "keyword": "paid", "type": "expense" },
      { "keyword": "atm withdrawal", "type": "expense" },
      { "keyword": "fuel", "type": "expense" },
      { "keyword": "food", "type": "expense" },
      { "keyword": "market", "type": "expense" },
      { "keyword": "شراء", "type": "expense" },
      { "keyword": "خصم", "type": "expense" },
      { "keyword": "بطاقة", "type": "expense" },
	  { "keyword": "سداد", "type": "expense" },
	  { "keyword": "حوالة صادرة", "type": "income" },

      { "keyword": "salary", "type": "income" },
      { "keyword": "deposit", "type": "income" },
      { "keyword": "credited", "type": "income" },
      { "keyword": "received", "type": "income" },
      { "keyword": "bonus", "type": "income" },
      { "keyword": "commission", "type": "income" },
      { "keyword": "incentive", "type": "income" },
      { "keyword": "حوالة واردة", "type": "income" },
      { "keyword": "دفعة", "type": "income" },
	  { "keyword": "راتب", "type": "income" },

      { "keyword": "transfer", "type": "transfer" },
      { "keyword": "sent", "type": "transfer" },
      { "keyword": "received from", "type": "transfer" },
      { "keyword": "sent to", "type": "transfer" },
      { "keyword": "تحويل", "type": "transfer" },
      { "keyword": "نقل", "type": "transfer" },
      { "keyword": "ارسال", "type": "transfer" },
      { "keyword": "bank to bank", "type": "transfer" },
      { "keyword": "wallet", "type": "transfer" },
      { "keyword": "iban", "type": "transfer" },
	  { "keyword": "سحب", "type": "transfer" }
    ]));
    if (import.meta.env.MODE === 'development') {
      console.log('[Init] xpensia_type_keywords initialized');
    }
  }
  

   // Ensure type keyword bank exists
if (!safeStorage.getItem('xpensia_category_hierarchy')) {
  safeStorage.setItem('xpensia_category_hierarchy', JSON.stringify(CATEGORY_HIERARCHY));
}
  
  
}
