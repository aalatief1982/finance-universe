
import { v4 as uuidv4 } from 'uuid';
import { parseSmsMessage, categorizeTransaction } from '@/lib/sms-parser';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  date: string;
  type: 'income' | 'expense';
  notes?: string;
  source?: 'manual' | 'sms';
  originalCurrency?: string;
  smsDetails?: {
    sender: string;
    message: string;
    timestamp: string;
  };
}

class TransactionService {
  private storageKey = 'transactions';

  // Get all transactions
  getAllTransactions(): Transaction[] {
    const storedTransactions = localStorage.getItem(this.storageKey);
    return storedTransactions ? JSON.parse(storedTransactions) : [];
  }

  // Save transactions
  saveTransactions(transactions: Transaction[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(transactions));
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

  // Process SMS messages to extract transactions
  processTransactionsFromSMS(messages: { sender: string; message: string; date: Date }[]): Transaction[] {
    const extractedTransactions: Transaction[] = [];
    
    for (const message of messages) {
      const parsedTransaction = parseSmsMessage(message.message, message.sender);
      
      if (parsedTransaction) {
        const newTransaction: Transaction = {
          id: uuidv4(),
          title: parsedTransaction.description,
          amount: parsedTransaction.amount,
          category: parsedTransaction.category,
          date: parsedTransaction.date.toISOString().split('T')[0],
          type: parsedTransaction.amount >= 0 ? 'income' : 'expense',
          source: 'sms',
          smsDetails: {
            sender: message.sender,
            message: message.message,
            timestamp: message.date.toISOString()
          }
        };
        
        extractedTransactions.push(newTransaction);
      }
    }
    
    return extractedTransactions;
  }

  // Get transactions summary statistics
  getTransactionsSummary() {
    const transactions = this.getAllTransactions();
    
    const income = transactions
      .filter(t => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expenses = transactions
      .filter(t => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const balance = income - expenses;
    
    return { income, expenses, balance };
  }

  // Get transactions grouped by category
  getTransactionsByCategory() {
    const transactions = this.getAllTransactions();
    const categories: Record<string, number> = {};
    
    transactions
      .filter(t => t.amount < 0) // Only include expenses
      .forEach(t => {
        const category = t.category || 'Uncategorized';
        categories[category] = (categories[category] || 0) + Math.abs(t.amount);
      });
    
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }

  // Get transactions grouped by time period
  getTransactionsByTimePeriod(period: 'week' | 'month' | 'year' = 'month') {
    const transactions = this.getAllTransactions();
    const timelineData: Record<string, { income: number; expense: number }> = {};
    
    // Get date format based on period
    const getDateKey = (date: Date) => {
      if (period === 'week') {
        // Format as 'Mon', 'Tue', etc.
        return date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (period === 'month') {
        // Format as day of month: '1', '2', etc.
        return date.getDate().toString();
      } else {
        // Format as 'Jan', 'Feb', etc.
        return date.toLocaleDateString('en-US', { month: 'short' });
      }
    };
    
    // Initialize the timeline data structure
    const now = new Date();
    const dataPoints = period === 'week' ? 7 : period === 'month' ? 31 : 12;
    
    for (let i = 0; i < dataPoints; i++) {
      const date = new Date();
      
      if (period === 'week') {
        date.setDate(now.getDate() - (now.getDay() - i));
      } else if (period === 'month') {
        date.setDate(i + 1);
      } else {
        date.setMonth(i);
      }
      
      const key = getDateKey(date);
      timelineData[key] = { income: 0, expense: 0 };
    }
    
    // Fill in the actual data
    transactions.forEach(t => {
      const date = new Date(t.date);
      const key = getDateKey(date);
      
      if (timelineData[key]) {
        if (t.amount >= 0) {
          timelineData[key].income += t.amount;
        } else {
          timelineData[key].expense += Math.abs(t.amount);
        }
      }
    });
    
    // Convert to array format for charts
    return Object.entries(timelineData).map(([date, data]) => ({
      date,
      income: data.income,
      expense: data.expense
    }));
  }
}

// Export a singleton instance
export const transactionService = new TransactionService();
