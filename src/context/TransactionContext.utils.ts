import { useContext } from 'react';
import { TransactionContext } from './TransactionContext.context';
import type { TransactionContextType } from './TransactionContext.context';

export const useTransactions = (): TransactionContextType => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error(
      'useTransactions must be used within a TransactionProvider',
    );
  }
  return context;
};

export const useOptionalTransactions = () => {
  return useContext(TransactionContext);
};
