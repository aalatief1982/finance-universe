import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { safeStorage } from '@/utils/safe-storage';
import { getSmsSenderImportMap } from '@/utils/storage-utils';
import { migrateSmsFlowSchema } from '@/services/SmsFlowMigrationService';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

vi.mock('@/utils/firebase-analytics', () => ({
  logAnalyticsEvent: vi.fn().mockResolvedValue(undefined),
}));

describe('migrateSmsFlowSchema', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('removes legacy provider artifacts and preserves sender checkpoints', async () => {
    safeStorage.setItem('xpensia_sms_sender_import_map', JSON.stringify({ BANK: '2025-01-01T00:00:00.000Z' }));
    safeStorage.setItem('sms_providers', JSON.stringify([{ id: 'BANK', name: 'Bank', isSelected: true }]));
    safeStorage.setItem('smsProviders', JSON.stringify([{ id: 'legacy' }]));
    safeStorage.setItem('xpensia_sms_vendors', JSON.stringify(['dummy']));

    const result = await migrateSmsFlowSchema();

    expect(result.ok).toBe(true);
    expect(safeStorage.getItem('sms_flow_schema_version')).toBe('1');
    expect(safeStorage.getItem('sms_providers')).toBeNull();
    expect(safeStorage.getItem('smsProviders')).toBeNull();
    expect(safeStorage.getItem('xpensia_sms_vendors')).toBeNull();
    expect(getSmsSenderImportMap().BANK).toBe('2025-01-01T00:00:00.000Z');
    expect(logAnalyticsEvent).toHaveBeenCalledWith('sms_flow_migration_v1_success', expect.any(Object));
  });

  it('logs and returns failure when migration throws', async () => {
    const setItemSpy = vi.spyOn(safeStorage, 'setItem').mockImplementation(() => {
      throw new Error('write_failed');
    });

    const result = await migrateSmsFlowSchema();

    expect(result.ok).toBe(false);
    expect(result.error).toBe('write_failed');
    expect(logAnalyticsEvent).toHaveBeenCalledWith('sms_flow_migration_v1_failed', { error: 'write_failed' });

    setItemSpy.mockRestore();
  });

  it('skips when already on target schema version', async () => {
    safeStorage.setItem('sms_flow_schema_version', '1');
    (logAnalyticsEvent as Mock).mockClear();

    const result = await migrateSmsFlowSchema();

    expect(result.ok).toBe(true);
    expect(result.skipped).toBe(true);
    expect(logAnalyticsEvent).not.toHaveBeenCalled();
  });
});
