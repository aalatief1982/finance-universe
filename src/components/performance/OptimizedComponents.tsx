import React, { memo, useMemo } from 'react';
import { Transaction } from '@/types/transaction';
import { formatCurrency } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { AnimatedCard } from '@/components/animations/MicroInteractions';
import CategoryPill from '@/components/CategoryPill';
import { Calendar, Tag } from 'lucide-react';

interface OptimizedTransactionCardProps {
  transaction: Transaction;
  onClick?: () => void;
  className?: string;
}

const OptimizedTransactionCard = memo<OptimizedTransactionCardProps>(({
  transaction,
  onClick,
  className
}) => {
  const formattedAmount = useMemo(() => {
    return formatCurrency(transaction.amount);
  }, [transaction.amount]);

  const formattedDate = useMemo(() => {
    try {
      return new Date(transaction.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return transaction.date;
    }
  }, [transaction.date]);

  return (
    <div 
      className={cn(
        "p-[var(--card-padding)] rounded-lg bg-card border border-border cursor-pointer",
        "hover:shadow-elegant transition-all",
        className
      )}
      onClick={onClick}
    >
      <AnimatedCard delay={0}>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1 min-w-0">
            <h3 className="font-medium text-card-foreground truncate">
              {transaction.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar size={10} />
                {formattedDate}
              </span>
              <span className="flex items-center gap-1">
                <Tag size={10} />
                <CategoryPill category={transaction.category} />
              </span>
            </div>
          </div>
          <div className="ml-2 text-right">
            <p className={cn(
              "font-medium",
              transaction.amount < 0 ? "text-destructive" : "text-success"
            )}>
              {formattedAmount}
            </p>
          </div>
        </div>
      </AnimatedCard>
    </div>
  );
});

OptimizedTransactionCard.displayName = 'OptimizedTransactionCard';

export { OptimizedTransactionCard };