
import React from 'react';
import { Transaction } from '@/types/transaction';

interface TransactionPreviewProps {
  transaction: Transaction;
}

const TransactionPreview: React.FC<TransactionPreviewProps> = ({ transaction }) => {
  return (
    <div className="bg-muted/30 p-4 rounded-md">
      <h3 className="text-sm font-medium mb-3">Transaction Preview</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Type</div>
          <div className="font-medium">{transaction.type}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Amount</div>
          <div className="font-medium">{transaction.amount}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Currency</div>
          <div className="font-medium">{transaction.currency}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Category</div>
          <div className="font-medium">{transaction.category}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Description/Vendor</div>
          <div className="font-medium">{transaction.description || '(None)'}</div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Account</div>
          <div className="font-medium">{transaction.fromAccount || '(None)'}</div>
        </div>
      </div>
    </div>
  );
};

export default TransactionPreview;
