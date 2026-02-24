import { endOfDay, startOfDay } from 'date-fns';
import { Transaction } from '@/types/transaction';

export type HomeDateRange = 'day' | 'week' | 'month' | 'year' | 'custom';

interface FilterOptions {
  transactions: Transaction[];
  baseCurrency: string;
  range: HomeDateRange;
  customStart: Date | null;
  customEnd: Date | null;
}

export interface HomeTransactionViewModel extends Transaction {
  effectiveAmount: number;
  isUnconverted: boolean;
}

export const resolveHomeDateRange = (
  range: HomeDateRange,
  customStart: Date | null,
  customEnd: Date | null,
) => {
  const now = new Date();
  let start = startOfDay(now);
  let end = endOfDay(now);

  switch (range) {
    case 'day':
      break;
    case 'week':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6));
      break;
    case 'month':
      start = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      break;
    case 'year':
      start = startOfDay(new Date(now.getFullYear(), 0, 1));
      break;
    case 'custom':
      start = startOfDay(customStart ? new Date(customStart) : now);
      end = endOfDay(customEnd ? new Date(customEnd) : now);
      break;
  }

  return { start, end };
};

export const getHomeFilteredTransactions = ({
  transactions,
  baseCurrency,
  range,
  customStart,
  customEnd,
}: FilterOptions): HomeTransactionViewModel[] => {
  const { start, end } = resolveHomeDateRange(range, customStart, customEnd);
  const normalizedBaseCurrency = baseCurrency.toUpperCase();

  return transactions
    .filter((transaction) => {
      const txnDate = new Date(transaction.date);
      return !Number.isNaN(txnDate.getTime()) && txnDate >= start && txnDate <= end;
    })
    .map((transaction) => {
      const txCurrency = (transaction.currency || normalizedBaseCurrency).toUpperCase();
      const isBaseCurrency = txCurrency === normalizedBaseCurrency;
      const hasConversion =
        (transaction.amountInBase != null && transaction.fxSource !== 'missing') ||
        (transaction.fxSource === undefined && isBaseCurrency);
      const isUnconverted = !hasConversion && !isBaseCurrency;
      const effectiveAmount = Math.abs(transaction.amountInBase ?? transaction.amount);

      return {
        ...transaction,
        effectiveAmount,
        isUnconverted,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const getHomeSummary = (transactions: HomeTransactionViewModel[]) => {
  const summary = transactions.reduce(
    (summary, transaction) => {
      if (transaction.type === 'income') {
        summary.income += transaction.effectiveAmount;
      }
      if (transaction.type === 'expense') {
        summary.expenses += transaction.effectiveAmount;
      }
      if (transaction.type !== 'transfer' && transaction.isUnconverted) {
        summary.unconvertedCount += 1;
      }
      return summary;
    },
    {
      income: 0,
      expenses: 0,
      balance: 0,
      unconvertedCount: 0,
    },
  );

  return {
    ...summary,
    balance: summary.income - summary.expenses,
  };
};
