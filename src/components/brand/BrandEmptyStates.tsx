import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { XpensiaLogo } from '@/components/header/XpensiaLogo';
import { Plus, Search, Filter, Calendar, CreditCard, PieChart } from 'lucide-react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline';
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

const BrandEmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  secondaryAction
}) => {
  return (
    <Card className="border-dashed">
      <CardContent className="pt-6 text-center space-y-6">
        {/* Brand Logo - Small */}
        <div className="flex justify-center">
          <XpensiaLogo className="h-8 w-8 opacity-20" />
        </div>

        {/* Main Icon */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            {icon}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {title}
          </h3>
          <p className="text-muted-foreground max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Actions */}
        {(action || secondaryAction) && (
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {action && (
              <Button 
                onClick={action.onClick}
                variant={action.variant || 'default'}
              >
                {action.label}
              </Button>
            )}
            {secondaryAction && (
              <Button 
                onClick={secondaryAction.onClick}
                variant="outline"
              >
                {secondaryAction.label}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Pre-configured empty states
interface EmptyTransactionsProps {
  onAddTransaction: () => void;
  onImportSMS?: () => void;
}

export const EmptyTransactions: React.FC<EmptyTransactionsProps> = ({
  onAddTransaction,
  onImportSMS
}) => (
  <BrandEmptyState
    icon={<CreditCard className="h-8 w-8 text-muted-foreground" />}
    title="No transactions yet"
    description="Start tracking your expenses by adding your first transaction or importing from SMS."
    action={{
      label: "Add Transaction",
      onClick: onAddTransaction
    }}
    secondaryAction={onImportSMS ? {
      label: "Import from SMS",
      onClick: onImportSMS
    } : undefined}
  />
);

interface EmptySearchResultsProps {
  onClearSearch: () => void;
}

export const EmptySearchResults: React.FC<EmptySearchResultsProps> = ({
  onClearSearch
}) => (
  <BrandEmptyState
    icon={<Search className="h-8 w-8 text-muted-foreground" />}
    title="No results found"
    description="We couldn't find any transactions matching your search criteria."
    action={{
      label: "Clear Search",
      onClick: onClearSearch,
      variant: "outline"
    }}
  />
);

interface EmptyFilterResultsProps {
  onClearFilters: () => void;
}

export const EmptyFilterResults: React.FC<EmptyFilterResultsProps> = ({
  onClearFilters
}) => (
  <BrandEmptyState
    icon={<Filter className="h-8 w-8 text-muted-foreground" />}
    title="No transactions match filters"
    description="Try adjusting your filters to see more transactions."
    action={{
      label: "Clear Filters",
      onClick: onClearFilters,
      variant: "outline"
    }}
  />
);

interface EmptyAnalyticsProps {
  onAddTransaction: () => void;
}

export const EmptyAnalytics: React.FC<EmptyAnalyticsProps> = ({
  onAddTransaction
}) => (
  <BrandEmptyState
    icon={<PieChart className="h-8 w-8 text-muted-foreground" />}
    title="No data to analyze"
    description="Add some transactions to see insights and analytics about your spending."
    action={{
      label: "Add Transactions",
      onClick: onAddTransaction
    }}
  />
);

interface EmptyDateRangeProps {
  onSelectDifferentRange: () => void;
}

export const EmptyDateRange: React.FC<EmptyDateRangeProps> = ({
  onSelectDifferentRange
}) => (
  <BrandEmptyState
    icon={<Calendar className="h-8 w-8 text-muted-foreground" />}
    title="No transactions in this period"
    description="There are no transactions in the selected date range."
    action={{
      label: "Select Different Range",
      onClick: onSelectDifferentRange,
      variant: "outline"
    }}
  />
);

export default BrandEmptyState;