
import { Capacitor } from '@capacitor/core';
import { SmsProvider } from './SmsProviderSelectionService';

// Define interfaces for our service
export interface SmsMessage {
  address: string;
  body: string;
  timestamp: string;
}

class NativeSmsService {
  /**
   * Read SMS messages from the device
   * @returns Promise resolving to an array of SMS messages
   */
  async readSmsMessages(): Promise<SmsMessage[]> {
    if (!Capacitor.isNativePlatform()) {
      // For web development, return mock data
      return this.getMockSmsMessages();
    }
    
    try {
      // Use Capacitor to call a custom native plugin method
      // Note: This requires a custom plugin or additional setup
      // For now, we'll return mock data
      return this.getMockSmsMessages();
      
      // When implementing with a real plugin or native code, it would look like:
      // return await CapacitorCustomPlugin.readSms();
    } catch (error) {
      console.error('Error reading SMS messages:', error);
      return [];
    }
  }
  
  /**
   * Detect SMS providers from messages
   * @param messages List of SMS messages
   * @returns Array of detected providers
   */
  detectProvidersFromMessages(messages: SmsMessage[]): string[] {
    const knownProviders = [
      { name: 'Bank ABC', patterns: ['bank abc', 'bankabc', 'abc bank'] },
      { name: 'Credit XYZ', patterns: ['credit xyz', 'creditxyz', 'xyz card'] },
      { name: 'Investment Corp', patterns: ['invest', 'portfolio', 'dividend'] },
      { name: 'Mobile Banking', patterns: ['mobile bank', 'm-banking', 'mbanking'] }
    ];
    
    const detectedProviders = new Set<string>();
    
    messages.forEach(message => {
      const messageLower = message.body.toLowerCase();
      const senderLower = message.address.toLowerCase();
      
      knownProviders.forEach(provider => {
        const isMatch = provider.patterns.some(pattern => 
          messageLower.includes(pattern) || senderLower.includes(pattern)
        );
        
        if (isMatch) {
          detectedProviders.add(provider.name);
        }
      });
    });
    
    return Array.from(detectedProviders);
  }
  
  /**
   * Filter SMS messages by provider
   * @param messages List of SMS messages
   * @param providers List of provider names
   * @returns Filtered list of messages
   */
  filterMessagesByProviders(messages: SmsMessage[], providers: string[]): SmsMessage[] {
    if (providers.length === 0) return [];
    
    const knownProviders = [
      { name: 'Bank ABC', patterns: ['bank abc', 'bankabc', 'abc bank'] },
      { name: 'Credit XYZ', patterns: ['credit xyz', 'creditxyz', 'xyz card'] },
      { name: 'Investment Corp', patterns: ['invest', 'portfolio', 'dividend'] },
      { name: 'Mobile Banking', patterns: ['mobile bank', 'm-banking', 'mbanking'] }
    ];
    
    // Get all patterns for the selected providers
    const selectedPatterns: string[] = [];
    providers.forEach(providerName => {
      const provider = knownProviders.find(p => p.name === providerName);
      if (provider) {
        selectedPatterns.push(...provider.patterns);
      }
    });
    
    // Filter messages
    return messages.filter(message => {
      const messageLower = message.body.toLowerCase();
      const senderLower = message.address.toLowerCase();
      
      return selectedPatterns.some(pattern => 
        messageLower.includes(pattern) || senderLower.includes(pattern)
      );
    });
  }
  
  /**
   * Get mock SMS messages for development/testing
   * @returns Array of mock SMS messages
   */
  private getMockSmsMessages(): SmsMessage[] {
    return [
      {
        address: 'Bank ABC',
        body: 'Your account was debited with $50.00 for Coffee Shop purchase',
        timestamp: new Date().toISOString()
      },
      {
        address: 'Credit XYZ',
        body: 'You made a purchase of $75.50 at Online Store',
        timestamp: new Date().toISOString()
      },
      {
        address: 'Investment Corp',
        body: 'Portfolio update: $100.00 dividend payment received',
        timestamp: new Date().toISOString()
      },
      {
        address: 'Mobile Banking',
        body: 'Your transfer of $200.00 to John Doe was successful',
        timestamp: new Date().toISOString()
      }
    ];
  }
}

export const nativeSmsService = new NativeSmsService();
