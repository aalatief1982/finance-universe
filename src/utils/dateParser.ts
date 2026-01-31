/**
 * @file dateParser.ts
 * @description Normalizes SMS date strings to ISO format.
 *
 * @module utils/dateParser
 *
 * @responsibilities
 * 1. Extract date substrings from raw SMS text
 * 2. Parse multiple formats and return ISO UTC dates
 *
 * @dependencies
 * - date-fns: parse + validate helpers
 *
 * @review-tags
 * - @risk: ambiguous day/month ordering
 *
 * @review-checklist
 * - [ ] Two-digit years map to 19xx/20xx correctly
 * - [ ] UTC midnight used to avoid timezone drift
 */

// utils/dateParser.ts
import { parse, isValid } from 'date-fns';

export function normalizeSmsDate(raw: string): string | undefined {
  const cleaned = raw.trim();
  const match = cleaned.match(
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})|(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/
  );
  if (!match) return undefined;

  const dateStr = match[0];

  // Handle DD/MM/YY or DD-MM-YY with 2-digit year FIRST to avoid date-fns misparse
  const shortYearMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (shortYearMatch) {
    const [, dd, mm, yy] = shortYearMatch;
    const fullYear = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    // Return UTC midnight to avoid timezone drift
    return new Date(Date.UTC(parseInt(fullYear), parseInt(mm) - 1, parseInt(dd))).toISOString();
  }

  const formats = [
    'dd-MM-yyyy', 'dd/MM/yyyy', 'dd.MM.yyyy', 'dd.MM.yy',
    'yyyy-MM-dd', 'yyyy/MM/dd',
    'dd MMM yyyy', 'dd MMMM yyyy',
    'MMMM dd, yyyy', 'MMM dd, yyyy'
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(dateStr, fmt, new Date());
      if (isValid(parsed)) {
        // Return UTC midnight ISO to avoid timezone drift
        return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())).toISOString();
      }
    } catch {
      continue;
    }
  }

  return undefined;
}
