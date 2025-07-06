import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardStats from '../DashboardStats';
import { formatCurrency } from '@/lib/formatters';

describe('DashboardStats', () => {
  it('renders income, expenses and balance', () => {
    render(
      <DashboardStats income={1000} expenses={200} balance={800} />
    );

    expect(screen.getByText(formatCurrency(1000))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(200))).toBeInTheDocument();
    expect(screen.getByText(formatCurrency(800))).toBeInTheDocument();
  });

  it('shows percentage change when previousBalance provided', () => {
    render(
      <DashboardStats income={500} expenses={200} balance={300} previousBalance={200} />
    );

    expect(screen.getByText(/50\.0% from last month/)).toBeInTheDocument();
  });
});
