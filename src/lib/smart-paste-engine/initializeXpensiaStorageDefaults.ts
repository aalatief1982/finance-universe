export function initializeXpensiaStorageDefaults() {
  // Ensure structure templates store exists
  if (!localStorage.getItem('xpensia_structure_templates')) {
    localStorage.setItem('xpensia_structure_templates', JSON.stringify([]));
    console.log('[Init] xpensia_structure_templates initialized');
  }

  // Ensure vendor map store exists
  if (!localStorage.getItem('xpensia_vendor_map')) {
    localStorage.setItem('xpensia_vendor_map', JSON.stringify({}));
    console.log('[Init] xpensia_vendor_map initialized');
  }

  // Ensure type keyword bank exists
  if (!localStorage.getItem('xpensia_type_keywords')) {
    localStorage.setItem('xpensia_type_keywords', JSON.stringify([
      { "keyword": "purchase", "type": "expense" },
      { "keyword": "pos", "type": "expense" },
      { "keyword": "mada", "type": "expense" },
      { "keyword": "spent", "type": "expense" },
      { "keyword": "paid", "type": "expense" },
      { "keyword": "atm withdrawal", "type": "expense" },
      { "keyword": "fuel", "type": "expense" },
      { "keyword": "food", "type": "expense" },
      { "keyword": "market", "type": "expense" },
      { "keyword": "شراء", "type": "expense" },
      { "keyword": "خصم", "type": "expense" },
      { "keyword": "بطاقة", "type": "expense" },

      { "keyword": "salary", "type": "income" },
      { "keyword": "deposit", "type": "income" },
      { "keyword": "credited", "type": "income" },
      { "keyword": "received", "type": "income" },
      { "keyword": "bonus", "type": "income" },
      { "keyword": "commission", "type": "income" },
      { "keyword": "incentive", "type": "income" },
      { "keyword": "حوالة واردة", "type": "income" },
      { "keyword": "دفعة", "type": "income" },

      { "keyword": "transfer", "type": "transfer" },
      { "keyword": "sent", "type": "transfer" },
      { "keyword": "received from", "type": "transfer" },
      { "keyword": "sent to", "type": "transfer" },
      { "keyword": "تحويل", "type": "transfer" },
      { "keyword": "نقل", "type": "transfer" },
      { "keyword": "ارسال", "type": "transfer" },
      { "keyword": "bank to bank", "type": "transfer" },
      { "keyword": "wallet", "type": "transfer" },
      { "keyword": "iban", "type": "transfer" }
    ]));
    console.log('[Init] xpensia_type_keywords initialized');
  }
}
