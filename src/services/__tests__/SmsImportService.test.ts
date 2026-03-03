import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import SmsImportService from '../SmsImportService';
import { SmsReaderService } from '../SmsReaderService';
import {
  getSelectedSmsSenders,
  getSmsSenderImportMap,
  getSmsSenderVendorMap,
  setSelectedSmsSenders
} from '@/utils/storage-utils';
import {
  extractVendorName,
  inferIndirectFields
} from '@/lib/smart-paste-engine/suggestionEngine';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import { safeStorage } from '@/utils/safe-storage';
import { getAutoImportStartDate } from '@/utils/sms-permission-storage';

vi.mock('../SmsReaderService');
vi.mock('@/utils/storage-utils');
vi.mock('@/lib/smart-paste-engine/suggestionEngine');
vi.mock('@/lib/smart-paste-engine/messageFilter');
vi.mock('@/utils/sms-permission-storage');

describe('SmsImportService.checkForNewMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (isFinancialTransactionMessage as Mock).mockReturnValue(true);
    (getSmsSenderVendorMap as Mock).mockReturnValue({});
    (getSmsSenderImportMap as Mock).mockReturnValue({});
    (getAutoImportStartDate as Mock).mockReturnValue(new Date(0));
  });

  it('routes to process-sms when no sender selection exists', async () => {
    (getSelectedSmsSenders as Mock).mockReturnValue([]);
    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate);

    expect(navigate).toHaveBeenCalledWith('/process-sms');
    expect(SmsReaderService.readSmsMessages).not.toHaveBeenCalled();
  });

  it('filters messages by selected senders and per-sender checkpoint', async () => {
    const now = Date.now();
    const messages = [
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date(now).toISOString() },
      { sender: 'BANK', message: 'Old BANK message', date: new Date(now - 86400000).toISOString() },
      { sender: 'OTHER', message: 'Paid 20 SAR at Dominoes', date: new Date(now).toISOString() }
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(now - 3600000).toISOString() });

    (extractVendorName as Mock).mockReturnValue('Starbucks');
    (inferIndirectFields as Mock).mockReturnValue({ category: 'Food', subcategory: 'Coffee', type: 'expense' });

    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate);

    expect(SmsReaderService.readSmsMessages).toHaveBeenCalledWith({
      startDate: expect.any(Date),
      senders: ['BANK'],
    });

    expect(navigate).toHaveBeenCalledWith('/vendor-mapping', {
      state: {
        messages: [messages[0]],
        vendorMap: { Starbucks: 'Starbucks' },
        keywordMap: [
          {
            keyword: 'Starbucks',
            mappings: [
              { field: 'category', value: 'Food' },
              { field: 'subcategory', value: 'Coffee' },
              { field: 'type', value: 'expense' }
            ]
          }
        ]
      }
    });

    const [, navigationPayload] = navigate.mock.calls[0];
    expect(navigationPayload.state.messages).toEqual([messages[0]]);
    expect(navigationPayload.state.vendorMap).toEqual({ Starbucks: 'Starbucks' });
    expect(navigationPayload.state.keywordMap).toEqual([
      {
        keyword: 'Starbucks',
        mappings: [
          { field: 'category', value: 'Food' },
          { field: 'subcategory', value: 'Coffee' },
          { field: 'type', value: 'expense' },
        ],
      },
    ]);
  });

  it('prompts user only when auto mode has new filtered messages', async () => {
    const futureDate = new Date(Date.now() + 60000).toISOString();
    const messages = [
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: futureDate }
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(0).toISOString() });

    (extractVendorName as Mock).mockReturnValue('Starbucks');
    (inferIndirectFields as Mock).mockReturnValue({ category: 'Food', subcategory: 'Coffee', type: 'expense' });

    const navigate = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => undefined);

    await SmsImportService.checkForNewMessages(navigate, { auto: true });

    expect(confirmSpy).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();

    confirmSpy.mockRestore();
    alertSpy.mockRestore();
  });


  it('routes to home when permission-date import fetches zero messages', async () => {
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(0).toISOString() });
    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue([]);

    const navigate = vi.fn();
    await SmsImportService.checkForNewMessages(navigate, { usePermissionDate: true });

    expect(navigate).toHaveBeenCalledWith('/home', { replace: true });
  });

  it('routes to home when permission-date import has zero financial messages after filtering', async () => {
    const now = new Date().toISOString();
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(0).toISOString() });
    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue([
      { sender: 'BANK', message: 'Your OTP is 1234', date: now },
    ]);
    (isFinancialTransactionMessage as Mock).mockReturnValue(false);

    const navigate = vi.fn();
    await SmsImportService.checkForNewMessages(navigate, { usePermissionDate: true });

    expect(navigate).toHaveBeenCalledWith('/home', { replace: true });
  });

  it('converts legacy selected providers to sender allowlist when sender IDs match', async () => {
    const now = Date.now();
    const messages = [
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date(now).toISOString() }
    ];

    safeStorage.setItem('sms_providers', JSON.stringify([
      { id: 'BANK', name: 'Bank Provider', pattern: 'bank', isSelected: true }
    ]));

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue([]);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(now - 3600000).toISOString() });
    (extractVendorName as Mock).mockReturnValue('Starbucks');
    (inferIndirectFields as Mock).mockReturnValue({});

    const navigate = vi.fn();
    await SmsImportService.checkForNewMessages(navigate);

    expect(setSelectedSmsSenders).toHaveBeenCalledWith(['BANK']);
    expect(navigate).toHaveBeenCalledWith('/vendor-mapping', expect.anything());

    safeStorage.removeItem('sms_providers');
  });

  it('does not auto-create dummy provider IDs when legacy providers do not match senders', async () => {
    const now = Date.now();
    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue([
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date(now).toISOString() },
    ]);

    safeStorage.setItem(
      'sms_providers',
      JSON.stringify([{ id: 'dummy-provider-id', name: 'Dummy Provider', pattern: 'dummy', isSelected: true }])
    );

    (getSelectedSmsSenders as Mock).mockReturnValue([]);
    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate);

    expect(setSelectedSmsSenders).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/process-sms');
    expect(SmsReaderService.readSmsMessages).not.toHaveBeenCalled();

    safeStorage.removeItem('sms_providers');
  });

  it('falls back safely when sender map has malformed checkpoint dates', async () => {
    const messages = [
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date().toISOString() },
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: 'not-a-date' });
    (extractVendorName as Mock).mockReturnValue('Starbucks');
    (inferIndirectFields as Mock).mockReturnValue({});

    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate);

    expect(SmsReaderService.readSmsMessages).toHaveBeenCalledWith({
      startDate: expect.any(Date),
      senders: ['BANK'],
    });
    expect(navigate).toHaveBeenCalledWith('/vendor-mapping', expect.any(Object));
  });

  it('ignores legacy smsProviders key and routes safely to sender discovery', async () => {
    safeStorage.setItem(
      'smsProviders',
      JSON.stringify([{ id: 'BANK', name: 'Legacy Bank', isSelected: true }])
    );
    (getSelectedSmsSenders as Mock).mockReturnValue([]);

    const navigate = vi.fn();
    await SmsImportService.checkForNewMessages(navigate);

    expect(setSelectedSmsSenders).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith('/process-sms');
    expect(SmsReaderService.readSmsMessages).not.toHaveBeenCalled();

    safeStorage.removeItem('smsProviders');
  });
});
