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
    saveNewTemplate('Payment of {{amount}}', ['amount'], 'Payment of 100', 'TestBank');
    const templates = getAllTemplates();
    expect(templates).toHaveLength(1);
    expect(templates[0].fields).toContain('amount');
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
});
