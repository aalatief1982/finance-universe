import { describe, expect, it } from 'vitest';
import { findCategoryForVendor } from '../CategoryInferencer';

describe('CategoryInferencer', () => {
  it('infers category based on vendor keyword', () => {
    const result = findCategoryForVendor('Starbucks Riyadh', 'expense');
    expect(result.category).toBe('Food & Dining');
    expect(result.subcategory).toBe('Coffee Shops');
  });

  it('falls back to defaults when no match found', () => {
    const result = findCategoryForVendor('Unknown Vendor', 'income');
    expect(result.category).toBe('Income');
    expect(result.subcategory).toBe('Other Income');
  });
});
