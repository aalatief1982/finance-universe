export interface ClassificationResult {
  amount?: string;
  currency?: string;
  vendor?: string;
  type?: string;
  confidence?: number;
  [key: string]: any;
}

export async function classifyText(text: string): Promise<ClassificationResult> {
  const result: ClassificationResult = {};

  const amountMatch = text.match(/(\d+[.,]\d+|\d+)/);
  if (amountMatch) {
    result.amount = amountMatch[0].replace(/,/g, '');
  }

  const currencyMatch = text.match(/\b(SAR|USD|AED|EUR)\b/i);
  if (currencyMatch) {
    result.currency = currencyMatch[0].toUpperCase();
  }

  const vendorMatch = text.match(/at\s+(\w+)/i);
  if (vendorMatch) {
    result.vendor = vendorMatch[1];
  }

  if (/credit/i.test(text)) {
    result.type = 'income';
  } else if (/debit|purchase|spent/i.test(text)) {
    result.type = 'expense';
  }

  result.confidence = 0.5;
  return result;
}
