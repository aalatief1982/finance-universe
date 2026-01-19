import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteKeyword, loadKeywordBank, saveKeywordBank } from '../keywordBankUtils';
import type { KeywordEntry } from '../keywordBankUtils';

const createStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  } as Storage;
};

describe('keywordBankUtils', () => {
  beforeEach(() => {
    const mockStorage = createStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      configurable: true,
    });
  });

  it('saves and loads keyword banks', () => {
    const bank: KeywordEntry[] = [
      {
        keyword: 'amazon',
        type: 'auto',
        mappings: [{ field: 'category', value: 'Shopping' }],
      },
    ];

    saveKeywordBank(bank);
    const loaded = loadKeywordBank();

    expect(loaded).toEqual(bank);
  });

  it('deletes keywords case-insensitively', () => {
    const bank: KeywordEntry[] = [
      {
        keyword: 'Cafe',
        type: 'auto',
        mappings: [{ field: 'category', value: 'Food' }],
      },
      {
        keyword: 'store',
        type: 'auto',
        mappings: [{ field: 'category', value: 'Shopping' }],
      },
    ];

    saveKeywordBank(bank);
    deleteKeyword('cafe');

    const loaded = loadKeywordBank();
    expect(loaded).toHaveLength(1);
    expect(loaded[0].keyword).toBe('store');
  });
});
