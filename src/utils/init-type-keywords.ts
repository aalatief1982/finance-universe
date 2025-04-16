
// 📁 Path: src/utils/init-type-keywords.ts

export const DEFAULT_TYPE_KEYWORDS = {
  expense: [
    "purchase", "pos", "mada", "spent", "paid", "atm withdrawal",
    "fuel", "food", "market", "شراء", "خصم", "بطاقة"
  ],
  income: [
    "salary", "deposit", "credited", "received", "bonus",
    "commission", "incentive", "حوالة واردة", "دفعة"
  ],
  transfer: [
    "transfer", "sent", "received", "sent to", "received from",
    "تحويل", "نقل", "ارسال", "bank to bank", "wallet", "iban"
  ]
};

export function initTypeKeywordDefaults(): void {
  const key = 'xpensia_type_keywords';
  const exists = localStorage.getItem(key);
  if (!exists) {
    localStorage.setItem(key, JSON.stringify(DEFAULT_TYPE_KEYWORDS));
    console.log('[Init] Type keyword mapping loaded into localStorage');
  }
}

export function getTypeKeywordMap(): Record<string, string[]> {
  const data = localStorage.getItem('xpensia_type_keywords');
  return data ? JSON.parse(data) : DEFAULT_TYPE_KEYWORDS;
}

// 📌 Ensure initialization is triggered on module load
declare global {
  interface Window { __xpensia_keyword_init?: boolean; }
}

if (typeof window !== 'undefined' && !window.__xpensia_keyword_init) {
  initTypeKeywordDefaults();
  window.__xpensia_keyword_init = true;
}
