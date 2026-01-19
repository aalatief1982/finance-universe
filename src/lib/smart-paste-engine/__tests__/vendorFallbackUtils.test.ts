import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  addUserVendor,
  getVendorNames,
  loadVendorFallbacks,
  saveVendorFallbacks,
} from '../vendorFallbackUtils';

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

describe('vendorFallbackUtils', () => {
  beforeEach(() => {
    const mockStorage = createStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      configurable: true,
    });
  });

  it('saves and loads vendor fallbacks', () => {
    saveVendorFallbacks({
      Starbucks: { type: 'expense', category: 'Food', subcategory: 'Coffee Shops' },
    });

    const loaded = loadVendorFallbacks();
    expect(loaded.Starbucks.category).toBe('Food');
  });

  it('adds user vendors only when name is non-empty', () => {
    addUserVendor(' ', { type: 'expense', category: 'Shopping', subcategory: 'Retail' });
    addUserVendor('IKEA', { type: 'expense', category: 'Shopping', subcategory: 'Home Goods' });

    const names = getVendorNames();
    expect(names).toEqual(['IKEA']);
  });
});
