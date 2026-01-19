import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getTemplateByHash,
  getTemplateKey,
  loadTemplateBank,
  saveNewTemplate,
} from '../templateUtils';
import type { SmartPasteTemplate } from '@/types/template';

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

describe('templateUtils', () => {
  beforeEach(() => {
    const mockStorage = createStorageMock();
    Object.defineProperty(window, 'localStorage', {
      value: mockStorage,
      configurable: true,
    });
  });

  it('converts legacy template arrays into a bank', () => {
    const legacyTemplate: SmartPasteTemplate = {
      id: 'legacy-1',
      template: 'Paid {{amount}}',
      fields: ['amount'],
      created: '2024-01-01T00:00:00.000Z',
    };

    window.localStorage.setItem('xpensia_structure_templates', JSON.stringify([legacyTemplate]));

    const bank = loadTemplateBank();
    const key = getTemplateKey(undefined, undefined, 'legacy-1');
    expect(bank[key].template).toBe('Paid {{amount}}');
  });

  it('saves templates and updates metadata on access', () => {
    const hash = saveNewTemplate('Paid {{amount}}', ['amount'], 'Paid 20');
    const template = getTemplateByHash(hash);

    expect(template?.id).toBe(hash);
    expect(template?.meta?.usageCount).toBe(1);
    expect(template?.meta?.lastUsedAt).toBeDefined();
  });
});
