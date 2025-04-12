// src/services/MLTransactionParser.ts
import { loadNERModel } from '@/ml/ner';

export async function extractTransactionEntities(text: string) {
  const ner = await loadNERModel();
  const result = await ner(text);

  const entities = {
    amount: '',
    currency: '',
    type: '',
    vendor: '',
    account: '',
    date: '',
  };

  for (const ent of result) {
    const word = ent.word.toLowerCase();
    if (ent.entity_group === 'PER') entities.vendor += ` ${word}`;
    else if (word.includes('sar') || word.includes('egp') || word.includes('usd')) entities.currency = word.toUpperCase();
    else if (!isNaN(parseFloat(word.replace(',', '')))) entities.amount = word.replace(',', '');
    else if (word.includes('شراء') || word.includes('debited')) entities.type = 'expense';
    else if (word.includes('حوالة') || word.includes('credited')) entities.type = 'income';
  }

  return entities;
}
