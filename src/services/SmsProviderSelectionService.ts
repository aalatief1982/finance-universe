/**
 * @file SmsProviderSelectionService.ts
 * @description Manages selectable SMS providers and detected senders.
 *
 * @module services/SmsProviderSelectionService
 *
 * @responsibilities
 * 1. Persist available provider list and selected providers
 * 2. Track detected providers for UI highlighting
 * 3. Manage SMS import start date defaults
 *
 * @storage-keys
 * - sms_providers: stored provider list
 * - sms_start_date: start date for SMS import
 * - detected_sms_providers: providers observed in inbox
 *
 * @dependencies
 * - safe-storage.ts: storage wrapper
 * - error-utils.ts: error handling for storage failures
 *
 * @review-tags
 * - @risk: storage parse errors fall back to defaults
 * - @side-effects: writes provider selections
 *
 * @review-checklist
 * - [ ] Provider list merges detected metadata
 * - [ ] Storage errors emit ErrorType.STORAGE
 * - [ ] Provider list loads from persisted mappings only
 */

import { safeStorage } from "@/utils/safe-storage";
import { safePreferences } from '@/utils/safe-storage';
import { ErrorType } from '@/types/error';
import { handleError } from '@/utils/error-utils';
import { Capacitor } from '@capacitor/core';

export interface SmsProvider {
  id: string;
  name: string;
  pattern: string;
  isSelected: boolean;
  isDetected?: boolean; // New field to track if provider was auto-detected
}

export interface DetectedProvider {
  id: string;
  count: number;
  lastSeen?: Date;
}

const SMS_PROVIDERS_STORAGE_KEY = 'sms_providers';
const LEGACY_SMS_PROVIDERS_STORAGE_KEY = 'smsProviders';
const SMS_START_DATE_STORAGE_KEY = 'sms_start_date';
const DETECTED_PROVIDERS_STORAGE_KEY = 'detected_sms_providers';
const SMS_SENDER_IMPORT_MAP_STORAGE_KEY = 'xpensia_sms_sender_import_map';

class SmsProviderSelectionService {
  private isValidProvider(provider: unknown): provider is SmsProvider {
    if (!provider || typeof provider !== 'object') {
      return false;
    }

    const candidate = provider as Partial<SmsProvider>;
    return (
      typeof candidate.id === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.pattern === 'string' &&
      typeof candidate.isSelected === 'boolean'
    );
  }

  private parseStoredProviders(storedProviders: string | null): SmsProvider[] | null {
    if (!storedProviders) {
      return null;
    }

    const parsed = JSON.parse(storedProviders);
    if (!Array.isArray(parsed)) {
      return null;
    }

    if (!parsed.every((provider) => this.isValidProvider(provider))) {
      return null;
    }

    return parsed;
  }

  private hasLegacyProviderOrSenderState(): boolean {
    const legacyProviders = safeStorage.getItem(LEGACY_SMS_PROVIDERS_STORAGE_KEY);
    if (legacyProviders) {
      return true;
    }

    const senderMapRaw = safeStorage.getItem(SMS_SENDER_IMPORT_MAP_STORAGE_KEY);
    if (!senderMapRaw) {
      return false;
    }

    try {
      const senderMap = JSON.parse(senderMapRaw);
      if (!senderMap || Array.isArray(senderMap) || typeof senderMap !== 'object') {
        return true;
      }

      return Object.entries(senderMap).some(
        ([sender, date]) =>
          typeof sender !== 'string' ||
          sender.trim().length === 0 ||
          typeof date !== 'string' ||
          Number.isNaN(new Date(date).getTime())
      );
    } catch {
      return true;
    }
  }

  async hydrateProvidersFromStableStorage(): Promise<void> {
    try {
      const preferenceValue = await safePreferences.get({ key: SMS_PROVIDERS_STORAGE_KEY });
      const storedProviders = safeStorage.getItem(SMS_PROVIDERS_STORAGE_KEY);

      if (!storedProviders && preferenceValue.value) {
        safeStorage.setItem(SMS_PROVIDERS_STORAGE_KEY, preferenceValue.value);
        return;
      }

      if (storedProviders && preferenceValue.value !== storedProviders) {
        await safePreferences.set({ key: SMS_PROVIDERS_STORAGE_KEY, value: storedProviders });
      }
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to hydrate SMS providers from stable storage',
        originalError: error
      });
    }
  }

  // Get all available SMS providers
  getSmsProviders(): SmsProvider[] {
    try {
      const storedProviders = safeStorage.getItem(SMS_PROVIDERS_STORAGE_KEY);
      if (!storedProviders) {
        return [];
      }

      const providers = this.parseStoredProviders(storedProviders);
      if (!providers) {
        return [];
      }
      
      // Merge with detected providers to highlight detected ones
      const detectedProviders = this.getDetectedProviders();
      
      return providers.map(provider => ({
        ...provider,
        isDetected: detectedProviders.some(dp => dp.id === provider.id)
      }));
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to load SMS providers from storage',
        originalError: error
      });
      return [];
    }
  }
  
  // Save selected SMS providers
  saveSelectedProviders(providers: SmsProvider[]): void {
    try {
      const serializedProviders = JSON.stringify(providers);
      safeStorage.setItem(SMS_PROVIDERS_STORAGE_KEY, serializedProviders);
      void safePreferences.set({ key: SMS_PROVIDERS_STORAGE_KEY, value: serializedProviders });
      safeStorage.removeItem(LEGACY_SMS_PROVIDERS_STORAGE_KEY);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS providers to storage',
        originalError: error
      });
    }
  }
  
  // Get selected SMS providers only
  getSelectedProviders(): SmsProvider[] {
    return this.getSmsProviders().filter(provider => provider.isSelected);
  }
  
  // Toggle selection status of a provider
  toggleProviderSelection(providerId: string): SmsProvider[] {
    const providers = this.getSmsProviders();
    const updatedProviders = providers.map(provider => {
      if (provider.id === providerId) {
        return { ...provider, isSelected: !provider.isSelected };
      }
      return provider;
    });
    
    this.saveSelectedProviders(updatedProviders);
    return updatedProviders;
  }
  
  // Save SMS start date
  saveSmsStartDate(date: string): void {
    try {
      safeStorage.setItem(SMS_START_DATE_STORAGE_KEY, date);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS start date to storage',
        originalError: error
      });
    }
  }
  
  // Get SMS start date
  getSmsStartDate(): string | null {
    try {
      return safeStorage.getItem(SMS_START_DATE_STORAGE_KEY);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to get SMS start date from storage',
        originalError: error
      });
      return null;
    }
  }
  
  // Check if SMS permissions have been granted
  hasSmsPermission(): boolean {
    try {
      return safeStorage.getItem('smsPermissionGranted') === 'true';
    } catch (error) {
      return false;
    }
  }
  
  // Save SMS permission status
  saveSmsPermissionStatus(granted: boolean): void {
    try {
      safeStorage.setItem('smsPermissionGranted', granted ? 'true' : 'false');
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS permission status to storage',
        originalError: error
      });
    }
  }
  
  hasConfiguredProviders(): boolean {
    try {
      if (this.hasLegacyProviderOrSenderState()) {
        return false;
      }

      const providers = this.parseStoredProviders(safeStorage.getItem(SMS_PROVIDERS_STORAGE_KEY));
      if (!providers || providers.length === 0) {
        return false;
      }

      return providers.some((provider) => provider.isSelected);
    } catch {
      return false;
    }
  }

  // Check if SMS provider selection is completed
  isProviderSelectionCompleted(): boolean {
    return this.hasConfiguredProviders();
  }
  
  // NEW METHODS FOR PROVIDER DETECTION
  
  // Save detected providers
  saveDetectedProviders(detectedProviders: DetectedProvider[]): void {
    try {
      safeStorage.setItem(DETECTED_PROVIDERS_STORAGE_KEY, JSON.stringify(detectedProviders));
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save detected SMS providers',
        originalError: error
      });
    }
  }
  
  // Get detected providers
  getDetectedProviders(): DetectedProvider[] {
    try {
      const storedDetectedProviders = safeStorage.getItem(DETECTED_PROVIDERS_STORAGE_KEY);
      if (!storedDetectedProviders) {
        return [];
      }
      return JSON.parse(storedDetectedProviders);
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to get detected SMS providers',
        originalError: error
      });
      return [];
    }
  }
  
  // Analyze SMS message content to detect providers
  detectProviderFromMessage(message: string, sender: string): string | null {
    const providers = this.getSmsProviders();
    
    // First check if the sender matches any known provider name
    const senderMatch = providers.find(provider => 
      sender.toLowerCase().includes(provider.name.toLowerCase()) ||
      provider.name.toLowerCase().includes(sender.toLowerCase())
    );
    
    if (senderMatch) {
      return senderMatch.id;
    }
    
    // Then check if the message content matches any provider patterns
    for (const provider of providers) {
      const patternWords = provider.pattern
        .replace('$AMOUNT', '')
        .toLowerCase()
        .split(' ')
        .filter(word => word.length > 3); // Only use significant words
      
      const messageWords = message.toLowerCase();
      const matches = patternWords.filter(word => messageWords.includes(word));
      
      // If enough significant words match, consider it a match
      if (matches.length >= 2) {
        return provider.id;
      }
    }
    
    return null;
  }
  
  // Process a batch of SMS messages to detect providers
  detectProvidersFromMessages(messages: Array<{body: string, address: string}>): DetectedProvider[] {
    if (!messages || messages.length === 0) {
      return this.getDetectedProviders();
    }
    
    const existingDetected = this.getDetectedProviders();
    const detectedProviderCounts: Record<string, number> = {};
    const lastSeen: Record<string, Date> = {};
    
    // Count provider occurrences in messages
    messages.forEach(message => {
      const providerId = this.detectProviderFromMessage(message.body, message.address);
      if (providerId) {
        detectedProviderCounts[providerId] = (detectedProviderCounts[providerId] || 0) + 1;
        lastSeen[providerId] = new Date();
      }
    });
    
    // Merge with existing detections
    existingDetected.forEach(provider => {
      if (detectedProviderCounts[provider.id]) {
        detectedProviderCounts[provider.id] += provider.count;
      } else {
        detectedProviderCounts[provider.id] = provider.count;
        lastSeen[provider.id] = provider.lastSeen || new Date();
      }
    });
    
    // Convert to array of detected providers
    const detectedProviders: DetectedProvider[] = Object.keys(detectedProviderCounts).map(id => ({
      id,
      count: detectedProviderCounts[id],
      lastSeen: lastSeen[id]
    }));
    
    // Sort by count (most frequently detected first)
    detectedProviders.sort((a, b) => b.count - a.count);
    
    // Save detected providers
    this.saveDetectedProviders(detectedProviders);
    
    return detectedProviders;
  }
  
  // Auto-select providers based on detection (if user hasn't made a selection yet)
  autoSelectDetectedProviders(): SmsProvider[] {
    // Only auto-select if user hasn't made any selections yet
    const providers = this.getSmsProviders();
    const hasUserSelectedAny = providers.some(p => p.isSelected);
    
    if (hasUserSelectedAny) {
      return providers; // User has already made selections, don't override
    }
    
    const detectedProviders = this.getDetectedProviders();
    
    // Only consider providers with multiple detections to reduce false positives
    const significantDetections = detectedProviders.filter(dp => dp.count >= 2);
    
    if (significantDetections.length === 0) {
      return providers; // No significant detections
    }
    
    // Auto-select the detected providers
    const updatedProviders = providers.map(provider => ({
      ...provider,
      isSelected: provider.isSelected || significantDetections.some(dp => dp.id === provider.id)
    }));
    
    this.saveSelectedProviders(updatedProviders);
    return updatedProviders;
  }
  
  // Method to check if we're in a native environment (needed for actual SMS access)
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }
}

// Export a singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();
