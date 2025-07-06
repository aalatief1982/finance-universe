import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Form } from '@/components/ui/form';
import CategorySelector from '../CategorySelector';
import { useForm, type UseFormReturn } from 'react-hook-form';
import type { TransactionFormValues } from '../transaction-form-schema';
import { vi } from 'vitest';
import { getCategoriesForType } from '@/lib/categories-data';

vi.mock('@/lib/categories-data', () => ({
  getCategoriesForType: vi.fn(),
}));

const mockCategories = ['Food', 'Utilities', 'Entertainment'];

function renderWithForm() {
  let methods: UseFormReturn<TransactionFormValues>;
  const Wrapper = () => {
    methods = useForm<TransactionFormValues>({
      defaultValues: {
        title: '',
        amount: 0,
        category: '',
        subcategory: 'none',
        date: '',
        type: 'expense',
        fromAccount: '',
        toAccount: '',
        description: '',
        notes: '',
        person: 'none',
        currency: 'USD',
      },
    });
    return (
      <Form {...methods}>
        <CategorySelector form={methods} transactionType="expense" />
      </Form>
    );
  };

  const utils = render(<Wrapper />);
  return { ...utils, methods: methods! };
}

describe('CategorySelector', () => {
  beforeEach(() => {
    vi.mocked(getCategoriesForType).mockReturnValue(mockCategories);
  });

  it('lists all categories for the chosen type', () => {
    renderWithForm();
    fireEvent.click(screen.getByRole('combobox'));
    mockCategories.forEach(cat => {
      expect(screen.getByText(cat)).toBeInTheDocument();
    });
  });

  it('resets subcategory when a category is selected', () => {
    const { methods } = renderWithForm();
    const spy = vi.spyOn(methods, 'setValue');

    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByText(mockCategories[0]));

    expect(spy).toHaveBeenCalledWith('subcategory', 'none');
  });
});
