
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { Transaction, TransactionType } from '@/types/transaction';
import { SupportedCurrency } from '@/types/locale';

interface LearningSettingsProps {
  dummyTransaction: Transaction;
  setDummyTransaction: React.Dispatch<React.SetStateAction<Transaction>>;
  onLearnFromCurrentMessage: () => void;
}

const LearningSettings: React.FC<LearningSettingsProps> = ({
  dummyTransaction,
  setDummyTransaction,
  onLearnFromCurrentMessage
}) => {
  return (
    <div className="p-4 rounded-md border">
      <h3 className="text-sm font-medium mb-4">Transaction Data</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Amount</label>
          <Input
            type="number"
            placeholder="100.00"
            value={dummyTransaction.amount || ''}
            onChange={(e) => setDummyTransaction({
              ...dummyTransaction,
              amount: parseFloat(e.target.value) || 0
            })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Currency</label>
          <Input
            placeholder="USD"
            value={dummyTransaction.currency}
            onChange={(e) => setDummyTransaction({
              ...dummyTransaction,
              currency: e.target.value as SupportedCurrency
            })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Vendor/Description</label>
          <Input
            placeholder="Vendor name"
            value={dummyTransaction.description || ''}
            onChange={(e) => setDummyTransaction({
              ...dummyTransaction,
              description: e.target.value
            })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Account</label>
          <Input
            placeholder="Account"
            value={dummyTransaction.fromAccount || ''}
            onChange={(e) => setDummyTransaction({
              ...dummyTransaction,
              fromAccount: e.target.value
            })}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <select
            className="w-full rounded-md border border-input bg-background px-3 py-2"
            value={dummyTransaction.type}
            onChange={(e) => setDummyTransaction({
              ...dummyTransaction,
              type: e.target.value as TransactionType
            })}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
            <option value="transfer">Transfer</option>
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Category</label>
          <Input
            placeholder="Category"
            value={dummyTransaction.category || ''}
            onChange={(e) => setDummyTransaction({
              ...dummyTransaction,
              category: e.target.value
            })}
          />
        </div>
      </div>
      <div className="mt-6">
        <Button 
          onClick={onLearnFromCurrentMessage}
          className="w-full flex items-center justify-center gap-2"
        >
          <Save className="h-4 w-4" />
          Save as New Learned Entry
        </Button>
      </div>
    </div>
  );
};

export default LearningSettings;
