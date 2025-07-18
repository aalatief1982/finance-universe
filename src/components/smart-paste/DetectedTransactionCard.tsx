
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Check } from 'lucide-react';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/utils/format-utils';

interface DetectedTransactionCardProps {
  transaction: Transaction;
  isSmartMatch: boolean;
  onAddTransaction: (transaction: Transaction) => void;
  origin?: "template" | "structure" | "ml" | "fallback";
}

const DetectedTransactionCard = ({
  transaction,
  isSmartMatch,
  onAddTransaction,
  origin
}: DetectedTransactionCardProps) => {
  const getOriginDisplay = () => {
    switch (origin) {
      case 'template':
        return { label: 'Template Match', color: 'bg-success/10 text-success border border-success/20' };
      case 'structure':
        return { label: 'Structure Match', color: 'bg-info/10 text-info border border-info/20' };
      case 'ml':
        return { label: 'AI Extracted', color: 'bg-warning/10 text-warning border border-warning/20' };
      case 'fallback':
        return { label: 'Fallback', color: 'bg-muted text-muted-foreground border border-border' };
      default:
        return { label: 'Unknown', color: 'bg-muted text-muted-foreground border border-border' };
    }
  };

  const originInfo = getOriginDisplay();

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-[var(--card-padding)]">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{transaction.title}</h3>
              {isSmartMatch && (
                <span className="bg-success/10 text-success text-xs px-2 py-0.5 rounded-full border border-success/20">
                  <Check className="inline h-3 w-3 mr-1" />
                  Smart Match
                </span>
              )}
              {origin && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${originInfo.color}`}>
                  {originInfo.label}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              {transaction.description || transaction.fromAccount || 'No description'}
            </p>
            <p className="text-lg font-semibold mt-2">
              {formatCurrency(transaction.amount, transaction.currency)}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="text-xs bg-muted px-2 py-1 rounded-md">
                {transaction.type}
              </span>
              <span className="text-xs bg-muted px-2 py-1 rounded-md">
                {transaction.category}
              </span>
              {transaction.subcategory && (
                <span className="text-xs bg-muted px-2 py-1 rounded-md">
                  {transaction.subcategory}
                </span>
              )}
            </div>
          </div>
          <Button 
            size="sm" 
            className="shrink-0"
            onClick={() => onAddTransaction(transaction)}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default DetectedTransactionCard;
