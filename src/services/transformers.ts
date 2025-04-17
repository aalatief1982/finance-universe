
/**
 * This file provides machine learning inference fallbacks for transaction data.
 * It's used when the regular extraction methods fail to provide complete data.
 */

interface InferenceResult {
  type?: string;
  category?: string;
  subcategory?: string;
  vendor?: string;
  confidence?: number;
  [key: string]: any;
}

/**
 * Fallback ML inference function for extracting transaction data
 * Uses simple keyword-based rules when ML is not available
 * 
 * @param rawMessage The raw message text to analyze
 * @returns A result object with inferred fields
 */
export const fallbackMLInference = (rawMessage: string): InferenceResult => {
  console.log("[transformers] Using fallback ML inference for:", rawMessage.substring(0, 30) + "...");
  
  const result: InferenceResult = {
    confidence: 0.6
  };
  
  // Simple keyword-based type detection
  if (/شراء|purchase|debit|spent|charge|payment|pay/i.test(rawMessage.toLowerCase())) {
    result.type = "expense";
  } else if (/deposit|credit|received|salary|income|راتب|ايداع/i.test(rawMessage.toLowerCase())) {
    result.type = "income";
  } else if (/transfer|تحويل|moved/i.test(rawMessage.toLowerCase())) {
    result.type = "transfer";
  }
  
  // Simple category inference
  if (/restaurant|food|coffee|cafe|مطعم|كافيه/i.test(rawMessage.toLowerCase())) {
    result.category = "Food & Dining";
  } else if (/market|grocery|supermarket|بقالة|سوق/i.test(rawMessage.toLowerCase())) {
    result.category = "Shopping";
    result.subcategory = "Grocery";
  } else if (/taxi|uber|careem|كريم|اوبر/i.test(rawMessage.toLowerCase())) {
    result.category = "Transportation";
  } else if (/salary|راتب/i.test(rawMessage.toLowerCase())) {
    result.category = "Income";
    result.subcategory = "Salary";
  }
  
  // Vendor extraction (simple)
  const vendorMatch = rawMessage.match(/(?:at|from|to|لدى|من|الى)\s+([A-Za-z\s&]+)/i);
  if (vendorMatch && vendorMatch[1]) {
    result.vendor = vendorMatch[1].trim();
  }
  
  console.log("[transformers] Inference result:", result);
  return result;
};
