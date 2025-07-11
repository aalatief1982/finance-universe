
import { pipeline } from '@huggingface/transformers';
import { ModelConfig, getNERModelConfig } from './config';

let extractor: any = null;
let isLoading = false;
let loadError: Error | null = null;
let currentConfig: ModelConfig | null = null;

export async function loadNERModel(config?: ModelConfig) {
  // Use provided config or get default
  const modelConfig = config || currentConfig || getNERModelConfig();
  
  // If model is already loaded with the same config, return it
  if (extractor && currentConfig && 
      currentConfig.modelId === modelConfig.modelId) {
    return extractor;
  }
  
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
  currentConfig = modelConfig;
  
  try {
    if (import.meta.env.MODE === 'development') {
      console.log(`Loading NER model: ${modelConfig.modelId}`);
    }
    
    // Load the model using the config
    extractor = await pipeline(
      modelConfig.task,
      modelConfig.modelId,
      modelConfig.options
    );
    
    isLoading = false;
    if (import.meta.env.MODE === 'development') {
      console.log('NER model loaded successfully');
    }
    return extractor;
  } catch (error) {
    if (import.meta.env.MODE === 'development') {
      console.error('Error loading NER model:', error);
    }
    loadError = error as Error;
    isLoading = false;
    throw error;
  }
}

export function resetNERModel() {
  extractor = null;
  isLoading = false;
  loadError = null;
  currentConfig = null;
}

export function isNERModelReady() {
  return !!extractor;
}

export function getCurrentModelConfig(): ModelConfig | null {
  return currentConfig;
}
