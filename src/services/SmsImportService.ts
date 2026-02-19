/**
 * @file SmsImportService.ts
 * @description Orchestrates SMS import flow, including sender selection,
 *              auto-import prompts, and navigation to review screens.
 *
 * @module services/SmsImportService
 *
 * @responsibilities
 * 1. Fetch SMS messages based on sender filters and lookback windows
 * 2. Gate auto-import prompts to avoid repeated dialogs
 * 3. Log analytics for import activity and failures
 *
 * @dependencies
 * - SmsReaderService.ts: native SMS access
 * - messageFilter.ts: financial SMS filtering
 * - storage-utils.ts: sender selection and import tracking
 *
 * @review-tags
 * - @risk: import lock prevents duplicate fetches
 * - @side-effects: analytics logging and navigation
 *
 * @review-checklist
 * - [ ] Import lock releases on error paths
 * - [ ] Sender selection defaults are handled safely
 * - [ ] Auto-import uses permission date when requested
 */

import { SmsReaderService, SmsEntry } from './SmsReaderService';
import { extractVendorName, inferIndirectFields } from '@/lib/smart-paste-engine/suggestionEngine';
import { isFinancialTransactionMessage } from '@/lib/smart-paste-engine/messageFilter';
import { safeStorage } from '@/utils/safe-storage';
import {
  getSelectedSmsSenders,
  getSmsSenderImportMap,
  getSmsSenderVendorMap,
  setSelectedSmsSenders
} from '@/utils/storage-utils';
import { getAutoImportStartDate, setLastAutoImportDate } from '@/utils/sms-permission-storage';
import { logAnalyticsEvent } from '@/utils/firebase-analytics';

// Flags to ensure auto import prompts only appear once per session
// and track whether the user accepted the auto import prompt
let autoPromptShown = false;
let autoPromptAccepted: boolean | null = null;

let autoAlertShown = false;

interface LegacySmsProviderSelection {
  id: string;
  name: string;
  isSelected: boolean;
}

export class SmsImportService {

  private static logImportDecision(decision: string, details: Record<string, unknown> = {}): void {
    void logAnalyticsEvent('sms_import_sender_decision', {
      decision,
      ...details,
    });
  }
  private static getLegacySelectedProviderCandidates(): string[] {
    try {
      const raw = safeStorage.getItem('sms_providers');
      if (!raw) return [];
      const parsed = JSON.parse(raw) as LegacySmsProviderSelection[];
      if (!Array.isArray(parsed)) return [];

      return parsed
        .filter((provider) => provider && provider.isSelected)
        .flatMap((provider) => [provider.id, provider.name])
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
    } catch {
      return [];
    }
  }

  private static getConfiguredSendersFromSelection(availableSenders: string[]): string[] {
    const selectedSenders = getSelectedSmsSenders();
    if (selectedSenders.length > 0) {
      this.logImportDecision('use_selected_senders', { count: selectedSenders.length });
      return selectedSenders;
    }

    const candidates = this.getLegacySelectedProviderCandidates();
    if (candidates.length === 0 || availableSenders.length === 0) {
      this.logImportDecision('no_sender_candidates', {
        candidateCount: candidates.length,
        availableSenderCount: availableSenders.length,
      });
      return [];
    }

    const matchedSenders = availableSenders.filter((sender) =>
      candidates.some((candidate) => sender.toLowerCase() === candidate.toLowerCase())
    );

    if (matchedSenders.length > 0) {
      setSelectedSmsSenders(matchedSenders);
      this.logImportDecision('migrate_legacy_provider_matches', { count: matchedSenders.length });
    } else {
      this.logImportDecision('legacy_candidates_without_matches', {
        candidateCount: candidates.length,
        availableSenderCount: availableSenders.length,
      });
    }

    return matchedSenders;
  }

  private static isSenderAllowedByConfiguredSenders(
    message: SmsEntry,
    allowedSenders: Set<string>,
    senderVendorMappings: Record<string, Record<string, string>>
  ): boolean {
    if (!allowedSenders.has(message.sender)) {
      return false;
    }

    const senderMapping = senderVendorMappings[message.sender];
    const hasConfiguredSenderVendorMappings = Object.keys(senderVendorMappings).length > 0;

    if (!hasConfiguredSenderVendorMappings) {
      return true;
    }

    if (senderMapping && Object.keys(senderMapping).length > 0) {
      return true;
    }

    const extractedVendor = extractVendorName(message.message)?.toLowerCase();
    if (!extractedVendor) {
      return false;
    }

    return !!senderMapping?.[extractedVendor];
  }

  private static importLock = false;

  private static getDefaultStartDate(): Date {
    const defaultStart = new Date();
    defaultStart.setMonth(defaultStart.getMonth() - 6);
    return defaultStart;
  }

  private static computeScanStartDate(senders: string[], senderMap: Record<string, string>): Date {
    const defaultStart = this.getDefaultStartDate();
    const senderDates = senders.map((sender) => {
      const checkpoint = senderMap[sender];
      return checkpoint ? new Date(checkpoint) : defaultStart;
    });

    if (senderDates.length === 0) {
      return defaultStart;
    }

    return new Date(Math.min(...senderDates.map((date) => date.getTime())));
  }

  private static filterMessagesBySelectedSendersAndCutoff(
    messages: SmsEntry[],
    senders: string[],
    senderMap: Record<string, string>,
    fallbackStartDate: Date
  ): SmsEntry[] {
    const allowedSenders = new Set(senders);
    const senderVendorMappings = getSmsSenderVendorMap();

    return messages.filter((msg) => {
      if (!this.isSenderAllowedByConfiguredSenders(msg, allowedSenders, senderVendorMappings)) {
        return false;
      }

      if (!isFinancialTransactionMessage(msg.message)) {
        return false;
      }

      const checkpoint = senderMap[msg.sender];
      const senderCutoff = checkpoint ? new Date(checkpoint) : fallbackStartDate;
      return new Date(msg.date).getTime() > senderCutoff.getTime();
    });
  }

  static async checkForNewMessages(
    navigate?: ((path: string, options?: any) => void) | undefined,
    opts?: { auto?: boolean; usePermissionDate?: boolean }
  ): Promise<void> {
    if (this.importLock) {
      if (import.meta.env.MODE === 'development') {
        console.log('[SmsImportService] Import already in progress, skipping duplicate call');
      }
      return;
    }

    this.importLock = true;

    const safeNavigate = typeof navigate === 'function' ? navigate : (path: string) => {
      if (import.meta.env.MODE === 'development') {
        console.log('[SmsImportService] navigate not provided - cannot navigate to', path);
      }
    };

    try {
      await logAnalyticsEvent('app_start');
      const { auto = false, usePermissionDate = false } = opts || {};

      // For permission-date-based import, use the dedicated logic
      // This handles both initial import after permission grant and subsequent auto imports
      if (usePermissionDate) {
        await this.handleAutoImportWithPermissionDate(safeNavigate as any);
        return;
      }

      const senderMap = getSmsSenderImportMap();
      const senders = this.getConfiguredSendersFromSelection(Object.keys(senderMap));
      if (senders.length === 0) {
        this.logImportDecision('route_to_process_sms_no_senders');
        safeNavigate('/process-sms');
        return;
      }
      const defaultStart = this.getDefaultStartDate();
      const startDate = this.computeScanStartDate(senders, senderMap);

      const messages: SmsEntry[] = await SmsReaderService.readSmsMessages({ startDate, senders });
      if (!messages || messages.length === 0) return;

      const filteredMessages = this.filterMessagesBySelectedSendersAndCutoff(
        messages,
        senders,
        senderMap,
        defaultStart
      );

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
        const rawVendor = extractVendorName(msg.message) || msg.sender;
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

      if (filteredMessages.length === 0) {
        return;
      }

      await logAnalyticsEvent('sms_import_complete');
      safeNavigate('/vendor-mapping', { state: { messages: filteredMessages, vendorMap, keywordMap } });
    } catch (error) {
      if (import.meta.env.MODE === 'development') {
        console.error('[SmsImportService] Failed to auto import SMS messages:', error);
      }
    } finally {
      this.importLock = false;
    }
  }

  /**
   * Handle automatic import using permission grant date
   */
  private static async handleAutoImportWithPermissionDate(
    navigate: (path: string, options?: any) => void
  ): Promise<void> {
    try {
      const senderMap = getSmsSenderImportMap();
      const senders = this.getConfiguredSendersFromSelection(Object.keys(senderMap));
      if (senders.length === 0) {
        this.logImportDecision('route_to_process_sms_no_senders_permission_date');
        navigate('/process-sms');
        return;
      }
      const permissionStartDate = getAutoImportStartDate();
      const senderCheckpointStartDate = this.computeScanStartDate(senders, senderMap);
      const startDate = new Date(
        Math.min(permissionStartDate.getTime(), senderCheckpointStartDate.getTime())
      );
      
      if (import.meta.env.MODE === 'development') {
        // console.log('[SMS Auto Import] Using permission-based start date:', startDate.toISOString());
      }

      // Read messages from selected senders and let checkpoint filtering
      // keep only new messages for each sender.
      const messages: SmsEntry[] = await SmsReaderService.readSmsMessages({ 
        startDate, 
        senders
      });

      if (!messages || messages.length === 0) {
        if (import.meta.env.MODE === 'development') {
          // console.log('[SMS Auto Import] No messages found since permission grant date');
        }
        return;
      }

      const filteredMessages = this.filterMessagesBySelectedSendersAndCutoff(
        messages,
        senders,
        senderMap,
        this.getDefaultStartDate()
      );

      if (filteredMessages.length === 0) {
        if (import.meta.env.MODE === 'development') {
          // console.log('[SMS Auto Import] No financial messages found');
        }
        return;
      }

      if (import.meta.env.MODE === 'development') {
        // console.log(`[SMS Auto Import] Found ${filteredMessages.length} financial messages since ${startDate.toLocaleDateString()}`);
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
        const rawVendor = extractVendorName(msg.message) || msg.sender;
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
    } finally {
      this.importLock = false;
    }
  }
}

export default SmsImportService;
