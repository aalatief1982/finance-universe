export interface SenderCategoryRule {
  category: string;
  subcategory: string;
}

const KEY = 'xpensia_sender_category_rules';

export function loadSenderCategoryRules(): Record<string, SenderCategoryRule> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (err) {
    console.error('[SenderCategoryRules] Failed to load rules', err);
    return {};
  }
}

export function saveSenderCategoryRules(rules: Record<string, SenderCategoryRule>): void {
  localStorage.setItem(KEY, JSON.stringify(rules));
}

export function learnVendorCategoryRule(sender: string, category: string, subcategory: string): void {
  if (!sender) return;
  const rules = loadSenderCategoryRules();
  rules[sender] = { category, subcategory };
  saveSenderCategoryRules(rules);
}
