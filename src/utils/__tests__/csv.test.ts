import { convertTransactionsToCsv, parseCsvTransactions } from '../csv';
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
      source: 'manual'
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
      currency: 'USD'
    }
  ];

  it('converts transactions to CSV and back', () => {
    const csv = convertTransactionsToCsv(sampleTransactions);
    const parsed = parseCsvTransactions(csv);
    expect(parsed).toEqual(sampleTransactions);
  });

  it('ignores rows missing required fields when parsing', () => {
    const csv =
      'id,title,amount,category,subcategory,date,type,notes,source,currency,person,fromAccount,toAccount,country,description,originalCurrency,vendor,account,createdAt\n' +
      '"1","Item","10","Other","","2024-06-01","expense","","manual","","","","","","","","",""\n' +
      '"2","","5","Misc","","2024-06-02","expense","","manual","","","","","","","","",""';

    const parsed = parseCsvTransactions(csv);
    expect(parsed.length).toBe(1);
    expect(parsed[0].id).toBe('1');
    expect(parsed[0].title).toBe('Item');
  });
});
