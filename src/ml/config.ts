/**
 * Configuration options for ML models
 */
export interface ModelConfig {
  // Model identifier from Hugging Face
  modelId: string;
  // Task type for the pipeline
  task: 'token-classification' | 'text-classification' | 'feature-extraction';
  // Model options
  options?: {
    // Use WebGPU acceleration if available
    device?: 'cpu' | 'webgpu';
    // Cache model locally
    cache?: boolean;
    // Other custom options
    [key: string]: any;
  };
}

/**
 * NER (Named Entity Recognition) model configurations
 */
export const NER_MODELS = {
  // Standard NER model - balance of size and accuracy
  DEFAULT: {
    modelId: 'Xenova/distilbert-base-multilingual-cased-ner-hrl',
    task: 'token-classification',
    options: {
      // Note: The 'quantized' option was previously used but is not supported in the
      // newer @huggingface/transformers package. Quantization reduces model size and
      // inference time at the cost of some accuracy.
      //
      // We now rely on the pre-quantized models from HuggingFace hub
      cache: true
    }
  } as ModelConfig,
  
  // Lightweight NER model - faster but less accurate
  LIGHTWEIGHT: {
    modelId: 'Xenova/bert-base-NER-uncased',
    task: 'token-classification',
    options: {
      cache: true
    }
  } as ModelConfig,
  
  // High accuracy NER model - slower but more accurate
  HIGH_ACCURACY: {
    modelId: 'Xenova/bert-large-cased-finetuned-conll03-english',
    task: 'token-classification',
    options: {
      device: 'webgpu',
      cache: true
    }
  } as ModelConfig
};

/**
 * Get the appropriate NER model configuration based on device capabilities
 * and performance requirements
 */
export function getNERModelConfig(preferHighAccuracy = false, preferLightweight = false): ModelConfig {
  // Check if WebGPU is available
  const hasWebGPU = typeof navigator !== 'undefined' && 
                    'gpu' in navigator;
  
  // Choose the model based on preferences
  if (preferHighAccuracy && hasWebGPU) {
    return NER_MODELS.HIGH_ACCURACY;
  } else if (preferLightweight || (typeof window !== 'undefined' && window.navigator.userAgent.includes('Mobile'))) {
    return NER_MODELS.LIGHTWEIGHT;
  }
  
  // Default model
  return NER_MODELS.DEFAULT;
}
