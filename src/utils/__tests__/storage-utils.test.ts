import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import {
  storeTransactions,
  getStoredTransactions,
  saveStructureTemplate,
  getStructureTemplates,
  safeSetItem,
} from '../storage-utils';
import { StructureTemplateEntry } from '@/types/template';

describe('storage-utils', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    localStorage.clear();
  });

  it('stores and retrieves transactions', () => {
    const transactions = [
      {
        id: '1',
        title: 'Test',
        amount: 100,
        category: 'Food',
        date: '2024-01-01',
        type: 'expense' as const,
        source: 'manual' as const,
      },
    ];
    storeTransactions(transactions);
    const retrieved = getStoredTransactions();
    expect(retrieved).toHaveLength(1);
    expect(retrieved[0].id).toBe('1');
  });

  it('saves structure templates in most-recent order', () => {
    const template1: StructureTemplateEntry = {
      id: '1',
      structure: 'Payment of {{amount}}',
      fields: ['amount'],
      createdAt: '2024-01-01T00:00:00Z',
    };
    const template2: StructureTemplateEntry = {
      id: '2',
      structure: 'Transfer {{amount}}',
      fields: ['amount'],
      createdAt: '2024-01-02T00:00:00Z',
    };

    saveStructureTemplate(template1);
    saveStructureTemplate(template2);

    const templates = getStructureTemplates();
    expect(templates).toHaveLength(2);
    // Most recent first (unshift order)
    expect(templates[0].id).toBe('2');
  });

  it('returns success when safeSetItem writes to storage', () => {
    const result = safeSetItem('test_key', 'test_value');
    expect(result).toBe(true);
    expect(localStorage.getItem('test_key')).toBe('"test_value"');
  });

  it('returns empty array when no transactions exist', () => {
    const transactions = getStoredTransactions();
    expect(transactions).toEqual([]);
  });

  it('returns empty array when no templates exist', () => {
    const templates = getStructureTemplates();
    expect(templates).toEqual([]);
  });
});
