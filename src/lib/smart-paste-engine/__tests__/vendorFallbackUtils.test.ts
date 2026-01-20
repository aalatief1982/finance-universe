import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import {
  loadVendorFallbacks,
  saveVendorFallbacks,
  getVendorNames,
  addUserVendor,
  VendorFallbackData,
} from '../vendorFallbackUtils';

describe('vendorFallbackUtils', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    localStorage.clear();
  });

  it('returns an empty object when no fallbacks exist', () => {
    const fallbacks = loadVendorFallbacks();
    expect(fallbacks).toEqual({});
  });

  it('saves and retrieves vendor fallbacks', () => {
    const data: Record<string, VendorFallbackData> = {
      amazon: {
        type: 'expense',
        category: 'Shopping',
        subcategory: 'Online',
      },
    };
    saveVendorFallbacks(data);
    const fallbacks = loadVendorFallbacks();
    expect(fallbacks['amazon']).toBeDefined();
    expect(fallbacks['amazon'].category).toBe('Shopping');
  });

  it('overwrites existing fallback for same vendor', () => {
    saveVendorFallbacks({
      amazon: { type: 'expense', category: 'Shopping', subcategory: '' },
    });
    saveVendorFallbacks({
      amazon: { type: 'expense', category: 'Electronics', subcategory: '' },
    });
    const fallbacks = loadVendorFallbacks();
    expect(fallbacks['amazon'].category).toBe('Electronics');
  });

  it('gets vendor names', () => {
    saveVendorFallbacks({
      amazon: { type: 'expense', category: 'Shopping', subcategory: '' },
      uber: { type: 'expense', category: 'Transport', subcategory: '' },
    });
    const names = getVendorNames();
    expect(names).toContain('amazon');
    expect(names).toContain('uber');
  });

  it('adds a user vendor', () => {
    addUserVendor('NewVendor', {
      type: 'expense',
      category: 'Entertainment',
      subcategory: 'Streaming',
    });
    const fallbacks = loadVendorFallbacks();
    expect(fallbacks['NewVendor']).toBeDefined();
    expect(fallbacks['NewVendor'].user).toBe(true);
  });

  it('does not overwrite existing vendor when adding', () => {
    saveVendorFallbacks({
      existing: { type: 'expense', category: 'Original', subcategory: '' },
    });
    addUserVendor('existing', {
      type: 'expense',
      category: 'New',
      subcategory: '',
    });
    const fallbacks = loadVendorFallbacks();
    expect(fallbacks['existing'].category).toBe('Original');
  });
});
