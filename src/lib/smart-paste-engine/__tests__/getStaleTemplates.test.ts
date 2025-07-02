import { getStaleTemplates } from '../templateUtils';
import { SmartPasteTemplate } from '@/types/template';

describe('getStaleTemplates', () => {
  it('returns templates older than threshold', () => {
    const oldDate = new Date(Date.now() - 100 * 86400000).toISOString();
    const recentDate = new Date(Date.now() - 10 * 86400000).toISOString();
    const bank: Record<string, SmartPasteTemplate> = {
      old: {
        id: 'old',
        template: 't1',
        fields: [],
        created: '',
        meta: { createdAt: '', lastUsedAt: oldDate }
      },
      recent: {
        id: 'recent',
        template: 't2',
        fields: [],
        created: '',
        meta: { createdAt: '', lastUsedAt: recentDate }
      }
    };

    const result = getStaleTemplates(bank, 90);
    expect(result.map(t => t.id)).toEqual(['old']);
  });

  it('treats templates without lastUsedAt as stale', () => {
    const bank: Record<string, SmartPasteTemplate> = {
      stale: {
        id: 'stale',
        template: 't',
        fields: [],
        created: '',
        meta: { createdAt: '' }
      }
    };

    const result = getStaleTemplates(bank, 1);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('stale');
  });
});
