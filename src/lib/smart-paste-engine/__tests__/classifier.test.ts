import { classifyText } from '../../../../functions/functions/src/classifier';

describe('classifyText', () => {
  it('extracts amount and currency', async () => {
    const res = await classifyText('Spent 100 SAR at Store');
    expect(res.amount).toBe('100');
    expect(res.currency).toBe('SAR');
  });
});
