// src/lib/smart-paste-engine/smsParser.ts

import { inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import { extractVendorName } from '@/lib/smart-paste-engine/suggestionEngine';
import { extractTemplateStructure } from '@/lib/smart-paste-engine/templateUtils';

export interface TransactionDraft {
  amount: number;
  currency: string;
  vendor: string;
  date: string;
  type: string;
  category: string;
  subcategory: string;
  description?: string;
}

// Helper regexes
const amountRegex = /(\d+[.,]\d{2})|\d+/g;
const dateRegex = /\d{4}-\d{2}-\d{2}/g;

function normalizeDate(value: string): string | null {
  try {
    // Match DD-MM-YY (e.g. 25-3-30)
    const dmyMatch = value.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);
    if (dmyMatch) {
      const [, dd, mm, yy] = dmyMatch;
      const year = parseInt(yy, 10);
      const fullYear = year < 50 ? 2000 + year : 1900 + year;
      const iso = new Date(`${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`).toISOString();
      return iso;
    }

    // Else fallback to default parser
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  } catch {
    return null;
  }
}


export function parseSmsMessage(message: string): TransactionDraft | null {
  if (!message) return null;

  let amount = 0;
  const currency = 'SAR';
  let vendor = 'Unknown Vendor';
  let date = new Date().toISOString();

  try {
    // 1. Try to extract amount
    const amounts = message.match(amountRegex);
    if (amounts && amounts.length > 0) {
      amount = parseFloat(amounts[0].replace(',', ''));
    }

    // 2. Try to extract date
    //const dates = message.match(dateRegex);
    //if (dates && dates.length > 0) {
    //  date = new Date(dates[0]).toISOString();
   // }
	const dates = message.match(dateRegex);
	if (dates && dates.length > 0) {
	  const normalized = normalizeDate(dates[0]);
	  if (normalized) date = normalized;
	  else if (import.meta.env.MODE === 'development') console.warn('[SmsParser] Invalid date format after normalization:', dates[0]);
	}


    // 3. Extract vendor name
	const extractedVendor = extractVendorName(message);
	if (extractedVendor) {
	  vendor = extractedVendor;
	} else if (/راتب|salary/i.test(message)) {
	  vendor = 'Company';
	}

    // 4. Infer category, subcategory, and type
    const inferred = inferIndirectFields(message, { vendor });

    const type = inferred.type || 'expense';

    let category = inferred.category || '';
    let subcategory = inferred.subcategory || '';
    
    if (!category && !subcategory && type === 'income') {
      category = 'Earnings';
      subcategory = 'Benefits';
      console.info('[SmsParser] Applied default category for income: Earnings > Benefits');
    } else {
      // safe fallback for other types
      category = category || 'Other';
      subcategory = subcategory || 'Miscellaneous';
    }
    

    const transaction: TransactionDraft = {
      amount,
      currency,
      vendor,
      date,
      type,
      category,
      subcategory,
      description: message,
    };

    if (import.meta.env.MODE === 'development') {
      // console.log('[SmsParser] Parsed transaction draft:', transaction);
    }

    return transaction;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('[SmsParser] Failed to parse SMS:', error);
    }
    return null;
  }
}
