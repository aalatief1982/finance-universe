import { mock, test, expect } from 'bun:test';

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

test('generic vendors mada and cash do not match fallback data', async () => {
  mock.module('string-similarity', () => ({
    default: { findBestMatch: () => ({ bestMatch: { rating: 0 } }) },
  }));
  mock.module('../vendorFallbackUtils', () => ({
    loadVendorFallbacks: () => ({}),
  }));

  const { findClosestFallbackMatch } = await import('../suggestionEngine');

  const mada = findClosestFallbackMatch('mada card purchase');
  expect(mada).toBeNull();

  const cash = findClosestFallbackMatch('cash withdrawal');
  expect(cash).toBeNull();

  mock.restore();
  await import('../vendorFallbackUtils');
});

test('corrupted fallback data returns null without calling similarity lib', async () => {
  let called = false;
  mock.module('string-similarity', () => ({
    default: { findBestMatch: () => { called = true; return { bestMatch: { rating: 1 } }; } },
  }));
  mock.module('../vendorFallbackUtils', () => ({
    loadVendorFallbacks: () => null,
  }));

  const { findClosestFallbackMatch } = await import('../suggestionEngine');

  const result = findClosestFallbackMatch('some vendor');
  expect(result).toBeNull();
  expect(called).toBe(false);

  mock.restore();
  await import('../vendorFallbackUtils');
});
