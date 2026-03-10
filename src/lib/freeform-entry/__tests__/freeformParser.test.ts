import { describe, it, expect, beforeEach } from 'vitest';
import { parseFreeformTransaction } from '../freeformParser';

describe('parseFreeformTransaction', () => {
  beforeEach(() => {
    localStorage.removeItem('xpensia_freeform_learned_mappings');
  });

  // --- English expense phrases ---
  it('parses "coffee 18 riyals" as expense', () => {
    const r = parseFreeformTransaction('coffee 18 riyals');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(18);
    expect(r.type).toBe('expense');
    expect(r.currency).toBe('SAR');
    expect(r.title.toLowerCase()).toContain('coffee');
    expect(r.category).toBe('Food & Drink');
  });

  it('parses "groceries 82" as expense', () => {
    const r = parseFreeformTransaction('groceries 82');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(82);
    expect(r.type).toBe('expense');
    expect(r.category).toBe('Groceries');
  });

  // --- Arabic expense phrases ---
  it('parses "قهوة 18 ريال" as expense', () => {
    const r = parseFreeformTransaction('قهوة 18 ريال');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(18);
    expect(r.type).toBe('expense');
    expect(r.currency).toBe('SAR');
    expect(r.title).toContain('قهوة');
  });

  it('parses "بنزين 120" as expense', () => {
    const r = parseFreeformTransaction('بنزين 120');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(120);
    expect(r.type).toBe('expense');
    expect(r.category).toBe('Transportation');
  });

  // --- Income phrases ---
  it('parses "salary 12000" as income', () => {
    const r = parseFreeformTransaction('salary 12000');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(12000);
    expect(r.type).toBe('income');
    expect(r.category).toBe('Income');
  });

  it('parses "راتب 12000" as income', () => {
    const r = parseFreeformTransaction('راتب 12000');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(12000);
    expect(r.type).toBe('income');
  });

  // --- Transfer phrases ---
  it('parses "transferred 500 to Ahmed" as transfer', () => {
    const r = parseFreeformTransaction('transferred 500 to Ahmed');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(500);
    expect(r.type).toBe('transfer');
    expect(r.counterparty).toBe('Ahmed');
  });

  it('parses "حولت 500 لأحمد" as transfer', () => {
    const r = parseFreeformTransaction('حولت 500 لأحمد');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(500);
    expect(r.type).toBe('transfer');
    expect(r.counterparty).toBe('أحمد');
  });


  it('applies exact learned mapping for repeated freeform vendor phrase', () => {
    localStorage.setItem('xpensia_freeform_learned_mappings', JSON.stringify([
      {
        normalizedVendor: 'bolt',
        category: 'Transportation',
        subcategory: 'Apps',
        type: 'expense',
        currency: 'SAR',
        confirmedCount: 2,
        lastConfirmedAt: '2026-03-10T11:11:55.053Z',
      },
    ]));

    const r = parseFreeformTransaction('bolt 31');
    expect(r.success).toBe(true);
    expect(r.amount).toBe(31);
    expect(r.category).toBe('Transportation');
    expect(r.subcategory).toBe('Apps');
    expect(r.type).toBe('expense');
    expect(r.currency).toBe('SAR');
    expect(r.learnedMappingApplied?.normalizedVendor).toBe('bolt');
    expect(r.learnedMappingApplied?.appliedFields).toContain('category');
  });

  it('does not override stronger parsed type evidence with learned mapping', () => {
    localStorage.setItem('xpensia_freeform_learned_mappings', JSON.stringify([
      {
        normalizedVendor: 'salary',
        category: 'Food',
        subcategory: 'Dining Out',
        type: 'expense',
        currency: 'SAR',
        confirmedCount: 3,
        lastConfirmedAt: '2026-03-10T11:11:55.053Z',
      },
    ]));

    const r = parseFreeformTransaction('salary 12000');
    expect(r.success).toBe(true);
    expect(r.type).toBe('income');
    expect(r.learnedMappingApplied?.appliedFields || []).not.toContain('type');
  });

  // --- No amount = fail ---
  it('returns success=false for text without amount', () => {
    const r = parseFreeformTransaction('just some random text');
    expect(r.success).toBe(false);
    expect(r.amount).toBe(0);
  });

  // --- Relative dates ---
  it('resolves "yesterday" date word', () => {
    const r = parseFreeformTransaction('coffee 18 yesterday');
    expect(r.success).toBe(true);
    expect(r.dateDefaulted).toBe(false);
  });

  // --- Confidence is reasonable ---
  it('produces confidence between 0 and 1', () => {
    const r = parseFreeformTransaction('coffee 18 riyals');
    expect(r.confidence).toBeGreaterThan(0);
    expect(r.confidence).toBeLessThanOrEqual(1);
  });
});
