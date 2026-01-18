import React from 'react';
import { Budget, BudgetPeriod } from '@/models/budget';
import { formatCurrency } from '@/utils/format-utils';
import { formatPeriodLabel } from '@/utils/budget-period-utils';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SiblingBudgetsContextProps {
  siblings: Budget[];
  currentAmount: number;
  currentPeriodIndex?: number;
  period: BudgetPeriod;
  year: number;
  currency: string;
  parentPeriodLabel?: string;
}

export function SiblingBudgetsContext({
  siblings,
  currentAmount,
  currentPeriodIndex,
  period,
  year,
  currency,
  parentPeriodLabel,
}: SiblingBudgetsContextProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  
  if (siblings.length === 0) return null;
  
  // Sort siblings by periodIndex
  const sortedSiblings = [...siblings].sort(
    (a, b) => (a.periodIndex || 0) - (b.periodIndex || 0)
  );
  
  // Calculate total including current
  const siblingTotal = sortedSiblings.reduce((sum, b) => sum + b.amount, 0);
  const totalWithCurrent = siblingTotal + currentAmount;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full">
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {parentPeriodLabel || 'Period'} Breakdown
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">
              Total: {formatCurrency(totalWithCurrent, currency)}
            </span>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="mt-2 space-y-1 pl-3 border-l-2 border-muted ml-2">
          {sortedSiblings.map(sibling => {
            const label = formatPeriodLabel(sibling.period, sibling.year, sibling.periodIndex);
            const isCurrent = sibling.periodIndex === currentPeriodIndex;
            
            return (
              <div 
                key={sibling.id}
                className={cn(
                  "flex items-center justify-between py-1.5 px-2 rounded text-sm",
                  isCurrent && "bg-primary/10"
                )}
              >
                <span className={cn(
                  "text-muted-foreground",
                  isCurrent && "text-primary font-medium"
                )}>
                  {label}
                  {isCurrent && " ← editing"}
                </span>
                <span className={cn(
                  "font-medium",
                  sibling.isOverride ? "text-foreground" : "text-muted-foreground"
                )}>
                  {formatCurrency(sibling.amount, currency)}
                  {!sibling.isOverride && (
                    <span className="ml-1 text-xs text-muted-foreground">(calc)</span>
                  )}
                </span>
              </div>
            );
          })}
          
          {/* Show current if not in siblings list */}
          {currentPeriodIndex && !sortedSiblings.find(s => s.periodIndex === currentPeriodIndex) && (
            <div className="flex items-center justify-between py-1.5 px-2 rounded text-sm bg-primary/10">
              <span className="text-primary font-medium">
                {formatPeriodLabel(period, year, currentPeriodIndex)} ← editing
              </span>
              <span className="font-medium text-primary">
                {formatCurrency(currentAmount, currency)}
              </span>
            </div>
          )}
          
          <div className="flex items-center justify-between py-2 px-2 border-t mt-2 font-medium text-sm">
            <span>Total</span>
            <span>{formatCurrency(totalWithCurrent, currency)}</span>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export default SiblingBudgetsContext;
