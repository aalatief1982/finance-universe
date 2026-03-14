import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createStorageMock } from '@/test/storage-mock';
import {
  XPENSIA_BACKUP_VERSION,
  collectBackupData,
  createBackupPayload,
  parseBackupPayload,
  restoreBackupData,
  toBackupJson,
} from '@/utils/backup-utils';

describe('backup-utils', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createStorageMock());
    localStorage.clear();
  });

  it('collects only xpensia-prefixed keys', () => {
    localStorage.setItem('xpensia_transactions', '[]');
    localStorage.setItem('theme', 'dark');

    expect(collectBackupData()).toEqual({
      xpensia_transactions: '[]',
    });
  });

  it('builds parseable versioned backup json', () => {
    localStorage.setItem('xpensia_transactions', '[{"id":"1"}]');

    const payload = createBackupPayload({ appVersion: '1.2.3', platform: 'android' });
    const parsed = parseBackupPayload(toBackupJson(payload));

    expect(parsed.xpensiaBackupVersion).toBe(XPENSIA_BACKUP_VERSION);
    expect(parsed.platform).toBe('android');
    expect(parsed.data).toEqual({
      xpensia_transactions: '[{"id":"1"}]',
    });
  });

  it('rejects non-versioned backup shapes', () => {
    expect(() => parseBackupPayload(JSON.stringify([{ id: '1' }]))).toThrow('invalid_structure');
    expect(() => parseBackupPayload(JSON.stringify({ data: {} }))).toThrow('unsupported_backup_version');
  });

  it('restores backup data as exact strings', () => {
    const restoredCount = restoreBackupData({
      xpensiaBackupVersion: 1,
      createdAt: new Date().toISOString(),
      appVersion: '1.2.3',
      platform: 'android',
      data: {
        xpensia_transactions: '[{"id":"1"}]',
        xpensia_template_bank: '["a"]',
      },
    });

    expect(restoredCount).toBe(2);
    expect(localStorage.getItem('xpensia_transactions')).toBe('[{"id":"1"}]');
    expect(localStorage.getItem('xpensia_template_bank')).toBe('["a"]');
  });
});
