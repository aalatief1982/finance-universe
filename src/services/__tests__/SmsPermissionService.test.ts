import { smsPermissionService } from '../SmsPermissionService';
import { SmsReaderService } from '../SmsReaderService';
import { loadSmsListener } from '@/lib/native/BackgroundSmsListener';

jest.mock('../SmsReaderService');
jest.mock('@/lib/native/BackgroundSmsListener');

describe('SmsPermissionService.requestPermission', () => {
  it('requests both sms reader and listener permissions', async () => {
    (SmsReaderService.requestPermission as jest.Mock).mockResolvedValue(true);

    const requestPermission = jest.fn().mockResolvedValue({ granted: true });
    (loadSmsListener as jest.Mock).mockResolvedValue({
      requestPermission,
      checkPermission: jest.fn(),
      startListening: jest.fn(),
    });

    const granted = await smsPermissionService.requestPermission();

    expect(SmsReaderService.requestPermission).toHaveBeenCalled();
    expect(requestPermission).toHaveBeenCalled();
    expect(granted).toBe(true);
  });
});
