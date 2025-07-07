import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import TransactionCard from '../TransactionCard';
import { formatCurrency } from '@/utils/format-utils';
import type { Transaction } from '@/types/transaction';

describe('TransactionCard', () => {
  const transaction: Transaction = {
    id: '1',
    title: 'Coffee',
    amount: 4.5,
    category: 'Food',
    date: '2024-05-01T10:00:00Z',
    type: 'income',
    source: 'manual',
  };

  it('renders title, amount and category', () => {
    render(<TransactionCard transaction={transaction} />);

    expect(screen.getByText(transaction.title)).toBeInTheDocument();
    expect(
      screen.getByText(
        `+${formatCurrency(transaction.amount, transaction.currency || 'USD')}`
      )
    ).toBeInTheDocument();
    expect(screen.getByText(transaction.category)).toBeInTheDocument();
  });

  it('calls callbacks when actions clicked', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <TransactionCard
        transaction={transaction}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /edit/i }));
    expect(onEdit).toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    expect(onDelete).toHaveBeenCalled();
  });

  it('hides actions when showActions is false', () => {
    render(
      <TransactionCard
        transaction={transaction}
        onEdit={() => {}}
        onDelete={() => {}}
        showActions={false}
      />
    );

    expect(screen.queryByRole('button', { name: /edit/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull();
  });
});
