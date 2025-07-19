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
  let totalScore = 0;
  let sourceCount = 0;

  // Check keyword bank confidence for category/subcategory
  if (transaction.vendor) {
    const keyword = transaction.vendor.toLowerCase().split(' ')[0];
    const entry = keywordBank.find(k => k.keyword === keyword);
    if (entry && entry.mappings) {
      const fieldsMatched = entry.mappings.filter(m =>
        m.value === transaction[m.field]
      ).length;
      if (fieldsMatched > 0) {
        totalScore += fieldsMatched / entry.mappings.length;
        sourceCount++;
      }
    }
  }

  // Check xpensia_vendor_map confidence
  const vendorMap = JSON.parse(localStorage.getItem('xpensia_vendor_map') || '{}');
  if (transaction.vendor) {
    const isUserMappedVendor = Object.values(vendorMap).includes(transaction.vendor);
    if (isUserMappedVendor) {
      totalScore += 0.8; // 80% confidence for user-mapped vendors
      sourceCount++;
    }
  }

  // Check xpensia_keyword_bank for category/subcategory derivation
  if (transaction.category || transaction.subcategory) {
    const hasKeywordBankMatch = keywordBank.some(entry => 
      entry.mappings.some(mapping => 
        (mapping.field === 'category' && mapping.value === transaction.category) ||
        (mapping.field === 'subcategory' && mapping.value === transaction.subcategory)
      )
    );
    if (hasKeywordBankMatch) {
      totalScore += 0.7; // 70% confidence for keyword bank category/subcategory matches
      sourceCount++;
    }
  }

  // Check xpensia_fromaccount_map confidence
  const fromAccountMap = JSON.parse(localStorage.getItem('xpensia_fromaccount_map') || '{}');
  if (transaction.fromAccount) {
    const isUserMappedFromAccount = Object.values(fromAccountMap).includes(transaction.fromAccount);
    if (isUserMappedFromAccount) {
      totalScore += 0.8; // 80% confidence for user-mapped fromAccount
      sourceCount++;
    }
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
