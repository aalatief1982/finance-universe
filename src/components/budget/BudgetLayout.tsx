import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { BudgetNav } from './BudgetNav';
import { BudgetPeriodSelector } from './BudgetPeriodSelector';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useBudgetPeriodParams, PeriodFilter } from '@/hooks/useBudgetPeriodParams';
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
  title, 
  description,
  showPeriodFilter = true,
  showAddButton = true,
  headerActions,
}: BudgetLayoutProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { period, year, periodIndex, setPeriod, navigatePeriod, periodLabel } = useBudgetPeriodParams();

  return (
    <Layout showBack>
      <div className="container px-4 pb-24">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {headerActions}
            {showAddButton && (
              <Button size="sm" onClick={() => navigate('/budget/set')}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            )}
          </div>
        </div>

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
