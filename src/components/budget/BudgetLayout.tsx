import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { BudgetNav } from './BudgetNav';
import { BudgetPeriodSelector } from './BudgetPeriodSelector';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useBudgetPeriodParams } from '@/hooks/useBudgetPeriodParams';
import { useIsMobile } from '@/hooks/use-mobile';

interface BudgetLayoutProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  showPeriodFilter?: boolean;
  showAddButton?: boolean;
  headerActions?: React.ReactNode;
}

export function BudgetLayout({ 
  children, 
  title: _title,
  description: _description,
  showPeriodFilter = true,
  showAddButton = true,
  headerActions,
}: BudgetLayoutProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { period, year, periodIndex, setPeriod, navigatePeriod, periodLabel } = useBudgetPeriodParams();

  return (
    <Layout withPadding={false} showBack fullWidth>
      <div className="w-full">
        <div className="sticky top-0 z-10 bg-background px-[var(--page-padding-x)] pt-0 pb-1.5 space-y-1">
          {/* Navigation Tabs */}
          <BudgetNav />

          {/* Period Filter */}
          {showPeriodFilter && (
            <BudgetPeriodSelector
              period={period}
              year={year}
              periodIndex={periodIndex}
              periodLabel={periodLabel}
              onPeriodChange={setPeriod}
              onNavigate={navigatePeriod}
            />
          )}

          {headerActions && (
            <div className="flex items-center justify-end gap-2">
              {headerActions}
            </div>
          )}
        </div>

        <div className="px-[var(--page-padding-x)] pt-2">
          <div className={showAddButton ? 'pb-24' : 'pb-20'}>
            {/* Page Content */}
            {children}
          </div>
        </div>
      </div>

      {/* Floating Action Button for Mobile */}
      {isMobile && showAddButton && (
        <Button
          size="icon"
          className="fixed bottom-16 right-4 z-40 h-12 w-12 rounded-full bg-primary text-primary-foreground shadow-lg"
          onClick={() => navigate('/budget/set')}
          aria-label="Add Budget"
        >
          <Plus className="h-5 w-5" />
        </Button>
      )}
    </Layout>
  );
}

export default BudgetLayout;
