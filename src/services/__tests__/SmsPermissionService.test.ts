import { describe, expect, it, vi, type Mock } from 'vitest';
import { smsPermissionService } from '../SmsPermissionService';
import { SmsReaderService } from '../SmsReaderService';
import { loadSmsListener } from '@/lib/native/BackgroundSmsListener';

vi.mock('../SmsReaderService');
vi.mock('@/lib/native/BackgroundSmsListener');

describe('SmsPermissionService.requestPermission', () => {
  it('requests both sms reader and listener permissions', async () => {
    (SmsReaderService.requestPermission as Mock).mockResolvedValue(true);
    (SmsReaderService.hasPermission as Mock).mockResolvedValue(false);

    const requestPermission = vi.fn().mockResolvedValue({ granted: true });
    (loadSmsListener as Mock).mockResolvedValue({
      requestPermission,
      checkPermission: vi.fn(),
      checkPermissionWithRationale: vi.fn().mockResolvedValue({ granted: true, shouldShowRationale: false }),
      startListening: vi.fn(),
    });

    const result = await smsPermissionService.requestPermission();

    expect(SmsReaderService.requestPermission).toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalled();
    expect(result.granted).toBe(true);
  });
});
