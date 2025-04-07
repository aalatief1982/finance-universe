
import { Capacitor } from '@capacitor/core';
import { SmsProvider } from './SmsProviderSelectionService';
import { registerPlugin } from '@capacitor/core';

// Define interfaces for our service
export interface SmsMessage {
  address: string;
  body: string;
  timestamp: string;
}

// Define the SmsReader plugin interface
interface SmsReaderPlugin {
  readSms: (options?: { startDate?: string }) => Promise<{ messages: SmsMessage[] }>;
}

// Register the custom plugin
const SmsReader = registerPlugin<SmsReaderPlugin>('SmsReader');

class NativeSmsService {
  /**
   * Read SMS messages from the device
   * @param startDate Optional start date to filter messages from
   * @returns Promise resolving to an array of SMS messages
   */
  async readSmsMessages(startDate?: string): Promise<SmsMessage[]> {
    if (!Capacitor.isNativePlatform()) {
      console.log('Not in a native environment, returning empty SMS list');
      return [];
    }
    
    try {
      console.log('Reading SMS messages from device...');
      const result = await SmsReader.readSms({
        startDate: startDate
      });
      
      console.log(`Read ${result.messages.length} SMS messages from device`);
      return result.messages;
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
}

export const nativeSmsService = new NativeSmsService();
