import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';

// Mock storage before imports
const storageMock = createStorageMock();
vi.stubGlobal('localStorage', storageMock);

// Mock firebase analytics
vi.mock('@/utils/firebase-analytics', () => ({
  logAnalyticsEvent: vi.fn(),
}));

// Import after mocks
import { transactionFormSchema, DEFAULT_FORM_VALUES, validateTransactionForm } from '../transaction-form-schema';
import { transactionService } from '@/services/TransactionService';
import { Transaction } from '@/types/transaction';

describe('TransactionForm + Service Integration', () => {
  beforeEach(() => {
    storageMock.clear();
    vi.clearAllMocks();
  });

  describe('Form schema validation', () => {
    it('should validate a complete expense transaction', () => {
      const formData = {
        title: 'Groceries',
        amount: 150.50,
        type: 'expense' as const,
        fromAccount: 'Cash',
        toAccount: '',
        category: 'Food',
        subcategory: '',
        date: '2024-01-15',
        description: 'Weekly groceries',
        notes: '',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('should validate a complete income transaction', () => {
      const formData = {
        title: 'Salary',
        amount: 5000,
        type: 'income' as const,
        fromAccount: 'Bank',
        toAccount: '',
        category: 'Salary',
        subcategory: '',
        date: '2024-01-15',
        description: 'Monthly salary',
        notes: '',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(true);
    });

    it('should require both accounts for transfer type', () => {
      const formData = {
        title: 'Transfer',
        amount: 500,
        type: 'transfer' as const,
        fromAccount: 'Bank',
        toAccount: '', // Missing!
        category: 'Transfer',
        subcategory: '',
        date: '2024-01-15',
        description: '',
        notes: '',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
    });

    it('should require fromAccount for income', () => {
      const formData = {
        title: 'Interest',
        amount: 15,
        type: 'income' as const,
        fromAccount: '',
        toAccount: 'Savings',
        category: 'Interest',
        subcategory: '',
        date: '2024-01-15',
        description: '',
        notes: '',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
    });

    it('should require different accounts for transfer', () => {
      const formData = {
        title: 'Transfer',
        amount: 500,
        type: 'transfer' as const,
        fromAccount: 'Bank',
        toAccount: 'Bank', // Same as fromAccount!
        category: 'Transfer',
        subcategory: '',
        date: '2024-01-15',
        description: '',
        notes: '',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
    });

    it('should reject amount of 0', () => {
      const formData = {
        title: 'Zero amount',
        amount: 0,
        type: 'expense' as const,
        fromAccount: 'Cash',
        category: 'Food',
        date: '2024-01-15',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
    });

    it('should reject amounts exceeding max', () => {
      const formData = {
        title: 'Too big',
        amount: 1000000, // Exceeds 999,999.99
        type: 'expense' as const,
        fromAccount: 'Cash',
        category: 'Food',
        date: '2024-01-15',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
    });

    it('should require title with minimum length', () => {
      const formData = {
        title: 'A', // Too short
        amount: 100,
        type: 'expense' as const,
        fromAccount: 'Cash',
        category: 'Food',
        date: '2024-01-15',
        currency: 'USD',
      };

      const result = transactionFormSchema.safeParse(formData);
      expect(result.success).toBe(false);
    });
  });



    it('should return unified validation errors for missing required fields', () => {
      const errors = validateTransactionForm({
        title: '',
        amount: 0,
        type: 'transfer',
        fromAccount: '',
        toAccount: '',
        category: '',
        date: '',
        currency: '',
      }, 'transfer');

      expect(errors.title).toBeDefined();
      expect(errors.amount).toBeDefined();
      expect(errors.fromAccount).toBeDefined();
      expect(errors.toAccount).toBeDefined();
      expect(errors.category).toBeDefined();
      expect(errors.currency).toBeDefined();
      expect(errors.date).toBeDefined();
    });


    it('should reject negative amount in unified validation', () => {
      const errors = validateTransactionForm({
        title: 'Bad amount',
        amount: -10,
        type: 'expense',
        fromAccount: 'Cash',
        category: 'Food',
        date: '2024-01-15',
        currency: 'USD',
      }, 'expense');

      expect(errors.amount).toBe('Amount must be greater than 0');
    });

    it('should treat N/A subcategory as missing when subcategory is mandatory', () => {
      const errors = validateTransactionForm({
        title: 'Food order',
        amount: 10,
        type: 'expense',
        fromAccount: 'Cash',
        category: 'Food',
        subcategory: 'N/A',
        date: '2024-01-15',
        currency: 'USD',
      }, 'expense');

      expect(errors.subcategory).toBeDefined();
    });

    it('should require subcategory even when category is not selected yet', () => {
      const errors = validateTransactionForm({
        title: 'Pending transaction',
        amount: 10,
        type: 'expense',
        fromAccount: 'Cash',
        category: '',
        subcategory: '',
        date: '2024-01-15',
        currency: 'USD',
      }, 'expense');

      expect(errors.subcategory).toBe('Subcategory is required');
    });

    it('should accept numeric amount provided as a formatted string', () => {
      const errors = validateTransactionForm({
        title: 'Salary',
        amount: '500.00' as unknown as number,
        type: 'income',
        fromAccount: 'Bank',
        category: 'Income',
        subcategory: 'Salary',
        date: '2024-01-15',
        currency: 'USD',
      }, 'income');

      expect(errors.amount).toBeUndefined();
    });

  describe('Form to service integration', () => {
    it('should create expense transaction from valid form data', () => {
      const formData = {
        title: 'Groceries',
        amount: 150.50,
        type: 'expense' as const,
        fromAccount: 'Cash',
        category: 'Food',
        date: '2024-01-15',
        currency: 'USD',
        source: 'manual' as const,
      };

      const result = transactionService.addTransaction(formData);
      const tx = result as Transaction;

      expect(tx.id).toBeDefined();
      expect(tx.title).toBe('Groceries');
      expect(tx.amount).toBe(150.50);
      expect(tx.type).toBe('expense');
    });

    it('should create transfer with dual entries from valid form data', () => {
      const formData = {
        title: 'Transfer to Savings',
        amount: 500,
        type: 'transfer' as const,
        fromAccount: 'Bank',
        toAccount: 'Savings',
        category: 'Transfer',
        date: '2024-01-15',
        currency: 'USD',
        source: 'manual' as const,
      };

      const result = transactionService.addTransaction(formData);
      const entries = result as Transaction[];

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBe(2);

      const outEntry = entries.find(e => e.transferDirection === 'out');
      const inEntry = entries.find(e => e.transferDirection === 'in');

      expect(outEntry?.amount).toBe(-500);
      expect(inEntry?.amount).toBe(500);
      expect(outEntry?.transferId).toBe(inEntry?.transferId);
    });

    it('should update transaction from edited form data', () => {
      // Create initial transaction
      const initial = transactionService.addTransaction({
        title: 'Original',
        amount: -100,
        type: 'expense',
        category: 'Food',
        date: '2024-01-15',
        fromAccount: 'Cash',
        currency: 'USD',
        source: 'manual',
      }) as Transaction;

      // Update via form data
      const updated = transactionService.updateTransaction(initial.id, {
        title: 'Updated Title',
        amount: -200,
        category: 'Shopping',
      });

      expect(updated?.title).toBe('Updated Title');
      expect(updated?.amount).toBe(-200);
      expect(updated?.category).toBe('Shopping');
    });
  });

  describe('Default form values', () => {
    it('should have sensible defaults', () => {
      expect(DEFAULT_FORM_VALUES.type).toBe('expense');
      expect(DEFAULT_FORM_VALUES.currency).toBe('SAR');
      expect(DEFAULT_FORM_VALUES.date).toBeDefined();
    });
  });
});
