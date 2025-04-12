
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Transaction } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

/**
 * Hook for handling learning operations
 */
const useLearningOperations = (
  message: string, 
  senderHint: string, 
  isLabelingMode: boolean, 
  manualFieldTokenMap: Record<string, string[]>
) => {
  const [dummyTransaction, setDummyTransaction] = useState<Transaction>({
    id: '',
    date: new Date().toISOString(),
    amount: 0,
    currency: 'USD' as SupportedCurrency,
    description: '',
    type: 'expense',
    category: 'Uncategorized',
    fromAccount: '',
    toAccount: '',
    title: '',
    source: 'manual'
  });
  
  const { toast } = useToast();
  const { learnFromTransaction, clearLearnedEntries } = useLearningEngine();

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

  const clearLearningEntriesHandler = () => {
    if (window.confirm("Are you sure you want to clear all learned entries? This action cannot be undone.")) {
      clearLearnedEntries();
      toast({
        title: "Memory cleared",
        description: "All learned entries have been removed",
      });
    }
  };

  return {
    dummyTransaction,
    setDummyTransaction,
    learnFromCurrentMessage,
    clearLearningEntriesHandler
  };
};

export default useLearningOperations;
