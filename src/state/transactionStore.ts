import { Transaction } from '@/types/transaction';
import { getStoredTransactions, storeTransactions } from '@/utils/storage-utils';

export type TransactionSubscriber = (transactions: Transaction[]) => void;

class TransactionStore {
  private transactions: Transaction[] = getStoredTransactions();
  private subscribers: TransactionSubscriber[] = [];

  get(): Transaction[] {
    return this.transactions;
  }

  private notify() {
    this.subscribers.forEach(cb => cb(this.transactions));
  }

  set(transactions: Transaction[]) {
    this.transactions = transactions;
    storeTransactions(transactions);
    this.notify();
  }

  add(transaction: Transaction) {
    this.set([transaction, ...this.transactions]);
  }

  update(updated: Transaction) {
    this.set(this.transactions.map(t => (t.id === updated.id ? updated : t)));
  }

  remove(id: string) {
    this.set(this.transactions.filter(t => t.id !== id));
  }

  clear() {
    this.set([]);
  }

  subscribe(cb: TransactionSubscriber) {
    this.subscribers.push(cb);
    cb(this.transactions);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== cb);
    };
  }
}

export const transactionStore = new TransactionStore();
