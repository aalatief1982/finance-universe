import { describe, expect, it } from 'vitest';
import { canAccessEngineOut } from '@/utils/engineOutAccess';

describe('canAccessEngineOut', () => {
  it('returns false when admin is disabled', () => {
    expect(canAccessEngineOut(false, null)).toBe(false);
  });

  it('returns true only with admin + valid state', () => {
    const dto = {
      transaction: { id: '', title: '', amount: 0, category: 'Uncategorized', subcategory: 'none', date: '2025-01-01', type: 'expense', source: 'smart-paste', currency: 'SAR', fromAccount: '' },
      rawMessage: '',
      fieldConfidences: {},
      mode: 'create' as const,
      isSuggested: true,
    };

    expect(canAccessEngineOut(true, { source: 'smart_entry', inferenceDTO: dto, continueState: dto })).toBe(true);
  });
});
