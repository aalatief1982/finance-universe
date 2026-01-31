/**
 * @file useLearningEngine.ts
 * @description Hook wrapper for the learning engine service.
 *
 * @module hooks/useLearningEngine
 *
 * @responsibilities
 * 1. Expose learn/match/infer helpers for smart-paste flows
 * 2. Track loading state for learning operations
 * 3. Persist configuration updates
 *
 * @dependencies
 * - LearningEngineService.ts: learning and matching logic
 *
 * @review-tags
 * - @side-effects: writes learning data and config
 *
 * @review-checklist
 * - [ ] Errors handled without crashing UI
 * - [ ] Config updates merge with existing settings
 */

import { useState, useCallback } from 'react';
import { learningEngineService } from '@/services/LearningEngineService';
import { LearnedEntry, LearningEngineConfig, MatchResult, PositionedToken } from '@/types/learning';
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
    (rawMessage: string, transaction: Transaction, senderHint?: string, customFieldTokenMap?: Partial<any>) => {
      setIsLoading(true);
      try {
        learningEngineService.learnFromTransaction(rawMessage, transaction, senderHint, customFieldTokenMap);
      } catch (error) {
        if (import.meta.env.MODE === 'development') {
          console.error('Error learning from transaction:', error);
        }
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
        if (import.meta.env.MODE === 'development') {
          console.error('Error finding best match:', error);
        }
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
      if (import.meta.env.MODE === 'development') {
        console.error('Error inferring fields from text:', error);
      }
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
      if (import.meta.env.MODE === 'development') {
        console.error('Error updating learning engine config:', error);
      }
    }
  }, [config]);

  /**
   * Get all learned entries
   */
  const getLearnedEntries = useCallback((): LearnedEntry[] => {
    try {
      return learningEngineService.getLearnedEntries();
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('Error getting learned entries:', error);
      }
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
      if (import.meta.env.MODE === 'development') {
        console.error('Error clearing learned entries:', error);
      }
    }
  }, []);

  // Additional utility methods - now properly typed to return PositionedToken arrays
  const tokenize = useCallback((msg: string): string[] => {
    return learningEngineService.tokenize(msg);
  }, []);

  const extractAmountTokens = useCallback((msg: string): PositionedToken[] => {
    return learningEngineService.extractAmountTokensWithPosition(msg);
  }, []);

  const extractCurrencyTokens = useCallback((msg: string): PositionedToken[] => {
    return learningEngineService.extractCurrencyTokensWithPosition(msg);
  }, []);

  const extractVendorTokens = useCallback((msg: string): PositionedToken[] => {
    return learningEngineService.extractVendorTokensWithPosition(msg);
  }, []);

  const extractAccountTokens = useCallback((msg: string): PositionedToken[] => {
    return learningEngineService.extractAccountTokensWithPosition(msg);
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
