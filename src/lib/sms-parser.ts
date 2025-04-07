
import { v4 as uuidv4 } from 'uuid';

// Mock SMS messages for testing
export interface MockSms {
  id: string;
  sender: string;
  message: string;
  date: Date;
}

export const getMockSmsMessages = (): MockSms[] => {
  return [
    {
      id: uuidv4(),
      sender: 'ALRAJHI',
      message: 'Purchase: SAR 120.50 at PANDA SUPERMARKET on 25/03/2023. Current balance: SAR 4,580.25',
      date: new Date(2023, 2, 25, 15, 30)
    },
    {
      id: uuidv4(),
      sender: 'SNB',
      message: 'Dear customer, your account has been debited with SAR 850.00 for UTILITY BILL payment. Ref: 784512369',
      date: new Date(2023, 2, 28, 9, 45)
    },
    {
      id: uuidv4(),
      sender: 'STCPAY',
      message: 'Payment confirmed: SAR 75.00 to JARIR BOOKSTORE. Transaction ID: STC7845126. Balance: SAR 245.50',
      date: new Date(2023, 3, 1, 14, 20)
    },
    {
      id: uuidv4(),
      sender: 'SAMBA',
      message: 'Your salary of SAR 12,500.00 has been credited to your account. Available balance: SAR 18,750.25',
      date: new Date(2023, 3, 2, 10, 0)
    },
    {
      id: uuidv4(),
      sender: 'CIB',
      message: 'ATM withdrawal: EGP 2,000.00 from ATM #12345. Fee: EGP 20.00. Available balance: EGP 8,450.00',
      date: new Date(2023, 3, 3, 16, 15)
    },
    {
      id: uuidv4(),
      sender: 'ALINMA',
      message: 'Transfer completed: SAR 1,500.00 to account ending 4567. Ref: 789456123. Available balance: SAR 7,850.00',
      date: new Date(2023, 3, 4, 11, 30)
    }
  ];
};

// Simplified SMS parser that extracts transaction details from SMS message
export const parseSmsMessage = (sender: string, message: string): {
  isTransaction: boolean;
  amount?: number;
  isExpense?: boolean;
  merchant?: string;
  date?: string;
  currency?: string;
  category?: string;
} => {
  const result = {
    isTransaction: false,
    amount: 0,
    isExpense: true,
    merchant: '',
    date: new Date().toISOString(),
    currency: 'SAR',
    category: 'Uncategorized'
  };
  
  // Check if it's a transaction message
  const hasTransactionKeywords = /purchase|payment|debit|credit|transfer|salary|withdraw/i.test(message);
  if (!hasTransactionKeywords) {
    return { isTransaction: false };
  }
  
  result.isTransaction = true;
  
  // Extract amount - look for currency followed by amount
  const amountMatch = message.match(/(SAR|EGP|USD|AED|QAR|KWD|BHD)\s?([0-9,]+\.[0-9]+|[0-9,]+)/i);
  if (amountMatch) {
    result.currency = amountMatch[1].toUpperCase();
    result.amount = parseFloat(amountMatch[2].replace(/,/g, ''));
  }
  
  // Determine if expense or income
  result.isExpense = /purchase|payment|debit|transfer|withdraw|paid/i.test(message);
  result.isExpense = !(/salary|credit|receive|received|income/i.test(message));
  
  // Extract merchant/recipient
  if (/at\s+([A-Z\s]+)\s+on/i.test(message)) {
    const merchantMatch = message.match(/at\s+([A-Z0-9\s]+)\s+on/i);
    if (merchantMatch) {
      result.merchant = merchantMatch[1].trim();
    }
  } else if (/to\s+([A-Z\s]+)/i.test(message)) {
    const merchantMatch = message.match(/to\s+([A-Z0-9\s]+)/i);
    if (merchantMatch) {
      result.merchant = merchantMatch[1].trim();
    }
  }
  
  // Extract date
  const dateMatch = message.match(/on\s+(\d{1,2}\/\d{1,2}\/\d{2,4})/i);
  if (dateMatch) {
    const dateParts = dateMatch[1].split('/');
    if (dateParts.length === 3) {
      const day = parseInt(dateParts[0]);
      const month = parseInt(dateParts[1]) - 1; // JS months are 0-indexed
      const year = parseInt(dateParts[2]) < 100 
        ? parseInt(dateParts[2]) + 2000 
        : parseInt(dateParts[2]);
      
      result.date = new Date(year, month, day).toISOString();
    }
  }
  
  // Simple category determination
  if (/supermarket|grocery|food|panda/i.test(message)) {
    result.category = 'Groceries';
  } else if (/restaurant|cafe|coffee|dining/i.test(message)) {
    result.category = 'Dining';
  } else if (/transport|uber|careem|taxi|fuel|gas/i.test(message)) {
    result.category = 'Transportation';
  } else if (/utility|bill|electricity|water|internet/i.test(message)) {
    result.category = 'Utilities';
  } else if (/salary/i.test(message)) {
    result.category = 'Salary';
  }
  
  return result;
};
