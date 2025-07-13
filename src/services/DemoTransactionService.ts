import { safeStorage } from "@/utils/safe-storage";
import { Transaction, TransactionType } from '@/types/transaction';
import { v4 as uuidv4 } from 'uuid';
import { getCategoryHierarchy, CURRENCIES } from '@/lib/categories-data';
import { getStoredTransactions, storeTransactions } from '@/utils/storage-utils';

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
  seedDemoTransactions(): void {
    if (safeStorage.getItem(INIT_FLAG_KEY)) {
      return;
    }

    const existing = getStoredTransactions();
    if (existing.length > 0) {
      safeStorage.setItem(INIT_FLAG_KEY, 'true');
      return;
    }

    const categories = getCategoryHierarchy();
    const start = new Date();
    start.setFullYear(start.getFullYear() - 1);
    const end = new Date();

    const newTransactions: Transaction[] = [];

    const randomDate = () => {
      const time = start.getTime() + Math.random() * (end.getTime() - start.getTime());
      const d = new Date(time);
      return d.toISOString().split('T')[0];
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

    storeTransactions([...existing, ...newTransactions]);
    safeStorage.setItem(INIT_FLAG_KEY, 'true');
  }

  clearDemoTransactions(): void {
    const existing = getStoredTransactions();
    const filtered = existing.filter(t => !t.isSample);
    storeTransactions(filtered);
    // Maintain the initialization flag so that demo data is not reseeded
    // when the application reloads after clearing sample transactions.
    safeStorage.setItem(INIT_FLAG_KEY, 'true');
  }
}

export const demoTransactionService = new DemoTransactionService();
