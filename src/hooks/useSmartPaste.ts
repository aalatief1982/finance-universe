
import { useState, useCallback } from 'react';
import { Transaction } from '@/types/transaction';
import { parseAndInferTransaction } from '@/lib/smart-paste-engine/parseAndInferTransaction';

interface UseSmartPasteReturn {
  isProcessing: boolean;
  error: string | null;
  processMessage: (message: string) => Promise<{
    transactions: Transaction[];
    confidence: number;
    rawMessage: string;
    senderHint?: string;
    matchOrigin?: 'template' | 'structure' | 'ml' | 'fallback';
  } | null>;
}

export const useSmartPaste = (): UseSmartPasteReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processMessage = useCallback(async (message: string) => {
    if (!message.trim()) {
      setError('Please enter a message to process');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const result = await parseAndInferTransaction(message);
      
      if (!result || !result.transaction) {
        setError('Unable to extract transaction from message');
        return null;
      }

      return {
        transactions: [result.transaction],
        confidence: result.confidence || 0.5,
        rawMessage: message,
        senderHint: result.senderHint,
        matchOrigin: result.matchOrigin
      };
    } catch (err) {
      console.error('Error processing message:', err);
      setError(err instanceof Error ? err.message : 'Failed to process message');
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    processMessage
  };
};
