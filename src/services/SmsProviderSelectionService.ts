
import { ErrorType } from '@/types/error';
import { handleError } from '@/utils/error-utils';
import { Capacitor } from '@capacitor/core';

export interface SmsProvider {
  id: string;
  name: string;
  pattern: string;
  isSelected: boolean;
  isDetected?: boolean; // Field to track if provider was auto-detected
}

export interface DetectedProvider {
  id: string;
  count: number;
  lastSeen?: Date;
}

const SMS_PROVIDERS_STORAGE_KEY = 'sms_providers';
const SMS_START_DATE_STORAGE_KEY = 'sms_start_date';
const DETECTED_PROVIDERS_STORAGE_KEY = 'detected_sms_providers';

class SmsProviderSelectionService {
  // Default provider templates - will be filled with actual detected providers
  private defaultProviders: SmsProvider[] = [];
  
  // Get all available SMS providers - from actual detection
  getSmsProviders(): SmsProvider[] {
    try {
      const storedProviders = localStorage.getItem(SMS_PROVIDERS_STORAGE_KEY);
      if (!storedProviders) {
        return this.defaultProviders;
      }
      
      const providers = JSON.parse(storedProviders);
      
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
      return this.defaultProviders;
    }
  }
  
  // Save selected SMS providers
  saveSelectedProviders(providers: SmsProvider[]): void {
    try {
      localStorage.setItem(SMS_PROVIDERS_STORAGE_KEY, JSON.stringify(providers));
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
      localStorage.setItem(SMS_START_DATE_STORAGE_KEY, date);
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
      return localStorage.getItem(SMS_START_DATE_STORAGE_KEY);
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
      return localStorage.getItem('smsPermissionGranted') === 'true';
    } catch (error) {
      return false;
    }
  }
  
  // Save SMS permission status
  saveSmsPermissionStatus(granted: boolean): void {
    try {
      localStorage.setItem('smsPermissionGranted', granted ? 'true' : 'false');
    } catch (error) {
      handleError({
        type: ErrorType.STORAGE,
        message: 'Failed to save SMS permission status to storage',
        originalError: error
      });
    }
  }
  
  // Check if SMS provider selection is completed
  isProviderSelectionCompleted(): boolean {
    const selectedProviders = this.getSelectedProviders();
    return selectedProviders.length > 0;
  }
  
  // METHODS FOR REAL PROVIDER DETECTION
  
  // Save detected providers
  saveDetectedProviders(detectedProviders: DetectedProvider[]): void {
    try {
      localStorage.setItem(DETECTED_PROVIDERS_STORAGE_KEY, JSON.stringify(detectedProviders));
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
      const storedDetectedProviders = localStorage.getItem(DETECTED_PROVIDERS_STORAGE_KEY);
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
    // Get existing providers or create a new provider ID if no match
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
    
    // If no match found, this is a new provider
    // Generate an ID based on the sender
    const cleanSender = sender.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `provider-${cleanSender}-${Math.floor(Math.random() * 1000)}`;
  }
  
  // Create a new provider from a message
  createProviderFromMessage(message: string, sender: string): SmsProvider {
    const id = this.detectProviderFromMessage(message, sender) || 
              `provider-${Math.floor(Math.random() * 10000)}`;
    
    // Extract a pattern from the message
    let pattern = message;
    
    // Look for amount patterns (like $50.00 or 50.00 USD)
    const amountRegex = /\$?\d+(\.\d{2})?\s?[A-Z]{0,3}/g;
    pattern = pattern.replace(amountRegex, '$AMOUNT');
    
    // Truncate long patterns
    if (pattern.length > 100) {
      pattern = pattern.substring(0, 100) + '...';
    }
    
    return {
      id,
      name: sender,
      pattern,
      isSelected: false,
      isDetected: true
    };
  }
  
  // Process a batch of SMS messages to detect providers - now with real data
  detectProvidersFromMessages(messages: Array<{body: string, address: string}>): SmsProvider[] {
    if (!messages || messages.length === 0) {
      return this.getSmsProviders();
    }
    
    const existingDetected = this.getDetectedProviders();
    const detectedProviderCounts: Record<string, number> = {};
    const lastSeen: Record<string, Date> = {};
    const newProviders: Record<string, SmsProvider> = {};
    
    // Process each message to detect or create providers
    messages.forEach(message => {
      // Try to detect existing provider
      const providerId = this.detectProviderFromMessage(message.body, message.address);
      
      if (providerId) {
        detectedProviderCounts[providerId] = (detectedProviderCounts[providerId] || 0) + 1;
        lastSeen[providerId] = new Date();
      } else {
        // Create a new provider from this message
        const newProvider = this.createProviderFromMessage(message.body, message.address);
        newProviders[newProvider.id] = newProvider;
        detectedProviderCounts[newProvider.id] = 1;
        lastSeen[newProvider.id] = new Date();
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
    
    // Convert to array of detected providers for storage
    const detectedProviders: DetectedProvider[] = Object.keys(detectedProviderCounts).map(id => ({
      id,
      count: detectedProviderCounts[id],
      lastSeen: lastSeen[id]
    }));
    
    // Sort by count (most frequently detected first)
    detectedProviders.sort((a, b) => b.count - a.count);
    
    // Save detected providers
    this.saveDetectedProviders(detectedProviders);
    
    // Get existing providers
    let providers = this.getSmsProviders();
    
    // Add new providers
    Object.values(newProviders).forEach(newProvider => {
      if (!providers.some(p => p.id === newProvider.id)) {
        providers.push(newProvider);
      }
    });
    
    // Update provider detection status
    providers = providers.map(provider => ({
      ...provider,
      isDetected: detectedProviders.some(dp => dp.id === provider.id)
    }));
    
    // Save all providers
    this.saveSelectedProviders(providers);
    
    return providers;
  }
  
  // Method to check if we're in a native environment (needed for actual SMS access)
  isNativeEnvironment(): boolean {
    return Capacitor.isNativePlatform();
  }
  
  // Access native SMS for provider detection (in real implementation, this would use a Capacitor plugin)
  async accessNativeSms(): Promise<Array<{body: string, address: string}>> {
    if (!this.isNativeEnvironment()) {
      console.log('Cannot access native SMS in web environment');
      return [];
    }
    
    // In a real implementation, this would use a Capacitor plugin to access SMS
    // For now, return an empty array
    return [];
  }
}

// Export a singleton instance
export const smsProviderSelectionService = new SmsProviderSelectionService();
