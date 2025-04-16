
import { getTypeKeywordMap } from '@/utils/init-type-keywords';

interface MatchResult {
  type: string;
  confidence: number;
}

export function inferTypeByKeywords(messageText: string): string | null {
  const keywords = getTypeKeywordMap();
  const text = messageText.toLowerCase();
  
  const matches: Record<string, number> = {};
  
  // Count matches for each type
  Object.entries(keywords).forEach(([type, typeKeywords]) => {
    matches[type] = 0;
    
    typeKeywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        matches[type]++;
      }
    });
  });
  
  // Find type with highest match count
  let bestMatch: MatchResult | null = null;
  
  Object.entries(matches).forEach(([type, count]) => {
    if (count > 0 && (!bestMatch || count > bestMatch.confidence)) {
      bestMatch = {
        type,
        confidence: count
      };
    }
  });
  
  return bestMatch ? bestMatch.type : null;
}
