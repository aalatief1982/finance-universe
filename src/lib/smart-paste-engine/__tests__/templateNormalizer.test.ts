import normalizeTemplateStructure from '../templateNormalizer';

describe('normalizeTemplateStructure', () => {
  it('normalizes messages with differing whitespace and smart quotes equivalently', () => {
    const msg1 = 'Paid 1000 SAR to “Store” on 1/2/2024';
    const msg2 = '  Paid 1,000 SAR to "Store" on 2024-01-02  ';

    const res1 = normalizeTemplateStructure(msg1);
    const res2 = normalizeTemplateStructure(msg2);

    expect(res1.structure).toBe('Paid AMOUNT SAR to "Store" on DATE');
    expect(res1).toEqual(res2);
  });
});
