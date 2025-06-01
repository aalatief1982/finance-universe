
import { Transaction } from '@/types/transaction';
import { saveToStorage, getFromStorage } from '@/utils/storage-utils';

interface LearningEntry {
  field: 'type' | 'category' | 'subcategory' | 'fromAccount' | 'vendor';
  value: string;
}

interface LearningData {
  patterns: LearningEntry[];
  confidence: number;
  timestamp: string;
}

export const saveTransactionWithLearning = async (
  transaction: Transaction,
  rawMessage: string,
  confidence: number = 0.8
): Promise<void> => {
  try {
    // Save the transaction
    const transactions = getFromStorage('transactions', []);
    transactions.push(transaction);
    saveToStorage('transactions', transactions);

    // Extract learning patterns
    const learningPatterns: LearningEntry[] = [];
    
    if (transaction.type) {
      learningPatterns.push({ field: 'type', value: transaction.type });
    }
    
    if (transaction.category) {
      learningPatterns.push({ field: 'category', value: transaction.category });
    }
    
    if (transaction.subcategory) {
      learningPatterns.push({ field: 'subcategory', value: transaction.subcategory });
    }
    
    if (transaction.fromAccount) {
      learningPatterns.push({ field: 'fromAccount', value: transaction.fromAccount });
    }
    
    if (transaction.vendor) {
      learningPatterns.push({ field: 'vendor', value: transaction.vendor });
    }

    // Save learning data
    const learningData: LearningData = {
      patterns: learningPatterns,
      confidence,
      timestamp: new Date().toISOString()
    };

    const existingLearningData = getFromStorage('learning_data', []);
    existingLearningData.push(learningData);
    saveToStorage('learning_data', existingLearningData);

    console.log('Transaction saved with learning data:', { transaction, learningData });
  } catch (error) {
    console.error('Failed to save transaction with learning:', error);
    throw error;
  }
};
