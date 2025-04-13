
// src/ml/ner.ts
import { pipeline } from '@huggingface/transformers';

let extractor: any = null;
let isLoading = false;
let loadError: Error | null = null;

export async function loadNERModel() {
  if (extractor) return extractor;
  
  // If already attempting to load, return a promise that will resolve when loading completes
  if (isLoading) {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(() => {
        if (extractor) {
          clearInterval(checkInterval);
          resolve(extractor);
        }
        if (loadError) {
          clearInterval(checkInterval);
          reject(loadError);
        }
      }, 500);
    });
  }

  isLoading = true;
  
  try {
    // Try to use a smaller, more readily available model
    extractor = await pipeline(
      'token-classification', 
      'Xenova/distilbert-base-multilingual-cased-ner-hrl',
      { quantized: true }
    );
    isLoading = false;
    console.log('NER model loaded successfully');
    return extractor;
  } catch (error) {
    console.error('Error loading NER model:', error);
    loadError = error as Error;
    isLoading = false;
    throw error;
  }
}

export function resetNERModel() {
  extractor = null;
  isLoading = false;
  loadError = null;
}

export function isNERModelReady() {
  return !!extractor;
}
