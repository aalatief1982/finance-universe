
declare module '@/components/smart-paste/DetectedTransactionCard' {
  import { Transaction } from '@/types/transaction';
  import * as React from 'react';
  
  export interface DetectedTransactionCardProps {
    transaction: Transaction;
    isSmartMatch: boolean;
    onAddTransaction: (transaction: Transaction) => void;
    origin: "template" | "structure" | "ml" | "fallback";
  }
  
  export const DetectedTransactionCard: React.FC<DetectedTransactionCardProps>;
}
