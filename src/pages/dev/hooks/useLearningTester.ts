
import { useState, useMemo, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import { MatchResult } from '@/types/learning';
import { useLearningEngine } from '@/hooks/useLearningEngine';

const useLearningTester = () => {
  const [message, setMessage] = useState<string>('');
  const [senderHint, setSenderHint] = useState<string>('');
  const [matchResult, setMatchResult] = useState<MatchResult | null>(null);
  const [isLabelingMode, setIsLabelingMode] = useState(false);
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
  const [dummyTransaction, setDummyTransaction] = useState<Transaction>({
    id: '',
    date: new Date().toISOString(),
    amount: 0,
    currency: 'USD' as SupportedCurrency,
    description: '',
    type: 'expense' as TransactionType,
    category: 'Uncategorized',
    fromAccount: '',
    toAccount: '',
    title: '',
    source: 'manual'
  });
  
  const { toast } = useToast();
  const {
    findBestMatch,
    tokenize,
    extractAmountTokens,
    extractCurrencyTokens,
    extractVendorTokens,
    extractAccountTokens,
    learnFromTransaction,
    clearLearnedEntries
  } = useLearningEngine();

  // Generate tokens from the current message
  const messageTokens = useMemo(() => {
    if (!message) return [];
    return tokenize(message);
  }, [message, tokenize]);
  
  useEffect(() => {
    if (message && !isLabelingMode) {
      const tokenMap = {
        amount: extractAmountTokens(message),
        currency: extractCurrencyTokens(message),
        vendor: extractVendorTokens(message),
        account: extractAccountTokens(message),
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
            if (tokens && tokens.includes(token)) {
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

  const getTokenFieldMatch = (token: string) => {
    if (!matchResult?.entry?.fieldTokenMap) return null;
    
    const fieldMap = matchResult.entry.fieldTokenMap;
    for (const [field, tokens] of Object.entries(fieldMap)) {
      if (tokens && tokens.includes(token)) {
        return field;
      }
    }
    return null;
  };

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
    const matchedFields = Object.entries(fieldMap).filter(([_, tokens]) => 
      tokens && tokens.some(token => messageTokens.includes(token))
    ).length;
    
    // Count total token overlaps
    let tokenOverlapCount = 0;
    Object.values(fieldMap).forEach(fieldTokens => {
      if (fieldTokens) {
        fieldTokens.forEach(token => {
          if (messageTokens.includes(token)) tokenOverlapCount++;
        });
      }
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

  const toggleLabelingMode = () => {
    if (!isLabelingMode) {
      // Entering labeling mode, save current state for undo
      setLabelingHistory([{ ...tokenLabels }]);
    }
    setIsLabelingMode(!isLabelingMode);
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
  
    // Optional: also update tokenLabels state if still needed for coloring/highlights
    setTokenLabels(prev => ({
      ...prev,
      [token]: field
    }));
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
    
    const tokenMap = {
      amount: extractAmountTokens(message),
      currency: extractCurrencyTokens(message),
      vendor: extractVendorTokens(message),
      account: extractAccountTokens(message),
      type: [],
      date: [],
      title: []
    };
    
    // Create initial token labels
    const autoLabels: Record<string, string> = {};
    messageTokens.forEach(token => {
      let found = false;
      for (const [field, tokens] of Object.entries(tokenMap)) {
        if (tokens && tokens.includes(token)) {
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

  const learnFromCurrentMessage = () => {
    if (!message) {
      toast({
        title: "Message required",
        description: "Please enter a message to learn from",
        variant: "destructive"
      });
      return;
    }

    try {
      learnFromTransaction(message, dummyTransaction, senderHint, isLabelingMode ? manualFieldTokenMap : undefined);
      
      toast({
        title: "Learning success",
        description: "Message has been added to learning engine",
      });
    } catch (error) {
      toast({
        title: "Learning failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    }
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

  const clearLearningEntriesHandler = () => {
    if (window.confirm("Are you sure you want to clear all learned entries? This action cannot be undone.")) {
      clearLearnedEntries();
      toast({
        title: "Memory cleared",
        description: "All learned entries have been removed",
      });
      setMatchResult(null);
    }
  };

  return {
    message,
    setMessage,
    senderHint, 
    setSenderHint,
    matchResult,
    setMatchResult,
    isLabelingMode,
    setIsLabelingMode,
    tokenLabels,
    setTokenLabels,
    manualFieldTokenMap,
    setManualFieldTokenMap,
    labelingHistory,
    setLabelingHistory,
    dummyTransaction,
    setDummyTransaction,
    messageTokens,
    confidenceBreakdown,
    findBestMatchHandler,
    toggleLabelingMode,
    handleDropToken,
    handleRemoveToken,
    clearAllLabels,
    undoLastLabeling,
    applyAutomaticLabels,
    learnFromCurrentMessage,
    getTokenFieldMatch,
    clearLearningEntriesHandler
  };
};

export default useLearningTester;
