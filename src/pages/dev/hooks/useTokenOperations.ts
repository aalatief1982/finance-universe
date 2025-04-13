
import { useState, useEffect } from 'react';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { PositionedToken } from '@/types/learning';

/**
 * Hook for handling token operations
 */
const useTokenOperations = (message: string, isLabelingMode: boolean) => {
  const [tokenLabels, setTokenLabels] = useState<Record<string, string>>({});
  const [manualFieldTokenMap, setManualFieldTokenMap] = useState<Record<string, string[]>>({
    amount: [],
    currency: [],
    vendor: [],
    account: [],
    type: [],
    date: [],
    title: []
  });
  const [labelingHistory, setLabelingHistory] = useState<Array<Record<string, string>>>([]);
  
  const {
    tokenize,
    extractAmountTokens,
    extractCurrencyTokens,
    extractVendorTokens,
    extractAccountTokens,
  } = useLearningEngine();

  // Generate tokens from the current message
  const messageTokens = message ? tokenize(message) : [];
  
  useEffect(() => {
    if (message && !isLabelingMode) {
      // These functions now return strings with proper typing
      const tokenMap = {
        amount: extractAmountTokens(message).map(pt => pt.token),
        currency: extractCurrencyTokens(message).map(pt => pt.token),
        vendor: extractVendorTokens(message).map(pt => pt.token),
        account: extractAccountTokens(message).map(pt => pt.token),
        type: [],
        date: [],
        title: []
      };
      setManualFieldTokenMap(tokenMap);
      
      // Create initial token labels
      const initialLabels: Record<string, string> = {};
      if (messageTokens) {
        messageTokens.forEach(token => {
          for (const [field, tokens] of Object.entries(tokenMap)) {
            // Type check to ensure tokens is an array before using includes
            if (Array.isArray(tokens) && tokens.includes(token)) {
              initialLabels[token] = field;
              break;
            }
          }
          if (!initialLabels[token]) {
            initialLabels[token] = 'unlabeled';
          }
        });
      }
      setTokenLabels(initialLabels);
    }
  }, [message, messageTokens, isLabelingMode, extractAmountTokens, extractCurrencyTokens, extractVendorTokens, extractAccountTokens]);

  const getTokenFieldMatch = (token: string, fieldTokenMap: Record<string, string[]>) => {
    if (!fieldTokenMap) return null;
    
    for (const [field, tokens] of Object.entries(fieldTokenMap)) {
      // Add type check here to ensure tokens is an array
      if (Array.isArray(tokens) && tokens.includes(token)) {
        return field;
      }
    }
    return null;
  };

  const handleDropToken = (field: string, token: string) => {
    setManualFieldTokenMap(prev => {
      const updated = { ...prev };
      if (!updated[field]) {
        updated[field] = [];
      }
      if (!updated[field].includes(token)) {
        updated[field].push(token);
      }
      return updated;
    });
  
    // Also update tokenLabels state
    setTokenLabels(prev => ({
      ...prev,
      [token]: field
    }));
  };
  
  const handleRemoveToken = (field: string, token: string) => {
    setManualFieldTokenMap(prev => {
      const updated = { ...prev };
      if (updated[field]) {
        updated[field] = updated[field].filter(t => t !== token);
      }
      return updated;
    });
    
    setTokenLabels(prev => {
      const updated = { ...prev };
      if (token in updated) {
        delete updated[token];
      }
      return updated;
    });
  };

  const clearAllLabels = () => {
    // Save current state for undo
    setLabelingHistory([...labelingHistory, { ...tokenLabels }]);
    
    // Reset all tokens to unlabeled
    const clearedLabels: Record<string, string> = {};
    messageTokens.forEach(token => {
      clearedLabels[token] = 'unlabeled';
    });
    
    setTokenLabels(clearedLabels);
    setManualFieldTokenMap({
      amount: [],
      currency: [],
      vendor: [],
      account: [],
      type: [],
      date: [],
      title: []
    });
  };

  const undoLastLabeling = () => {
    if (labelingHistory.length > 0) {
      const previousState = labelingHistory.pop();
      if (previousState) {
        setTokenLabels(previousState);
        
        // Reconstruct field token map from previous token labels
        const reconstructedMap = {
          amount: [],
          currency: [],
          vendor: [],
          account: [],
          type: [],
          date: [],
          title: []
        };
        
        Object.entries(previousState).forEach(([token, label]) => {
          if (label !== 'unlabeled' && label !== 'ignore' && reconstructedMap[label]) {
            reconstructedMap[label].push(token);
          }
        });
        
        setManualFieldTokenMap(reconstructedMap);
      }
      setLabelingHistory([...labelingHistory]);
    }
  };

  const applyAutomaticLabels = () => {
    if (!message) return;
    
    // Save current state for undo
    setLabelingHistory([...labelingHistory, { ...tokenLabels }]);
    
    // These functions return PositionedToken[], so we need to extract just the tokens
    const tokenMap = {
      amount: extractAmountTokens(message).map(pt => pt.token),
      currency: extractCurrencyTokens(message).map(pt => pt.token),
      vendor: extractVendorTokens(message).map(pt => pt.token),
      account: extractAccountTokens(message).map(pt => pt.token),
      type: [],
      date: [],
      title: []
    };
    
    // Create initial token labels
    const autoLabels: Record<string, string> = {};
    messageTokens.forEach(token => {
      let found = false;
      for (const [field, tokens] of Object.entries(tokenMap)) {
        // Add type check here to ensure tokens is an array
        if (Array.isArray(tokens) && tokens.includes(token)) {
          autoLabels[token] = field;
          found = true;
          break;
        }
      }
      if (!found) {
        autoLabels[token] = 'unlabeled';
      }
    });
    
    setTokenLabels(autoLabels);
    setManualFieldTokenMap(tokenMap);
  };

  return {
    tokenLabels,
    setTokenLabels,
    manualFieldTokenMap,
    setManualFieldTokenMap,
    labelingHistory,
    setLabelingHistory,
    messageTokens,
    getTokenFieldMatch,
    handleDropToken,
    handleRemoveToken,
    clearAllLabels,
    undoLastLabeling,
    applyAutomaticLabels
  };
};

export default useTokenOperations;
