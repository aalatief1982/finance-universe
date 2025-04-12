
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { MatchResult, PositionedToken } from '@/types/learning';

/**
 * Helper function to get token text from a PositionedToken or string
 */
const getTokenText = (token: string | PositionedToken): string => {
  if (typeof token === 'string') return token;
  return token.token;
};

/**
 * Helper function to check if a token is in the array
 */
const isTokenInArray = (token: string | PositionedToken, array: string[]): boolean => {
  const tokenText = getTokenText(token);
  return array.includes(tokenText);
};

/**
 * Hook for handling matching operations
 */
const useMatchOperations = (
  message: string, 
  senderHint: string, 
  messageTokens: string[],
  isLabelingMode: boolean,
  tokenLabels: Record<string, string>
) => {
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const { toast } = useToast();
  const { findBestMatch } = useLearningEngine();

  // Calculate confidence breakdown details
  const confidenceBreakdown = useMemo(() => {
    if (isLabelingMode) {
      // Create a field map from the manual labels
      const labelFieldMap: Record<string, string[]> = {
        amount: [],
        currency: [],
        vendor: [],
        account: [],
        type: [],
        date: [],
        title: []
      };
      
      // Group tokens by their label
      Object.entries(tokenLabels || {}).forEach(([token, label]) => {
        if (label && label !== 'unlabeled' && label !== 'ignore' && labelFieldMap[label]) {
          labelFieldMap[label].push(token);
        }
      });
      
      const totalFields = Object.keys(labelFieldMap).filter(
        key => labelFieldMap[key].length > 0
      ).length;
      
      // Total tokens with meaningful labels
      const labeledTokenCount = Object.values(tokenLabels || {})
        .filter(label => label && label !== 'unlabeled' && label !== 'ignore')
        .length;
      
      // Estimate sender hint bonus (simplified calculation)
      const senderBonus = senderHint ? 0.1 : 0;
        
      return {
        matchedFields: totalFields,
        totalFields: Object.keys(labelFieldMap).length,
        tokenOverlapCount: labeledTokenCount,
        senderBonus,
        calculatedScore: (totalFields ? totalFields / Object.keys(labelFieldMap).length : 0) + senderBonus
      };
    }
    
    if (!matchResult?.entry) return null;
    
    const fieldMap = matchResult.entry.fieldTokenMap;
    const totalFields = Object.keys(fieldMap).length;
    
    // Count fields with at least one matching token
    let matchedFields = 0;
    let tokenOverlapCount = 0;
    
    Object.entries(fieldMap).forEach(([_, tokens]) => {
      if (!tokens || !Array.isArray(tokens)) return;
      
      // Check if any token in this field matches with messageTokens
      const hasMatch = tokens.some(token => isTokenInArray(token, messageTokens));
      
      if (hasMatch) matchedFields++;
      
      // Count individual token matches
      tokens.forEach(token => {
        if (isTokenInArray(token, messageTokens)) {
          tokenOverlapCount++;
        }
      });
    });
    
    // Estimate sender hint bonus (simplified calculation)
    const senderBonus = 
      senderHint && 
      matchResult.entry.senderHint?.toLowerCase().includes(senderHint.toLowerCase())
        ? 0.1
        : 0;
        
    return {
      matchedFields,
      totalFields,
      tokenOverlapCount,
      senderBonus,
      calculatedScore: (totalFields ? matchedFields / totalFields : 0) + senderBonus
    };
  }, [matchResult, messageTokens, senderHint, isLabelingMode, tokenLabels]);

  const findBestMatchHandler = () => {
    if (!message) {
      toast({
        title: "Message required",
        description: "Please enter a message to test matching",
        variant: "destructive"
      });
      return;
    }

    const result = findBestMatch(message, senderHint);
    setMatchResult(result);
  };

  const getTokenFieldMatch = (token: string) => {
    if (!matchResult?.entry?.fieldTokenMap) return null;
    
    const fieldMap = matchResult.entry.fieldTokenMap;
    for (const [field, tokens] of Object.entries(fieldMap)) {
      if (!tokens || !Array.isArray(tokens)) continue;
      
      // Check if this token is in the field's tokens
      for (const fieldToken of tokens) {
        if (getTokenText(fieldToken) === token) {
          return field;
        }
      }
    }
    return null;
  };

  return {
    matchResult,
    setMatchResult,
    confidenceBreakdown,
    findBestMatchHandler,
    getTokenFieldMatch
  };
};

export default useMatchOperations;
