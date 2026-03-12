import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import {
  getAllTemplates,
  saveNewTemplate,
  loadTemplateBank,
  saveTemplateBank,
  extractTemplateStructure,
  getTemplateKey,
  parseTemplateKey,
  getTemplateByHash,
} from '../templateUtils';

describe('templateUtils', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    localStorage.clear();
  });

  it('returns an empty array when no templates exist', () => {
    const templates = getAllTemplates();
    expect(templates).toEqual([]);
  });

  it('saves and retrieves a template', () => {
    const template = 'Payment of {{amount}}';
    const { hash } = extractTemplateStructure(template);
    saveNewTemplate(template, ['amount'], 'Payment of 100', 'TestBank');
    const templates = getAllTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0].fields).toContain('amount');

    const bank = loadTemplateBank();
    expect(bank[getTemplateKey('TestBank', undefined, hash)]).toBeDefined();
  });

  it('loads and saves template bank', () => {
    const bank = loadTemplateBank();
    expect(typeof bank).toBe('object');

    saveNewTemplate('Transfer {{amount}}', ['amount'], 'Transfer 500');
    const updatedBank = loadTemplateBank();
    expect(Object.keys(updatedBank).length).toBeGreaterThan(0);
  });

  it('generates template key from sender and hash', () => {
    const key = getTemplateKey('TestBank', undefined, 'abc123');
    expect(key).toBe('testbank:abc123');
  });

  it('parses template key correctly', () => {
    const { sender, hash } = parseTemplateKey('testbank:abc123');
    expect(sender).toBe('testbank');
    expect(hash).toBe('abc123');
  });

  it('extracts template structure from message', () => {
    const message = 'Payment of SAR 100.00 on 2024-01-15';
    const result = extractTemplateStructure(message);
    expect(result.placeholders).toBeDefined();
    expect(result.hash).toBeDefined();
  });

  it('updates existing template fields when saving duplicate', () => {
    saveNewTemplate('Test {{amount}}', ['amount'], 'Test 100', 'Sender1');
    saveNewTemplate('Test {{amount}}', ['amount', 'date'], 'Test 100', 'Sender1');

    const templates = getAllTemplates();
    // Should have merged fields
    const template = templates.find(t => t.fields.includes('date'));
    expect(template).toBeDefined();
  });

  it('finds legacy id-keyed entries by canonical hash', () => {
    const template = 'Transfer {{currency}} {{amount}} to {{vendor}}';
    const { hash } = extractTemplateStructure(template);
    const legacyId = btoa(unescape(encodeURIComponent(template))).slice(0, 24);

    saveTemplateBank({
      [getTemplateKey('legacybank', undefined, legacyId)]: {
        id: legacyId,
        template,
        fields: ['amount', 'currency', 'vendor'],
        defaultValues: {},
        created: new Date().toISOString(),
        rawSample: 'Transfer SAR 42 to Store',
        version: 'v2',
        hashAlgorithm: 'SHA256',
      },
    });

    const found = getTemplateByHash(hash, 'legacybank');
    expect(found).toBeDefined();
    expect(found?.template).toBe(template);
  });
  // ---- Multi-amount candidate scoring tests ----

  describe('extractTemplateStructure multi-amount scoring', () => {
    it('picks original foreign currency amount over SAR conversion in dual-currency SMS', () => {
      const msg = 'عملية شراء دولية بمبلغ 50.00 USD لدى AMAZON في 2026-03-10\nالمبلغ المحول: 187.50 SAR\nسعر الصرف: 3.75\nرسوم دولية: 5.63 SAR\nالإجمالي: 193.13 SAR';
      const result = extractTemplateStructure(msg);
      expect(result.placeholders.amount).toBe('50.00');
      expect(result.placeholders.currency).toBe('USD');
    });

    it('simple single-amount SMS still works (no regression)', () => {
      const msg = 'شراء بمبلغ 45.50 SAR لدى STC PAY في 2026-03-10';
      const result = extractTemplateStructure(msg);
      expect(result.placeholders.amount).toBe('45.50');
      expect(result.placeholders.currency).toBe('SAR');
    });

    it('does not pick fee amount as primary', () => {
      const msg = 'دفع بمبلغ 200.00 SAR\nرسوم: 10.00 SAR';
      const result = extractTemplateStructure(msg);
      expect(result.placeholders.amount).toBe('200.00');
    });

    it('picks only candidate even if it has fee context', () => {
      const msg = 'رسوم خدمة 15.00 SAR';
      const result = extractTemplateStructure(msg);
      expect(result.placeholders.amount).toBe('15.00');
      expect(result.placeholders.currency).toBe('SAR');
    });

    it('does not pick exchange rate value as amount', () => {
      const msg = 'شراء بمبلغ 100.00 USD\nالمبلغ المحول: 375.00 SAR\nسعر الصرف: 3.75 SAR';
      const result = extractTemplateStructure(msg);
      expect(result.placeholders.amount).not.toBe('3.75');
    });

    it('picks foreign currency when SAR conversion appears first', () => {
      const msg = 'المبلغ المحول: 375.00 SAR\nعملية شراء بمبلغ 100.00 USD لدى NETFLIX';
      const result = extractTemplateStructure(msg);
      expect(result.placeholders.amount).toBe('100.00');
      expect(result.placeholders.currency).toBe('USD');
    });
  });
});
