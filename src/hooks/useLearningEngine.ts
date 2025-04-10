
import { useState, useCallback } from 'react';
import { learningEngineService } from '@/services/LearningEngineService';
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
    (rawMessage: string, transaction: Transaction, senderHint?: string) => {
      setIsLoading(true);
      try {
        learningEngineService.learnFromTransaction(rawMessage, transaction, senderHint);
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

  return {
    isLoading,
    config,
    learnFromTransaction,
    findBestMatch,
    updateConfig,
    getLearnedEntries,
    clearLearnedEntries
  };
};
