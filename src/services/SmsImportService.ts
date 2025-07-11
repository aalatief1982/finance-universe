import { SmsReaderService, SmsEntry } from './SmsReaderService';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import {
  getSelectedSmsSenders,
  getSmsSenderImportMap,
  setSelectedSmsSenders
} from '@/utils/storage-utils';
import { FirebaseAnalytics } from '@capacitor-firebase/analytics';

// Flags to ensure auto import prompts only appear once per session

// and track whether the user accepted the auto import prompt
let autoPromptShown = false;
let autoPromptAccepted: boolean | null = null;

let autoAlertShown = false;

export class SmsImportService {
  static async checkForNewMessages(
    navigate: (path: string, options?: any) => void,
    opts?: { auto?: boolean }
  ): Promise<void> {
    if (import.meta.env.MODE === 'development') {
      console.log('AIS-02 checkForNewMessages');
    }
    try {
      await FirebaseAnalytics.logEvent({ name: 'sms_import_start' });
      const { auto = false } = opts || {};

      const senders = getSelectedSmsSenders();
      if (senders.length === 0) return;

      const senderMap = getSmsSenderImportMap();

      // Determine the earliest date we need to scan from based on the
      // per-sender import map. Any sender without a stored date defaults to
      // six months ago. We then use the earliest of these dates when querying
      // the device to reduce the search range.
      const defaultStart = new Date();
      defaultStart.setMonth(defaultStart.getMonth() - 6);
      const senderDates = senders.map(s =>
        senderMap[s] ? new Date(senderMap[s]) : defaultStart
      );
      const startDate =
        senderDates.length > 0
          ? new Date(Math.min(...senderDates.map(d => d.getTime())))
          : defaultStart;

      const messages: SmsEntry[] = await SmsReaderService.readSmsMessages({ startDate, senders });
      if (!messages || messages.length === 0) return;

      const filteredMessages = messages.filter(msg => {
        const lastForSender = senderMap[msg.sender];
        const senderDate = lastForSender ? new Date(lastForSender) : defaultStart;
        return new Date(msg.date).getTime() > senderDate.getTime();
      });

      setSelectedSmsSenders(senders);

      if (filteredMessages.length === 0) return;

      if (auto && !autoPromptShown) {
        autoPromptShown = true;

        autoPromptAccepted = window.confirm(
          'Automatically import new SMS messages from your saved senders?'
        );

        if (!autoPromptAccepted) return;
      } else if (auto && autoPromptShown && autoPromptAccepted === false) {
        // user declined earlier in this session
        return;
      }

      if (auto && !autoAlertShown) {
        autoAlertShown = true;
        window.alert(
          `Auto import will process ${filteredMessages.length} messages from ${senders.join(
            ', '
          )} since ${startDate.toLocaleDateString()}. Additional senders can be added via manual import.`
        );
      }

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

      if (filteredMessages.length === 0 || Object.keys(vendorMap).length === 0) {
        return;
      }

      await FirebaseAnalytics.logEvent({ name: 'sms_import_complete' });
      navigate('/vendor-mapping', { state: { messages: filteredMessages, vendorMap, keywordMap } });
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('[SmsImportService] Failed to auto import SMS messages:', error);
      }
    }
  }
}

export default SmsImportService;
