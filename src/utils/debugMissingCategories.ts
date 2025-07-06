// utils/debugMissingCategories.ts
export function logTransactionsMissingCategory(transactions: any[]) {
  console.group(`[Validation] Scanning ${transactions.length} transactions for missing category/subcategory...`);

  let missingCategoryCount = 0;
  transactions.forEach((txn, index) => {
    const { type, category, subcategory, rawMessage } = txn;
    if (!category || category === 'undefined') {
      if (process.env.NODE_ENV === 'development') console.warn(`❌ txn[${index}] is missing category:`, { type, subcategory, rawMessage });
      missingCategoryCount++;
    } else if (!subcategory || subcategory === 'undefined' || subcategory === 'none') {
      if (process.env.NODE_ENV === 'development') console.warn(`⚠️ txn[${index}] is missing subcategory:`, { category, rawMessage });
    }
  });

  if (process.env.NODE_ENV === 'development') console.log(`✅ Finished. ${missingCategoryCount} transactions missing category.`);
  console.groupEnd();
}
