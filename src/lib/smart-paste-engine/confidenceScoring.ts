// confidenceScoring.ts

export function getFieldConfidence(parsed: any): number {
  const totalFields = ['amount', 'currency', 'date', 'type', 'category', 'subcategory', 'vendor', 'fromAccount'];
  const filledFields = totalFields.filter(field => {
    return parsed.directFields?.[field] || parsed.inferredFields?.[field] || parsed.defaultValues?.[field];
  });

  return filledFields.length / totalFields.length; // e.g., 7/8 = 0.875
}

export function getTemplateConfidence(matchedCount: number, totalTemplates: number): number {
  if (totalTemplates === 0) return 0;
  return matchedCount / totalTemplates;
}

export function getKeywordConfidence(transaction: any, keywordBank: any[]): number {
  if (!transaction.vendor) return 0;

  const keyword = transaction.vendor.toLowerCase().split(' ')[0];
  const entry = keywordBank.find(k => k.keyword === keyword);
  if (!entry || !entry.mappings) return 0;

  const fieldsMatched = entry.mappings.filter(m =>
    m.value === transaction[m.field]
  ).length;

  return fieldsMatched / entry.mappings.length;
}

export function computeOverallConfidence(
  fieldScore: number,
  templateScore: number,
  keywordScore: number
): number {
  // You can weight this however you like
  return (
    fieldScore * 0.5 +  // 50%
    templateScore * 0.3 + // 30%
    keywordScore * 0.2    // 20%
  );
}
