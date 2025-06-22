import { mock, test, expect } from 'bun:test';

// Mock string-similarity to avoid dependency installation
mock.module('string-similarity', () => ({
  default: { findBestMatch: () => ({ bestMatch: { rating: 0 } }) },
}));

const { findClosestFallbackMatch } = await import('../suggestionEngine');

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

test('generic vendors mada and cash do not match fallback data', () => {
  const mada = findClosestFallbackMatch('mada card purchase');
  expect(mada).toBeNull();

  const cash = findClosestFallbackMatch('cash withdrawal');
  expect(cash).toBeNull();
});
