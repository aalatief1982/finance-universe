import { normalizeTemplateStructure } from '../templateNormalizer';
import { createHash } from 'crypto';

describe('normalizeTemplateStructure', () => {
  const hash = (text: string) =>
    createHash('sha256').update(text, 'utf8').digest('hex');

  it('returns same hash for equivalent messages', () => {
    const msg1 = 'Hello – you spent 50 SAR.';
    const msg2 = 'Hello -    you spent  50 SAR.';

    const normalized1 = normalizeTemplateStructure(msg1);
    const normalized2 = normalizeTemplateStructure(msg2);

    expect(hash(normalized1)).toBe(hash(normalized2));
  });
});
