import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { BudgetProgressCard } from './BudgetProgressCard';
import { Budget } from '@/models/budget';
import { BudgetProgress } from '@/models/budget-period';

describe('BudgetProgressCard', () => {
  const budget: Budget = {
    id: 'budget-1',
    scope: 'category',
    targetId: 'category-1',
    amount: 1000,
    currency: 'USD',
    period: 'monthly',
    year: 2024,
    periodIndex: 1,
    isOverride: true,
    alertThresholds: [50, 80, 100],
    isActive: true,
  };

  const progress: BudgetProgress = {
    budgetId: 'budget-1',
    budgeted: 1000,
    spent: 250,
    remaining: 750,
    percentUsed: 25,
    periodStart: new Date('2024-01-01'),
    periodEnd: new Date('2024-01-31'),
    isOverBudget: false,
    daysRemaining: 10,
    dailyBudgetRemaining: 75,
    triggeredAlerts: [],
  };

  it('renders target name and percent used', () => {
    render(
      <BudgetProgressCard
        budget={budget}
        progress={progress}
        targetName="Food"
      />
    );

    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('25%')).toBeInTheDocument();
  });

  it('invokes onClick when card is clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <BudgetProgressCard
        budget={budget}
        progress={progress}
        targetName="Food"
        onClick={handleClick}
      />
    );

    await user.click(screen.getByText('Food'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
