
// src/services/MLTransactionParser.ts
import { loadNERModel, isNERModelReady } from '@/ml/ner';
import { getNERModelConfig } from '@/ml/config';
import { handleError } from '@/utils/error-utils';
import { ErrorType } from '@/types/error';

export async function extractTransactionEntities(text: string, useHighAccuracy = false) {
  // Default entity structure
  const entities = {
    amount: '',
    currency: '',
    type: '',
    vendor: '',  // We'll keep vendor property as is
    account: '',
    date: '',
  };

  try {
    // Get appropriate model config based on complexity of the text
    // For complex texts (longer), we might want higher accuracy
    const isComplexText = text.length > 150;
    const modelConfig = getNERModelConfig(useHighAccuracy || isComplexText);
    
    // Check if model is available
    if (!isNERModelReady()) {
      if (process.env.NODE_ENV === 'development') console.log('NER model not ready, trying to load...');
      await loadNERModel(modelConfig);
    }

    const ner = await loadNERModel(modelConfig);
    const result = await ner(text);

    // Process entity results
    for (const ent of result) {
      const word = ent.word.toLowerCase();
      if (ent.entity_group === 'PER' || ent.entity_group === 'ORG') entities.vendor += ` ${word}`;
      else if (word.includes('sar') || word.includes('egp') || word.includes('usd')) entities.currency = word.toUpperCase();
      else if (!isNaN(parseFloat(word.replace(',', '')))) entities.amount = word.replace(',', '');
      else if (word.includes('شراء') || word.includes('debited') || word.includes('purchase')) entities.type = 'expense';
      else if (word.includes('حوالة') || word.includes('credited') || word.includes('received')) entities.type = 'income';
    }

    return entities;
  } catch (error) {
    console.error('ML Transaction parsing error:', error);
    handleError({
      type: ErrorType.PARSING,
      message: 'Failed to process transaction with ML model. Using fallback instead.',
      details: { text },
      originalError: error,
      isSilent: true
    });
    
    // Return the empty entities object to allow fallback methods to work
    return entities;
  }
}
