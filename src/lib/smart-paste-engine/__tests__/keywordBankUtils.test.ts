import { loadKeywordBank } from '../keywordBankUtils';

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

test('malformed storage does not throw', () => {
  localStorage.clear();
  localStorage.setItem('xpensia_keyword_bank', 'not-json');
  expect(loadKeywordBank()).toEqual([]);
});
