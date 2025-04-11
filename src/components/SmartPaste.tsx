// SmartPaste.tsx - Auto-fill fields after smart paste using learned entries
import React, { useState, useEffect } from 'react';
import { useLearningEngine } from '@/hooks/useLearningEngine';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';
import TransactionForm from '@/components/TransactionForm';

const SmartPaste: React.FC = () => {
  const [pastedMessage, setPastedMessage] = useState('');
  const [draftTransaction, setDraftTransaction] = useState<Transaction | null>(null);
  const { findBestMatch, extractAmountTokens, extractCurrencyTokens } = useLearningEngine();

  useEffect(() => {
    if (!pastedMessage) return;

    const match = findBestMatch(pastedMessage);

    if (match.matched && match.entry) {
      const { confirmedFields } = match.entry;

      const transaction: Transaction = {
        id: '',
        date: new Date().toISOString(),
        amount: confirmedFields.amount,
        currency: confirmedFields.currency as SupportedCurrency,
        type: confirmedFields.type as TransactionType,
        category: confirmedFields.category,
        subcategory: confirmedFields.subcategory,
        fromAccount: confirmedFields.account,
        toAccount: '',
        description: pastedMessage,
        title: `${confirmedFields.category}||${confirmedFields.subcategory}||${confirmedFields.amount}`,
        source: 'smart-paste'
      };

      setDraftTransaction(transaction);
    } else {
      // Use fallback inference logic
      const inferred: Partial<Transaction> = {
        amount: parseFloat(extractAmountTokens(pastedMessage)[0] || '0'),
        currency: (extractCurrencyTokens(pastedMessage)[0] || 'SAR') as SupportedCurrency,
        type: inferTypeFromText(pastedMessage),
        description: pastedMessage,
        title: `Uncategorized||Uncategorized||${extractAmountTokens(pastedMessage)[0] || '0'}`
      };

      const fallbackTx: Transaction = {
        id: '',
        date: new Date().toISOString(),
        amount: inferred.amount || 0,
        currency: inferred.currency || 'SAR',
        type: inferred.type || 'expense',
        category: 'Uncategorized',
        subcategory: '',
        fromAccount: '',
        toAccount: '',
        description: inferred.description!,
        title: inferred.title!,
        source: 'smart-paste'
      };

      setDraftTransaction(fallbackTx);
    }
  }, [pastedMessage]);

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('text');
    setPastedMessage(text);
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-xl font-bold mb-4">Smart Paste</h1>
      <textarea
        className="w-full border p-3 rounded mb-4"
        rows={5}
        placeholder="Paste your bank SMS here..."
        onPaste={handlePaste}
      />
      {draftTransaction && (
        <TransactionForm initialTransaction={draftTransaction} />
      )}
    </div>
  );
};

function inferTypeFromText(message: string): TransactionType {
  const text = message.toLowerCase();
  if (text.includes('شراء') || text.includes('debited') || text.includes('سداد')) return 'expense';
  if (text.includes('حوالة واردة') || text.includes('credited')) return 'income';
  return 'expense'; // default fallback
}

export default SmartPaste;
