import { SmsReaderService, SmsEntry } from './SmsReaderService';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import {
  getSelectedSmsSenders,
  getSmsSenderImportMap,
  setSelectedSmsSenders
} from '@/utils/storage-utils';
import { getAutoImportStartDate, setLastAutoImportDate } from '@/utils/sms-permission-storage';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

// Flags to ensure auto import prompts only appear once per session
// and track whether the user accepted the auto import prompt
let autoPromptShown = false;
let autoPromptAccepted: boolean | null = null;

let autoAlertShown = false;

export class SmsImportService {
  static async checkForNewMessages(
    navigate: (path: string, options?: any) => void,
    opts?: { auto?: boolean; usePermissionDate?: boolean }
  ): Promise<void> {
    if (import.meta.env.MODE === 'development') {
      console.log('AIS-02 checkForNewMessages', opts);
    }
    try {
      await logAnalyticsEvent('app_start');
      const { auto = false, usePermissionDate = false } = opts || {};

      // For automatic import with permission date, use different logic
      if (auto && usePermissionDate) {
        await this.handleAutoImportWithPermissionDate(navigate);
        return;
      }

      // Original logic for manual import (unchanged)
      // For automatic import, check all senders. For manual, use selected senders only.
      let senders: string[] = getSelectedSmsSenders();
      if (auto && senders.length === 0) {
        // Auto mode: read from all senders, then filter by financial content
        senders = [];
        if (import.meta.env.MODE === 'development') {
          console.log('[SMS Auto Import] No selected senders. Will check all senders for financial messages.');
        }
      } else if (!auto && senders.length === 0) {
        return;
      }

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

      // Filter messages by date and financial content
      const filteredMessages = messages.filter(msg => {
        // For auto mode, accept all financial messages regardless of sender selection
        if (auto) {
          // Import financial messages from any sender
          return isFinancialTransactionMessage(msg.message);
        }
        
        // For manual mode, use existing date filtering
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

      await logAnalyticsEvent('sms_import_complete');
      navigate('/vendor-mapping', { state: { messages: filteredMessages, vendorMap, keywordMap } });
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('[SmsImportService] Failed to auto import SMS messages:', error);
      }
    }
  }

  /**
   * Handle automatic import using permission grant date
   */
  private static async handleAutoImportWithPermissionDate(
    navigate: (path: string, options?: any) => void
  ): Promise<void> {
    try {
      const startDate = getAutoImportStartDate();
      
      if (import.meta.env.MODE === 'development') {
        console.log('[SMS Auto Import] Using permission-based start date:', startDate.toISOString());
      }

      // Read messages from all senders since the permission grant date
      const messages: SmsEntry[] = await SmsReaderService.readSmsMessages({ 
        startDate, 
        senders: [] // Empty array means all senders
      });

      if (!messages || messages.length === 0) {
        if (import.meta.env.MODE === 'development') {
          console.log('[SMS Auto Import] No messages found since permission grant date');
        }
        return;
      }

      // Filter for financial messages only
      const filteredMessages = messages.filter(msg => 
        isFinancialTransactionMessage(msg.message)
      );

      if (filteredMessages.length === 0) {
        if (import.meta.env.MODE === 'development') {
          console.log('[SMS Auto Import] No financial messages found');
        }
        return;
      }

      if (import.meta.env.MODE === 'development') {
        console.log(`[SMS Auto Import] Found ${filteredMessages.length} financial messages since ${startDate.toLocaleDateString()}`);
      }

      // Show user confirmation for auto import
      if (!autoPromptShown) {
        autoPromptShown = true;
        autoPromptAccepted = window.confirm(
          `Found ${filteredMessages.length} new financial SMS messages. Import them automatically?`
        );

        if (!autoPromptAccepted) return;
      } else if (autoPromptShown && autoPromptAccepted === false) {
        return;
      }

      // Process vendor mapping
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

      // Update the last auto import date to now
      setLastAutoImportDate(new Date().toISOString());

      await logAnalyticsEvent('sms_auto_import_complete');
      navigate('/vendor-mapping', { 
        state: { 
          messages: filteredMessages, 
          vendorMap, 
          keywordMap,
          isAutoImport: true 
        } 
      });

    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('[SmsImportService] Failed to handle auto import with permission date:', error);
      }
    }
  }
}

export default SmsImportService;
