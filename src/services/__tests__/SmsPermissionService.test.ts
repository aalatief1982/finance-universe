import { smsPermissionService } from '../SmsPermissionService';
import { SmsReaderService } from '../SmsReaderService';
import { loadSmsListener } from '@/lib/native/BackgroundSmsListener';

jest.mock('../SmsReaderService');
jest.mock('@/lib/native/BackgroundSmsListener');

describe('SmsPermissionService.requestPermission', () => {
  it('requests both sms reader and listener permissions', async () => {
    (SmsReaderService.requestPermission as jest.Mock).mockResolvedValue(true);
    (SmsReaderService.hasPermission as jest.Mock).mockResolvedValue(false);

    const requestPermission = jest.fn().mockResolvedValue({ granted: true });
    (loadSmsListener as jest.Mock).mockResolvedValue({
      requestPermission,
      checkPermission: jest.fn(),
      checkPermissionWithRationale: jest.fn().mockResolvedValue({ granted: true, shouldShowRationale: false }),
      startListening: jest.fn(),
    });

    const result = await smsPermissionService.requestPermission();

    expect(SmsReaderService.requestPermission).toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalled();
    expect(result.granted).toBe(true);
  });
});
