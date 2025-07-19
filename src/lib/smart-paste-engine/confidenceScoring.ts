// confidenceScoring.ts

export function getFieldConfidence(parsed: any): number {
  const totalFields = ['amount', 'currency', 'date', 'type', 'category', 'subcategory', 'vendor', 'fromAccount'];
  const filledFields = totalFields.filter(field => {
    return parsed.directFields?.[field] || parsed.inferredFields?.[field] || parsed.defaultValues?.[field];
  });

  return filledFields.length / totalFields.length; // e.g., 7/8 = 0.875
}

export function getTemplateConfidence(templateMatched: number, totalTemplates: number): number {
  // templateMatched should be 1 if matched, 0 if not
  // If we have templates and this one matched, give high confidence
  if (totalTemplates === 0) return 0;
  return templateMatched; // Simply return 1 if matched, 0 if not
}

export function getKeywordConfidence(transaction: any, keywordBank: any[]): number {
  if (!transaction.vendor) return 0;

  let totalScore = 0;
  let sourceCount = 0;

  // Check keyword bank confidence
  const keyword = transaction.vendor.toLowerCase().split(' ')[0];
  const entry = keywordBank.find(k => k.keyword === keyword);
  if (entry && entry.mappings) {
    const fieldsMatched = entry.mappings.filter(m =>
      m.value === transaction[m.field]
    ).length;
    totalScore += fieldsMatched / entry.mappings.length;
    sourceCount++;
  }

  // Check user vendor mapping confidence
  const vendorMap = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
  const isUserMappedVendor = Object.values(vendorMap).includes(transaction.vendor);
  if (isUserMappedVendor) {
    // If vendor came from user mapping, give it high confidence
    totalScore += 0.8; // 80% confidence for user-mapped vendors
    sourceCount++;
  }

  return sourceCount > 0 ? totalScore / sourceCount : 0;
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
