
import React from 'react';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/transaction';

interface DetectedTransactionCardProps {
  transaction: Transaction;
  isSmartMatch: boolean;
  onAddTransaction: (transaction: Transaction) => void;
}

const DetectedTransactionCard: React.FC<DetectedTransactionCardProps> = ({ 
  transaction, 
  isSmartMatch,
  onAddTransaction 
}) => {
  return (
    <div className="p-3 border rounded-md">
      <div className="flex justify-between items-start sm:items-center flex-col sm:flex-row gap-2">
        <div>
          <h4 className="font-medium">{transaction.title}</h4>
          <p className="text-sm text-muted-foreground">
            Amount: {transaction.amount} | Category: {transaction.category}
          </p>
        </div>
        
            {transaction.notes?.includes('template') && (
      <span className="text-xs text-purple-600 font-semibold">Template Structure Match</span>
    )}

    {transaction.notes?.includes('ML') && (
      <span className="text-xs text-blue-600 font-semibold">Extracted with ML</span>
    )}

    {transaction.notes?.includes('fallback') && (
      <span className="text-xs text-gray-500 font-semibold">Fallback Parser Used</span>
    )}



        <Button
          variant="outline"
          size="sm"
          className="w-full sm:w-auto text-sm"
          onClick={() => onAddTransaction(transaction)}
        >
          Add Transaction
        </Button>
      </div>
      <div className="flex items-center mt-2 text-green-500 text-sm">
        {isSmartMatch ? (
          <>
            <CheckCircle className="h-4 w-4 mr-1" />
            AI Model Matched
          </>
        ) : (
          <>
            <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
            Basic Text Analysis
          </>
        )}
      </div>
    </div>
  );
};

export default DetectedTransactionCard;
