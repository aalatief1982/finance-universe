import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getStoredTransactions,
  saveStructureTemplate,
  getStructureTemplates,
  safeSetItem,
  storeTransaction,
} from '../storage-utils';
import type { StructureTemplateEntry } from '@/types/template';

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

describe('storage-utils', () => {
  beforeEach(() => {
    const mockStorage = createStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      configurable: true,
    });
  });

  it('stores and retrieves transactions', () => {
    const transaction = {
      id: 'txn-1',
      title: 'Lunch',
      amount: 20,
      category: 'Food',
      date: '2024-02-01',
      type: 'expense',
      source: 'manual',
      fromAccount: 'Cash',
    };

    storeTransaction(transaction);

    const stored = getStoredTransactions();
    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe('txn-1');
  });

  it('saves structure templates in most-recent order', () => {
    const first: StructureTemplateEntry = {
      id: 'template-1',
      structure: 'Paid {{amount}}',
      fields: ['amount'],
      createdAt: '2024-01-01T00:00:00.000Z',
    };
    const next: StructureTemplateEntry = {
      id: 'template-2',
      structure: 'Paid {{amount}} to {{vendor}}',
      fields: ['amount', 'vendor'],
      createdAt: '2024-01-02T00:00:00.000Z',
    };

    saveStructureTemplate(first);
    saveStructureTemplate(next);

    const stored = getStructureTemplates();
    expect(stored[0].id).toBe('template-2');
    expect(stored[1].id).toBe('template-1');
  });

  it('returns success when safeSetItem writes to storage', () => {
    const result = safeSetItem('xpensia_test', { ok: true });
    expect(result).toBe(true);
  });
});
