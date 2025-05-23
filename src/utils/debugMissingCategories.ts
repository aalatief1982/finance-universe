// utils/debugMissingCategories.ts
export function logTransactionsMissingCategory(transactions: any[]) {
  console.group(`[Validation] Scanning ${transactions.length} transactions for missing category/subcategory...`);

  let missingCategoryCount = 0;
  transactions.forEach((txn, index) => {
    const { type, category, subcategory, rawMessage } = txn;
    if (!category || category === 'undefined') {
      console.warn(`❌ txn[${index}] is missing category:`, { type, subcategory, rawMessage });
      missingCategoryCount++;
    } else if (!subcategory || subcategory === 'undefined' || subcategory === 'none') {
      console.warn(`⚠️ txn[${index}] is missing subcategory:`, { category, rawMessage });
    }
  });

  console.log(`✅ Finished. ${missingCategoryCount} transactions missing category.`);
  console.groupEnd();
}
