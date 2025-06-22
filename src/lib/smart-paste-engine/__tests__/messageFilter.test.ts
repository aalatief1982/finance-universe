import { isFinancialTransactionMessage } from '../messageFilter';

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

test('detects financial message with custom keyword', () => {
  localStorage.clear();
  localStorage.setItem(
    'xpensia_type_keywords',
    JSON.stringify([{ keyword: 'foobar', type: 'expense' }])
  );

  const text = 'Foobar purchase of 100 SAR on 01/01/2024';
  expect(isFinancialTransactionMessage(text)).toBe(true);
});

test('fails detection without custom keyword', () => {
  localStorage.clear();
  const text = 'Foobar purchase of 100 SAR on 01/01/2024';
  expect(isFinancialTransactionMessage(text)).toBe(false);
});
