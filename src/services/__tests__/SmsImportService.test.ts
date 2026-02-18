import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import SmsImportService from '../SmsImportService';
import { SmsReaderService } from '../SmsReaderService';
import {
  getSelectedSmsSenders,
  getSmsSenderImportMap,
  setSelectedSmsSenders
} from '@/utils/storage-utils';
import {
  extractVendorName,
  inferIndirectFields
} from '@/lib/smart-paste-engine/suggestionEngine';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import { smsProviderSelectionService } from '../SmsProviderSelectionService';

vi.mock('../SmsReaderService');
vi.mock('@/utils/storage-utils');
vi.mock('@/lib/smart-paste-engine/suggestionEngine');
vi.mock('@/lib/smart-paste-engine/messageFilter');
vi.mock('../SmsProviderSelectionService', () => ({
  smsProviderSelectionService: {
    hydrateProvidersFromStableStorage: vi.fn().mockResolvedValue(undefined),
    hasConfiguredProviders: vi.fn().mockReturnValue(true),
    getSelectedProviders: vi.fn().mockReturnValue([{ id: 'bank-abc', name: 'Bank ABC', pattern: 'alert', isSelected: true }]),
    detectProviderFromMessage: vi.fn().mockReturnValue('bank-abc'),
  },
}));


describe('SmsImportService.checkForNewMessages', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (smsProviderSelectionService.hasConfiguredProviders as Mock).mockReturnValue(true);
    (smsProviderSelectionService.getSelectedProviders as Mock).mockReturnValue([
      { id: 'bank-abc', name: 'Bank ABC', pattern: 'alert', isSelected: true },
    ]);
    (smsProviderSelectionService.detectProviderFromMessage as Mock).mockReturnValue('bank-abc');
    (isFinancialTransactionMessage as Mock).mockReturnValue(true);
  });

  it('blocks strict auto-import and routes to provider setup when no providers are configured', async () => {
    (smsProviderSelectionService.hasConfiguredProviders as Mock).mockReturnValue(false);
    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate, { auto: true, usePermissionDate: true });

    expect(navigate).toHaveBeenCalledWith('/sms-providers');
    expect(SmsReaderService.readSmsMessages).not.toHaveBeenCalled();
  });

  it('filters out messages that do not match configured providers', async () => {
    const messages = [
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date().toISOString() },
      { sender: 'OTHER', message: 'Paid 20 SAR at Dominoes', date: new Date().toISOString() }
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK', 'OTHER']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(0).toISOString(), OTHER: new Date(0).toISOString() });
    (setSelectedSmsSenders as Mock).mockImplementation(() => {});

    (smsProviderSelectionService.detectProviderFromMessage as Mock)
      .mockImplementation((message: string) => message.includes('Starbucks') ? 'bank-abc' : null);

    (extractVendorName as Mock).mockImplementation((msg: string) => {
      if (msg.includes('Starbucks')) return 'Starbucks';
      if (msg.includes('Dominoes')) return 'Dominoes';
      return '';
    });
    (inferIndirectFields as Mock).mockReturnValue({ category: 'Food', subcategory: 'Fast Food', type: 'expense' });

    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate);

    expect(navigate).toHaveBeenCalledWith('/vendor-mapping', {
      state: {
        messages: [messages[0]],
        vendorMap: { Starbucks: 'Starbucks' },
        keywordMap: [
          {
            keyword: 'Starbucks',
            mappings: [
              { field: 'category', value: 'Food' },
              { field: 'subcategory', value: 'Fast Food' },
              { field: 'type', value: 'expense' }
            ]
          }
        ]
      }
    });
  });
  it('redirects to provider setup when providers are not configured', async () => {
    (smsProviderSelectionService.hasConfiguredProviders as Mock).mockReturnValue(false);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue([
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date().toISOString() },
    ]);
    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate);

    expect(navigate).toHaveBeenCalledWith('/sms-providers');
    expect(navigate).not.toHaveBeenCalledWith('/vendor-mapping', expect.anything());
    expect(SmsReaderService.readSmsMessages).not.toHaveBeenCalled();
  });

  it('never bypasses provider setup in auto mode when providers are missing', async () => {
    (smsProviderSelectionService.hasConfiguredProviders as Mock).mockReturnValue(false);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue([
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date().toISOString() },
    ]);
    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate, { auto: true });

    expect(navigate).toHaveBeenCalledWith('/sms-providers');
    expect(navigate).not.toHaveBeenCalledWith('/vendor-mapping', expect.anything());
    expect(SmsReaderService.readSmsMessages).not.toHaveBeenCalled();
  });

  it('navigates to vendor mapping with parsed messages', async () => {
    const messages = [
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: new Date().toISOString() },
      { sender: 'BANK', message: 'Paid 20 SAR at Dominoes', date: new Date().toISOString() }
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(0).toISOString() });
    (setSelectedSmsSenders as Mock).mockImplementation(() => {});

    (extractVendorName as Mock).mockImplementation((msg: string) => {
      if (msg.includes('Starbucks')) return 'Starbucks';
      if (msg.includes('Dominoes')) return 'Dominoes';
      return '';
    });
    (inferIndirectFields as Mock).mockReturnValue({ category: 'Food', subcategory: 'Fast Food', type: 'expense' });

    const navigate = vi.fn();

    await SmsImportService.checkForNewMessages(navigate);

    const vendorMap = { Starbucks: 'Starbucks', Dominoes: 'Dominoes' };
    const keywordMap = [
      {
        keyword: 'Starbucks',
        mappings: [
          { field: 'category', value: 'Food' },
          { field: 'subcategory', value: 'Fast Food' },
          { field: 'type', value: 'expense' }
        ]
      },
      {
        keyword: 'Dominoes',
        mappings: [
          { field: 'category', value: 'Food' },
          { field: 'subcategory', value: 'Fast Food' },
          { field: 'type', value: 'expense' }
        ]
      }
    ];

    expect(navigate).toHaveBeenCalledWith('/vendor-mapping', {
      state: { messages, vendorMap, keywordMap }
    });
  });

  it('prompts user only when there are new messages in auto mode', async () => {
    // Use a future date to ensure messages are considered "new"
    const futureDate = new Date(Date.now() + 60000).toISOString();
    const messages = [
      { sender: 'BANK', message: 'Paid 10 SAR at Starbucks', date: futureDate }
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    // Set last import to far past so messages are definitely considered "new"
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date(0).toISOString() });
    (setSelectedSmsSenders as Mock).mockImplementation(() => {});

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

  it('does not prompt when no new messages are found in auto mode', async () => {
    const messages = [
      { sender: 'BANK', message: 'Old message', date: new Date(0).toISOString() }
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date().toISOString() });
    (setSelectedSmsSenders as Mock).mockImplementation(() => {});
    (isFinancialTransactionMessage as Mock).mockReturnValue(false);

    const navigate = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    await SmsImportService.checkForNewMessages(navigate, { auto: true });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
