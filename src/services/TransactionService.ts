
import { v4 as uuidv4 } from 'uuid';
import { Transaction } from '@/types/transaction';
import { getStoredTransactions, storeTransactions } from '@/utils/storage-utils';
import { transactionAnalyticsService } from './TransactionAnalyticsService';
import { smsProcessingService } from './SmsProcessingService';

class TransactionService {
  // Get all transactions
  getAllTransactions(): Transaction[] {
    return getStoredTransactions();
  }

  // Save transactions
  saveTransactions(transactions: Transaction[]): void {
    storeTransactions(transactions);
  }

  // Add a new transaction
  addTransaction(transaction: Omit<Transaction, 'id'>): Transaction {
    const newTransaction = {
      ...transaction,
      id: uuidv4()
    };
    
    const transactions = this.getAllTransactions();
    transactions.push(newTransaction);
    this.saveTransactions(transactions);
    
    return newTransaction;
  }

  // Update an existing transaction
  updateTransaction(id: string, updates: Partial<Omit<Transaction, 'id'>>): Transaction | null {
    const transactions = this.getAllTransactions();
    const index = transactions.findIndex(t => t.id === id);
    
    if (index === -1) return null;
    
    const updatedTransaction = { ...transactions[index], ...updates };
    transactions[index] = updatedTransaction;
    this.saveTransactions(transactions);
    
    return updatedTransaction;
  }

  // Delete a transaction
  deleteTransaction(id: string): boolean {
    const transactions = this.getAllTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    
    if (filteredTransactions.length === transactions.length) {
      return false;
    }
    
    this.saveTransactions(filteredTransactions);
    return true;
  }

  // Process SMS messages to extract transactions (delegated to SmsProcessingService)
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    return smsProcessingService.processTransactionsFromSMS(messages);
  }

  // Get transactions summary statistics (delegated to TransactionAnalyticsService)
  getTransactionsSummary() {
    return transactionAnalyticsService.getTransactionsSummary();
  }

  // Get transactions grouped by category (delegated to TransactionAnalyticsService)
  getTransactionsByCategory() {
    return transactionAnalyticsService.getTransactionsByCategory();
  }

  // Get transactions grouped by time period (delegated to TransactionAnalyticsService)
  getTransactionsByTimePeriod(period: 'week' | 'month' | 'year' = 'month') {
    return transactionAnalyticsService.getTransactionsByTimePeriod(period);
  }
}

// Re-export Transaction interface for backward compatibility
export type { Transaction } from '@/types/transaction';

// Export a singleton instance
export const transactionService = new TransactionService();
