import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import { loadKeywordBank, saveKeywordBank, deleteKeyword, KeywordEntry } from '../keywordBankUtils';

describe('keywordBankUtils', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    localStorage.clear();
  });

  it('returns an empty keyword bank when none exists', () => {
    const bank = loadKeywordBank();
    expect(bank).toEqual([]);
  });

  it('saves and retrieves a keyword bank', () => {
    const bank: KeywordEntry[] = [
      {
        keyword: 'restaurant',
        type: 'expense',
        mappings: [{ field: 'category', value: 'Food' }],
      },
    ];
    saveKeywordBank(bank);
    expect(loadKeywordBank()).toEqual(bank);
  });

  it('saves multiple keywords', () => {
    const bank: KeywordEntry[] = [
      {
        keyword: 'uber',
        type: 'expense',
        mappings: [{ field: 'category', value: 'Transport' }],
      },
      {
        keyword: 'salary',
        type: 'income',
        mappings: [{ field: 'category', value: 'Income' }],
      },
    ];
    saveKeywordBank(bank);
    const loaded = loadKeywordBank();
    expect(loaded).toHaveLength(2);
  });

  it('deletes a keyword by name', () => {
    const bank: KeywordEntry[] = [
      {
        keyword: 'restaurant',
        type: 'expense',
        mappings: [{ field: 'category', value: 'Food' }],
      },
      {
        keyword: 'cafe',
        type: 'expense',
        mappings: [{ field: 'category', value: 'Food' }],
      },
    ];
    saveKeywordBank(bank);
    deleteKeyword('restaurant');
    const loaded = loadKeywordBank();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].keyword).toBe('cafe');
  });

  it('handles case-insensitive keyword deletion', () => {
    const bank: KeywordEntry[] = [
      {
        keyword: 'Uber',
        type: 'expense',
        mappings: [{ field: 'vendor', value: 'Uber' }],
      },
    ];
    saveKeywordBank(bank);
    deleteKeyword('uber'); // lowercase
    const loaded = loadKeywordBank();
    expect(loaded).toHaveLength(0);
  });
});
