// src/ml/ner.ts
import { pipeline } from '@xenova/transformers';

let extractor: any = null;

export async function loadNERModel() {
  if (!extractor) {
    extractor = await pipeline('token-classification', 'Xenova/bert-base-multilingual-cased');
  }
  return extractor;
}
