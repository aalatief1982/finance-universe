import React from 'react';
import { CreditCard, MessageSquare, Plus, RefreshCw } from 'lucide-react';
import WireframeButton from '../../WireframeButton';
import { Transaction } from '@/types/transaction';
import { getCurrencySymbol } from '@/utils/format-utils';

interface TransactionsSectionProps {
  transactions: Transaction[];
  onAddTransaction: () => void;
  onImportSms: () => void;
  currency: string;
  formatCurrency: (amount: number) => string;
}

const TransactionsSection = ({ 
  transactions, 
  onAddTransaction, 
  onImportSms, 
  currency, 
  formatCurrency 
}: TransactionsSectionProps) => {

  const formatAmount = (transaction: Transaction) => {
    const currencySymbol = getCurrencySymbol(transaction.currency || currency || 'USD');
    const amount = Math.abs(transaction.amount).toFixed(2);
    return `${currencySymbol}${amount}`;
  };

  return (
    <div className="space-y-2 max-h-52 overflow-y-auto">
      {transactions.length > 0 ? (
        transactions.map(tx => (
          <div key={tx.id} className="flex justify-between items-center p-3 bg-white border rounded-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                <CreditCard size={16} className="text-gray-500" />
              </div>
              <div>
                <h3 className="font-medium text-sm">{tx.title}</h3>
                <span className="text-xs text-gray-500">{tx.date} • {tx.category}</span>
              </div>
            </div>
            <div className="text-right">
              <span className={`font-semibold ${tx.amount < 0 ? 'text-red-500' : 'text-green-500'}`}>
                {tx.amount < 0 ? '-' : '+'}{formatCurrency(Math.abs(tx.amount))}
              </span>
              {tx.originalCurrency && tx.originalCurrency !== currency && (
                <div className="flex items-center text-xs text-gray-500">
                  <span>Originally {tx.originalCurrency}</span>
                  <RefreshCw size={10} className="mx-1" />
                </div>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="text-center py-6 bg-gray-50 border rounded-lg">
          <p className="text-gray-500 mb-2">No transactions to display</p>
          <div className="flex justify-center space-x-2">
            <WireframeButton onClick={onAddTransaction} variant="secondary" size="small">
              <Plus size={14} className="mr-1" /> Add Manually
            </WireframeButton>
            <WireframeButton onClick={onImportSms} variant="secondary" size="small">
              <MessageSquare size={14} className="mr-1" /> Import SMS
            </WireframeButton>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionsSection;
