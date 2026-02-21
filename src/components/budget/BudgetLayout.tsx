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
      <div className="container px-1">
        <div className="px-[var(--page-padding-x)] pb-24">
          {(headerActions || showAddButton) && (
            <div className="flex items-center justify-end gap-2 mb-4">
              {headerActions}
              {showAddButton && (
                <Button size="sm" onClick={() => navigate('/budget/set')}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>
          )}

          {/* Navigation Tabs */}
          <BudgetNav className="mb-4" />

          {/* Period Filter */}
          {showPeriodFilter && (
            <BudgetPeriodSelector
              period={period}
              year={year}
              periodIndex={periodIndex}
              periodLabel={periodLabel}
              onPeriodChange={setPeriod}
              onNavigate={navigatePeriod}
              className="mb-6"
            />
          )}

          {/* Page Content */}
          {children}
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
