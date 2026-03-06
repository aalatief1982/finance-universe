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
        <div className="sticky top-0 z-10 bg-background px-[var(--page-padding-x)] pt-0 pb-1 space-y-1.5">
          {headerActions && (
            <div className="flex items-center justify-end gap-2">
              {headerActions}
            </div>
          )}

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
          size="lg"
          className="fixed bottom-20 right-4 h-14 w-14 rounded-full shadow-lg z-50"
          onClick={() => navigate('/budget/set')}
        >
          <Plus className="h-6 w-6" />
        </Button>
      )}
    </Layout>
  );
}

export default BudgetLayout;
