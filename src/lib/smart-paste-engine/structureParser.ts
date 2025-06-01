
import { Transaction } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';

interface ParsedField {
  key: string;
  value: string;
  confidence: number;
}

export const parseTransactionStructure = (message: string): { transaction: Transaction; confidence: number } => {
  const cleanMessage = message.trim().toLowerCase();
  
  // Initialize transaction with defaults
  const transaction: Transaction = {
    id: uuidv4(),
    title: 'Unknown Transaction',
    amount: 0,
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
    type: 'expense',
    source: 'smart-paste'
  };

  let totalConfidence = 0;
  const fields: ParsedField[] = [];

  // Parse amount
  const amountMatch = cleanMessage.match(/(?:sar|aed|usd|eur)?\s*(\d+(?:\.\d{2})?)/i);
  if (amountMatch) {
    const amount = parseFloat(amountMatch[1]);
    transaction.amount = -Math.abs(amount); // Default to expense
    fields.push({ key: 'amount', value: amount.toString(), confidence: 0.9 });
  }

  // Parse vendor/merchant
  const vendorPatterns = [
    /(?:at|from|to)\s+([a-z\s]{2,20})/i,
    /([a-z\s]{2,20})\s+(?:store|shop|market|restaurant)/i
  ];
  
  for (const pattern of vendorPatterns) {
    const match = cleanMessage.match(pattern);
    if (match) {
      const vendor = match[1].trim();
      transaction.title = vendor;
      transaction.vendor = vendor;
      fields.push({ key: 'vendor', value: vendor, confidence: 0.8 });
      break;
    }
  }

  // Parse date
  const dateMatch = cleanMessage.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (dateMatch) {
    const [, day, month, year] = dateMatch;
    const fullYear = year.length === 2 ? `20${year}` : year;
    const dateStr = `${fullYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    transaction.date = dateStr;
    fields.push({ key: 'date', value: dateStr, confidence: 0.9 });
  }

  // Calculate overall confidence
  totalConfidence = fields.reduce((sum, field) => sum + field.confidence, 0) / Math.max(fields.length, 1);

  return {
    transaction,
    confidence: Math.min(totalConfidence, 1.0)
  };
};
