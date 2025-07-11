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
  for (const fmt of possibleFormats) {
    const parsed = parse(input.trim(), fmt, new Date());
    if (isValid(parsed)) {
      return format(parsed, 'yyyy-MM-dd'); // ✅ for <input type="date" />
    }
  }

  if (import.meta.env.MODE === 'development') {
    console.warn('[normalizeDate] Could not parse:', input);
  }
  return null;
}
