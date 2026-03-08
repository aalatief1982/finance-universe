import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { LanguageProvider } from '@/i18n/LanguageContext';
import DashboardStats from '../DashboardStats';

const formatNumericAmount = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
    .formatToParts(amount)
    .filter((part) => part.type !== 'currency' && part.type !== 'literal')
    .map((part) => part.value)
    .join('')
    .trim();

describe('DashboardStats', () => {
  it('renders income, expenses and balance values without currency prefix', () => {
    render(
      <DashboardStats income={1000} expenses={200} balance={800} currencyCode="USD" />
    );

    expect(screen.getByText('Income [USD]')).toBeInTheDocument();
    expect(screen.getByText('Expenses [USD]')).toBeInTheDocument();
    expect(screen.getByText('Balance [USD]')).toBeInTheDocument();

    expect(screen.getByText(formatNumericAmount(1000))).toBeInTheDocument();
    expect(screen.getByText(formatNumericAmount(200))).toBeInTheDocument();
    expect(screen.getByText(formatNumericAmount(800))).toBeInTheDocument();
  });

  it('shows percentage change when previousBalance provided', () => {
    render(
      <DashboardStats income={500} expenses={200} balance={300} previousBalance={200} currencyCode="USD" />
    );

    expect(screen.getByText(/50\.0% from last month/)).toBeInTheDocument();
  });
});
