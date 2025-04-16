// 📁 Path: src/data/suggestions.ts (🆕 New)

interface SuggestionEntry {
    type: string;
    category: string;
    updatedAt: string;
  }
  
  const vendorSuggestions: Record<string, SuggestionEntry> = {};
  
  export function getSuggestionForVendor(vendor: string): SuggestionEntry | null {
    return vendorSuggestions[vendor.toLowerCase()] || null;
  }
  
  export function saveSuggestion(vendor: string, outcome: { type: string; category: string }): void {
    const key = vendor.toLowerCase();
    vendorSuggestions[key] = {
      type: outcome.type,
      category: outcome.category,
      updatedAt: new Date().toISOString()
    };
  }
  
  export function listSuggestions(): Record<string, SuggestionEntry> {
    return vendorSuggestions;
  }
  
  export function clearSuggestions(): void {
    Object.keys(vendorSuggestions).forEach(k => delete vendorSuggestions[k]);
  }
  