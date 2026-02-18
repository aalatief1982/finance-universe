/**
 * @file DemoTransactionService.ts
 * @description Seeds demo transactions for new users or demo mode.
 *
 * @module services/DemoTransactionService
 *
 * @responsibilities
 * 1. Generate randomized demo transactions across categories
 * 2. Avoid seeding when real transactions already exist
 * 3. Persist seeded data to the demo namespace (xpensia_tx_demo)
 * 4. Never mix demo data into the real transaction key
 *
 * @storage-keys
 * - xpensia_tx_demo: demo transaction data
 * - xpensia_demo_transactions_initialized: seed guard flag
 *
 * @dependencies
 * - categories-data.ts: category hierarchy
 * - demo-storage.ts: demo namespace persistence
 * - app-mode.ts: mode flag management
 * - safe-storage.ts: storage wrapper
 */

import { safeStorage } from "@/utils/safe-storage";
import { Transaction, TransactionType } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { getCategoryHierarchy, CURRENCIES } from '@/lib/categories-data';
import { demoStorage } from '@/utils/demo-storage';

const FROM_ACCOUNTS = [
  'SAB Bank Debit',
  'SAB Bank Credit',
  'ALRajhi Bank Debit',
  'AlRajhi Bank Credit',
  'D360 Bank Debit',
  'HSBC Egypt Bank Debit',
  'STC Pay',
  'UPay',
  'Instapay',
  'Cash',
  'Work Company Account'
];

const VENDORS = [
  'restaurant','cafe','starbucks','mcdonald','kfc','pizza',
  'amazon','ikea','market','grocery','supermarket','panda','tamimi','danube','carrefour','lulu','mall',
  'uber','careem','taxi','gas','petrol','fuel','aldrees',
  'electric','water','internet','phone','mobile','stc','zain','mobily',
  'netflix','spotify','cinema','theater',
  'pharmacy','doctor','hospital','clinic','medical'
];

const INIT_FLAG_KEY = 'xpensia_demo_transactions_initialized';

class DemoTransactionService {
  /**
   * Seed demo transactions into the demo namespace (xpensia_tx_demo).
   * Skips if already seeded. Never touches xpensia_transactions.
   */
  seedDemoTransactions(): void {
    if (safeStorage.getItem(INIT_FLAG_KEY)) {
      return;
    }

    const categories = getCategoryHierarchy();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date();

    const newTransactions: Transaction[] = [];

    const randomDate = () => {
      const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
      return new Date(time).toISOString().split('T')[0];
    };

    const randomAmount = (type: TransactionType) => {
      const val = Number((Math.random() * 500 + 5).toFixed(2));
      if (type === 'income') return val;
      if (type === 'transfer') return Math.random() > 0.5 ? val : -val;
      return -val;
    };

    const randomItem = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const sampleCount = 5 + Math.floor(Math.random() * 6);
    for (let i = 0; i < sampleCount; i++) {
      const cat = randomItem(categories);
      const sub = cat.subcategories.length > 0
        ? randomItem(cat.subcategories).name
        : cat.name;

      newTransactions.push({
        id: uuidv4(),
        title: sub,
        amount: randomAmount(cat.type as TransactionType),
        category: cat.name,
        subcategory: sub !== cat.name ? sub : undefined,
        date: randomDate(),
        type: cat.type as TransactionType,
        notes: 'Demo seed transaction',
        source: 'manual',
        currency: randomItem(CURRENCIES),
        fromAccount: randomItem(FROM_ACCOUNTS),
        vendor: randomItem(VENDORS),
        isSample: true
      });
    }

    demoStorage.setTransactions(newTransactions);
    safeStorage.setItem(INIT_FLAG_KEY, 'true');
  }

  /**
   * Get all demo transactions from the demo namespace.
   */
  getDemoTransactions(): Transaction[] {
    return demoStorage.getTransactions();
  }

  /**
   * Returns true if the demo namespace has any data.
   */
  hasDemoData(): boolean {
    return demoStorage.hasData();
  }

  /**
   * Clear demo transactions and switch app mode to real.
   * Does NOT reseed. Call seedDemoTransactions() after this to reseed.
   */
  clearDemoTransactions(): void {
    demoStorage.clear();
  }

  /**
   * Reset demo data: clear and reseed.
   */
  resetDemoTransactions(): void {
    demoStorage.clear();
    safeStorage.removeItem(INIT_FLAG_KEY);
    this.seedDemoTransactions();
  }
}

export const demoTransactionService = new DemoTransactionService();
