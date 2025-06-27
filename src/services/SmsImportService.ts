import { SmsReaderService, SmsEntry } from './SmsReaderService';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import { getLastSmsImportDate, getSelectedSmsSenders, getSmsSenderImportMap } from '@/utils/storage-utils';

export class SmsImportService {
  static async checkForNewMessages(navigate: (path: string, options?: any) => void): Promise<void> {
    try {
      const senders = getSelectedSmsSenders();
      if (senders.length === 0) return;

      const startDateStr = getLastSmsImportDate();
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const senderMap = getSmsSenderImportMap();

      const messages: SmsEntry[] = await SmsReaderService.readSmsMessages({ startDate, senders });
      if (!messages || messages.length === 0) return;

      const filteredMessages = messages.filter(msg => {
        const lastForSender = senderMap[msg.sender];
        if (!lastForSender) return true;
        return new Date(msg.date).getTime() > new Date(lastForSender).getTime();
      });

      if (filteredMessages.length === 0) return;

      const vendorMap: Record<string, string> = {};
      const keywordMap: { keyword: string; mappings: { field: string; value: string }[] }[] = [];

      filteredMessages.forEach(msg => {
        const rawVendor = extractVendorName(msg.message);
        const inferred = inferIndirectFields(msg.message, { vendor: rawVendor });
        if (rawVendor && !vendorMap[rawVendor]) {
          vendorMap[rawVendor] = rawVendor;
          const mappings = [] as { field: string; value: string }[];
          if (inferred.category) mappings.push({ field: 'category', value: inferred.category });
          if (inferred.subcategory) mappings.push({ field: 'subcategory', value: inferred.subcategory });
          if (inferred.type) mappings.push({ field: 'type', value: inferred.type });
          if (mappings.length > 0) {
            keywordMap.push({ keyword: rawVendor, mappings });
          }
        }
      });

      navigate('/vendor-mapping', { state: { messages: filteredMessages, vendorMap, keywordMap } });
    } catch (error) {
      console.error('[SmsImportService] Failed to auto import SMS messages:', error);
    }
  }
}

export default SmsImportService;
