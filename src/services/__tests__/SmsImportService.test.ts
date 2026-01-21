import { describe, expect, it, vi, type Mock } from 'vitest';
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

vi.mock('../SmsReaderService');
vi.mock('@/utils/storage-utils');
vi.mock('@/lib/smart-paste-engine/suggestionEngine');

describe('SmsImportService.checkForNewMessages', () => {
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

    await SmsImportService.checkForNewMessages(navigate, { auto: true });

    expect(confirmSpy).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('does not prompt when no new messages are found in auto mode', async () => {
    const messages = [
      { sender: 'BANK', message: 'Old message', date: new Date(0).toISOString() }
    ];

    (SmsReaderService.readSmsMessages as Mock).mockResolvedValue(messages);
    (getSelectedSmsSenders as Mock).mockReturnValue(['BANK']);
    (getSmsSenderImportMap as Mock).mockReturnValue({ BANK: new Date().toISOString() });
    (setSelectedSmsSenders as Mock).mockImplementation(() => {});

    const navigate = vi.fn();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    await SmsImportService.checkForNewMessages(navigate, { auto: true });

    expect(confirmSpy).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
