import { convertTransactionsToCsv, parseCsvTransactions, TRANSACTION_CSV_COLUMNS } from '../csv';
import { Transaction } from '@/types/transaction';

describe('CSV utilities', () => {
  const sampleTransactions: Transaction[] = [
    {
      id: '1',
      title: 'Coffee',
      amount: 4.5,
      category: 'Food',
      date: '2024-05-01',
      type: 'expense',
      source: 'manual',
      currency: 'USD',
      createdAt: '2024-05-01T00:00:00.000Z',
    },
    {
      id: '2',
      title: 'Salary',
      amount: 5000,
      category: 'Income',
      date: '2024-05-02',
      type: 'income',
      source: 'manual',
      notes: 'Monthly salary',
      currency: 'USD',
      createdAt: '2024-05-02T00:00:00.000Z',
    }
  ];

  it('converts transactions to CSV and back', () => {
    const csv = convertTransactionsToCsv(sampleTransactions);
    const parsed = parseCsvTransactions(csv);
    expect(parsed).toEqual(sampleTransactions);
  });

  it('exports with the exact required header order', () => {
    const csv = convertTransactionsToCsv(sampleTransactions);
    const [header] = csv.split('\n');
    expect(header).toBe(TRANSACTION_CSV_COLUMNS.join(','));
  });

  it('throws when required fields are missing when parsing', () => {
    const csv =
      `${TRANSACTION_CSV_COLUMNS.join(',')}\n` +
      '"1","Item","10","Other","","2024-06-01","expense","","manual","USD","","","","","","","","","","","","","","",""';

    expect(() => parseCsvTransactions(csv)).toThrow('Missing required fields');
  });

  it('throws when CSV header does not match required format', () => {
    const csv =
      'id,title,amount,date,type,currency,createdAt\n' +
      '"1","Item","10","2024-06-01","expense","USD","2024-06-01T00:00:00.000Z"';

    expect(() => parseCsvTransactions(csv)).toThrow('Invalid CSV format');
  });

  it('handles newline characters in fields', () => {
    const txns: Transaction[] = [
      {
        id: '3',
        title: 'Note with newline',
        amount: 10,
        category: 'Misc',
        date: '2024-07-01',
        type: 'expense',
        source: 'manual',
        notes: 'line1\nline2',
        currency: 'USD',
        createdAt: '2024-07-01T00:00:00.000Z',
      },
    ];

    const csv = convertTransactionsToCsv(txns);
    const parsed = parseCsvTransactions(csv);
    expect(parsed).toEqual(txns);
  });
});
