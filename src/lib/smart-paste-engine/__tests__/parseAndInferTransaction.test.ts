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

mock.module('../structureParser', () => ({
  parseStructuredSms: (msg: string) => {
    const base = {
      rawMessage: msg,
      template: '',
      templateHash: '',
      matched: false,
      inferredFields: {},
      defaultValues: {},
    };
    if (msg === 'empty') {
      return { ...base, directFields: { amount: '', currency: 'SAR', date: '' } };
    }
    if (msg === 'invalid') {
      return { ...base, directFields: { amount: 'abc', currency: 'SAR', date: '' } };
    }
    return { ...base, directFields: { amount: '123', currency: 'SAR', date: '' } };
  },
  applyVendorMapping: (v: string) => v,
}));

mock.module('nanoid', () => ({ nanoid: () => 'id' }));
mock.module('../templateUtils', () => ({ getAllTemplates: () => [] }));

const { parseAndInferTransaction } = await import('../parseAndInferTransaction');

test('defaults amount to 0 when placeholder is empty or malformed', () => {
  const empty = parseAndInferTransaction('empty');
  expect(empty.transaction.amount).toBe(0);

  const invalid = parseAndInferTransaction('invalid');
  expect(invalid.transaction.amount).toBe(0);
});
