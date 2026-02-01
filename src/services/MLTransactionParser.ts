/**
 * @file MLTransactionParser.ts
 * @description Regex-based transaction entity extraction (ML removed for APK size).
 *
 * @module services/MLTransactionParser
 *
 * @responsibilities
 * 1. Extract amount, currency, vendor, date, and type from raw text
 * 2. Normalize currency codes and numeric formats
 * 3. Provide lightweight alternative to ML parsing
 *
 * @review-tags
 * - @risk: regex coverage across languages
 * - @data-quality: false positives in vendor/type detection
 *
 * @review-checklist
 * - [ ] Amount parsing strips commas correctly
 * - [ ] Currency normalization covers Arabic tokens
 * - [ ] Type inference uses keyword lists
 */


/**
 * Extract transaction entities from text using regex patterns.
 * This replaces the heavy ML-based extraction to reduce APK size by ~50MB.
 */
export async function extractTransactionEntities(text: string, _useHighAccuracy = false) {
  const entities = {
    amount: '',
    currency: '',
    type: '',
    vendor: '',
    account: '',
    date: '',
  };

  try {
    const normalizedText = text.toLowerCase();

    // Extract amount - look for numbers with optional decimal/comma
    const amountPatterns = [
      /(?:sar|egp|usd|aed|kwd|bhd|omr|qar|jod|lbp|eur|gbp|inr)\s*[:\s]?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /([\d,]+(?:\.\d{1,2})?)\s*(?:sar|egp|usd|aed|kwd|bhd|omr|qar|jod|lbp|eur|gbp|inr)/i,
      /(?:amount|مبلغ|قيمة)[:\s]?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /(?:debited|credited|paid|received|purchase|شراء|حوالة)[:\s]?\s*([\d,]+(?:\.\d{1,2})?)/i,
      /([\d,]+(?:\.\d{1,2})?)/,
    ];

    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        entities.amount = match[1].replace(/,/g, '');
        break;
      }
    }

    // Extract currency
    const currencyPatterns = [
      /\b(SAR|EGP|USD|AED|KWD|BHD|OMR|QAR|JOD|LBP|EUR|GBP|INR)\b/i,
      /\b(sar|egp|usd|aed|kwd|bhd|omr|qar|jod|lbp|eur|gbp|inr)\b/i,
      /\b(ريال|جنيه|دولار|درهم)\b/,
    ];

    for (const pattern of currencyPatterns) {
      const match = text.match(pattern);
      if (match) {
        const curr = match[1].toUpperCase();
        if (curr === 'ريال') entities.currency = 'SAR';
        else if (curr === 'جنيه') entities.currency = 'EGP';
        else if (curr === 'دولار') entities.currency = 'USD';
        else if (curr === 'درهم') entities.currency = 'AED';
        else entities.currency = curr;
        break;
      }
    }

    // Determine transaction type
    const expenseKeywords = ['شراء', 'debited', 'purchase', 'paid', 'payment', 'spent', 'withdrawn', 'سحب', 'خصم', 'مشتريات'];
    const incomeKeywords = ['حوالة', 'credited', 'received', 'salary', 'deposit', 'راتب', 'إيداع', 'تحويل', 'استلام'];

    if (expenseKeywords.some(kw => normalizedText.includes(kw))) {
      entities.type = 'expense';
    } else if (incomeKeywords.some(kw => normalizedText.includes(kw))) {
      entities.type = 'income';
    }

    // Extract vendor/merchant name
    const vendorPatterns = [
      /(?:at|from|to|merchant|vendor|عند|من|إلى)[:\s]+([A-Za-z\u0600-\u06FF\s]+?)(?:\s+(?:on|for|amount|SAR|EGP|USD|\d)|\.|$)/i,
      /(?:purchase at|payment to|paid to)[:\s]+([A-Za-z\u0600-\u06FF\s]+?)(?:\s+|\.|$)/i,
    ];

    for (const pattern of vendorPatterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        entities.vendor = match[1].trim();
        break;
      }
    }

    // Extract account info
    const accountPatterns = [
      /(?:account|a\/c|acc|حساب)[:\s#]*([*\dX]+)/i,
      /(?:card|بطاقة)[:\s#]*([*\dX]+)/i,
      /\*{3,}(\d{4})/,
    ];

    for (const pattern of accountPatterns) {
      const match = text.match(pattern);
      if (match) {
        entities.account = match[1] || match[0];
        break;
      }
    }

    // Extract date
    const datePatterns = [
      /(\d{1,2}[/-]\d{1,2}[/-]\d{2,4})/,
      /(\d{4}[/-]\d{1,2}[/-]\d{1,2})/,
      /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{2,4})/i,
    ];

    for (const pattern of datePatterns) {
      const match = text.match(pattern);
      if (match) {
        entities.date = match[1];
        break;
      }
    }

    return entities;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Transaction parsing error:', error);
    }
    return entities;
  }
}
