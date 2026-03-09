import { render, screen, within, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import TransactionList from '../TransactionList';
import { formatCurrency } from '@/utils/format-utils';
import type { Transaction } from '@/types/transaction';
import { vi } from 'vitest';
import { LanguageProvider } from '@/i18n/LanguageContext';

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: () => false,
}));

describe('TransactionList', () => {
  const transaction: Transaction = {
    id: '1',
    title: 'Coffee',
    amount: 4.5,
    category: 'Food',
    date: '2024-05-01',
    type: 'income',
    source: 'manual',
    currency: 'USD',
  };

  it('renders transaction title, amount and category', () => {
    render(<LanguageProvider><TransactionList transactions={[transaction]} /></LanguageProvider>);

    expect(screen.getByText(transaction.title)).toBeInTheDocument();
    expect(
      screen.getByText(formatCurrency(transaction.amount, 'USD')),
    ).toBeInTheDocument();
    expect(screen.getByText(transaction.category)).toBeInTheDocument();
  });

  it('calls onEdit and onDelete when buttons clicked', () => {
    const handleEdit = vi.fn();
    const handleDelete = vi.fn();
    render(
      <LanguageProvider>
        <TransactionList
          transactions={[transaction]}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </LanguageProvider>,
    );

    const row = screen.getByText(transaction.title).closest('tr')!;
    const buttons = within(row).getAllByRole('button');
    fireEvent.click(buttons[0]);
    expect(handleEdit).toHaveBeenCalledWith(transaction);

    fireEvent.click(buttons[1]);
    expect(
      screen.getByText('Are you sure you want to delete this transaction?')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'OK' }));
    expect(handleDelete).toHaveBeenCalledWith(transaction.id);
  });

  it('shows loading skeleton when isLoading', () => {
    const { container } = render(
      <TransactionList transactions={[transaction]} isLoading />,
    );
    expect(container.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });

  it('renders empty message when no transactions', () => {
    render(
      <TransactionList transactions={[]} emptyMessage="Nothing here" />,
    );
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
  });
});
