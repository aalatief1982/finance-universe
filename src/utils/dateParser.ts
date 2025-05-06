// utils/dateParser.ts

export function normalizeSmsDate(raw: string): string | undefined {
  const cleaned = raw.trim();
  const match = cleaned.match(
    /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})|(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})|(\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{2,4})|((Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{2,4})/
  );
  if (!match) return undefined;

  const dateStr = match[0];

  const formats = [
    'dd-MM-yy', 'dd-MM-yyyy', 'dd/MM/yy', 'dd/MM/yyyy', 'dd.MM.yyyy', 'dd.MM.yy',
    'yyyy-MM-dd', 'yyyy/MM/dd',
    'dd MMM yyyy', 'dd MMMM yyyy',
    'MMMM dd, yyyy', 'MMM dd, yyyy'
  ];

  for (const fmt of formats) {
    try {
      const parsed = parse(dateStr, fmt, new Date());
      if (!isNaN(parsed.getTime())) return parsed.toISOString();
    } catch {
      continue;
    }
  }

  return undefined;
}
