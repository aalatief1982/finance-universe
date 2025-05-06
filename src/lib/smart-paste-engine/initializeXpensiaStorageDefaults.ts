import { TransactionType } from '@/types/transaction';



  export const CATEGORY_HIERARCHY = [
  // Income
  {
    id: 'salary', name: 'Salary', type: 'income' as TransactionType,
    subcategories: [
      { id: 'main', name: 'Main Salary' },
      { id: 'overtime', name: 'Overtime' },
      { id: 'bonus', name: 'Bonus' },
      { id: 'allowance', name: 'Allowance' },
      { id: 'benefit', name: 'Benefit' },
    ]
  },
  {
    id: 'investment', name: 'Investment', type: 'income' as TransactionType,
    subcategories: [
      { id: 'stocks', name: 'Stocks' },
      { id: 'sukuk', name: 'Sukuk' },
      { id: 'dividends', name: 'Dividends' },
      { id: 'realestate', name: 'Real Estate' }
    ]
  },
  {
    id: 'freelance', name: 'Freelance & Side Jobs', type: 'income' as TransactionType,
    subcategories: [
      { id: 'consulting', name: 'Consulting' },
      { id: 'design', name: 'Design Projects' },
      { id: 'gig', name: 'Gig Work' }
    ]
  },
  {
    id: 'transfers', name: 'Transfers & Refunds', type: 'income' as TransactionType,
    subcategories: [
      { id: 'loan-return', name: 'Loan Return' },
      { id: 'wallet-topup', name: 'Wallet Top-Up' },
      { id: 'reimbursement', name: 'Reimbursement' }
    ]
  },

  // Expense
  {
    id: 'shopping', name: 'Shopping', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'grocery', name: 'Grocery' },
      { id: 'clothing', name: 'Clothing' },
      { id: 'appliances', name: 'Appliances' },
      { id: 'electronics', name: 'Electronics' },
      { id: 'online', name: 'Online Orders' },
      { id: 'misc', name: 'Misc' }
    ]
  },
  {
    id: 'car', name: 'Car & Transport', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'fuel', name: 'Fuel' },
      { id: 'maintenance', name: 'Maintenance' },
      { id: 'insurance', name: 'Insurance' },
      { id: 'parking', name: 'Parking' },
      { id: 'ride', name: 'Ride-Hailing (Uber)' }
    ]
  },
  {
    id: 'health', name: 'Health & Wellness', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'hospital', name: 'Hospital' },
      { id: 'pharmacy', name: 'Pharmacy' },
      { id: 'gym', name: 'Gym' },
      { id: 'therapy', name: 'Therapy' },
      { id: 'sports', name: 'Sports Fees' }
    ]
  },
  {
    id: 'education', name: 'Education', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'school', name: 'School' },
      { id: 'course', name: 'Online Course' },
      { id: 'books', name: 'Books & Materials' }
    ]
  },
  {
    id: 'bills', name: 'Bills & Utilities', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'electricity', name: 'Electricity' },
      { id: 'water', name: 'Water' },
      { id: 'internet', name: 'Internet' },
      { id: 'mobile', name: 'Mobile Plan' }
    ]
  },
  {
    id: 'entertainment', name: 'Entertainment', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'cinema', name: 'Cinema' },
      { id: 'subscriptions', name: 'Subscriptions (Netflix, etc.)' },
      { id: 'games', name: 'Games' }
    ]
  },
  {
    id: 'donation', name: 'Donations & Zakat', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'zakat', name: 'Zakat' },
      { id: 'sadaqah', name: 'Sadaqah' },
      { id: 'charity', name: 'Charity Org.' }
    ] 
  },
  {
    id: 'other', name: 'Other', type: 'expense' as TransactionType,
    subcategories: [
      { id: 'misc', name: 'Miscellaneous' },
      { id: 'gift', name: 'Gifts' },
      { id: 'travel', name: 'Travel & Hotels' }
    ]
  },

  // Transfer
  {
    id: 'bank-transfer', name: 'Bank Transfers', type: 'transfer' as TransactionType,
    subcategories: [
      { id: 'local', name: 'Local Bank' },
      { id: 'international', name: 'International Bank' }
    ]
  },
  {
    id: 'wallets', name: 'E-Wallets', type: 'transfer' as TransactionType,
    subcategories: [
      { id: 'stcpay', name: 'STC Pay' },
      { id: 'applepay', name: 'Apple Pay' },
      { id: 'mada', name: 'Mada Pay' }
    ]
  }
];
  


export function initializeXpensiaStorageDefaults() {
  // Ensure structure templates store exists
  if (!localStorage.getItem('xpensia_structure_templates')) {
    localStorage.setItem('xpensia_structure_templates', JSON.stringify([]));
    console.log('[Init] xpensia_structure_templates initialized');
  }

  // Ensure vendor map store exists
  if (!localStorage.getItem('xpensia_vendor_map')) {
    localStorage.setItem('xpensia_vendor_map', JSON.stringify({}));
    console.log('[Init] xpensia_vendor_map initialized');
  }

  // Ensure type keyword bank exists
  if (!localStorage.getItem('xpensia_type_keywords')) {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify([
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

      { "keyword": "salary", "type": "income" },
      { "keyword": "deposit", "type": "income" },
      { "keyword": "credited", "type": "income" },
      { "keyword": "received", "type": "income" },
      { "keyword": "bonus", "type": "income" },
      { "keyword": "commission", "type": "income" },
      { "keyword": "incentive", "type": "income" },
      { "keyword": "حوالة واردة", "type": "income" },
      { "keyword": "دفعة", "type": "income" },
	  { "keyword": "حوالة", "type": "income" },
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
    console.log('[Init] xpensia_type_keywords initialized');
  }
  

   // Ensure type keyword bank exists
if (!localStorage.getItem('xpensia_category_hierarchy')) {
  localStorage.setItem('xpensia_category_hierarchy', JSON.stringify(CATEGORY_HIERARCHY));
}
  
  
}
