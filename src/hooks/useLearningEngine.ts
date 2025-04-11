
import { useState, useCallback } from 'react';
import { learningEngineService, FieldTokenMap } from '@/services/LearningEngineService';
import { LearnedEntry, LearningEngineConfig, MatchResult } from '@/types/learning';
import { Transaction } from '@/types/transaction';

/**
 * Hook for accessing the learning engine functionality
 */
export const useLearningEngine = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState<LearningEngineConfig>(
    learningEngineService.getConfig()
  );

  /**
   * Learn from a confirmed transaction
   */
  const learnFromTransaction = useCallback(
    (rawMessage: string, transaction: Transaction, senderHint?: string, customFieldTokenMap?: Partial<FieldTokenMap>) => {
      setIsLoading(true);
      try {
        learningEngineService.learnFromTransaction(rawMessage, transaction, senderHint, customFieldTokenMap);
      } catch (error) {
        console.error('Error learning from transaction:', error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  /**
   * Find the best match for a given message
   */
  const findBestMatch = useCallback(
    (message: string, senderHint?: string): MatchResult => {
      try {
        return learningEngineService.findBestMatch(message, senderHint);
      } catch (error) {
        console.error('Error finding best match:', error);
        return { entry: null, confidence: 0, matched: false };
      }
    },
    []
  );

  /**
   * Infer fields from text message when no learned match is found
   */
  const inferFieldsFromText = useCallback((message: string): Partial<Transaction> | null => {
    if (!message) return null;
    
    try {
      return learningEngineService.inferFieldsFromText(message);
    } catch (error) {
      console.error('Error inferring fields from text:', error);
      return null;
    }
  }, []);

  /**
   * Update the learning engine configuration
   */
  const updateConfig = useCallback((newConfig: Partial<LearningEngineConfig>) => {
    try {
      learningEngineService.saveConfig(newConfig);
      setConfig({ ...config, ...newConfig });
    } catch (error) {
      console.error('Error updating learning engine config:', error);
    }
  }, [config]);

  /**
   * Get all learned entries
   */
  const getLearnedEntries = useCallback((): LearnedEntry[] => {
    try {
      return learningEngineService.getLearnedEntries();
    } catch (error) {
      console.error('Error getting learned entries:', error);
      return [];
    }
  }, []);

  /**
   * Clear all learned entries
   */
  const clearLearnedEntries = useCallback(() => {
    try {
      learningEngineService.clearLearnedEntries();
    } catch (error) {
      console.error('Error clearing learned entries:', error);
    }
  }, []);

  // Additional utility functions from the service
  const tokenize = useCallback((msg: string) => {
    return learningEngineService.tokenize(msg);
  }, []);

  const extractAmountTokens = useCallback((msg: string) => {
    return learningEngineService.extractAmountTokens(msg);
  }, []);

  const extractCurrencyTokens = useCallback((msg: string) => {
    return learningEngineService.extractCurrencyTokens(msg);
  }, []);

  const extractVendorTokens = useCallback((msg: string) => {
    return learningEngineService.extractVendorTokens(msg);
  }, []);

  const extractAccountTokens = useCallback((msg: string) => {
    return learningEngineService.extractAccountTokens(msg);
  }, []);

  return {
    isLoading,
    config,
    learnFromTransaction,
    findBestMatch,
    inferFieldsFromText,
    updateConfig,
    getLearnedEntries,
    clearLearnedEntries,
    tokenize,
    extractAmountTokens,
    extractCurrencyTokens,
    extractVendorTokens,
    extractAccountTokens
  };
};
