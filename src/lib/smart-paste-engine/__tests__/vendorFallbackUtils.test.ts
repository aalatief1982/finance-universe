import { test, expect } from 'bun:test';
import { loadVendorFallbacks, VENDOR_FALLBACK_KEY } from '../vendorFallbackUtils';

// Simple in-memory localStorage mock
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem(key: string) {
      return store[key] ?? null;
    },
    setItem(key: string, value: string) {
      store[key] = value;
    },
    removeItem(key: string) {
      delete store[key];
    },
    clear() {
      store = {};
    },
  };
})();

globalThis.localStorage = localStorageMock as any;

test('loadVendorFallbacks strips blank keys and persists result', () => {
  localStorage.clear();
  const raw = JSON.stringify({
    '': { type: 'expense', category: 'Bills', subcategory: 'Utilities' },
    Netflix: { type: 'expense', category: 'Entertainment', subcategory: 'Streaming' },
  });
  localStorage.setItem(VENDOR_FALLBACK_KEY, raw);

  const loaded = loadVendorFallbacks();
  expect(Object.keys(loaded)).toEqual(['Netflix']);

  const stored = JSON.parse(localStorage.getItem(VENDOR_FALLBACK_KEY) || '{}');
  expect(Object.keys(stored)).toEqual(['Netflix']);
});
