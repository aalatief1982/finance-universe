import { beforeEach, describe, expect, it } from 'vitest';
import type { Transaction } from '@/types/transaction';
import { deriveFreeformPhraseKey, learnFromFreeformConfirmation, loadFreeformMappings, loadFreeformPhraseMappings } from '../freeformLearningStore';

const makeTransaction = (overrides: Partial<Transaction> = {}): Transaction => ({
  id: 'txn-1',
  title: 'Test',
  amount: 10,
  category: 'Food',
  subcategory: 'Coffee',
  date: '2026-03-10',
  type: 'expense',
  source: 'smart-paste-freeform',
  currency: 'SAR',
  vendor: 'Test',
  ...overrides,
});

describe('freeformLearningStore', () => {
  beforeEach(() => {
    localStorage.removeItem('xpensia_freeform_learned_mappings');
    localStorage.removeItem('xpensia_freeform_phrase_mappings');
    localStorage.removeItem('xpensia_template_bank');
    localStorage.removeItem('xpensia_keyword_bank');
    localStorage.removeItem('xpensia_vendor_map');
    localStorage.removeItem('xpensia_fromaccount_map');
    localStorage.removeItem('xpensia_template_account_map');
    localStorage.removeItem('xpensia_templatehash_fromaccount_map_v1');
    localStorage.removeItem('xpensia_confidence_graph_v1');
  });

  it('derives deterministic phrase keys', () => {
    expect(deriveFreeformPhraseKey('coffee 18')).toBe('coffee');
    expect(deriveFreeformPhraseKey('salary 12000')).toBe('salary');
    expect(deriveFreeformPhraseKey('قهوة 18')).toBe('قهوة');
    expect(deriveFreeformPhraseKey('حولت 500 لأحمد')).toBe('transfer-out');
    expect(deriveFreeformPhraseKey('received 300 from Ahmed')).toBe('received-from-person');
  });

  it('stores non-vendor generic phrase confirmations in phrase store', () => {
    learnFromFreeformConfirmation('coffee 18', 'coffee', makeTransaction());

    expect(loadFreeformMappings()).toHaveLength(0);
    const phraseMappings = loadFreeformPhraseMappings();
    expect(phraseMappings).toHaveLength(1);
    expect(phraseMappings[0].normalizedPhraseKey).toBe('coffee');
    expect(phraseMappings[0].category).toBe('Food');
  });

  it('keeps vendor-like confirmations in vendor store', () => {
    learnFromFreeformConfirmation(
      'bolt 31',
      'bolt',
      makeTransaction({ category: 'Transportation', subcategory: 'Ride', vendor: 'bolt' }),
    );

    const vendorMappings = loadFreeformMappings();
    expect(vendorMappings).toHaveLength(1);
    expect(vendorMappings[0].normalizedVendor).toBe('bolt');
    expect(loadFreeformPhraseMappings()).toHaveLength(0);
  });

  it('stores transfer phrases as intent keys in phrase store', () => {
    learnFromFreeformConfirmation(
      'received 300 from Ahmed',
      'Ahmed',
      makeTransaction({ type: 'transfer', category: 'Transfer', subcategory: 'Incoming' }),
    );

    const phraseMappings = loadFreeformPhraseMappings();
    expect(phraseMappings).toHaveLength(1);
    expect(phraseMappings[0].normalizedPhraseKey).toBe('received-from-person');
  });

  it('does not touch SMS/template/account learning stores', () => {
    learnFromFreeformConfirmation('salary 12000', 'salary', makeTransaction({ type: 'income', category: 'Income', subcategory: 'Salary' }));

    expect(localStorage.getItem('xpensia_template_bank')).toBeNull();
    expect(localStorage.getItem('xpensia_keyword_bank')).toBeNull();
    expect(localStorage.getItem('xpensia_vendor_map')).toBeNull();
    expect(localStorage.getItem('xpensia_fromaccount_map')).toBeNull();
    expect(localStorage.getItem('xpensia_template_account_map')).toBeNull();
    expect(localStorage.getItem('xpensia_templatehash_fromaccount_map_v1')).toBeNull();
    expect(localStorage.getItem('xpensia_confidence_graph_v1')).toBeNull();
  });
});
