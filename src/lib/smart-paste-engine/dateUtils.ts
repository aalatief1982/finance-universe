// dateUtils.ts
import { parse, isValid, format } from 'date-fns';

const possibleFormats = [
 'dd-MM-yy HH:mm',
  'dd-MM-yy',
  'd-M-yy HH:mm',
  'd-M-yy',
  'dd-MM-yyyy HH:mm',
  'dd-MM-yyyy',
  'yyyy-MM-dd',
  'yyyy/MM/dd',
  'd/M/yyyy',
  'd/M/yy',
  'dd/MM/yyyy',
  'dd/MM/yy',
  'dd MMM yyyy',
  'MMMM d yyyy',
  'MMM d yyyy',
  'MMMM d, yyyy',
  'MMM d, yyyy',
  'd MMM yyyy HH:mm',
  'MMMM d yyyy HH:mm',
  'yyyy-MM-dd HH:mm',
];

export function normalizeDate(input: string): string | null {
  const trimmed = input.trim();
  
  // Handle DD/MM/YY slash format manually FIRST (avoids date-fns misparse of 2-digit years)
  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2})$/);
  if (slashMatch) {
    const [, dd, mm, yy] = slashMatch;
    const fullYear = parseInt(yy, 10) < 50 ? `20${yy}` : `19${yy}`;
    return `${fullYear}-${mm.padStart(2, '0')}-${dd.padStart(2, '0')}`;
  }
  
  for (const fmt of possibleFormats) {
    const parsed = parse(trimmed, fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd'); // ✅ for <input type="date" />
    }
  }

  if (import.meta.env.MODE === 'development') {
    console.warn('[normalizeDate] Could not parse:', input);
  }
  return null;
}
